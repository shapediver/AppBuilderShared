import React, {
	useContext,
	useState,
	useCallback,
	useEffect,
	useMemo,
} from "react";
import {
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
	IAppBuilder,
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
import {IconPaperclip, IconUser, IconRobot} from "@tabler/icons-react";
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

const langfuse = new Langfuse({
	secretKey: import.meta.env.VITE_LANGFUSE_SECRET_KEY,
	publicKey: import.meta.env.VITE_LANGFUSE_PUBLIC_KEY,
	baseUrl:
		import.meta.env.VITE_LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

// Initialize LangfuseWeb for client-side feedback
const langfuseWeb = new LangfuseWeb({
	publicKey: import.meta.env.VITE_LANGFUSE_PUBLIC_KEY,
	baseUrl:
		import.meta.env.VITE_LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

/** Style properties that can be controlled via the theme. */
type StylePros = PaperProps & {};

/** Default values for style properties. */
const defaultStyleProps: Partial<StylePros> = {};

type AppBuilderAgentWidgetThemePropsType = Partial<StylePros>;

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
 * TODO Alex to Mayur: How complex can we type the response?
 * As an example, is it possible to use discriminated unions to
 * more strictly type the values depending on parameter type?
 * https://zod.dev/?id=discriminated-unions
 */
const AGENT_RESPONSE_SCHEMA = z.object({
	parameters: z
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
				// Alex to Mayur: What's the reason we are asking for the old value?
				// MM Response : Its for debugging for hallucination and better accuracy (pause and reflect)
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

/** Initialize the OpenAI API client. */

const OPENAI = new OpenAI({
	apiKey: import.meta.env.VITE_OPENAI_API_KEY,
	dangerouslyAllowBrowser: true, // Required for client-side usage
});

/** Toggle for debugging and testing. */
const DEBUG = true;

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
 * @param parameterRefs Parameter references used in the App Builder data defining the UI.
 */
function createParametersContext(
	parameters: IShapeDiverParameter<any>[],
	parameterNames: string[] | undefined,
	parameterRefs: IAppBuilderParameterRef[],
) {
	parameters = parameters
		.filter(
			(p) =>
				!parameterNames ||
				parameterNames.includes(p.definition.name) ||
				(p.definition.displayname &&
					parameterNames.includes(p.definition.displayname)),
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
	agentResponse: AgentResponseType,
	batchUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"],
): Promise<string[]> {
	const indices: number[] = [];
	const messages: string[] = [];
	const values: {[key: string]: any} = {};

	agentResponse.parameters.forEach((update) => {
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
	/**
	 * TODO Alex to Mayur:
	 * The "context" is an optional string that can be output by the GH developer to provide
	 * further context to the LLM. Please make use of this.
	 * For purposes of testing and debugging, I suggest to add a text input field that
	 * allows us to edit the context string (if DEBUG is true).
	 */
	const {namespace, context, parameterNames, ...rest} = props;
	const themeProps = useProps(
		"AppBuilderAgentWidgetComponent",
		defaultStyleProps,
		rest,
	);

	/** Current chat input by the user. */
	const [chatInput, setChatInput] = useState("");
	/** Loading state while LLM interaction is ongoing. */
	const [isLoading, setIsLoading] = useState(false);
	/** Optional image provided by the user. */
	const [userImage, setUserImage] = useState<string | null>(null);
	/** Chat history for display (user messages and assistant reasoning) */
	const [chatHistory, setChatHistory] = useState<ChatHistoryType[]>([]);
	/** Complete LLM history for chat completion API */
	const [llmHistory, setLLMHistory] = useState<ChatCompletionMessageParam[]>(
		[],
	);
	/** Grasshopper prompt */
	const [authorContext, setAuthorContext] = useState<string | undefined>();
	/** System prompt */
	const [systemPrompt, setSystemPrompt] = useState("");

	/** Session if for langfuse */
	const sessionId = useMemo(() => crypto.randomUUID(), []);

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

	// TODO Alex to Mayur: getting screenshots from viewport
	const {viewportId} = useViewportId();
	const {getScreenshot} = useShapeDiverStoreViewportAccessFunctions(
		useShallow((state) => ({
			getScreenshot:
				state.viewportAccessFunctions[viewportId]?.getScreenshot,
		})),
	);

	// TODO: screenshot button
	useEffect(() => {
		const logScreenshot = async () => {
			if (getScreenshot) {
				try {
					const screenshot = await getScreenshot();
					//console.log("Screenshot data:", screenshot);
					// It outputs blank image so need to fix it
				} catch (error) {
					console.error("Error getting screenshot:", error);
				}
			}
		};

		logScreenshot();
	}, [viewportId, getScreenshot]);

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
	 * Handler for user feedback.
	 */
	const handleFeedback = useCallback(
		async (value: number, traceId: string) => {
			await langfuseWeb.score({
				traceId,
				name: "user-feedback",
				value,
			});
		},
		[],
	);

	/**
	 * Context provided by the author of the Grasshopper model
	 */
	useEffect(() => {
		setAuthorContext(context);
	}, [context]);

	/**
	 * Context for the parameters the user wants to expose to the LLM.
	 */
	const parametersContext = useMemo(
		() =>
			createParametersContext(
				Object.values(parameters),
				// skip dynamic parameters for now
				//	.concat(Object.values(dynamicParameters))
				parameterNames,
				parameterRefs,
			),
		[parameters, dynamicParameters, parameterNames, parameterRefs],
	);

	/**
	 * Define the system prompt based on the parameters context.
	 * https://platform.openai.com/docs/guides/text-generation
	 *
	 * TODO add instructions specific to parameter type based on which types are present in the parameters
	 */
	useEffect(() => {
		// Enhance system prompt with confgurator app context information which has information about what the configurator app is about
		const systemPrompt = `You are a helpful assistant that can modify parameters of a 3D configurator and answer questions about the 3D configurator \
based on the user's input and the context provided. You may answer questions by the user without changing parameters. \
Parameters context: ${parametersContext}
`;
		setSystemPrompt(systemPrompt);
	}, [parametersContext, authorContext]);

	/** System prompt with author context. */
	const systemPromptComplete = useMemo(() => {
		return authorContext ? `${systemPrompt}${authorContext}` : systemPrompt;
	}, [systemPrompt, authorContext]);

	/** Tags to attach to langfuse traces. */
	const tags = useMemo(() => {
		// get "slug" query string parameter
		const urlParams = new URLSearchParams(window.location.search);
		const slug = urlParams.get("slug");
		return slug ? [slug, packagejson.version] : [packagejson.version];
	}, []);

	const llm = async (userQuery: string, errorMessages?: string[]) => {
		// Create a new trace for this user query
		const trace = langfuse.trace({
			name: "user-query",
			id: crypto.randomUUID(), // Generate unique trace ID
			sessionId,
			metadata: {
				userQuery,
				errorMessages,
				parameters: Object.values(parameters).map((p) => ({
					id: p.definition.id,
					type: p.definition.type,
					name: p.definition.displayname ?? p.definition.name,
					uiValue: p.state.uiValue,
					execValue: p.state.execValue,
				})),
			},
			tags,
		});

		// Add user query to chat history
		setChatHistory((prev) => [...prev, {role: "user", content: userQuery}]);
		setLLMHistory((prev) => [...prev, {role: "user", content: userQuery}]);

		// Message for chat completion API
		const maxHistoryMessages = 10; // Adjust as needed
		const messages: ChatCompletionMessageParam[] = [
			{
				role: "developer",
				content: systemPromptComplete,
			},
			// Add previous chat history
			...llmHistory.slice(-maxHistoryMessages),
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
			: userQuery;
		if (userImage) {
			messages.push({
				role: "user",
				content: [
					{
						type: "image_url",
						image_url: {
							url: userImage,
						},
					},
					{
						type: "text",
						text: userPrompt,
					},
				],
			});
		} else {
			messages.push({role: "user", content: userPrompt});
		}

		const responseFormat = zodResponseFormat(
			AGENT_RESPONSE_SCHEMA,
			"parameters_update",
		);

		// Create a span for the LLM interaction
		const model = "gpt-4o-mini";
		const llmSpan = trace.span({
			name: "llm-interaction",
			metadata: {
				model,
				hasImage: !!userImage,
			},
		});
		const completion = await observeOpenAI(OPENAI, {
			parent: llmSpan,
			generationName: "OpenAI-Generation",
		}).beta.chat.completions.parse({
			model,
			messages: messages as any,
			response_format: responseFormat,
			max_tokens: 1000,
		});
		// End the LLM span
		llmSpan.end();

		// Deal with the response message
		const message = completion.choices[0].message;

		// Update trace metadata with complete LLM response
		trace.update({
			metadata: {
				llmResponse: message,
			},
		});

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

		// Update display chat history with just the summary
		setChatHistory((prev) => [
			...prev,
			{
				role: "assistant",
				content: parsedMessage.summaryAndReasoning,
				traceId: trace.id,
			},
		]);

		// Create a span for parameter updates
		const updateSpan = trace.span({
			name: "parameter-updates",
			metadata: {
				updates: parsedMessage.parameters,
			},
		});

		// Set parameter values (only do this once)
		// TODO handle errors
		const msgs = await setParameterValues(
			namespace,
			Object.values(parameters),
			parsedMessage,
			batchParameterValueUpdate,
		);

		updateSpan.end(); // End the update span

		if (msgs.length > 0) {
			trace.event({
				name: "Parameter update errors",
				metadata: {errors: msgs},
			});
		}

		return `Updated parameters: ${parsedMessage.parameters.map((u) => `${u.parameterId}: ${u.newValue}`).join(", ")}`;
	};

	const handleParameterUpdate = async (
		parsedMessage: z.infer<typeof AGENT_RESPONSE_SCHEMA>,
	) => {
		const msgs = await setParameterValues(
			namespace,
			Object.values(parameters),
			parsedMessage,
			batchParameterValueUpdate,
		);

		if (msgs.length > 0) {
			console.error("Some parameter updates failed: ", msgs);

			// Make another LLM call with the error messages
			try {
				setIsLoading(true);
				const retryResponse = await llm(chatInput, msgs);
				return retryResponse;
			} catch (error) {
				console.error("Error in retry LLM call: ", error);
				throw error;
			}
		}

		return `Updated parameters: ${parsedMessage.parameters.map((u) => `${u.parameterId}: ${u.newValue}`).join(", ")}`;
	};

	const handleUserQuery = async () => {
		try {
			setIsLoading(true);
			const response = await llm(chatInput);
			// The response will now include any retry attempts if there were errors
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

	return (
		<Paper {...themeProps} style={styleProps}>
			<Stack>
				{DEBUG ? (
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
				<Group>
					<FileButton
						onChange={handleUserImage}
						accept="image/png,image/jpeg,image/gif,image/webp"
					>
						{(props) => (
							<ActionIcon
								variant="subtle"
								{...props}
								className="hover:bg-gray-100"
							>
								<IconPaperclip />
							</ActionIcon>
						)}
					</FileButton>
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
					/>
					<Button onClick={handleUserQuery} loading={isLoading}>
						Go
					</Button>
				</Group>

				{userImage && <AppBuilderImage src={userImage} />}

				<ScrollArea h={400}>
					{chatHistory.map((message, index) => (
						<Stack key={index} pb="md">
							<Group gap="xs">
								{message.role === "user" ? (
									<IconUser />
								) : (
									<IconRobot />
								)}

								<Paper withBorder={false}>
									{typeof message.content === "string" ? (
										<MarkdownWidgetComponent>
											{message.content}
										</MarkdownWidgetComponent>
									) : (
										JSON.stringify(message.content)
									)}
								</Paper>

								{/* Add feedback buttons for assistant messages */}
								{message.role === "assistant" && (
									<Group>
										<Button
											onClick={() =>
												handleFeedback(
													1,
													message.traceId,
												)
											}
											aria-label="Thumbs up"
										>
											👍
										</Button>
										<Button
											onClick={() =>
												handleFeedback(
													0,
													message.traceId,
												)
											}
											aria-label="Thumbs down"
										>
											👎
										</Button>
									</Group>
								)}
							</Group>
						</Stack>
					))}
				</ScrollArea>
			</Stack>
		</Paper>
	);
}
