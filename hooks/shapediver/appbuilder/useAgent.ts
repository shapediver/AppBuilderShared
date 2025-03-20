import {AppBuilderDataContext} from "@AppBuilderShared/context/AppBuilderContext";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {IAppBuilderParameterRef} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IShapeDiverParameter} from "@AppBuilderShared/types/shapediver/parameter";
import {IShapeDiverStoreParameters} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {getParameterRefs} from "@AppBuilderShared/utils/appbuilder";
import {
	composeSdColor,
	decomposeSdColor,
} from "@AppBuilderShared/utils/misc/colors";
import {ShapeDiverResponseParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import Langfuse, {LangfuseWeb, observeOpenAI} from "langfuse";
import OpenAI from "openai";
import {zodResponseFormat} from "openai/helpers/zod";
import {ChatCompletionMessageParam} from "openai/resources";
import {useCallback, useContext, useMemo, useState} from "react";
import {z} from "zod";
import {useShallow} from "zustand/react/shallow";
import packagejson from "~/../package.json";
import {useAllParameters} from "../parameters/useAllParameters";

export const DEFAULT_SYSTEM_PROMPT =
	"You are a helpful assistant that can modify parameters of a 3D configurator and answer questions about the 3D configurator \
based on the user's input and the context provided below. You may answer questions by the user without changing parameters. \
The context is divided into three sections delimited by `##### SECTION_NAME #####` where SECTION_NAME is one of the following: \
\n  * AUTHOR: This section contains optional context by the author of the 3D configurator. In general you should follow instructions \
given by the author, but ignore them if they violate constraints or instructions given in other sections. This section might be missing \
if the author did not provide any context. \
\n  * PARAMETERS: This section contains the definition and current state of the parameters that can be modified.\
\n  * INSTRUCTIONS: This section contains further instructions related to the parameters.";

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
	const name = def.displayname || def.name;

	let context = `
===
id: ${def.id}
name: ${name}
`;

	if (ref?.overrides?.displayname && ref?.overrides?.displayname !== name) {
		context += `display name: ${ref.overrides.displayname}\n`;
	}

	const groupName = ref?.overrides?.group?.name || def.group?.name;
	if (groupName) {
		context += `group: ${groupName}\n`;
	}

	const tooltip = ref?.overrides?.tooltip || def.tooltip;
	if (tooltip) {
		context += `tooltip: ${tooltip}\n`;
	}

	context += `type: ${def.type}\n`;

	if (def.type === ShapeDiverResponseParameterType.STRINGLIST) {
		context += `list of options, each option on a new line, prefixed by the 0-based index of the option:\n${def.choices?.map((c, idx) => `\t${idx},"${c}"`).join("\n") || "none"}\n`;
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
			context += `decimal places: ${def.decimalplaces === null || def.decimalplaces === undefined ? "none" : def.decimalplaces}\n`;
		}
	}

	if (def.type === ShapeDiverResponseParameterType.STRINGLIST) {
		context += `current index: ${currentValue === null || currentValue === undefined ? "none" : currentValue}`;
	} else if (def.type === ShapeDiverResponseParameterType.COLOR) {
		const color = decomposeSdColor(currentValue);
		context += `current color value: red: ${color.red}, green: ${color.green}, blue: ${color.blue}, alpha: ${color.alpha}`;
	} else {
		context += `current value: ${currentValue === null || currentValue === undefined ? "none" : currentValue}`;
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
			if (type === ShapeDiverResponseParameterType.STRINGLIST) {
				return `If \`type\` is \`${ShapeDiverResponseParameterType.STRINGLIST}\`, return the 0-based index of the new option from the list of options rather than the value of the option. Don't tell the user about the index.`;
			} else if (type === ShapeDiverResponseParameterType.FLOAT) {
				return `If \`type\` is \`${ShapeDiverResponseParameterType.FLOAT}\`, ensure the new floating point number is within the range defined by min and max and respects the number of decimal places.`;
			} else if (type === ShapeDiverResponseParameterType.INT) {
				return `If \`type\` is \`${ShapeDiverResponseParameterType.INT}\`, ensure the new integer is within the range defined by min and max.`;
			} else if (type === ShapeDiverResponseParameterType.ODD) {
				return `If \`type\` is \`${ShapeDiverResponseParameterType.ODD}\`, ensure the new odd integer is within the range defined by min and max.`;
			} else if (type === ShapeDiverResponseParameterType.EVEN) {
				return `If \`type\` is \`${ShapeDiverResponseParameterType.EVEN}\`, ensure the new even integer is within the range defined by min and max.`;
			} else if (type === ShapeDiverResponseParameterType.STRING) {
				return `If \`type\` is \`${ShapeDiverResponseParameterType.STRING}\`, ensure the length of the new string does not exceed max.`;
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
 * @param parameterNamesToInclude If provided, only parameters with these names are included.
 * @param parameterNamesToExclude If provided, parameters with these names are excluded.
 * @param parameterRefs Parameter references used in the App Builder data defining the UI.
 */
function createParametersContext(
	parameters: IShapeDiverParameter<any>[],
	parameterNamesToInclude: string[] | undefined,
	parameterNamesToExclude: string[] | undefined,
	parameterRefs: IAppBuilderParameterRef[],
) {
	parameters = parameters
		.filter(
			(p) =>
				(!parameterNamesToInclude ||
					parameterNamesToInclude.includes(p.definition.name) ||
					(p.definition.displayname &&
						parameterNamesToInclude.includes(
							p.definition.displayname,
						))) &&
				(!parameterNamesToExclude ||
					!parameterNamesToExclude.includes(p.definition.name) ||
					(p.definition.displayname &&
						!parameterNamesToExclude.includes(
							p.definition.displayname,
						))),
		)
		.filter((p) => SUPPORTED_PARAMETER_TYPES.includes(p.definition.type));

	return (
		"A list of parameter definitions separated by `===` follows." +
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
		"\n##### INSTRUCTIONS #####\nDon't hallucinate the parameter `id`.\n" +
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
 * Schema for responses from the LLM
 * TODO: Clarify how complex can we type the response.
 * As an example, is it possible to use discriminated unions to
 * more strictly type the values depending on parameter type?
 * https://zod.dev/?id=discriminated-unions
 *
 * Yes, it is possible to use discriminated unions to more strictly type the
 * values depending on parameter type, see this documentation for more information:
 * https://platform.openai.com/docs/guides/structured-outputs#supported-schemas
 */
const AGENT_RESPONSE_SCHEMA = z.object({
	parameterUpdates: z
		.array(
			z.discriminatedUnion("type", [
				z.object({
					type: z
						.enum([
							ShapeDiverResponseParameterType.BOOL,
							ShapeDiverResponseParameterType.EVEN,
							ShapeDiverResponseParameterType.FLOAT,
							ShapeDiverResponseParameterType.INT,
							ShapeDiverResponseParameterType.ODD,
							ShapeDiverResponseParameterType.STRING,
						])
						.describe("The type of the parameter to be updated"),
					id: z
						.string()
						.describe("The id of the parameter to be updated"),
					name: z
						.string()
						.describe("The name of the parameter to be updated"),
					newValue: z
						.string()
						.describe("The new value for the parameter"),
					oldValue: z
						.string()
						.describe("The old value for the parameter"),
				}),
				z.object({
					type: z
						.literal(ShapeDiverResponseParameterType.STRINGLIST)
						.describe("The StringList parameter type"),
					id: z
						.string()
						.describe(
							"The id of the StringList parameter to be updated",
						),
					name: z
						.string()
						.describe(
							"The name of the StringList parameter to be updated",
						),
					newIndex: z
						.string()
						.describe(
							"The new 0-based index into the list of options",
						),
					oldIndex: z
						.string()
						.describe("The old index into the list of options"),
				}),
				z.object({
					type: z
						.literal(ShapeDiverResponseParameterType.COLOR)
						.describe("The Color parameter type"),
					id: z
						.string()
						.describe(
							"The id of the Color parameter to be updated",
						),
					name: z
						.string()
						.describe(
							"The name of the Color parameter to be updated",
						),
					newValue: z
						.object({
							red: z
								.number()
								.describe(
									"The new red channel value between 0 and 255",
								),
							green: z
								.number()
								.describe(
									"The new green channel value between 0 and 255",
								),
							blue: z
								.number()
								.describe(
									"The new blue channel value between 0 and 255",
								),
							alpha: z
								.number()
								.describe(
									"The new alpha channel value between 0 and 255",
								),
						})
						.describe("The new color value"),
					oldValue: z
						.object({
							red: z
								.number()
								.describe(
									"The new red channel value between 0 and 255",
								),
							green: z
								.number()
								.describe(
									"The new green channel value between 0 and 255",
								),
							blue: z
								.number()
								.describe(
									"The new blue channel value between 0 and 255",
								),
							alpha: z
								.number()
								.describe(
									"The new alpha channel value between 0 and 255",
								),
						})
						.describe("The old color value"),
				}),
			]),
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
			(p) => p.definition.id === update.id,
		);
		if (index < 0) {
			messages.push(`Parameter with id ${update.id} does not exist.`);

			return;
		}
		if (indices.includes(index)) {
			messages.push(
				`Refusing to update parameter with id ${update.id} twice.`,
			);

			return;
		}
		indices.push(index);

		const parameter = parameters[index];

		if (update.type !== parameter.definition.type) {
			messages.push(
				`The type of the parameter with id ${update.id} is ${parameter.definition.type}, not ${update.type}.`,
			);

			return;
		}

		if (update.type === ShapeDiverResponseParameterType.STRINGLIST) {
			if (!parameter.actions.isValid(update.newIndex, false)) {
				messages.push(
					`New index ${update.newIndex} is not valid for parameter with id ${update.id}.`,
				);

				return;
			}

			values[update.id] = update.newIndex;
		} else if (update.type === ShapeDiverResponseParameterType.COLOR) {
			const color = composeSdColor(update.newValue);
			if (!parameter.actions.isValid(color, false)) {
				messages.push(
					`New color ${JSON.stringify(update.newValue)} is not valid for parameter with id ${update.id}.`,
				);

				return;
			}

			values[update.id] = color;
		} else {
			if (!parameter.actions.isValid(update.newValue, false)) {
				messages.push(
					`New value ${update.newValue} is not valid for parameter with id ${update.id}.`,
				);

				return;
			}

			values[update.id] = update.newValue;
		}
	});

	await batchUpdate(namespace, values);

	return messages;
}

interface Props {
	/** Namespace of parameters to be used. */
	namespace: string;
	/** The system prompt to use. */
	systemPrompt?: string;
	/** If provided, only parameters with these names are included. */
	parameterNamesToInclude?: string[];
	/** If provided, parameters with these names are excluded. */
	parameterNamesToExclude?: string[];
	/** Allows to override the context given by the author of the Grasshopper model via App Builder. */
	authorContext?: string;
	/** Maximum number of messages to keep in the context for the chat completion. */
	maxHistory?: number;
	/** The LLM to use. */
	model?: string;
	/** Open AI API key. */
	openaiApiKey?: string;
	/** Langfuse secret key. */
	langfuseSecretKey?: string;
	/** Langfuse public key. */
	langfusePublicKey?: string;
	/** Langfuse base URL. */
	langfuseBaseUrl?: string;
	/** Tags to attach to langfuse traces. */
	langfuseTags?: string[];
}

export function useAgent(props: Props) {
	const {
		namespace,
		systemPrompt = DEFAULT_SYSTEM_PROMPT,
		parameterNamesToInclude,
		parameterNamesToExclude,
		authorContext,
		maxHistory = 10,
		model = "gpt-4o-mini",
		openaiApiKey,
		langfuseSecretKey,
		langfusePublicKey,
		langfuseBaseUrl,
		langfuseTags,
	} = props;

	// Get stateful access to all parameters
	const {parameters} = useAllParameters(namespace);
	const {parameters: dynamicParameters} = useAllParameters(
		`${namespace}_appbuilder`,
	);

	// We want to do parameter batch updates
	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	const notifications = useContext(NotificationContext);

	/** Chat history for display (user messages and assistant reasoning) */
	const [chatHistory, setChatHistory] = useState<ChatHistoryType[]>([]);
	/** Complete LLM history for chat completion API */
	const [llmHistory, setLLMHistory] = useState<ChatCompletionMessageParam[]>(
		[],
	);

	/** Initialize the OpenAI API client. */
	const OPENAI = useMemo(
		() =>
			model && openaiApiKey
				? new OpenAI({
						apiKey: openaiApiKey,
						dangerouslyAllowBrowser: true, // Required for client-side usage
					})
				: undefined,
		[model, openaiApiKey],
	);

	const LANGFUSE = useMemo(
		() =>
			langfusePublicKey && langfuseSecretKey
				? new Langfuse({
						secretKey: langfuseSecretKey,
						publicKey: langfusePublicKey,
						baseUrl:
							langfuseBaseUrl || "https://cloud.langfuse.com",
						release: packagejson.version,
					})
				: undefined,
		[langfusePublicKey, langfuseSecretKey, langfuseBaseUrl],
	);

	// Initialize LangfuseWeb for client-side feedback
	const LANGFUSEWEB = useMemo(
		() =>
			langfusePublicKey
				? new LangfuseWeb({
						publicKey: langfusePublicKey,
						baseUrl:
							langfuseBaseUrl || "https://cloud.langfuse.com",
						release: packagejson.version,
					})
				: undefined,
		[langfusePublicKey, langfuseBaseUrl],
	);

	/**
	 * Handler for user feedback.
	 */
	const handleFeedback = useMemo(
		() =>
			LANGFUSEWEB
				? async (value: number, traceId: string) => {
						await LANGFUSEWEB.score({
							traceId,
							name: "user-feedback",
							value,
						});
					}
				: undefined,
		[LANGFUSEWEB],
	);

	// get App Builder data, we need it to extract parameter tooltips
	const {data: appBuilderData} = useContext(AppBuilderDataContext);
	const parameterRefs = useMemo(
		() => (appBuilderData ? getParameterRefs(appBuilderData) : []),
		[appBuilderData],
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
				parameterNamesToInclude,
				parameterNamesToExclude,
				parameterRefs,
			),
		[
			parameters,
			dynamicParameters,
			parameterNamesToInclude,
			parameterNamesToExclude,
			parameterRefs,
		],
	);

	/** System prompt with parameter and author context. */
	const systemPromptComplete = useMemo(() => {
		return authorContext
			? `${systemPrompt}\n##### AUTHOR #####\n${authorContext}\n##### PARAMETERS #####\n${parametersContext}`
			: `${systemPrompt}\n##### PARAMETERS #####\n${parametersContext}`;
	}, [systemPrompt, authorContext, parametersContext]);

	/** Session id for langfuse */
	const langfuseSessionId = useMemo(() => crypto.randomUUID(), []);

	const llmInteraction = useCallback(
		async (
			userQuery: string,
			userImage: string | null,
			screenshot: string | null,
			errorMessages?: string[],
		) => {
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
			const completion = await (
				llmSpan
					? observeOpenAI(OPENAI, {
							parent: llmSpan,
							generationName: "OpenAI-Generation",
						})
					: OPENAI
			).beta.chat.completions.parse({
				model: model,
				messages: messages as any,
				response_format: responseFormat,
				//max_tokens: 1000,
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
				console.warn("No LLM response ?!", parsedMessage);

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
				notifications.error({
					title: "Invalid parameter updates",
					message: msgs.join(" "),
				});
				// TODO handle errors, recurse llmInteraction with error messages
			}
			updateSpan?.end();
		},
		[
			batchParameterValueUpdate,
			langfuseSessionId,
			langfuseTags,
			model,
			parameters,
			systemPromptComplete,
		],
	);

	return {
		chatHistory,
		handleFeedback,
		isReady: !!OPENAI,
		llmInteraction,
		systemPromptComplete,
	};
}
