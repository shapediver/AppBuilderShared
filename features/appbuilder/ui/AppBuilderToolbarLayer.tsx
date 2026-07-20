import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {
	legacyViewportIconsDefaultStyleProps,
	LegacyViewportIconsThemeProps,
	mapLegacyViewportIconsThemeToDefaultToolbarOptions,
} from "@AppBuilderLib/entities/viewport/config/legacyViewportIconsTheme";
import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {
	IAppBuilder,
	IAppBuilderSettingsSession,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderToolbarLayerThemeDefaultProps} from "@AppBuilderLib/features/appbuilder/config/AppBuilderToolbarLayer.theme.types";
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import {useAppBuilderToolbars} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderToolbars";
import {useDefaultToolbarRegistration} from "@AppBuilderLib/features/appbuilder/model/useDefaultToolbarRegistration";
import {useResolvedAppBuilderToolbarIconButtonTheme} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import {useProps} from "@mantine/core";
import {useCallback, useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import AppBuilderToolbar from "./AppBuilderToolbar";
import {
	computeToolbarPushOffsets,
	computeToolbarThickness,
	getToolbarSlotStyle,
	groupToolbarsBySlot,
	ToolbarAlign,
	ToolbarSide,
} from "./appBuilderToolbarLayerLayout";

const defaultStyleProps = {
	style: {
		position: "absolute" as const,
		inset: 0,
		pointerEvents: "none" as const,
		zIndex: 5,
	},
	offset: "0.5em",
	offsetX: undefined,
	offsetY: undefined,
};

interface Props {
	namespace: string;
	appBuilderData?: IAppBuilder;
	sessionSettings?: IAppBuilderSettingsSession;
	viewportId?: string;
}

const buildButtonRenderContext = ({
	namespace,
	viewportId,
	executing,
	hasPendingChanges,
	legacyViewportIconsTheme,
}: {
	namespace: string;
	viewportId?: string;
	executing: boolean;
	hasPendingChanges: boolean;
	legacyViewportIconsTheme: LegacyViewportIconsThemeProps;
}): ButtonRenderContext => ({
	viewportId,
	namespace,
	buttonsDisabled: hasPendingChanges,
	executing,
	hasPendingChanges,
	fullscreenId:
		legacyViewportIconsTheme.fullscreenId || "viewer-fullscreen-area",
});

export default function AppBuilderToolbarLayer({
	namespace,
	appBuilderData,
	sessionSettings,
	viewportId: inputViewportId,
}: Props) {
	const {viewportId: defaultViewportId} = useViewportId();
	const viewportId = inputViewportId ?? defaultViewportId;
	const {
		style = defaultStyleProps.style,
		offset = defaultStyleProps.offset,
		offsetX,
		offsetY,
	} = useProps(
		"AppBuilderToolbarLayer",
		defaultStyleProps,
		{},
	) as AppBuilderToolbarLayerThemeDefaultProps;
	const resolvedOffsetX = offsetX ?? offset;
	const resolvedOffsetY = offsetY ?? offset;

	const {toolbars} = useAppBuilderToolbars({
		appBuilderData,
		viewportId,
	});
	const viewport = useShapeDiverStoreViewport(
		useShallow((state) => state.viewports[viewportId]),
	);

	const legacyViewportIconsTheme = useProps(
		"ViewportIcons",
		legacyViewportIconsDefaultStyleProps,
		{},
	) as LegacyViewportIconsThemeProps;
	const legacyDefaultToolbarOptions = useMemo(
		() =>
			mapLegacyViewportIconsThemeToDefaultToolbarOptions(
				legacyViewportIconsTheme,
			),
		[legacyViewportIconsTheme],
	);

	useDefaultToolbarRegistration({
		viewportId,
		hideJsonMenu: sessionSettings?.hideJsonMenu,
		showDefaultToolbar: !(sessionSettings?.hideDefaultToolbar ?? false),
		viewport,
		...legacyDefaultToolbarOptions,
	});

	const parameterChanges = useShapeDiverStoreParameters(
		useCallback(
			(state) => {
				if (!namespace) return [];
				const ids = state.sessionDependency[namespace];
				if (ids === undefined || ids.length === 0) return [];
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
			parameterChanges.some(
				(change) => Object.keys(change.values).length > 0,
			),
		[parameterChanges],
	);

	// Thin compatibility layer: legacy `ViewportIconButton` theme overrides still
	// affect both the rendered icon button and the layout thickness calculations.
	const viewportIconButtonTheme =
		useResolvedAppBuilderToolbarIconButtonTheme();

	const buttonRenderContext = useMemo(
		() =>
			buildButtonRenderContext({
				namespace,
				viewportId,
				executing,
				hasPendingChanges,
				legacyViewportIconsTheme,
			}),
		[
			executing,
			hasPendingChanges,
			namespace,
			viewportId,
			legacyViewportIconsTheme,
		],
	);

	const buttonSize = viewportIconButtonTheme.actionIconProps?.size ?? 32;
	const buttonMargin = viewportIconButtonTheme.actionIconProps?.style?.margin;
	const paperPaddingX = legacyViewportIconsTheme.paperProps?.px ?? 2;
	const paperPaddingY = legacyViewportIconsTheme.paperProps?.py ?? 1;

	const verticalThickness = useMemo(
		() => computeToolbarThickness(buttonSize, buttonMargin, paperPaddingX),
		[buttonMargin, buttonSize, paperPaddingX],
	);
	const horizontalThickness = useMemo(
		() => computeToolbarThickness(buttonSize, buttonMargin, paperPaddingY),
		[buttonMargin, buttonSize, paperPaddingY],
	);
	const slotEntries = useMemo(
		() => groupToolbarsBySlot(toolbars),
		[toolbars],
	);
	const pushOffsets = useMemo(
		() =>
			computeToolbarPushOffsets({
				slotEntries,
				verticalThickness,
				horizontalThickness,
				offsetX: resolvedOffsetX,
				offsetY: resolvedOffsetY,
			}),
		[
			horizontalThickness,
			resolvedOffsetX,
			resolvedOffsetY,
			slotEntries,
			verticalThickness,
		],
	);

	if (toolbars.length === 0) return null;

	return (
		<div style={style}>
			{slotEntries.map(([key, slotToolbars]) => {
				const [side, align] = key.split(":") as [
					ToolbarSide,
					ToolbarAlign,
				];
				const push = pushOffsets[key];
				return (
					<section
						key={key}
						style={getToolbarSlotStyle(
							side,
							align,
							resolvedOffsetX,
							resolvedOffsetY,
							push?.px,
							push?.axis,
						)}
					>
						{slotToolbars.map((toolbar) => (
							<AppBuilderToolbar
								key={toolbar.id}
								toolbar={toolbar}
								buttonRenderContext={buttonRenderContext}
							/>
						))}
					</section>
				);
			})}
		</div>
	);
}
