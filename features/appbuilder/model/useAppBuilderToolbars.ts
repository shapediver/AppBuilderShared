import {
	IAppBuilder,
	isToolbarContainer,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useEffect, useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import {ToolbarRegistration} from "../config/shapediverStoreToolbars";
import type {ResolvedToolbarRegistration} from "../config/toolbarRenderTypes";
import {resolveRuntimeToolbarGroups} from "./resolveRuntimeToolbarGroups";
import {resolveToolbarRegistration} from "./resolveToolbarRegistration";
import {useRuntimeToolbarContributions} from "./runtimeToolbarContributionRegistry";
import {CUSTOM_SESSION_ID_POSTFIX} from "./useAppBuilderCustomParameters";
import {useShapeDiverStoreToolbars} from "./useShapeDiverStoreToolbars";

interface UseAppBuilderToolbarsProps {
	appBuilderData?: IAppBuilder;
	viewportId?: string;
	namespace?: string;
}

export function useAppBuilderToolbars(props: UseAppBuilderToolbarsProps) {
	const {appBuilderData, viewportId, namespace = ""} = props;

	const {setDefinitionToolbars, resetDefinitionToolbars} =
		useShapeDiverStoreToolbars(
			useShallow((state) => ({
				setDefinitionToolbars: state.setDefinitionToolbars,
				resetDefinitionToolbars: state.resetDefinitionToolbars,
			})),
		);

	// selectMergedToolbars returns a fresh sorted array, so shallow-compare the
	// array elements directly to avoid re-rendering on unrelated toolbar-store updates.
	const toolbars = useShapeDiverStoreToolbars(
		useShallow((state) => state.selectMergedToolbars(viewportId)),
	);

	useEffect(() => {
		const definitionToolbars: ToolbarRegistration[] =
			appBuilderData?.containers
				.filter((container) => isToolbarContainer(container))
				.map((container, definitionIndex) => ({
					id: container.props.id,
					source: "definition",
					viewportId,
					side: container.props.side ?? "top",
					align: container.props.align ?? "center",
					order: container.props.order ?? 0,
					definitionIndex,
					visibility: container.props.visibility ?? "always",
					defaultOpen: container.props.defaultOpen,
					exclusiveContainers:
						container.props.exclusiveContainers ?? true,
					groups: container.groups ?? [],
					actionSlots: container.actionSlots,
				})) ?? [];

		setDefinitionToolbars(definitionToolbars);

		return () => {
			resetDefinitionToolbars();
		};
	}, [
		appBuilderData?.containers,
		resetDefinitionToolbars,
		setDefinitionToolbars,
		viewportId,
	]);

	// Custom parameters defined by the model's App Builder output live in the
	// namespace "<session id>_appbuilder". Their interaction controls belong to
	// the same viewport toolbar as those of the session parameters.
	const sessionContributions = useRuntimeToolbarContributions(
		viewportId ?? "",
		namespace,
	);
	const customContributions = useRuntimeToolbarContributions(
		viewportId ?? "",
		namespace + CUSTOM_SESSION_ID_POSTFIX,
	);
	const runtimeToolbarContributions = useMemo(
		() =>
			[...sessionContributions, ...customContributions].sort(
				(a, b) =>
					(a.order ?? Infinity) - (b.order ?? Infinity) ||
					a.id.localeCompare(b.id),
			),
		[sessionContributions, customContributions],
	);
	const controls = useMemo(
		() => resolveRuntimeToolbarGroups(runtimeToolbarContributions),
		[runtimeToolbarContributions],
	);
	const renderedToolbars = useMemo<ToolbarRegistration[]>(() => {
		if (controls.length === 0) return toolbars;
		const target = toolbars.find(
			(toolbar) =>
				toolbar.side === "bottom" && toolbar.align === "center",
		);
		if (target)
			return toolbars.map((toolbar) =>
				toolbar.id === target.id
					? {...toolbar, groups: [...toolbar.groups, ...controls]}
					: toolbar,
			);
		return [
			...toolbars,
			{
				id: `interaction-toolbar-${viewportId}-${namespace}`,
				source: "runtime",
				viewportId,
				side: "bottom",
				align: "center",
				order: 0,
				visibility: "always",
				ariaLabel: "Interaction toolbar",
				groups: controls,
			},
		];
	}, [controls, namespace, toolbars, viewportId]);

	const resolvedToolbars = useMemo<ResolvedToolbarRegistration[]>(
		() => renderedToolbars.map(resolveToolbarRegistration),
		[renderedToolbars],
	);

	return {toolbars: resolvedToolbars};
}
