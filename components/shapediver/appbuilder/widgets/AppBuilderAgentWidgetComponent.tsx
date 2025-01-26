import React, { useContext, useState, useCallback } from "react";
import { MantineStyleProp, MantineThemeComponent, Paper, PaperProps, useProps } from "@mantine/core";
import { IAppBuilderWidgetPropsAgent } from "../../../../types/shapediver/appbuilder";
import MarkdownWidgetComponent from "../../ui/MarkdownWidgetComponent";
import { AppBuilderContainerContext } from "../../../../context/AppBuilderContext";
import { useAllParameters } from "../../../../hooks/shapediver/parameters/useAllParameters";
import { Button, TextInput, ActionIcon, FileButton, ScrollArea } from "@mantine/core";
import { IconPaperclip, IconUser, IconRobot } from "@tabler/icons-react";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ChatCompletionMessageParam } from "openai/resources";
import { IShapeDiverParameter } from "../../../../types/shapediver/parameter";
import { ShapeDiverResponseParameterType } from "@shapediver/sdk.geometry-api-sdk-v2";
import { IShapeDiverStoreParameters } from "../../../../types/store/shapediverStoreParameters";
import { useShapeDiverStoreParameters } from "../../../../store/useShapeDiverStoreParameters";
import { useShallow } from "zustand/react/shallow";
import { useViewportId } from "../../../../hooks/shapediver/viewer/useViewportId";
import { useShapeDiverStoreViewportAccessFunctions } from "../../../../store/useShapeDiverStoreViewportAccessFunctions";


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
		// TODO Alex to Mayur: What's the reason we are asking for the old value?  
		// MM Response : Its for debugging for hallucination and better accuracy (pause and reflect)
		oldValue: z.string().describe("The old value for the parameter"),
	})).describe("Array of parameters to update"),
	summary_and_reasoning: z.string().describe("A summary of the parameter update and the reasoning behind the parameter update")
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
	parameterName: ${def.name}
	parameterType: ${def.type}
	current_value: ${currentValue === undefined || currentValue === undefined ? "none" : currentValue}
	min: ${def.min === undefined || def.min === undefined ? "none" : def.min}
	max: ${def.max === undefined || def.max === undefined ? "none" : def.max}
	tooltip: ${def.tooltip || "none"}
	choices : ${def.choices || "none"}
	displayName : ${def.displayname || "none"}
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
			messages.push(`Parameter ${update.parameterId} does not exist.`);
			
			return;
		}
		if (indices.includes(index)) {
			messages.push(`Refusing to update parameter ${update.parameterId} twice.`);
			
			return;
		}
		indices.push(index);

		const parameter = parameters[index];
		if (!parameter.actions.isValid(update.newValue, false)) {
			messages.push(`New value ${update.newValue} is not valid for parameter ${update.parameterId}.`);
			
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
	/** Latest reasoning provided by the assistant. */
	const [reasoning, setReasoning] = useState("Agent response explaining the changes made...");
	/** Optional image provided by the user. */
	const [userImage, setUserImage] = useState<string | null>(null);
	/** Chat history (user and reasoning by assistant). */
	const [chatHistory, setChatHistory] = useState<ChatCompletionMessageParam[]>([]);
	
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
	console.log("-----------------------------------")
	console.log("viewportId", viewportId);
   console.log("getScreenshot", getScreenshot);
   // get screenshot value
   const screenshot = await getScreenshot();
   console.log("screenshot", screenshot);
   console.log("-----------------------------------")

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

	const llm = async (userQuery: string) => {
		// Add user message to chat history
		setChatHistory(prev => [...prev, { role: "user", content: userQuery }]);

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
		const recentHistory = chatHistory.slice(-maxHistoryMessages);

		const messages: ChatCompletionMessageParam[] = [
			{ 
				role: "system", 
				content: "You are a helpful assistant that can modify parameters based on the user's input and the context provided for a configurator app. Don't hallucinate parameterId, Ensure the suggested new values are within the min, max and available choices provided in context. If parameterType is stringlist, return the index of new choices from available choices rather than value of the choice." 
			},
			// Add previous chat history
			...recentHistory
		];

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

		//console.log("messages History", messages);

		const completion = await OPENAI.beta.chat.completions.parse({
			model: "gpt-4o-mini",  // Using the correct model name
			messages: messages as any, // Type assertion to handle mixed content types
			response_format: responseFormat,
			max_tokens: 1000,
		});

		const parsedMessage = completion.choices[0].message.parsed;
		if (!parsedMessage) {
			console.log("No LLM response ?!", parsedMessage);
			
			return;
		}
		console.log("LLM response", parsedMessage);
		
		// Set parameter values
		const msgs = await setParameterValues(namespace, 
			Object.values(parameters), 
			parsedMessage, 
			batchParameterValueUpdate
		);
		if (msgs.length > 0) {
			// TODO Alex to Mayur: How do we handle errors in the LLM response?
			// Maybe we can feed back the errors to the LLM and iterate. 
			console.error("Some parameter updates failed: ", msgs);
		}

		//console.log ("reasoning", parsedMessage.summary_and_reasoning);

		setReasoning(parsedMessage.summary_and_reasoning);

		const responseMessage = parsedMessage.summary_and_reasoning;
		setChatHistory(prev => [...prev, { role: "assistant", content: responseMessage }]);

		return `Updated parameters: ${parsedMessage.parameters.map(u => `${u.parameterId}: ${u.newValue}`).join(", ")}`;
	};

	const handleClick = async () => {
		try {
			setIsLoading(true);
			await llm(chatInput);
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
						handleClick();
					}
				}}
			/>
			<Button 
				onClick={handleClick} 
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
				</div>
			))}
		</ScrollArea>
	</Paper>;
}