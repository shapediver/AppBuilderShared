import {
	getInlineAcceptRejectEpoch,
	hasGlobalPendingParameterChanges,
	subscribeInlineAcceptReject,
} from "@AppBuilderLib/entities/parameter/lib/globalAcceptReject";
import {hasExecutingParameterChanges} from "@AppBuilderLib/entities/parameter/lib/hasPendingParameterChanges";
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
import type {ToolbarAcceptRejectItem} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import {useAppBuilderToolbars} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderToolbars";
import {useDefaultToolbarRegistration} from "@AppBuilderLib/features/appbuilder/model/useDefaultToolbarRegistration";
import {useProps} from "@mantine/core";
import {useCallback, useMemo, useRef, useSyncExternalStore} from "react";
import {useShallow} from "zustand/react/shallow";
import AppBuilderToolbar from "./AppBuilderToolbar";
import {
	computeToolbarPushOffsets,
	getToolbarSlotStyle,
	groupToolbarsBySlot,
	ToolbarAlign,
	ToolbarSide,
} from "./appBuilderToolbarLayerLayout";
import {useMeasuredToolbarSlotThickness} from "./useMeasuredToolbarSlotThickness";

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
	legacyViewportIconsTheme,
}: {
	namespace: string;
	viewportId?: string;
	executing: boolean;
	legacyViewportIconsTheme: LegacyViewportIconsThemeProps;
}): ButtonRenderContext => ({
	viewportId,
	namespace,
	executing,
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
		namespace,
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

	// Same queue the viewport overlay buttons use. Custom parameters are stored
	// under a dependent namespace, so this cannot be limited to sessionDependency
	// of the controller session or those changes never surface in the toolbar.
	// Parameters presented inline keep their own buttons and do not open this one.
	const inlineEpoch = useSyncExternalStore(
		subscribeInlineAcceptReject,
		getInlineAcceptRejectEpoch,
		getInlineAcceptRejectEpoch,
	);
	const parameterChanges = useShapeDiverStoreParameters(
		(state) => state.parameterChanges,
	);
	const hasPendingChanges = useMemo(
		() => hasGlobalPendingParameterChanges(parameterChanges),
		[inlineEpoch, parameterChanges],
	);
	const executing = useShapeDiverStoreParameters(
		useCallback(
			(state) => hasExecutingParameterChanges(namespace, state),
			[namespace],
		),
	);

	const buttonRenderContext = useMemo(
		() =>
			buildButtonRenderContext({
				namespace,
				viewportId,
				executing,
				legacyViewportIconsTheme,
			}),
		[executing, namespace, viewportId, legacyViewportIconsTheme],
	);

	const bottomCenterToolbar = toolbars.find(
		(toolbar) => toolbar.side === "bottom" && toolbar.align === "center",
	);
	const {showButtons: showAcceptRejectButtons} = useProps(
		"ViewportAcceptRejectButtons",
		{},
		{},
	) as {showButtons?: boolean};
	const showToolbarAcceptRejectButtons =
		showAcceptRejectButtons !== false &&
		(hasPendingChanges || showAcceptRejectButtons === true);
	const toolbarsWithAcceptRejectButtons = useMemo(() => {
		if (!bottomCenterToolbar || !showToolbarAcceptRejectButtons) {
			return toolbars;
		}

		const acceptRejectItem: ToolbarAcceptRejectItem = {
			id: "accept-reject",
			type: "acceptReject",
			label: "Accept or reject changes",
			props: {},
		};
		return toolbars.map((toolbar) =>
			toolbar.id === bottomCenterToolbar.id
				? {...toolbar, groups: [[acceptRejectItem], ...toolbar.groups]}
				: toolbar,
		);
	}, [bottomCenterToolbar, showToolbarAcceptRejectButtons, toolbars]);
	const slotEntries = useMemo(
		() => groupToolbarsBySlot(toolbarsWithAcceptRejectButtons),
		[toolbarsWithAcceptRejectButtons],
	);
	const slotKeys = useMemo(
		() => slotEntries.map(([key]) => key),
		[slotEntries],
	);
	const rootRef = useRef<HTMLDivElement>(null);
	const thicknessBySlot = useMeasuredToolbarSlotThickness(rootRef, slotKeys);
	const pushOffsets = useMemo(
		() =>
			computeToolbarPushOffsets({
				slotEntries,
				thicknessBySlot,
			}),
		[slotEntries, thicknessBySlot],
	);

	if (toolbars.length === 0) return null;

	return (
		<div ref={rootRef} style={style}>
			{slotEntries.map(([key, slotToolbars]) => {
				const [side, align] = key.split(":") as [
					ToolbarSide,
					ToolbarAlign,
				];
				const push = pushOffsets[key];
				return (
					<section
						key={key}
						data-toolbar-slot={key}
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
								forceVisible={
									showToolbarAcceptRejectButtons &&
									toolbar.id === bottomCenterToolbar?.id
								}
							/>
						))}
					</section>
				);
			})}
		</div>
	);
}
