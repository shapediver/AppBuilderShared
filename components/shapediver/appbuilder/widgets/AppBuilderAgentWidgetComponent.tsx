import React, { useContext, useState, useCallback, useEffect, useMemo } from "react";
import { MantineStyleProp, MantineThemeComponent, Paper, PaperProps, useProps } from "@mantine/core";
import { IAppBuilderWidgetPropsAgent } from "@AppBuilderShared/types/shapediver/appbuilder";
import MarkdownWidgetComponent from "@AppBuilderShared/components/shapediver/ui/MarkdownWidgetComponent";
import { AppBuilderContainerContext } from "@AppBuilderShared/context/AppBuilderContext";
import { useAllParameters } from "@AppBuilderShared/hooks/shapediver/parameters/useAllParameters";
import { Button, TextInput, ActionIcon, FileButton, ScrollArea } from "@mantine/core";
import { IconPaperclip, IconUser, IconRobot } from "@tabler/icons-react";
import { IShapeDiverParameter } from "@AppBuilderShared/types/shapediver/parameter";
import { ShapeDiverResponseParameterType } from "@shapediver/sdk.geometry-api-sdk-v2";
import { IShapeDiverStoreParameters } from "@AppBuilderShared/types/store/shapediverStoreParameters";
import { useShapeDiverStoreParameters } from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import { useShallow } from "zustand/react/shallow";
import { useViewportId } from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import { useShapeDiverStoreViewportAccessFunctions } from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ChatCompletionMessageParam } from "openai/resources";
import { z } from "zod";
import { Langfuse, LangfuseWeb, observeOpenAI } from "langfuse";

const langfuse = new Langfuse({
  secretKey: import.meta.env.VITE_LANGFUSE_SECRET_KEY,
  publicKey: import.meta.env.VITE_LANGFUSE_PUBLIC_KEY,
  baseUrl: import.meta.env.VITE_LANGFUSE_BASE_URL || "https://cloud.langfuse.com"
});

// Initialize LangfuseWeb for client-side feedback
const langfuseWeb = new LangfuseWeb({
  publicKey: import.meta.env.VITE_LANGFUSE_PUBLIC_KEY,
  baseUrl: import.meta.env.VITE_LANGFUSE_BASE_URL || "https://cloud.langfuse.com"
});

/** Style properties that can be controlled via the theme. */
type StylePros = PaperProps & {

};

/** Default values for style properties. */
const defaultStyleProps : Partial<StylePros> = {
};

type AppBuilderAgentWidgetThemePropsType = Partial<StylePros>;

export function AppBuilderAgentWidgetThemeProps(props: AppBuilderAgentWidgetThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
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
	parameters: z.array(z.object({
		parameterId: z.string().describe("The id of the parameter to be updated"),
		parameterName: z.string().describe("The name of the parameter to be updated"),
		newValue: z.string().describe("The new value for the parameter"),
		// Alex to Mayur: What's the reason we are asking for the old value?  
		// MM Response : Its for debugging for hallucination and better accuracy (pause and reflect)
		oldValue: z.string().describe("The old value for the parameter"),
	})).describe("Array of parameters to update"),
	summaryAndReasoning: z.string().describe("A summary of the parameter update and the reasoning behind the parameter update")
});
type AgentResponseType = z.infer<typeof AGENT_RESPONSE_SCHEMA>;


/** Initialize the OpenAI API client. */ 


const OPENAI = new OpenAI({

	apiKey: import.meta.env.VITE_OPENAI_API_KEY,
	dangerouslyAllowBrowser: true // Required for client-side usage
});

/** Toggle for debugging and testing. */
const DEBUG = true;

/**
 * Create a context string for a parameter that can be passed to the LLM.
 * @param param 
 * @returns 
 */
function createParameterContext(param: IShapeDiverParameter<any>) {
	const def = param.definition;
	const currentValue = param.state.uiValue;
	
	// TODO Alex to Mayur: 
	// We mix snake_case and camelCase in the parameter context.
	// Could that be a problem? 
	return `
	parameterId: ${def.id}
	parameterName: ${def.displayname || def.name}
	parameterType: ${def.type}
	currentValue: ${currentValue === null || currentValue === undefined ? "none" : currentValue}
	min: ${def.min === null || def.min === undefined ? "none" : def.min}
	max: ${def.max === null || def.max === undefined ? "none" : def.max}
	tooltip: ${def.tooltip || "none"}
	choices : ${def.choices || "none"}
	`;
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
 */
function createParametersContext(
	parameters: IShapeDiverParameter<any>[],
	parameterNames: string[] | undefined, 
) {
	return parameters
		.filter(p => !parameterNames || 
			parameterNames.includes(p.definition.name) || 
			(p.definition.displayname && parameterNames.includes(p.definition.displayname))
		)
		.filter(p => SUPPORTED_PARAMETER_TYPES.includes(p.definition.type))
		.map(p => createParameterContext(p))
		.join("\n")
	;
}

type ChatHistoryType = {
	content: string;
	role: 'user';
} | {
	content: string;
	role: 'assistant';
	traceId: string;
}

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
	const values: { [key: string]: any } = {};

	agentResponse.parameters.forEach(update => {
		const index = parameters.findIndex(p => p.definition.id === update.parameterId);
		if (index < 0) {
			messages.push(`Parameter with parameterId ${update.parameterId} does not exist.`);
			
			return;
		}
		if (indices.includes(index)) {
			messages.push(`Refusing to update parameter with parameterId ${update.parameterId} twice.`);
			
			return;
		}
		indices.push(index);

		const parameter = parameters[index];
		if (!parameter.actions.isValid(update.newValue, false)) {
			messages.push(`New value ${update.newValue} is not valid for parameter with parameterId ${update.parameterId}.`);
			
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
export default function AppBuilderAgentWidgetComponent(props: Props & AppBuilderAgentWidgetThemePropsType) {
	
	/**
	 * TODO Alex to Mayur: 
	 * The "context" is an optional string that can be output by the GH developer to provide 
	 * further context to the LLM. Please make use of this. 
	 * For purposes of testing and debugging, I suggest to add a text input field that
	 * allows us to edit the context string (if DEBUG is true).
	 */
	const { namespace, context, parameterNames, ...rest } = props;
	const themeProps = useProps("AppBuilderAgentWidgetComponent", defaultStyleProps, rest);

	/** Current chat input by the user. */
	const [chatInput, setChatInput] = useState("");
	/** Loading state while LLM interaction is ongoing. */
	const [isLoading, setIsLoading] = useState(false);
	/** Optional image provided by the user. */
	const [userImage, setUserImage] = useState<string | null>(null);
	/** Chat history for display (user messages and assistant reasoning) */
	const [chatHistory, setChatHistory] = useState<ChatHistoryType[]>([]);
	/** Complete LLM history for chat completion API */
	const [llmHistory, setLLMHistory] = useState<ChatCompletionMessageParam[]>([]);

	/** Session if for langfuse */
	const sessionId = useMemo(() => crypto.randomUUID(), []);
	
	// Get stateful access to all parameters
	const { parameters } = useAllParameters(namespace);
	const { parameters: dynamicParameters } = useAllParameters(`${namespace}_appbuilder`);

	// We want to do parameter batch updates
	const { batchParameterValueUpdate } = useShapeDiverStoreParameters(useShallow(state => ({ batchParameterValueUpdate: state.batchParameterValueUpdate })));
	
	// TODO Alex to Mayur: getting screenshots from viewport
	const { viewportId } = useViewportId();
	const { getScreenshot } = useShapeDiverStoreViewportAccessFunctions(useShallow(state => ({
		getScreenshot: state.viewportAccessFunctions[viewportId]?.getScreenshot,
	})));

	//  log screenshot when component mounts
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

	const handleFeedback = async (value: number, traceId: string) => {
		await langfuseWeb.score({
			traceId,
			name: "user-feedback",
			value,
		});
	};

	const llm = async (userQuery: string, errorMessages?: string[]) => {
		
		// Create a new trace for this user query
		const trace = langfuse.trace({
			name: "user-query",
			id: crypto.randomUUID(), // Generate unique trace ID
			sessionId,
			metadata: {
				userQuery,
				errorMessages,
				parameters: Object.values(parameters).map(p => ({
					id: p.definition.id,
					type: p.definition.type,
					name: p.definition.displayname ?? p.definition.name,
					uiValue: p.state.uiValue,
					execValue: p.state.execValue,
				}))
			}
		});

		// Add user query to chat history
		setChatHistory(prev => [...prev, { role: "user", content: userQuery }]);
		setLLMHistory(prev => [...prev, { role: "user", content: userQuery }]);

		// Create context for the parameters the user wants to expose to the LLM
		const parametersContext = createParametersContext(
			Object.values(parameters)
			// skip dynamic parameters for now
			//	.concat(Object.values(dynamicParameters))
			, parameterNames);

		const userPrompt = `User Query: ${userQuery}
			Parameters Context: ${parametersContext}. 
			${userImage ? "An image has been provided for context." : ""}
			Based on the user query and the parameters context, suggest new values for the parameters that suit the user query.
			`;

		const maxHistoryMessages = 10; // Adjust as needed
		
		// Enhance system prompt with confgurator app context information which has information about what the configurator app is about
		const systemPrompt = `You are a helpful assistant that can modify parameters based on the user's input and the context provided for a configurator app. Don't hallucinate parameterId. Ensure the suggested new values are within the min, max and available choices provided in context. If parameterType is stringlist, return the index of new choices from available choices rather than value of the choice. ${context ? `The configurator app context is: ${context}` : ""}`;

		const messages: ChatCompletionMessageParam[] = [
			{ 
				role: "system", 
				content: systemPrompt
			},
			// Add previous chat history
			...llmHistory.slice(-maxHistoryMessages)
		];

		// If there were errors, add them as context
		if (errorMessages?.length) {
			messages.push({
				role: "user",
				content: `The previous parameter updates failed with these errors: ${errorMessages.join(", ")}. Please provide new parameter values that address these issues.`
			});
		}

		// Add current message with image if present
		if (userImage) {
			messages.push({
				role: "user",
				content: [
					{
						type: "image_url",
						image_url: {
							url: userImage
						}
					},
					{
						type: "text",
						text: userPrompt
					}
				]
			});
		} else {
			messages.push({ role: "user", content: userPrompt });
		}

		const responseFormat = zodResponseFormat(AGENT_RESPONSE_SCHEMA, "parameters_update");

		// Create a span for the LLM interaction
		const model = "gpt-4o-mini";
		const llmSpan = trace.span({ 
			name: "llm-interaction",
			metadata: {
				model,
				hasImage: !!userImage
			}
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
				llmResponse: message
			}
		});

		setLLMHistory(prev => [...prev, {
			role: "assistant",
			content: message.content
		}]);

		const parsedMessage = message.parsed;
		if (!parsedMessage) {
			console.log("No LLM response ?!", parsedMessage);
			return;
		}

		// Update display chat history with just the summary
		setChatHistory(prev => [...prev, { 
			role: "assistant", 
			content: parsedMessage.summaryAndReasoning,
			traceId: trace.id,
		}]);
	
		// Create a span for parameter updates
		const updateSpan = trace.span({ 
			name: "parameter-updates",
			metadata: { 
				updates: parsedMessage.parameters 
			}
		});

		// Set parameter values (only do this once)
		const msgs = await setParameterValues(namespace, 
			Object.values(parameters), 
			parsedMessage, 
			batchParameterValueUpdate
		);

		updateSpan.end(); // End the update span

		if (msgs.length > 0) {
			trace.event({
				name: "Parameter update errors",
				metadata: { errors: msgs }
			});
		}
		
		return `Updated parameters: ${parsedMessage.parameters.map(u => `${u.parameterId}: ${u.newValue}`).join(", ")}`;
	};

	const handleParameterUpdate = async (parsedMessage: z.infer<typeof AGENT_RESPONSE_SCHEMA>) => {
		const msgs = await setParameterValues(
			namespace, 
			Object.values(parameters), 
			parsedMessage, 
			batchParameterValueUpdate
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

		return `Updated parameters: ${parsedMessage.parameters.map(u => `${u.parameterId}: ${u.newValue}`).join(", ")}`;
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

	// render ai widget content
	const markdown = `# AI Agent Widget
## Context
Context provided from Grasshopper: 

_${context}_
	
## Parameters
${Object.values(parameters).map(p => `* ${p.definition.name} (${p.definition.type})`).join("\n")}

## Dynamic Parameters
${Object.values(dynamicParameters).map(p => `* ${p.definition.name} (${p.definition.type})`).join("\n")}
`;

	// check for container alignment
	const containerContext = useContext(AppBuilderContainerContext);
	const styleProps: MantineStyleProp = {};
	if (containerContext.orientation === "horizontal") {
		styleProps.height = "100%";
	} else if (containerContext.orientation === "vertical") {
		styleProps.overflowX = "auto";
	}
	styleProps.fontWeight = "100";

	const messageStyles = {
		messageContainer: "flex w-full mb-4",
		messageWrapper: "flex items-center gap-2 max-w-[80%]",
		userWrapper: "ml-auto",
		assistantWrapper: "mr-auto",
		messageContent: "flex items-center gap-2",
		userContent: "flex-row-reverse",
		message: "p-4 rounded-lg",
		user: "bg-blue-500 text-white",
		assistant: "bg-gray-100 text-gray-900",
		icon: "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
		userIcon: "bg-blue-600 text-white",
		assistantIcon: "bg-gray-200 text-gray-700"
	};

	// Add feedback UI styles
	const feedbackStyles = {
		container: "flex gap-2 mt-2 justify-end",
		button: "p-2 rounded-full hover:bg-gray-200 transition-colors",
		activeButton: "bg-blue-100"
	};

	return <Paper {...themeProps} style={styleProps}>
		<div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
			<FileButton 
				onChange={handleUserImage} 
				accept="image/png,image/jpeg"
			>
				{(props) => (
					<ActionIcon 
						variant="subtle" 
						{...props}
						className="hover:bg-gray-100"
					>
						<IconPaperclip size={18} />
					</ActionIcon>
				)}
			</FileButton>
			<TextInput 
				placeholder="Ask a question" 
				style={{ flex: 1 }}
				value={chatInput}
				onChange={(e) => setChatInput(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						handleUserQuery();
					}
				}}
			/>
			<Button 
				onClick={handleUserQuery} 
				loading={isLoading}
			>
				SD AI Agent
			</Button>
		</div>
        
		{userImage && (
			<div className="mb-4">
				<img 
					src={userImage} 
					alt="Uploaded preview" 
					className="max-h-32 rounded-md"
				/>
			</div>
		)}

		<ScrollArea h={400} className="mb-4 p-4 border rounded-lg">
			{chatHistory.map((message, index) => (
				<div key={index} className={messageStyles.messageContainer}>
					<div className={`${messageStyles.messageWrapper} ${
						message.role === "user" ? messageStyles.userWrapper : messageStyles.assistantWrapper
					}`}>
						<div className={`${messageStyles.messageContent} ${
							message.role === "user" ? messageStyles.userContent : ""
						}`}>
							<div className={`${messageStyles.icon} ${
								message.role === "user" ? messageStyles.userIcon : messageStyles.assistantIcon
							}`}>
								{message.role === "user" ? (
									<IconUser size={18} />
								) : (
									<IconRobot size={18} />
								)}
							</div>
							<div className={`${messageStyles.message} ${
								message.role === "user" ? messageStyles.user : messageStyles.assistant
							}`}>
								<MarkdownWidgetComponent>
									{typeof message.content === "string" ? message.content : JSON.stringify(message.content)}
								</MarkdownWidgetComponent>
							</div>
						</div>
					</div>
					
					{/* Add feedback buttons for assistant messages */}
					{message.role === "assistant" && (
						<div className={feedbackStyles.container}>
							<button 
								className={feedbackStyles.button}
								onClick={() => handleFeedback(1, message.traceId)}
								aria-label="Thumbs up"
							>
								👍
							</button>
							<button 
								className={feedbackStyles.button}
								onClick={() => handleFeedback(0, message.traceId)}
								aria-label="Thumbs down"
							>
								👎
							</button>
						</div>
					)}
				</div>
			))}
		</ScrollArea>
	</Paper>;
}