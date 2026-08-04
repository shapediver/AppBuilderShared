import {
	IAppBuilder,
	isToolbarContainer,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {
	ResolvedToolbarRegistration,
	ToolbarMenuModel,
} from "../config/toolbarRenderTypes";
import {useRuntimeToolbarContributions} from "./runtimeToolbarContributionRegistry";
import {ToolbarRegistration} from "../config/shapediverStoreToolbars";
import {useEffect, useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import {resolveToolbarRegistration} from "./resolveToolbarRegistration";
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
					groups: container.groups ?? [],
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

	const runtimeToolbarContributions = useRuntimeToolbarContributions(
		viewportId ?? "",
		namespace,
	);
	const controls = useMemo<ToolbarMenuModel[]>(
		() =>
			runtimeToolbarContributions.map(({menu, items}) => ({
				type: "menu",
				id: menu.id,
				label: menu.label,
				icon: menu.icon,
				props: {
					sections: [{id: menu.sectionId ?? menu.id, items}],
				},
			})),
		[runtimeToolbarContributions],
	);
	const renderedToolbars = useMemo<ToolbarRegistration[]>(() => {
		if (controls.length === 0) return toolbars;
		const target = toolbars.find(
			(toolbar) => toolbar.side === "bottom" && toolbar.align === "center",
		);
		if (target)
			return toolbars.map((toolbar) =>
				toolbar.id === target.id
					? {...toolbar, groups: [...toolbar.groups, controls]}
					: toolbar,
			);
		return [...toolbars, {
			id: `interaction-toolbar-${viewportId}-${namespace}`,
			source: "runtime",
			viewportId,
			side: "bottom",
			align: "center",
			order: 0,
			visibility: "always",
			ariaLabel: "Interaction toolbar",
			groups: [controls],
		}];
	}, [controls, namespace, toolbars, viewportId]);

	const resolvedToolbars = useMemo<ResolvedToolbarRegistration[]>(
		() => renderedToolbars.map(resolveToolbarRegistration),
		[renderedToolbars],
	);

	return {toolbars: resolvedToolbars};
}
