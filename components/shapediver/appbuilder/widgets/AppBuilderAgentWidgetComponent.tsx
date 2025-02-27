import React, {
	useContext,
	useState,
	useCallback,
	useEffect,
	useMemo,
} from "react";
import {
	Box,
	Group,
	MantineStyleProp,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Stack,
	Text,
	Textarea,
	useProps,
} from "@mantine/core";
import {
	IAppBuilderParameterRef,
	IAppBuilderWidgetPropsAgent,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	AppBuilderContainerContext,
	AppBuilderDataContext,
} from "@AppBuilderShared/context/AppBuilderContext";
import {useAllParameters} from "@AppBuilderShared/hooks/shapediver/parameters/useAllParameters";
import {
	Button,
	TextInput,
	ActionIcon,
	FileButton,
	ScrollArea,
} from "@mantine/core";
import {IconUser, IconRobot} from "@tabler/icons-react";
import {IShapeDiverParameter} from "@AppBuilderShared/types/shapediver/parameter";
import {ShapeDiverResponseParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {IShapeDiverStoreParameters} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShallow} from "zustand/react/shallow";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";
import OpenAI from "openai";
import {zodResponseFormat} from "openai/helpers/zod";
import {ChatCompletionMessageParam} from "openai/resources";
import {z} from "zod";
import {Langfuse, LangfuseWeb, observeOpenAI} from "langfuse";
import packagejson from "~/../package.json";
import AppBuilderImage from "../AppBuilderImage";
import {getParameterRefs} from "@AppBuilderShared/utils/appbuilder";
import MarkdownWidgetComponent from "../../ui/MarkdownWidgetComponent";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";

/** Style properties that can be controlled via the theme. */
type ComponentProps = PaperProps & {
	/** The system prompt to use. */
	systemPrompt: string;
	/** If provided, only parameters with these names are included. */
	parameterNamesToInclude: string[];
	/** If provided, parameters with these names are excluded. */
	parameterNamesToExclude: string[];
	/** Allows to override the context given by the author of the Grasshopper model via App Builder. */
	authorContext: string;
	/** Set to true to show and allow to edit system prompt and author context. */
	debug: boolean;
	/** Maximum number of messages to keep in the context for the chat completion. */
	maxHistory: number;
	/** The LLM to use. */
	model: string;
	/** Open AI API key. */
	openaiApiKey: string;
	/** Langfuse secret key. */
	langfuseSecretKey: string;
	/** Langfuse public key. */
	langfusePublicKey: string;
	/** Langfuse base URL. */
	langfuseBaseUrl: string;
};

const DEFAULT_SYSTEM_PROMPT =
	"You are a helpful assistant that can modify parameters of a 3D configurator and answer questions about the 3D configurator \
based on the user's input and the context provided. You may answer questions by the user without changing parameters.";

/** Default values for component properties. */
const defaultStyleProps: Partial<ComponentProps> = {
	systemPrompt: DEFAULT_SYSTEM_PROMPT,
	maxHistory: 10,
	model: "gpt-4o-mini",
	langfuseBaseUrl: "https://cloud.langfuse.com",
};

type AppBuilderAgentWidgetThemePropsType = Partial<ComponentProps>;

export function AppBuilderAgentWidgetThemeProps(
	props: AppBuilderAgentWidgetThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

type Props = IAppBuilderWidgetPropsAgent & {
	namespace: string;
};

/**
 * Schema for responses from the LLM
 * TODO: Clarify how complex can we type the response.
 * As an example, is it possible to use discriminated unions to
 * more strictly type the values depending on parameter type?
 * https://zod.dev/?id=discriminated-unions
 */
const AGENT_RESPONSE_SCHEMA = z.object({
	parameterUpdates: z
		.array(
			z.object({
				parameterId: z
					.string()
					.describe("The id of the parameter to be updated"),
				parameterName: z
					.string()
					.describe("The name of the parameter to be updated"),
				newValue: z
					.string()
					.describe("The new value for the parameter"),
				oldValue: z
					.string()
					.describe("The old value for the parameter"),
			}),
		)
		.describe("Array of parameters to update"),
	summaryAndReasoning: z
		.string()
		.describe(
			"A summary of the parameter updates and the reasoning behind the parameter updates, and answers to the user's questions.",
		),
});
type AgentResponseType = z.infer<typeof AGENT_RESPONSE_SCHEMA>;

/**
 * Create a context string for a parameter that can be passed to the LLM.
 * @param param
 * @param ref Parameter reference used in the App Builder data defining the UI.
 * @returns
 */
function createParameterContext(
	param: IShapeDiverParameter<any>,
	ref: IAppBuilderParameterRef | undefined,
) {
	const def = param.definition;
	const currentValue = param.state.uiValue;

	let context = `
parameterId: ${def.id}
parameterName: ${def.displayname || def.name}
parameterType: ${def.type}
currentValue: ${currentValue === null || currentValue === undefined ? "none" : currentValue}
`;

	const tooltip = ref?.overrides?.tooltip || def.tooltip;
	if (tooltip) {
		context += `tooltip: ${tooltip}\n`;
	}

	if (def.type === ShapeDiverResponseParameterType.STRINGLIST) {
		context += `choices: ${def.choices || "none"}\n`;
	} else if (
		def.type === ShapeDiverResponseParameterType.EVEN ||
		def.type === ShapeDiverResponseParameterType.ODD ||
		def.type === ShapeDiverResponseParameterType.INT ||
		def.type === ShapeDiverResponseParameterType.FLOAT ||
		def.type === ShapeDiverResponseParameterType.STRING
	) {
		if (def.type !== ShapeDiverResponseParameterType.STRING) {
			context += `min: ${def.min === null || def.min === undefined ? "none" : def.min}\n`;
		}
		context += `max: ${def.max === null || def.max === undefined ? "none" : def.max}\n`;
		if (def.type === ShapeDiverResponseParameterType.FLOAT) {
			context += `decimalplaces: ${def.decimalplaces === null || def.decimalplaces === undefined ? "none" : def.decimalplaces}\n`;
		}
	}

	return context;
}

/**
 * Create a context string for the given types of parameters.
 */
function createParameterTypeContext(types: ShapeDiverResponseParameterType[]) {
	// ensure types are unique
	types = Array.from(new Set(types));

	return types
		.map((type) => {
			if (type === ShapeDiverResponseParameterType.COLOR) {
				return `If parameterType is ${ShapeDiverResponseParameterType.COLOR}, return the color value precisely in the following hexadecimal format: 0xRRGGBBAA where RR encodes the red channel, GG encodes the green channel, BB encodes the blue channel, AA encodes opacity.`;
			} else if (type === ShapeDiverResponseParameterType.STRINGLIST) {
				return `If parameterType is ${ShapeDiverResponseParameterType.STRINGLIST}, return the index of the new choice from the available choices rather than the value of the choice.`;
			} else if (type === ShapeDiverResponseParameterType.FLOAT) {
				return `If parameterType is ${ShapeDiverResponseParameterType.FLOAT}, ensure the suggested new floating point number is within the range defined by min and max and respects the number of decimalplaces.`;
			} else if (type === ShapeDiverResponseParameterType.INT) {
				return `If parameterType is ${ShapeDiverResponseParameterType.INT}, ensure the suggested new integer is within the range defined by min and max.`;
			} else if (type === ShapeDiverResponseParameterType.ODD) {
				return `If parameterType is ${ShapeDiverResponseParameterType.ODD}, ensure the suggested new odd integer is within the range defined by min and max.`;
			} else if (type === ShapeDiverResponseParameterType.EVEN) {
				return `If parameterType is ${ShapeDiverResponseParameterType.EVEN}, ensure the suggested new even integer is within the range defined by min and max.`;
			} else if (type === ShapeDiverResponseParameterType.STRING) {
				return `If parameterType is ${ShapeDiverResponseParameterType.STRING}, ensure the length of the suggested new string does not exceed max.`;
			}
		})
		.filter((s) => !!s)
		.join("\n");
}

/** Supported types of parameters (for now). */
const SUPPORTED_PARAMETER_TYPES = [
	ShapeDiverResponseParameterType.BOOL,
	ShapeDiverResponseParameterType.COLOR,
	ShapeDiverResponseParameterType.EVEN,
	ShapeDiverResponseParameterType.FLOAT,
	ShapeDiverResponseParameterType.INT,
	ShapeDiverResponseParameterType.ODD,
	ShapeDiverResponseParameterType.STRING,
	ShapeDiverResponseParameterType.STRINGLIST,
];

/**
 * Create a context string for a list of parameters that can be passed to the LLM.
 * @param parameters Parameters to create context for.
 * @param parameterNames If provided, only parameters with these names are included.
 * @param parameterNamesToExclude If provided, parameters with these names are excluded.
 * @param parameterRefs Parameter references used in the App Builder data defining the UI.
 */
function createParametersContext(
	parameters: IShapeDiverParameter<any>[],
	parameterNames: string[] | undefined,
	parameterNamesToExclude: string[] | undefined,
	parameterRefs: IAppBuilderParameterRef[],
) {
	parameters = parameters
		.filter(
			(p) =>
				(!parameterNames ||
					parameterNames.includes(p.definition.name) ||
					(p.definition.displayname &&
						parameterNames.includes(p.definition.displayname))) &&
				(!parameterNamesToExclude ||
					!parameterNamesToExclude.includes(p.definition.name) ||
					(p.definition.displayname &&
						!parameterNamesToExclude.includes(
							p.definition.displayname,
						))),
		)
		.filter((p) => SUPPORTED_PARAMETER_TYPES.includes(p.definition.type));

	return (
		"\n" +
		parameters
			.map((p) => {
				const ref = parameterRefs.find(
					(pr) =>
						pr.name === p.definition.id ||
						pr.name === p.definition.name ||
						pr.name === p.definition.displayname,
				);

				return createParameterContext(p, ref);
			})
			.join("") +
		"\nDon't hallucinate parameterId.\n" +
		createParameterTypeContext(parameters.map((p) => p.definition.type))
	);
}

type ChatHistoryType =
	| {
			image?: string;
			content: string;
			role: "user";
	  }
	| {
			content: string;
			role: "assistant";
			traceId: string;
	  };

/**
 * Helper function for updating parameter values based on the LLM response.
 * TODO Alex extend this to work with dynamic parameters as well.
 * @param parameters
 * @param agentResponse
 */
async function setParameterValues(
	namespace: string,
	parameters: IShapeDiverParameter<any>[],
	parameterUpdates: AgentResponseType["parameterUpdates"],
	batchUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"],
): Promise<string[]> {
	const indices: number[] = [];
	const messages: string[] = [];
	const values: {[key: string]: any} = {};

	parameterUpdates.forEach((update) => {
		const index = parameters.findIndex(
			(p) => p.definition.id === update.parameterId,
		);
		if (index < 0) {
			messages.push(
				`Parameter with parameterId ${update.parameterId} does not exist.`,
			);

			return;
		}
		if (indices.includes(index)) {
			messages.push(
				`Refusing to update parameter with parameterId ${update.parameterId} twice.`,
			);

			return;
		}
		indices.push(index);

		const parameter = parameters[index];
		if (!parameter.actions.isValid(update.newValue, false)) {
			messages.push(
				`New value ${update.newValue} is not valid for parameter with parameterId ${update.parameterId}.`,
			);

			return;
		}

		values[update.parameterId] = update.newValue;
	});

	await batchUpdate(namespace, values);

	return messages;
}

/**
 * The AI agent widget component.
 * @param props
 * @returns
 */
export default function AppBuilderAgentWidgetComponent(
	props: Props & AppBuilderAgentWidgetThemePropsType,
) {
	const {namespace, context, parameterNames, ...rest} = props;
	const themeProps = useProps(
		"AppBuilderAgentWidgetComponent",
		defaultStyleProps,
		rest,
	);

	const urlParams = useMemo(
		() => new URLSearchParams(window.location.search),
		[],
	);

	const {
		debug = urlParams.get("debug") === "1" ||
			urlParams.get("debug") === "true",
		parameterNamesToInclude,
		parameterNamesToExclude,
		systemPrompt: _systemPrompt,
		authorContext: _authorContext,
		maxHistory = urlParams.get("maxHistory") !== null
			? parseInt(urlParams.get("maxHistory")!)
			: 10,
		model = urlParams.get("model") ?? "gpt-4o-mini",
		openaiApiKey = urlParams.get("openaiApiKey") ??
			import.meta.env.VITE_OPENAI_API_KEY,
		langfusePublicKey = urlParams.get("langfusePublicKey") ??
			import.meta.env.VITE_LANGFUSE_PUBLIC_KEY,
		langfuseSecretKey = urlParams.get("langfuseSecretKey") ??
			import.meta.env.VITE_LANGFUSE_SECRET_KEY,
		langfuseBaseUrl = urlParams.get("langfuseBaseUrl") ??
			import.meta.env.VITE_LANGFUSE_BASE_URL,
		...paperProps
	} = themeProps;

	/** Initialize the OpenAI API client. */
	const OPENAI =
		model && openaiApiKey
			? new OpenAI({
					apiKey: openaiApiKey,
					dangerouslyAllowBrowser: true, // Required for client-side usage
				})
			: undefined;

	const LANGFUSE =
		langfusePublicKey && langfuseSecretKey
			? new Langfuse({
					secretKey: langfuseSecretKey,
					publicKey: langfusePublicKey,
					baseUrl: langfuseBaseUrl || "https://cloud.langfuse.com",
					release: packagejson.version,
				})
			: undefined;

	// Initialize LangfuseWeb for client-side feedback
	const LANGFUSEWEB = langfusePublicKey
		? new LangfuseWeb({
				publicKey: langfusePublicKey,
				baseUrl: langfuseBaseUrl || "https://cloud.langfuse.com",
				release: packagejson.version,
			})
		: undefined;

	/** Current chat input by the user. */
	const [chatInput, setChatInput] = useState("");
	/** Loading state while LLM interaction is ongoing. */
	const [isLoading, setIsLoading] = useState(false);
	/** Optional image provided by the user. */
	const [userImage, setUserImage] = useState<string | null>(null);
	/** Optional screenshot image. */
	const [screenshot, setScreenshot] = useState<string | null>(null);
	/** Chat history for display (user messages and assistant reasoning) */
	const [chatHistory, setChatHistory] = useState<ChatHistoryType[]>([]);
	/** Complete LLM history for chat completion API */
	const [llmHistory, setLLMHistory] = useState<ChatCompletionMessageParam[]>(
		[],
	);
	/** Grasshopper prompt */
	const [authorContext, setAuthorContext] = useState<string | undefined>(
		_authorContext ?? context,
	);
	/** System prompt */
	const [systemPrompt, setSystemPrompt] = useState<string>(
		_systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
	);

	/** Session if for langfuse */
	const langfuseSessionId = useMemo(() => crypto.randomUUID(), []);

	// Get stateful access to all parameters
	const {parameters} = useAllParameters(namespace);
	const {parameters: dynamicParameters} = useAllParameters(
		`${namespace}_appbuilder`,
	);

	// get App Builder data, we need it to extract parameter tooltips
	const {data: appBuilderData} = useContext(AppBuilderDataContext);
	const parameterRefs = useMemo(
		() => (appBuilderData ? getParameterRefs(appBuilderData) : []),
		[appBuilderData],
	);

	// We want to do parameter batch updates
	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	// Hook for getting screenshots from viewport
	const {viewportId} = useViewportId();
	const {getScreenshot} = useShapeDiverStoreViewportAccessFunctions(
		useShallow((state) => ({
			getScreenshot:
				state.viewportAccessFunctions[viewportId]?.getScreenshot,
		})),
	);

	/**
	 * Handler for image provided by the user.
	 * @param file
	 * @returns
	 */
	const handleUserImage = useCallback((file: File | null) => {
		if (!file) {
			setUserImage(null);

			return;
		}

		const reader = new FileReader();
		reader.onloadend = () => {
			const base64String = reader.result as string;
			setUserImage(base64String);
		};
		reader.readAsDataURL(file);
	}, []);

	/**
	 * Handler for screenshot.
	 * @param file
	 * @returns
	 */
	const handleGetScreenshot = useCallback(async () => {
		if (!getScreenshot) {
			return;
		}
		const screenshot = await getScreenshot();
		setScreenshot(screenshot);
	}, [getScreenshot]);

	/**
	 * Handler for user feedback.
	 */
	const handleFeedback = useCallback(
		async (value: number, traceId: string) => {
			await LANGFUSEWEB?.score({
				traceId,
				name: "user-feedback",
				value,
			});
		},
		[],
	);

	/**
	 * Context for the parameters the user wants to expose to the LLM.
	 */
	const parametersContext = useMemo(
		() =>
			createParametersContext(
				Object.values(parameters),
				// skip dynamic parameters for now
				//	.concat(Object.values(dynamicParameters))
				parameterNamesToInclude ?? parameterNames,
				parameterNamesToExclude,
				parameterRefs,
			),
		[
			parameters,
			dynamicParameters,
			parameterNames,
			parameterNamesToInclude,
			parameterNamesToExclude,
			parameterRefs,
		],
	);

	/**
	 * Define the system prompt based on the parameters context.
	 * https://platform.openai.com/docs/guides/text-generation
	 */
	useEffect(() => {
		const systemPrompt = `${_systemPrompt}
Parameters context: ${parametersContext}
`;
		setSystemPrompt(systemPrompt);
	}, [parametersContext, _systemPrompt]);

	/** System prompt with author context. */
	const systemPromptComplete = useMemo(() => {
		return authorContext ? `${systemPrompt}${authorContext}` : systemPrompt;
	}, [systemPrompt, authorContext]);

	/** Tags to attach to langfuse traces. */
	const langfuseTags = useMemo(() => {
		const slug = urlParams.get("slug");

		return slug ? [slug] : [];
	}, [urlParams]);

	const llmInteraction = useCallback(
		async (userQuery: string, errorMessages?: string[]) => {
			if (!OPENAI) throw new Error("OpenAI API key is missing.");

			// Create a new trace for this user query
			const trace = LANGFUSE?.trace({
				name: "user-query",
				id: crypto.randomUUID(), // Generate unique trace ID
				sessionId: langfuseSessionId,
				metadata: {
					parameters: Object.values(parameters).map((p) => ({
						id: p.definition.id,
						type: p.definition.type,
						name: p.definition.displayname || p.definition.name,
						uiValue: p.state.uiValue,
						execValue: p.state.execValue,
					})),
					hasImage: !!userImage,
					hasScreenshot: !!screenshot,
				},
				tags: langfuseTags,
				input: {
					userQuery,
					userImage,
					screenshot,
					errorMessages,
				},
			});

			// Add user query to chat history
			setChatHistory((prev) => [
				...prev,
				{
					role: "user",
					content: userQuery,
					image: userImage ?? screenshot ?? undefined,
				},
			]);
			setLLMHistory((prev) => [
				...prev,
				{role: "user", content: userQuery},
			]);

			// Message for chat completion API
			const messages: ChatCompletionMessageParam[] = [
				{
					role: "developer",
					content: systemPromptComplete,
				},
				// Add previous chat history
				...llmHistory.slice(-maxHistory),
			];

			// If there were errors, add them as context
			if (errorMessages?.length) {
				messages.push({
					role: "user",
					content: `The previous parameter updates failed with these errors: ${errorMessages.join(", ")}. Provide new parameter values that address these issues.`,
				});
			}

			// Add current message with image if present
			const userPrompt = userImage
				? `${userQuery} \
I have provided an image for context.`
				: screenshot
					? `${userQuery} \
I have provided a screenshot of the 3D view for context.`
					: userQuery;
			if (userImage ?? screenshot) {
				messages.push({
					role: "user",
					content: [
						{
							type: "image_url",
							image_url: {
								url: userImage ?? (screenshot as string),
							},
						},
						{
							type: "text",
							text: userPrompt,
						},
					],
				});
				if (userImage) setUserImage(null);
				if (screenshot) setScreenshot(null);
			} else {
				messages.push({role: "user", content: userPrompt});
			}

			const responseFormat = zodResponseFormat(
				AGENT_RESPONSE_SCHEMA,
				"parameters_update",
			);

			// Create a span for the LLM interaction
			const llmSpan = trace?.span({
				name: "llm-interaction",
			});
			const completion = await observeOpenAI(OPENAI, {
				parent: llmSpan,
				generationName: "OpenAI-Generation",
			}).beta.chat.completions.parse({
				model: model,
				messages: messages as any,
				response_format: responseFormat,
				max_tokens: 1000,
			});
			llmSpan?.end();

			// Deal with the response message
			const message = completion.choices[0].message;

			setLLMHistory((prev) => [
				...prev,
				{
					role: "assistant",
					content: message.content,
				},
			]);

			const parsedMessage = message.parsed;
			if (!parsedMessage) {
				console.log("No LLM response ?!", parsedMessage);

				return;
			}

			// Update trace metadata with complete LLM response
			trace?.update({
				output: {
					summaryAndReasoning: parsedMessage.summaryAndReasoning,
				},
			});

			// Update display chat history with just the summary
			setChatHistory((prev) => [
				...prev,
				{
					role: "assistant",
					content: parsedMessage.summaryAndReasoning,
					traceId: trace?.id ?? "",
				},
			]);

			// Create a span for parameter updates
			const updateSpan = trace?.span({
				name: "parameter-updates",
				input: {
					parameterUpdates: parsedMessage.parameterUpdates,
				},
			});

			// Set parameter values
			const msgs = await setParameterValues(
				namespace,
				Object.values(parameters),
				parsedMessage.parameterUpdates,
				batchParameterValueUpdate,
			);
			if (msgs.length > 0) {
				updateSpan?.event({
					name: "Parameter update errors",
					metadata: {errors: msgs},
				});
				// TODO handle errors, recurse llmInteraction with error messages
			}
			updateSpan?.end();

			return `Updated parameters: ${parsedMessage.parameterUpdates.map((u) => `${u.parameterId}: ${u.newValue}`).join(", ")}`;
		},
		[model, parameters, userImage, screenshot, systemPromptComplete],
	);

	const handleUserQuery = async () => {
		try {
			setIsLoading(true);
			await llmInteraction(chatInput);
		} catch (error) {
			console.error("Error calling AI: ", error);
		} finally {
			setIsLoading(false);
			setChatInput("");
		}
	};

	// check for container alignment
	const containerContext = useContext(AppBuilderContainerContext);
	const styleProps: MantineStyleProp = {};
	if (containerContext.orientation === "horizontal") {
		styleProps.height = "100%";
	} else if (containerContext.orientation === "vertical") {
		styleProps.overflowX = "auto";
	}
	styleProps.fontWeight = "100";

	// Duplicate and reverse the chat history for display
	const chatHistoryReverse = chatHistory.slice().reverse();

	return (
		<Paper {...paperProps} style={styleProps}>
			{OPENAI ? (
				<Stack>
					<Group>
						{userImage ? (
							<TooltipWrapper label={"Remove image"}>
								<ActionIcon onClick={() => setUserImage(null)}>
									<Icon type={IconTypeEnum.PaperClip} />
								</ActionIcon>
							</TooltipWrapper>
						) : (
							<FileButton
								disabled={!!screenshot}
								onChange={handleUserImage}
								accept="image/png,image/jpeg,image/gif,image/webp"
							>
								{(props) => (
									<TooltipWrapper label={"Attach an image"}>
										<ActionIcon
											variant="subtle"
											disabled={!!screenshot}
											{...props}
										>
											<Icon
												type={IconTypeEnum.PaperClip}
											/>
										</ActionIcon>
									</TooltipWrapper>
								)}
							</FileButton>
						)}
						{screenshot ? (
							<TooltipWrapper label={"Remove screenshot"}>
								<ActionIcon onClick={() => setScreenshot(null)}>
									<Icon type={IconTypeEnum.DeviceDesktop} />
								</ActionIcon>
							</TooltipWrapper>
						) : (
							<TooltipWrapper label={"Attach a screenshot"}>
								<ActionIcon
									variant="subtle"
									onClick={handleGetScreenshot}
									disabled={!!userImage}
								>
									<Icon type={IconTypeEnum.DeviceDesktop} />
								</ActionIcon>
							</TooltipWrapper>
						)}
						<TextInput
							placeholder="Ask a question"
							style={{flex: 1}}
							value={chatInput}
							onChange={(e) => setChatInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleUserQuery();
								}
							}}
							disabled={isLoading}
						/>
						<Button onClick={handleUserQuery} loading={isLoading}>
							Go
						</Button>
					</Group>

					{userImage && <AppBuilderImage src={userImage} />}
					{screenshot && <AppBuilderImage src={screenshot} />}

					<ScrollArea>
						{chatHistoryReverse.map((message, index) => (
							<Stack key={index} pb="sm">
								<Group align="start" w="100%" wrap="nowrap">
									<Box pt="xs">
										{message.role === "user" ? (
											<IconUser />
										) : (
											<IconRobot />
										)}
									</Box>

									<Group
										justify="space-between"
										w="100%"
										wrap="nowrap"
										align="start"
									>
										<Paper withBorder={false}>
											{typeof message.content ===
											"string" ? (
												<MarkdownWidgetComponent>
													{message.content}
												</MarkdownWidgetComponent>
											) : (
												JSON.stringify(message.content)
											)}
										</Paper>

										{message.role === "user" &&
											message.image && (
												<AppBuilderImage
													maw={250}
													fit="scale-down"
													src={message.image}
												/>
											)}
									</Group>
								</Group>
								{/* Add feedback buttons for assistant messages */}
								{message.role === "assistant" && (
									<Group justify="end">
										<ActionIcon
											variant="subtle"
											onClick={() =>
												handleFeedback(
													1,
													message.traceId,
												)
											}
										>
											<Icon type={IconTypeEnum.ThumbUp} />
										</ActionIcon>
										<ActionIcon
											variant="subtle"
											onClick={() =>
												handleFeedback(
													0,
													message.traceId,
												)
											}
										>
											<Icon
												type={IconTypeEnum.ThumbDown}
											/>
										</ActionIcon>
									</Group>
								)}
							</Stack>
						))}
					</ScrollArea>
					{debug ? (
						<>
							<Text size="sm">Context from Grasshopper:</Text>
							<Textarea
								value={authorContext}
								onChange={(event) =>
									setAuthorContext(event.currentTarget.value)
								}
								autosize
								maxRows={10}
							/>
							<Text size="sm">System prompt:</Text>
							<Textarea
								value={systemPrompt}
								onChange={(event) =>
									setSystemPrompt(event.currentTarget.value)
								}
								autosize
								maxRows={15}
							/>
						</>
					) : null}
				</Stack>
			) : (
				<Text size="sm" c="red">
					OpenAI API key is missing.
				</Text>
			)}
		</Paper>
	);
}
