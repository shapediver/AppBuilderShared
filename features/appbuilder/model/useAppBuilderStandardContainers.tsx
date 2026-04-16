import {useSessionPropsExport} from "@AppBuilderLib/entities/export";
import {useSessionPropsOutput} from "@AppBuilderLib/entities/output";
import {useSessionPropsParameter} from "@AppBuilderLib/entities/parameter";
import {useViewportAnchors} from "@AppBuilderLib/entities/viewport";
import {
	IAppBuilderTemplatePageContainerHints,
	IAppBuilderTemplatePageProps,
} from "@AppBuilderLib/pages/config/appbuildertemplates";
import React, {useContext, useEffect, useMemo} from "react";
import {
	AppBuilderContainerNameType,
	ComponentContext,
	IAppBuilder,
	IAppBuilderContainer,
	IAppBuilderSettingsResolved,
	IAppBuilderSettingsSession,
	isStandardContainer,
} from "../config";
import {useShapeDiverStoreStandardContainers} from "./useShapeDiverStoreStandardContainers";
import AppBuilderFallbackContainerComponent from "../../../widgets/appbuilder/ui/AppBuilderFallbackContainerComponent";
import AppBuilderContainerComponent from "../../../widgets/appbuilder/ui/AppBuilderContainerComponent";

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

	const componentContext = useContext(ComponentContext);
	const ContainerComponent =
		componentContext.containerComponent || AppBuilderContainerComponent;
	const FallbackContainerComponent =
		componentContext.fallbackContainerComponent ||
		AppBuilderFallbackContainerComponent;

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

		if (
			!hasAppBuilderOutput &&
			hasFallbackData &&
			showFallbackContainers &&
			FallbackContainerComponent
		) {
			return {
				node: (
					<FallbackContainerComponent
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
		FallbackContainerComponent,
	]);

	//create UI elements for containers
	const containers: IAppBuilderTemplatePageProps = useMemo(() => {
		const result: IAppBuilderTemplatePageProps = {
			top: undefined,
			bottom: undefined,
			left: undefined,
			right: undefined,
		};

		const mergedContainerArray = Object.values(mergedContainers).filter(
			(container): container is IAppBuilderContainer => !!container,
		);

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
					node: ContainerComponent ? (
						<ContainerComponent
							namespace={namespace}
							{...container}
						/>
					) : undefined,
					hints: createContainerHints(container),
				};
			});
		}

		return result;
	}, [mergedContainers, namespace, fallbackContainer, ContainerComponent]);

	return {containers, anchors};
}
