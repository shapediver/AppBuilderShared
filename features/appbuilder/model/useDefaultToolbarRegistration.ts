import {
	buildViewportToolbarRegistration,
	ViewportToolbarVisibilityOptions,
} from "@AppBuilderLib/entities/viewport/lib/buildViewportToolbarRegistration";
import {useShapeDiverDefaultViewportToolbarStore} from "@AppBuilderLib/entities/viewport/model/useShapeDiverDefaultViewportToolbarStore";
import type {IViewportApi} from "@shapediver/viewer.viewport";
import {useEffect, useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import {useShapeDiverStoreToolbars} from "./useShapeDiverStoreToolbars";

interface Props {
	viewportId?: string;
	hideJsonMenu?: boolean;
	showDefaultToolbar?: boolean;
	viewport?: IViewportApi;
	showButtons?: ViewportToolbarVisibilityOptions;
	enableImportExportButtons?: boolean;
	enableModelStateButtons?: boolean;
}

export function useDefaultToolbarRegistration(props: Props) {
	const {
		viewportId,
		hideJsonMenu,
		showDefaultToolbar = true,
		viewport,
		showButtons,
		enableImportExportButtons,
		enableModelStateButtons,
	} = props;
	const layout = useShapeDiverDefaultViewportToolbarStore(
		useShallow((state) =>
			viewportId
				? (state.defaultViewportToolbars[viewportId]?.layout ?? [])
				: [],
		),
	);
	const {setDefaultToolbar, removeDefaultToolbar} =
		useShapeDiverStoreToolbars(
			useShallow((state) => ({
				setDefaultToolbar: state.setDefaultToolbar,
				removeDefaultToolbar: state.removeDefaultToolbar,
			})),
		);

	const toolbarId = viewportId
		? `defaultViewportToolbar-${viewportId}`
		: "defaultViewportToolbar";
	const showHistoryButton = showButtons?.history;
	const showResetButton = showButtons?.reset;
	const showArButton = showButtons?.ar;
	const showCamerasButton = showButtons?.cameras;
	const showFullscreenButton = showButtons?.fullscreen;
	const showFullscreen3StatesButton = showButtons?.fullscreen3States;
	const showZoomButton = showButtons?.zoom;
	const showHistoryMenuButton = showButtons?.historyMenu;

	const toolbar = useMemo(
		() =>
			buildViewportToolbarRegistration(layout, {
				id: toolbarId,
				source: "default",
				viewportId,
				side: "top",
				align: "center",
				order: 0,
				visibility: "onMouseActivity",
				ariaLabel: "Default viewport toolbar",
				hideJsonMenu,
				excludeFullscreenWhenFullscreen3StatesPresent: true,
				viewport,
				showButtons: {
					history: showHistoryButton,
					reset: showResetButton,
					ar: showArButton,
					cameras: showCamerasButton,
					fullscreen: showFullscreenButton,
					fullscreen3States: showFullscreen3StatesButton,
					zoom: showZoomButton,
					historyMenu: showHistoryMenuButton,
				},
				enableImportExportButtons,
				enableModelStateButtons,
			}),
		[
			enableImportExportButtons,
			enableModelStateButtons,
			hideJsonMenu,
			layout,
			showArButton,
			showCamerasButton,
			showFullscreen3StatesButton,
			showFullscreenButton,
			showHistoryButton,
			showHistoryMenuButton,
			showResetButton,
			showZoomButton,
			toolbarId,
			viewport,
			viewportId,
		],
	);

	useEffect(() => {
		if (!showDefaultToolbar || !toolbar) {
			removeDefaultToolbar(toolbarId);
			return;
		}

		setDefaultToolbar(toolbar);

		return () => {
			removeDefaultToolbar(toolbarId);
		};
	}, [
		removeDefaultToolbar,
		setDefaultToolbar,
		showDefaultToolbar,
		toolbar,
		toolbarId,
	]);
}
