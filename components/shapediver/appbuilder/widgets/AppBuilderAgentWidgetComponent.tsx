import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {AppBuilderContainerContext} from "@AppBuilderShared/context/AppBuilderContext";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {
	DEFAULT_SYSTEM_PROMPT,
	useAgent,
} from "@AppBuilderShared/hooks/shapediver/appbuilder/useAgent";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";
import {
	AppBuilderAgentWidgetComponentProps,
	AppBuilderAgentWidgetThemePropsType,
} from "@AppBuilderShared/types/components/shapediver/props/appBuilderAgentWidget";
import {IAppBuilderWidgetPropsAgent} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	ActionIcon,
	Box,
	Button,
	createTheme,
	FileButton,
	Group,
	MantineStyleProp,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Textarea,
	TextInput,
	useMantineTheme,
	useProps,
} from "@mantine/core";
import {
	IconDeviceDesktop,
	IconPaperclip,
	IconRobot,
	IconThumbDown,
	IconThumbUp,
	IconUser,
} from "@tabler/icons-react";
import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {useShallow} from "zustand/react/shallow";
import MarkdownWidgetComponent from "../../ui/MarkdownWidgetComponent";
import AppBuilderImage from "../AppBuilderImage";

/** Default values for component properties. */
const defaultStyleProps: Partial<AppBuilderAgentWidgetComponentProps> = {};

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

	/** System prompt */
	const [systemPrompt, setSystemPrompt] = useState<string | undefined>(
		_systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
	);

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
		parameterNamesToExclude:
			parameterNamesToExclude ?? parameterNamesExclude,
		parameterNamesToInclude: parameterNamesToInclude ?? parameterNames,
		systemPrompt,
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

	// Duplicate and reverse the chat history for display
	const chatHistoryReverse = chatHistory.slice().reverse();

	// use the theme, create one using lower font sizes for markdown output
	const theme = useMantineTheme();
	const markdownTheme = createTheme({
		fontSizes: {
			xs: theme.fontSizes.xs,
			sm: theme.fontSizes.xs,
			md: theme.fontSizes.sm,
			lg: theme.fontSizes.md,
			xl: theme.fontSizes.lg,
		},
	});

	return (
		<Paper {...paperProps} style={styleProps}>
			{isReady && openaiApiKey !== "YOUR_OPENAI_API_KEY" ? (
				<Stack>
					<Group>
						{userImage ? (
							<TooltipWrapper label={"Remove image"}>
								<ActionIcon onClick={() => setUserImage(null)}>
									<Icon iconType={IconPaperclip} />
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
											<Icon iconType={IconPaperclip} />
										</ActionIcon>
									</TooltipWrapper>
								)}
							</FileButton>
						)}
						{screenshot ? (
							<TooltipWrapper label={"Remove screenshot"}>
								<ActionIcon onClick={() => setScreenshot(null)}>
									<Icon iconType={IconDeviceDesktop} />
								</ActionIcon>
							</TooltipWrapper>
						) : (
							<TooltipWrapper label={"Attach a screenshot"}>
								<ActionIcon
									variant="subtle"
									onClick={handleGetScreenshot}
									disabled={!!userImage}
								>
									<Icon iconType={IconDeviceDesktop} />
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
												<MarkdownWidgetComponent
													themeOverride={
														markdownTheme
													}
												>
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
												<Icon iconType={IconThumbUp} />
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
													iconType={IconThumbDown}
												/>
											</ActionIcon>
										</Group>
									)}
							</Stack>
						))}
					</ScrollArea>
					{debug ? (
						<>
							<Text size="sm">System prompt:</Text>
							<Textarea
								value={systemPrompt}
								onChange={(event) =>
									setSystemPrompt(event.currentTarget.value)
								}
								autosize
								maxRows={10}
							/>
							<Text size="sm">Context from Grasshopper:</Text>
							<Textarea
								value={authorContext}
								onChange={(event) =>
									setAuthorContext(event.currentTarget.value)
								}
								autosize
								maxRows={10}
							/>
							<Text size="sm">Combined prompt:</Text>
							<Textarea
								value={systemPromptComplete}
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
