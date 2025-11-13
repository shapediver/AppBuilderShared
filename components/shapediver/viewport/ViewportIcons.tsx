import {OverlayPosition} from "@AppBuilderShared/components/shapediver/ui/OverlayWrapper";
import {ComponentContext} from "@AppBuilderShared/context/ComponentContext";
import {useViewportControls} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportControls";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {useShapeDiverViewportIconsStore} from "@AppBuilderShared/store/useShapeDiverViewportIconsStore";
import {
	ButtonRenderContext,
	getViewportIconComponent,
} from "@AppBuilderShared/types/components/shapediver/componentTypes";
import {ViewportTransparentBackgroundStyle} from "@AppBuilderShared/types/shapediver/viewport";
import {
	ViewportIconsOptionalProps,
	ViewportIconsProps,
} from "@AppBuilderShared/types/shapediver/viewportIcons";
import {ViewportIconButtonEnum} from "@AppBuilderShared/types/store/shapediverStoreViewportIcons";
import {Divider, Paper, Transition, useProps} from "@mantine/core";
import React, {useCallback, useContext, useMemo, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import ViewportOverlayWrapper from "./ViewportOverlayWrapper";

export const defaultStyleProps: ViewportIconsOptionalProps = {
	style: {
		display: "flex",
		gap: "0.25rem",
		alignItems: "center",
		flexDirection: "row",
		border: "none",
		...ViewportTransparentBackgroundStyle,
	},
	fullscreenId: "viewer-fullscreen-area",
	viewportOverlayProps: {
		position: OverlayPosition.TOP_MIDDLE,
		offset: "0.5em",
	},
	paperProps: {
		py: 1,
		px: 0,
		shadow: "md",
	},
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
	} = useProps("ViewportIcons", defaultStyleProps, rest);

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
					return React.createElement(ButtonComponent, {
						key: "ar",
						viewport,
						...commonProps,
					});
				case ViewportIconButtonEnum.Zoom:
					return React.createElement(ButtonComponent, {
						key: "zoom",
						viewport,
						...commonProps,
					});
				case ViewportIconButtonEnum.Fullscreen:
					return React.createElement(ButtonComponent, {
						key: "fullscreen",
						fullscreenId,
						enableFullscreenBtn: true,
						...commonProps,
					});
				case ViewportIconButtonEnum.Cameras:
					return React.createElement(ButtonComponent, {
						key: "cameras",
						viewport,
						visible: iconsVisible,
						...commonProps,
					});
				case ViewportIconButtonEnum.Undo:
					return React.createElement(ButtonComponent, {
						key: "undo",
						disabled:
							buttonsDisabled || executing || hasPendingChanges,
						hasPendingChanges,
						executing,
						...commonProps,
					});
				case ViewportIconButtonEnum.Redo:
					return React.createElement(ButtonComponent, {
						key: "redo",
						disabled:
							buttonsDisabled || executing || hasPendingChanges,
						hasPendingChanges,
						executing,
						...commonProps,
					});
				case ViewportIconButtonEnum.Reload:
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
					if (hideJsonMenu) return null;
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
	}, [layout, componentContext, buttonContext, dividerProps]);

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
