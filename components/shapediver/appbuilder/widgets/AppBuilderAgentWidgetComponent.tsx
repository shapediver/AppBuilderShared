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
import {IAppBuilderWidgetPropsAgent} from "@AppBuilderShared/types/shapediver/appbuilder";
import {AppBuilderContainerContext} from "@AppBuilderShared/context/AppBuilderContext";
import {
	Button,
	TextInput,
	ActionIcon,
	FileButton,
	ScrollArea,
} from "@mantine/core";
import {IconUser, IconRobot} from "@tabler/icons-react";
import {useShallow} from "zustand/react/shallow";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";
import AppBuilderImage from "../AppBuilderImage";
import MarkdownWidgetComponent from "../../ui/MarkdownWidgetComponent";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useAgent} from "@AppBuilderShared/hooks/shapediver/appbuilder/useAgent";

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

/** Default values for component properties. */
const defaultStyleProps: Partial<ComponentProps> = {};

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
 * The AI agent widget component.
 * @param props
 * @returns
 */
export default function AppBuilderAgentWidgetComponent(
	props: Props & AppBuilderAgentWidgetThemePropsType,
) {
	const {namespace, context, parameterNames, parameterNamesExclude, ...rest} =
		props;
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
		systemPrompt,
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

	/** Current chat input by the user. */
	const [chatInput, setChatInput] = useState("");
	/** Loading state while LLM interaction is ongoing. */
	const [isLoading, setIsLoading] = useState(false);
	/** Optional image provided by the user. */
	const [userImage, setUserImage] = useState<string | null>(null);
	/** Optional screenshot image. */
	const [screenshot, setScreenshot] = useState<string | null>(null);

	/** Context from Grasshopper */
	const [authorContext, setAuthorContext] = useState<string | undefined>(
		_authorContext ?? context,
	);
	useEffect(() => {
		setAuthorContext(_authorContext ?? context);
	}, [context, _authorContext]);

	// Hook for getting screenshots from viewport
	const {viewportId} = useViewportId();
	const {getScreenshot} = useShapeDiverStoreViewportAccessFunctions(
		useShallow((state) => ({
			getScreenshot:
				state.viewportAccessFunctions[viewportId]?.getScreenshot,
		})),
	);

	// Notifications
	const notifications = useContext(NotificationContext);

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

	/** Tags to attach to langfuse traces. */
	const langfuseTags = useMemo(() => {
		const slug = urlParams.get("slug");

		return slug ? [slug] : [];
	}, [urlParams]);

	const {
		chatHistory,
		handleFeedback,
		isReady,
		llmInteraction,
		systemPromptComplete,
	} = useAgent({
		authorContext,
		langfuseBaseUrl,
		langfusePublicKey,
		langfuseSecretKey,
		langfuseTags,
		maxHistory,
		model,
		namespace,
		openaiApiKey,
	});

	/** Handler for user query */
	const handleUserQuery = async () => {
		const _chatInput = chatInput.trim();
		try {
			setIsLoading(true);
			setChatInput("");
			await llmInteraction(_chatInput, userImage, screenshot);
			if (userImage) setUserImage(null);
			if (screenshot) setScreenshot(null);
		} catch (error) {
			console.error("Error calling LLM: ", error);
			notifications.error({
				title: "Error calling LLM",
				message:
					error instanceof Error ? error.message : "Unknown error",
			});
			setChatInput(_chatInput);
		} finally {
			setIsLoading(false);
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
			{isReady && openaiApiKey !== "YOUR_OPENAI_API_KEY" ? (
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
								if (!isLoading && e.key === "Enter") {
									handleUserQuery();
								}
							}}
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
								{message.role === "assistant" &&
									handleFeedback && (
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
												<Icon
													type={IconTypeEnum.ThumbUp}
												/>
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
													type={
														IconTypeEnum.ThumbDown
													}
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
								value={systemPromptComplete}
								disabled
								autosize
								maxRows={15}
							/>
						</>
					) : null}
				</Stack>
			) : (
				<Text size="sm" c="red">
					An OpenAI API key is missing. Please provide one in the URL
					or using a theme file.
				</Text>
			)}
		</Paper>
	);
}
