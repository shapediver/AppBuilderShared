import React, { useContext, useState } from "react";
import { MantineStyleProp, MantineThemeComponent, Paper, PaperProps, useProps } from "@mantine/core";
import { IAppBuilderWidgetPropsAgent } from "../../../../types/shapediver/appbuilder";
import MarkdownWidgetComponent from "../../ui/MarkdownWidgetComponent";
import { AppBuilderContainerContext } from "../../../../context/AppBuilderContext";
import { useAllParameters } from "../../../../hooks/shapediver/parameters/useAllParameters";
import { Button, TextInput, ActionIcon, FileButton } from "@mantine/core";
import { IconPaperclip } from '@tabler/icons-react';

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {z} from "zod";


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

export default function AppBuilderAgentWidgetComponent(props: Props & AppBuilderAgentWidgetThemePropsType) {

	const { namespace, context, ...rest } = props;
	const themeProps = useProps("AppBuilderAgentWidgetComponent", defaultStyleProps, rest);
	const [chatInput, setChatInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [reasoning, setReasoning] = useState('Agent response explaining the changes made...');
	const [uploadedImage, setUploadedImage] = useState<string | null>(null);
	
	// get access to all parameters
	const { parameters } = useAllParameters(namespace);
    //console.log("AppBuilderAgentWidgetComponent: Available parameters", parameters);

	// get access to all dynamic parameters
	const { parameters: dynamicParameters } = useAllParameters(`${namespace}_appbuilder`);
	//console.log("AppBuilderAgentWidgetComponent: Available dynamic parameters", dynamicParameters);
    
	// To Do
	// feedback alert for outside range paramater
	// litellm option to switch between different llm providers
	// filter out parameters such as file, image out of llm context
	// pass in viewer image context. 
	
	// Create a combined string of all parameter definitions
	const parameterDefinitions = Object.values(parameters).map(param => {
		const def = param.definition;
		//console.log("def", def);
		return `
		parameterId: ${def.id}
		parameterName: ${def.name}
		parameterType: ${def.type}
		default_value: ${def.defval || 'none'}
		min: ${def.min || 'none'}
		max: ${def.max || 'none'}
		tooltip: ${def.tooltip || 'none'}
		choices : ${def.choices || 'none'}
		displayName : ${def.displayname || 'none'}
		
		`
	}).join('\n');



	// llm init 
	const openai = new OpenAI({
		apiKey: import.meta.env.VITE_OPENAI_API_KEY,
		dangerouslyAllowBrowser: true // Required for client-side usage
	});

	// Update the schema definition
	const parameterSchema = z.object({
		parameters: z.array(z.object({
			parameterId: z.string().describe("The id of the parameter to be updated"),
			parameterName: z.string().describe("The name of the parameter to be updated"),
			newValue: z.string().describe("The new value for the parameter"),
			oldValue: z.string().describe("The old value for the parameter"),
		})).describe("Array of parameters to update"),
		summary_and_reasoning: z.string().describe("A summary of the parameter update and the reasoning behind the parameter update")
	});


	// Update the llm function
	const handleImageUpload = (file: File) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			const base64String = reader.result as string;
			setUploadedImage(base64String);
			console.log("uploadedImage", uploadedImage);

		};
		reader.readAsDataURL(file);
	};

	const llm = async (userQuery: string, parametersContext: string) => {
		const userPrompt = `User Query: ${userQuery}
			Parameters Context: ${parametersContext}. 
			${uploadedImage ? 'An image has been provided for context.' : ''}
			Based on the user query and the parameters context, suggest new values for the parameters that suit the user query.
			`;

		//console.log("userPrompt", userPrompt);

		const messages = [
			{ 
				role: "system", 
				content: "You are a helpful assistant that can modify parameters based on the user's input and the context provided for a configurator app. Don't hallucinate parameterId, Ensure the suggested new values are within the min, max and available choices provided in context. If parameterType is stringlist, return the index of new choices from available choices rather than value of the choice." 
			}
		];

		// Add image to messages if present
		if (uploadedImage) {
			messages.push({
				role: "user",
				content: [
					{
						type: "image_url",
						image_url: {
							url: uploadedImage
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

		const responseFormat = zodResponseFormat(parameterSchema, "parameters_update");

		const completion = await openai.beta.chat.completions.parse({
			model: "gpt-4o-mini",  // Changed to vision model to handle images
			messages: messages,
			response_format: responseFormat,
			
		});

		
		console.log("LLM response", completion.choices[0].message.parsed);
		
		// Update parameters based on the response
		const updates = completion.choices[0].message.parsed.parameters;
		
		// Apply the parameter updates
		updates.forEach(update => {
			const parameter = parameters[update.parameterId];
			if (parameter) {
				parameter.actions.setUiValue(update.newValue);
				parameter.actions.execute(true);
			}
		});

		//console.log ("reasoning", completion.choices[0].message.parsed.summary_and_reasoning);

		setReasoning(completion.choices[0].message.parsed.summary_and_reasoning);

		return `Updated parameters: ${updates.map(u => `${u.parameterId}: ${u.newValue}`).join(', ')}`;
	};


	// Update handleClick to use the API key from environment variables
	const handleClick = async () => {
		try {
			setIsLoading(true);

			const response = await llm(chatInput, parameterDefinitions);
			
		} catch (error) {
			console.error('Error calling AI:', error);
		} finally {
			setIsLoading(false);
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

	return <Paper {...themeProps} style={styleProps}>
		<div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
			<FileButton 
				onChange={handleImageUpload} 
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
					if (e.key === 'Enter') {
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
        
		{uploadedImage && (
			<div className="mb-4">
				<img 
					src={uploadedImage} 
					alt="Uploaded preview" 
					className="max-h-32 rounded-md"
				/>
			</div>
		)}

		<MarkdownWidgetComponent>
			{reasoning}
		</MarkdownWidgetComponent>
		
		{/* <MarkdownWidgetComponent>
			{ markdown }
		</MarkdownWidgetComponent> */}
	</Paper>;
}
