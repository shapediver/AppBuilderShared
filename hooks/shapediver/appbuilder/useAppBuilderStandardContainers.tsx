import AppBuilderContainerComponent from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderContainerComponent";
import AppBuilderFallbackContainerComponent from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderFallbackContainerComponent";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderShared/store/useShapeDiverStoreStandardContainers";
import {
	IAppBuilderTemplatePageContainerHints,
	IAppBuilderTemplatePageProps,
} from "@AppBuilderShared/types/pages/appbuildertemplates";
import {
	AppBuilderContainerNameType,
	IAppBuilder,
	IAppBuilderContainer,
	IAppBuilderSettingsResolved,
	IAppBuilderSettingsSession,
	isStandardContainer,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import React, {useEffect, useMemo} from "react";
import {useSessionPropsExport} from "../parameters/useSessionPropsExport";
import {useSessionPropsOutput} from "../parameters/useSessionPropsOutput";
import {useSessionPropsParameter} from "../parameters/useSessionPropsParameter";
import {useViewportAnchors} from "../viewer/useViewportAnchors";

interface Props {
	namespace: string;
	appBuilderData?: IAppBuilder;
	sessionSettings?: IAppBuilderSettingsSession;
	settings?: IAppBuilderSettingsResolved;
	hasAppBuilderOutput: boolean;
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
		container.name === AppBuilderContainerNameType.Bottom &&
		container.tabs &&
		container.tabs.length > 0
	) {
		return {
			preferVertical: true,
		};
	}
};

/**
 * Hook to manage standard containers for the app builder.
 * This hook provides the necessary props and state management for the standard containers.
 * It also handles the viewport anchors.
 *
 * Once the mergedContainers are available, it creates the necessary UI elements for each container.
 *
 * @param props
 * @returns
 */
export function useAppBuilderStandardContainers(props: Props) {
	const {
		namespace,
		appBuilderData,
		sessionSettings,
		settings,
		hasAppBuilderOutput,
	} = props;

	// get props for fallback parameters
	const parameterProps = useSessionPropsParameter(namespace);
	const exportProps = useSessionPropsExport(namespace);
	const outputProps = useSessionPropsOutput(
		namespace,
		(output) => !!output.chunks,
	);

	const {mergedContainers, resetDefaultContainers, setDefaultContainers} =
		useShapeDiverStoreStandardContainers((state) => ({
			mergedContainers: state.mergedContainers,
			resetDefaultContainers: state.resetDefaultContainers,
			setDefaultContainers: state.setDefaultContainers,
		}));

	// viewport anchors
	const anchors = useViewportAnchors({
		namespace,
		containers: appBuilderData?.containers,
	});

	// should fallback containers be shown?
	const showFallbackContainers =
		settings?.settings?.disableFallbackUi !== true;

	// Update store with default containers whenever appBuilderData changes
	// This only stores the container definition within the store
	useEffect(() => {
		// Reset containers first
		resetDefaultContainers();

		if (appBuilderData?.containers) {
			const standardContainers = appBuilderData.containers
				.filter((container) => isStandardContainer(container))
				.reduce(
					(acc, container) => ({
						...acc,
						[container.name]: container,
					}),
					{} as Record<
						AppBuilderContainerNameType,
						IAppBuilderContainer | undefined
					>,
				);
			setDefaultContainers(standardContainers);
		}
	}, [
		appBuilderData?.containers,
		setDefaultContainers,
		resetDefaultContainers,
	]);

	// Fallback container logic
	// We memoize it and add it in the next useMemo
	const fallbackContainer = useMemo(() => {
		const hasFallbackData =
			parameterProps.length > 0 ||
			exportProps.length > 0 ||
			outputProps.length > 0;

		if (!hasAppBuilderOutput && hasFallbackData && showFallbackContainers) {
			return {
				node: (
					<AppBuilderFallbackContainerComponent
						parameters={parameterProps}
						exports={exportProps}
						outputs={outputProps}
						namespace={namespace}
						settings={sessionSettings}
					/>
				),
			};
		}
		return undefined;
	}, [
		hasAppBuilderOutput,
		showFallbackContainers,
		parameterProps,
		exportProps,
		outputProps,
		namespace,
		sessionSettings,
	]);

	//create UI elements for containers
	const containers: IAppBuilderTemplatePageProps = useMemo(() => {
		const result: IAppBuilderTemplatePageProps = {
			top: undefined,
			bottom: undefined,
			left: undefined,
			right: undefined,
		};

		const mergedContainerArray = Object.values(mergedContainers);

		if (mergedContainerArray.length === 0) {
			if (fallbackContainer) {
				result.right = fallbackContainer;
			}
		} else {
			mergedContainerArray.forEach((container) => {
				// these checks should never fail
				// we just have to do them here for type safety
				if (!container || !isStandardContainer(container)) return;
				result[container.name] = {
					node: (
						<AppBuilderContainerComponent
							namespace={namespace}
							{...container}
						/>
					),
					hints: createContainerHints(container),
				};
			});
		}

		return result;
	}, [mergedContainers, namespace, fallbackContainer]);

	return {containers, anchors};
}
