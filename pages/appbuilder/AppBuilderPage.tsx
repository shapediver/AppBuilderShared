import AppBuilderContainerComponent from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderContainerComponent";
import AppBuilderFallbackContainerComponent from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderFallbackContainerComponent";
import MarkdownWidgetComponent from "@AppBuilderShared/components/shapediver/ui/MarkdownWidgetComponent";
import { ComponentContext } from "@AppBuilderShared/context/ComponentContext";
import useAppBuilderSettings from "@AppBuilderShared/hooks/shapediver/appbuilder/useAppBuilderSettings";
import { SessionWithAppBuilderHandler, useSessionWithAppBuilder } from "@AppBuilderShared/hooks/shapediver/appbuilder/useSessionWithAppBuilder";
import { useParameterHistory } from "@AppBuilderShared/hooks/shapediver/parameters/useParameterHistory";
import { useSessionPropsExport } from "@AppBuilderShared/hooks/shapediver/parameters/useSessionPropsExport";
import { useSessionPropsParameter } from "@AppBuilderShared/hooks/shapediver/parameters/useSessionPropsParameter";
import useDefaultSessionDto from "@AppBuilderShared/hooks/shapediver/useDefaultSessionDto";
import { useKeyBindings } from "@AppBuilderShared/hooks/shapediver/useKeyBindings";
import {
	IAppBuilderTemplatePageContainerHints,
	IAppBuilderTemplatePageProps,
} from "@AppBuilderShared/types/pages/appbuildertemplates";
import {
	IAppBuilderSettingsSession,
	IAppBuilderContainer,
	IAppBuilder,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import { shouldUsePlatform } from "@AppBuilderShared/utils/platform/environment";
import React, { useContext } from "react";
import AlertPage from "@AppBuilderShared/pages/misc/AlertPage";
import LoaderPage from "@AppBuilderShared/pages/misc/LoaderPage";
import AppBuilderTemplateSelector from "@AppBuilderShared/pages/templates/AppBuilderTemplateSelector";
import {AppBuilderDataContext} from "@AppBuilderShared/context/AppBuilderContext";

const urlWithoutQueryParams = window.location.origin + window.location.pathname;

const WelcomePlatformMarkdown = `
## Welcome to the ShapeDiver App Builder

You can use this page to display any model from your ShapeDiver platform [library](https://help.shapediver.com/doc/model-library), 
as well as public models. You will be redirected to the login page if you are not logged in to the platform.

You can display:

   * models owned by your account (including private models), 
   * models shared with you, and
   * public models.

Note: You do **not** need to enable iframe or direct embedding for this to work.

Example: 

[${urlWithoutQueryParams}?slug=react-ar-cube](${urlWithoutQueryParams}?slug=react-ar-cube)
`;

const WelcomeIframeMarkdown = `
## Welcome to the ShapeDiver App Builder

This page can be opened directly or embedded in an iframe. 
Use this page in one of the following ways to display your model:

### Provide the slug of your model

Example: 

[${urlWithoutQueryParams}?slug=react-ar-cube](${urlWithoutQueryParams}?slug=react-ar-cube)

You need to allow [iframe embedding](https://help.shapediver.com/doc/iframe-settings) for this to work.

This method supports protection of your model by a short lived token. You can use the *Require strong authorization* setting for your model. 
This protection can be enabled in the [Embedding settings](https://help.shapediver.com/doc/setup-domains-for-embedding) for all of your models, 
or individually for each model in the [Developer settings](https://help.shapediver.com/doc/developers-settings).  

### Provide ticket and modelViewUrl

Example:

[${urlWithoutQueryParams}?ticket=TICKET&modelViewUrl=MODEL_VIEW_URL](${urlWithoutQueryParams}?ticket=YOUR_TICKET&modelViewUrl=MODEL_VIEW_URL)

You need to allow [direct embedding](https://help.shapediver.com/doc/developers-settings) for this to work. 
Copy the *Embedding ticket* and the *Model view URL* from the [Developer settings](https://help.shapediver.com/doc/developers-settings) of your model,
and replace YOUR_TICKET and MODEL_VIEW_URL in the URL shown above.

**Note:**
This method does **not** support protection of your model by a short lived token. 
You need to disable the *Require strong authorization* setting for your model. 
`;

const WelcomeLocalhostMarkdown = `
## Welcome to the ShapeDiver App Builder

You are using the App Builder SDK in local development mode. 
Use this page in one of the following ways to display your model:

### Provide the slug of your model

When developing locally, loading models based on their slug is only supported when using the development or staging platform.

Example: 

[${urlWithoutQueryParams}?slug=react-ar-cube&platformUrl=https://dev-wwwcdn.us-east-1.shapediver.com](${urlWithoutQueryParams}?slug=react-ar-cube&platformUrl=https://dev-wwwcdn.us-east-1.shapediver.com)

If you want the application to behave like it is running in the ShapeDiver platform, you can use one of the query parameter \`useDevPlatform\`, or \`useStagingPlatform\`, or \`useSandboxPlatform\` instead of specifying \`platformUrl\`. Example:

[${urlWithoutQueryParams}?slug=react-ar-cube&useDevPlatform=true](${urlWithoutQueryParams}?slug=react-ar-cube&useDevPlatform=true)

### Provide ticket and modelViewUrl

Example:

[${urlWithoutQueryParams}?ticket=TICKET&modelViewUrl=MODEL_VIEW_URL](${urlWithoutQueryParams}?ticket=YOUR_TICKET&modelViewUrl=MODEL_VIEW_URL)

You need to allow [direct embedding](https://help.shapediver.com/doc/developers-settings) for this to work. 
Copy the *Embedding ticket* and the *Model view URL* from the [Developer settings](https://help.shapediver.com/doc/developers-settings) of your model,
and replace YOUR_TICKET and MODEL_VIEW_URL in the URL shown above.

**Note:**
This method does **not** support protection of your model by a short lived token. 
You need to disable the *Require strong authorization* setting for your model. 

### Provide a json file

You can store the \`ticket\` and \`modelViewUrl\` in a json file in the \`public\` directory and use it like this:

Example: 

[${urlWithoutQueryParams}?g=example.json](${urlWithoutQueryParams}?g=example.json)

Using this method, you can also provide theme settings, as well as further settings useful for local development. 
Check out the interface \`IAppBuilderSettingsJson\` in the code for all available settings.
`;

/** Check whether the given IAppBuilder contains an AI agent widget. */
function hasAiAgentWidget(data: IAppBuilder | undefined): boolean {
	if (!data) return false;
	return data.containers.some(
		(c) =>
			c.widgets?.some((w) => w.type === "agent") ||
			c.tabs?.some((t) => t.widgets?.some((w) => w.type === "agent")),
	);
}

interface Props extends IAppBuilderSettingsSession {
	/** Name of example model */
	example?: string;
}

/**
 * Create rendering hints for the container.
 * @param container
 * @returns
 */
const createContainerHints = (
	container: IAppBuilderContainer,
): IAppBuilderTemplatePageContainerHints | undefined => {
	// if the bottom container contains tabs, prefer vertical layout
	if (
		container.name === "bottom" &&
		container.tabs &&
		container.tabs.length > 0
	) {
		return {
			preferVertical: true,
		};
	}
};

/**
 * Function that creates the web app page.
 *
 * @returns
 */
export default function AppBuilderPage(props: Partial<Props>) {
	// get default session dto, if any
	const { defaultSessionDto } = useDefaultSessionDto(props);

	// get the component context to get the correct viewport
	const componentContext = useContext(ComponentContext);
	const {
		viewportComponent: { component: ViewportComponent } = {},
		viewportOverlayWrapper: { component: ViewportOverlayWrapper } = {},
		viewportIcons: { component: ViewportIcons } = {},
	} = componentContext;

	// get settings for app builder from query string
	const {
		settings,
		error: settingsError,
		loading,
		hasSettings,
		hasSession,
	} = useAppBuilderSettings(defaultSessionDto);

	// for now we only make use of the first session in the settings
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const {
		namespace,
		sessionApi,
		error: appBuilderError,
		hasAppBuilderOutput,
		appBuilderData,
	} = useSessionWithAppBuilder(sessionDto, settings?.appBuilderOverride);
	const error = settingsError ?? appBuilderError;

	// get props for fallback parameters
	const parameterProps = useSessionPropsParameter(namespace);
	const exportProps = useSessionPropsExport(namespace);

	const sessionHandlers: JSX.Element[] = [];
	if (settings?.sessions && settings.sessions.length > 1) {
		settings?.sessions.map((session) => {
			sessionHandlers.push(
				<SessionWithAppBuilderHandler
					key={session.id}
					props={session}
					appBuilderOverride={settings?.appBuilderOverride}
				/>
			);
		});
	}

	// create UI elements for containers
	const containers: IAppBuilderTemplatePageProps = {
		top: undefined,
		bottom: undefined,
		left: undefined,
		right: undefined,
	};

	// should fallback containers be shown?
	const showFallbackContainers =
		settings?.settings?.disableFallbackUi !== true;

	if (appBuilderData?.containers) {
		// SS-8371 add AppBuilderAgentWidgetComponent for testing
		if (!hasAiAgentWidget(appBuilderData)) {
			const hasRightContainer = appBuilderData.containers.some(
				(c) => c.name === "right",
			);
			if (!hasRightContainer) {
				appBuilderData.containers.push({
					name: "right",
					widgets: [
						{
							type: "agent",
							props: {},
						},
					],
				});
			} else {
				appBuilderData.containers.forEach((c) => {
					if (c.name === "right") {
						if (!c.widgets) c.widgets = [];
						c.widgets.push({
							type: "agent",
							props: {},
						});
					}
				});
			}
		}
		appBuilderData.containers.forEach((container) => {
			containers[container.name] = {
				node: (
					<AppBuilderContainerComponent
						namespace={namespace}
						{...container}
					/>
				),
				hints: createContainerHints(container),
			};
		});
	} else if (
		!hasAppBuilderOutput &&
		(parameterProps.length > 0 || exportProps.length > 0) &&
		showFallbackContainers
	) {
		containers.right = {
			node: (
				<AppBuilderFallbackContainerComponent
					parameters={parameterProps}
					exports={exportProps}
					namespace={namespace}
				/>
			),
		};
	}

	const show = !!sessionApi;

	// use parameter history
	useParameterHistory({ loaded: show });

	// key bindings
	useKeyBindings({ namespace });

	const showMarkdown =
		!(settings && hasSession) && // no settings or no session
		!loading && // not loading
		!error && // no error
		!(hasSettings && hasSession); // there are no query string parameters or no session

	const NoSettingsMarkdown =
		window.location.hostname === "localhost"
			? WelcomeLocalhostMarkdown
			: shouldUsePlatform()
				? WelcomePlatformMarkdown
				: WelcomeIframeMarkdown;

	return showMarkdown ? (
		<AlertPage>
			<MarkdownWidgetComponent anchorTarget="_self">
				{NoSettingsMarkdown}
			</MarkdownWidgetComponent>
		</AlertPage>
	) : error ? (
		<AlertPage title="Error">{error.message}</AlertPage>
	) : loading || !show ? (
		<LoaderPage /> // TODO smooth transition between loading and showing
	) : show ? (
		<AppBuilderDataContext.Provider value={{data: appBuilderData}}>
			<AppBuilderTemplateSelector
				top={containers.top}
				left={containers.left}
				right={containers.right}
				bottom={containers.bottom}
			>
				{ViewportComponent && (
					<ViewportComponent visibilitySessionIds={settings?.sessions.map((s) => s.id)} >
						{ViewportOverlayWrapper && (
							<ViewportOverlayWrapper>
								{ViewportIcons && <ViewportIcons />}
							</ViewportOverlayWrapper>
						)}
					</ViewportComponent>
				)}
			</AppBuilderTemplateSelector>
		</AppBuilderDataContext.Provider>
	) : (
		<></>
	);
}
