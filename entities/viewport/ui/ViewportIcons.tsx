import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter";
import {
	ButtonRenderContext,
	ComponentContext,
	getViewportIconComponent,
} from "@AppBuilderLib/features/appbuilder";
import {OverlayPosition} from "@AppBuilderLib/shared/ui/overlay";
import {Divider, Paper, Transition, useProps} from "@mantine/core";
import React, {useCallback, useContext, useMemo, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {
	ViewportIconButtonEnum,
	ViewportIconsDefaultStyleProps,
	ViewportIconsOptionalProps,
	ViewportIconsProps,
} from "../config";
import {
	useShapeDiverStoreViewport,
	useShapeDiverViewportIconsStore,
	useViewportControls,
	useViewportId,
} from "../model";
import ViewportOverlayWrapper from "./ViewportOverlayWrapper";

export const defaultStyleProps: ViewportIconsOptionalProps = {
	...ViewportIconsDefaultStyleProps,
	dividerProps: {
		orientation: "vertical",
		color: "var(--mantine-color-disabled-color)",
	},
	transitionProps: {
		transition: "fade-down",
		duration: 400,
		timingFunction: "ease",
		keepMounted: true,
	},
	enableImportExportButtons: undefined,
	enableModelStateButtons: undefined,
	enableHistoryButtons: true,
	enableResetButton: true,
	enableArBtn: true,
	enableCamerasBtn: true,
	enableFullscreenBtn: false,
	enableFullscreenBtn3States: true,
	enableZoomBtn: true,
	enableHistoryMenuButton: undefined,
};

export type ShowButtons = {
	history?: boolean;
	reset?: boolean;
	ar?: boolean;
	cameras?: boolean;
	fullscreen?: boolean;
	fullscreen3States?: boolean;
	zoom?: boolean;
	historyMenu?: boolean;
};

export default function ViewportIcons(
	props: ViewportIconsProps & ViewportIconsOptionalProps,
) {
	const {
		viewportId: _viewportId,
		namespace = "",
		hideJsonMenu,
		...rest
	} = props;

	const componentContext = useContext(ComponentContext);
	const {
		style,
		iconStyle,
		fullscreenId,
		color,
		colorDisabled,
		variant,
		variantDisabled,
		size,
		viewportOverlayProps,
		paperProps,
		dividerProps,
		transitionProps,
		enableImportExportButtons,
		enableModelStateButtons,
		enableHistoryButtons,
		enableResetButton,
		enableArBtn,
		enableCamerasBtn,
		enableFullscreenBtn,
		enableFullscreenBtn3States,
		enableZoomBtn,
		enableHistoryMenuButton,
	} = useProps("ViewportIcons", defaultStyleProps, rest);

	/* Convert bad naming enable{Name}Buttons for compatibility */
	const showButtons = useMemo<ShowButtons>(
		() => ({
			history: enableHistoryButtons,
			reset: enableResetButton,
			ar: enableArBtn,
			cameras: enableCamerasBtn,
			fullscreen: enableFullscreenBtn3States
				? false
				: enableFullscreenBtn,
			fullscreen3States: enableFullscreenBtn3States,
			zoom: enableZoomBtn,
			historyMenu:
				enableImportExportButtons !== undefined ||
				enableModelStateButtons !== undefined
					? enableImportExportButtons || enableModelStateButtons
					: enableHistoryMenuButton !== undefined
						? enableHistoryMenuButton
						: !hideJsonMenu,
		}),
		[
			enableHistoryButtons,
			enableResetButton,
			enableArBtn,
			enableCamerasBtn,
			enableFullscreenBtn,
			enableFullscreenBtn3States,
			enableZoomBtn,
			enableHistoryMenuButton,
			enableImportExportButtons,
			enableModelStateButtons,
			hideJsonMenu,
		],
	);

	const {viewportId: defaultViewportId} = useViewportId();
	const [iconsVisible, setIconsVisible] = useState(true);
	const viewportId = _viewportId ?? defaultViewportId;
	const viewport = useShapeDiverStoreViewport(
		useShallow((state) => state.viewports[viewportId]),
	);
	const {showControls, setIsHoveringControls} = useViewportControls();

	const layout =
		useShapeDiverViewportIconsStore(
			useShallow((state) => state.viewportIcons[viewportId]?.layout),
		) ?? [];

	const parameterChanges = useShapeDiverStoreParameters(
		useCallback(
			(state) => {
				if (!namespace) {
					return [];
				}

				const ids = state.sessionDependency[namespace];
				if (ids === undefined || ids.length === 0) {
					return [];
				}

				return ids
					.map((id) => state.parameterChanges[id])
					.filter(Boolean);
			},
			[namespace],
		),
	);

	const executing = useMemo(
		() => parameterChanges.some((change) => change.executing),
		[parameterChanges],
	);

	const hasPendingChanges = useMemo(
		() =>
			parameterChanges.length > 0 &&
			parameterChanges.some((c) => Object.keys(c.values).length > 0),
		[parameterChanges],
	);

	const buttonsDisabled = hasPendingChanges;

	// Create button render context
	const buttonContext: ButtonRenderContext = useMemo(
		() => ({
			viewport,
			namespace,
			buttonsDisabled,
			executing,
			hasPendingChanges,
			iconsVisible,
			enableImportExportButtons, // Manages visibility inside HistoryMenuButton
			enableModelStateButtons, // Manages visibility inside HistoryMenuButton
			fullscreenId: fullscreenId || "viewer-fullscreen-area",
			color,
			colorDisabled,
			variant,
			variantDisabled,
			size,
			iconStyle,
		}),
		[
			viewport,
			namespace,
			buttonsDisabled,
			executing,
			hasPendingChanges,
			iconsVisible,
			enableModelStateButtons,
			enableHistoryButtons,
			fullscreenId,
			color,
			colorDisabled,
			variant,
			variantDisabled,
			size,
			iconStyle,
		],
	);

	const content = useMemo(() => {
		const renderButtonByKind = (
			kind: ViewportIconButtonEnum,
			componentContext: any,
			buttonContext: any,
			showButtons: ShowButtons,
		) => {
			const {
				viewport,
				namespace,
				buttonsDisabled,
				executing,
				hasPendingChanges,
				iconsVisible,
				fullscreenId,
				...commonProps
			} = buttonContext;

			const ButtonComponent = getViewportIconComponent(
				componentContext,
				kind,
			);
			if (!ButtonComponent) return null;

			switch (kind) {
				case ViewportIconButtonEnum.Ar:
					if (!showButtons.ar) return null;
					return React.createElement(ButtonComponent, {
						key: "ar",
						viewport,
						...commonProps,
					});
				case ViewportIconButtonEnum.Zoom:
					if (!showButtons.zoom) return null;
					return React.createElement(ButtonComponent, {
						key: "zoom",
						viewport,
						...commonProps,
					});
				case ViewportIconButtonEnum.Fullscreen:
					if (!showButtons.fullscreen) return null;
					return React.createElement(ButtonComponent, {
						key: "fullscreen",
						fullscreenId,
						...commonProps,
					});
				case ViewportIconButtonEnum.Fullscreen3States:
					if (!showButtons.fullscreen3States) return null;
					return React.createElement(ButtonComponent, {
						key: "fullscreen3States",
						fullscreenId,
						...commonProps,
					});
				case ViewportIconButtonEnum.Cameras:
					if (!showButtons.cameras) return null;
					return React.createElement(ButtonComponent, {
						key: "cameras",
						viewport,
						visible: iconsVisible,
						...commonProps,
					});
				case ViewportIconButtonEnum.Undo:
					if (!showButtons.history) return null;
					return React.createElement(ButtonComponent, {
						key: "undo",
						disabled:
							buttonsDisabled || executing || hasPendingChanges,
						hasPendingChanges,
						executing,
						...commonProps,
					});
				case ViewportIconButtonEnum.Redo:
					if (!showButtons.history) return null;
					return React.createElement(ButtonComponent, {
						key: "redo",
						disabled:
							buttonsDisabled || executing || hasPendingChanges,
						hasPendingChanges,
						executing,
						...commonProps,
					});
				case ViewportIconButtonEnum.Reload:
					if (!showButtons.reset) return null;
					return React.createElement(ButtonComponent, {
						key: "reload",
						disabled:
							!namespace ||
							buttonsDisabled ||
							executing ||
							hasPendingChanges,
						namespace: namespace || "",
						hasPendingChanges,
						executing,
						...commonProps,
					});
				case ViewportIconButtonEnum.HistoryMenu:
					if (hideJsonMenu || !showButtons.historyMenu) return null;
					return React.createElement(ButtonComponent, {
						key: "historyMenu",
						disabled:
							!namespace || buttonsDisabled || hasPendingChanges,
						namespace: namespace || "",
						visible: iconsVisible,
						...commonProps,
					});
				default:
					return null;
			}
		};

		const sections: React.ReactNode[] = [];
		if (layout.length === 0) return sections;

		layout.forEach((item, index) => {
			if (item.type === "button") {
				const button = renderButtonByKind(
					item.button.type,
					componentContext,
					buttonContext,
					showButtons,
				);
				if (button) sections.push(button);
			} else if (item.type === "group") {
				const groupButtons: React.ReactNode[] = [];
				item.sections.forEach((section) => {
					section.forEach((buttonDef) => {
						const button = renderButtonByKind(
							buttonDef.type,
							componentContext,
							buttonContext,
							showButtons,
						);
						if (button) groupButtons.push(button);
					});
					// Add divider between sections within a group
					if (
						groupButtons.length > 0 &&
						section !== item.sections[item.sections.length - 1]
					) {
						groupButtons.push(
							React.createElement(Divider, {
								key: `divider-${index}-${section.length}`,
								...dividerProps,
							}),
						);
					}
				});
				sections.push(
					React.createElement(
						React.Fragment,
						{key: `group-${index}`},
						...groupButtons,
					),
				);
			}

			// Add divider between layout items
			if (index < layout.length - 1) {
				sections.push(
					React.createElement(Divider, {
						key: `layout-divider-${index}`,
						...dividerProps,
					}),
				);
			}
		});

		return sections;
	}, [layout, componentContext, buttonContext, dividerProps, showButtons]);

	// Prevent event propagation to avoid triggering viewport interactions
	// when touching the icons.
	const preventEventPropagation = (e: React.TouchEvent) => {
		e.stopPropagation();
	};

	return (
		<ViewportOverlayWrapper {...viewportOverlayProps}>
			<Transition
				mounted={showControls}
				{...transitionProps}
				onEntered={() => setIconsVisible(true)}
				onExit={() => setIconsVisible(false)}
			>
				{(styles) => (
					<Paper
						style={{...style, ...styles}}
						{...paperProps}
						onTouchStart={preventEventPropagation}
						onTouchMove={preventEventPropagation}
						onTouchEnd={preventEventPropagation}
						onMouseLeave={() => setIsHoveringControls(false)}
						onMouseEnter={() => setIsHoveringControls(true)}
					>
						{content}
					</Paper>
				)}
			</Transition>
		</ViewportOverlayWrapper>
	);
}
