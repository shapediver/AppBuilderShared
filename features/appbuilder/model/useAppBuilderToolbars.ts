import {
	IAppBuilder,
	isToolbarContainer,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useEffect} from "react";
import {useShallow} from "zustand/react/shallow";
import {ToolbarRegistration} from "../config/shapediverStoreToolbars";
import {useShapeDiverStoreToolbars} from "./useShapeDiverStoreToolbars";

interface UseAppBuilderToolbarsProps {
	appBuilderData?: IAppBuilder;
	viewportId?: string;
}

export function useAppBuilderToolbars(props: UseAppBuilderToolbarsProps) {
	const {appBuilderData, viewportId} = props;

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

	return {toolbars};
}
