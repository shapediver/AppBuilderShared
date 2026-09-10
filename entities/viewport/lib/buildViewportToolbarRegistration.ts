import {
	DefaultViewportToolbarButtonEnum,
	DefaultViewportToolbarLayoutItem,
} from "@AppBuilderLib/entities/viewport/config/shapediverStoreDefaultViewportToolbar";
import {
	AppBuilderActionType,
	IAppBuilderActionDefinition,
	IAppBuilderToolbarActionItem,
	IAppBuilderToolbarActionMenuItem,
	IAppBuilderToolbarControlItem,
	IAppBuilderToolbarItem,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	ToolbarRegistration,
	ToolbarSource,
} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import {firstLetterUppercase} from "@AppBuilderLib/shared/lib/strings";
import type {IViewportApi} from "@shapediver/viewer.viewport";

export interface ViewportToolbarVisibilityOptions {
	history?: boolean;
	reset?: boolean;
	ar?: boolean;
	cameras?: boolean;
	fullscreen?: boolean;
	fullscreen3States?: boolean;
	zoom?: boolean;
	historyMenu?: boolean;
}

export interface BuildViewportToolbarRegistrationOptions {
	id: string;
	source?: ToolbarSource;
	viewportId?: string;
	side: ToolbarRegistration["side"];
	align: ToolbarRegistration["align"];
	order: number;
	visibility: ToolbarRegistration["visibility"];
	ariaLabel?: string;
	hideJsonMenu?: boolean;
	showButtons?: ViewportToolbarVisibilityOptions;
	excludeFullscreenWhenFullscreen3StatesPresent?: boolean;
	viewport?: IViewportApi;
	enableImportExportButtons?: boolean;
	enableModelStateButtons?: boolean;
}

/**
 * Shared visibility-check helper used by viewport toolbar builders and
 * per-button renderers so the "value !== false" convention stays in one place.
 */
export const isButtonEnabled = (value: boolean | undefined) => value !== false;

// Default viewport icons that execute a single operation are converted to
// toolbar action controls. This keeps the toolbar schema semantic (camera,
// fullscreen, undo, ...) instead of leaking DefaultViewportToolbarButtonEnum values into
// authored App Builder JSON.
const toActionControl = (
	definition: IAppBuilderActionDefinition,
	presentation: Pick<
		IAppBuilderToolbarControlItem,
		"icon" | "label" | "tooltip"
	> = {},
): IAppBuilderToolbarControlItem => ({
	...presentation,
	type: "action",
	props: {definition},
});

// Action menu entries are still semantic actions, but they render with Mantine
// Menu.Item-like styling. The action menu trigger itself is intentionally not
// an action; only the atomic operations inside the menu are actions.
const toActionItem = (
	definition: IAppBuilderActionDefinition,
	presentation: Pick<
		IAppBuilderToolbarActionItem,
		"icon" | "label" | "tooltip"
	> = {},
): IAppBuilderToolbarActionItem => ({
	...presentation,
	type: "action",
	presentation: "item",
	props: {
		label: presentation.label,
		icon: presentation.icon,
		tooltip: presentation.tooltip,
		definition,
	},
});

// Recreate the old history/dropdown viewport icon as a toolbar action menu.
// Import/export and model-state options are grouped separately so the toolbar
// renderer can show dividers between the same sections the old menu exposed.
const createHistoryMenuItem = (
	options: BuildViewportToolbarRegistrationOptions,
): IAppBuilderToolbarActionMenuItem | undefined => {
	const importExportEnabled = options.enableImportExportButtons !== false;
	const modelStateEnabled = options.enableModelStateButtons !== false;
	const sections: IAppBuilderToolbarActionItem[][] = [];

	if (importExportEnabled) {
		sections.push([
			toActionItem(
				{
					type: AppBuilderActionType.ImportParameterValues,
					props: {},
				},
				{label: "Import parameter values", icon: "tabler:upload"},
			),
			toActionItem(
				{
					type: AppBuilderActionType.ExportParameterValues,
					props: {},
				},
				{label: "Export parameter values", icon: "tabler:download"},
			),
		]);
	}

	if (modelStateEnabled) {
		sections.push([
			toActionItem(
				{
					type: AppBuilderActionType.CreateModelState,
					props: {includeImage: true, includeGltf: false},
				},
				{label: "Create model state", icon: "tabler:device-floppy"},
			),
			toActionItem(
				{
					type: AppBuilderActionType.ImportModelState,
					props: {},
				},
				{label: "Import model state", icon: "tabler:file-import"},
			),
		]);
	}

	if (sections.length === 0) return undefined;

	return {
		type: "actionMenu",
		icon: "tabler:dots-vertical",
		label: "More options",
		props: {sections},
	};
};

// Recreate the old cameras dropdown as a toolbar action menu. Camera ids are not part
// of the authored action schema; the action supports camera selection via the
// existing camera.name matcher, with unnamed cameras using their id as name.
const createCamerasMenuItem = (
	viewport: IViewportApi | undefined,
): IAppBuilderToolbarActionMenuItem | undefined => {
	const viewportId = viewport?.id;
	const cameras = viewport ? Object.values(viewport.cameras) : [];
	if (!viewportId || cameras.length === 0) return undefined;

	return {
		type: "actionMenu",
		icon: "tabler:video",
		label: "Cameras",
		props: {
			sections: [
				cameras.map((camera) =>
					toActionItem(
						{
							type: AppBuilderActionType.Camera,
							props: {
								type: "assign",
								viewportId,
								props: {
									camera: {name: camera.name || camera.id},
								},
							},
						},
						{
							label: firstLetterUppercase(
								camera.name || camera.id,
							),
						},
					),
				),
			],
		},
	};
};

// Map each legacy viewport icon kind to either a semantic action control or an
// action menu trigger. `cameras` and `historyMenu` deliberately stay grouped
// command menus while their inner rows are regular semantic actions.
const toViewportToolbarItem = (
	kind: DefaultViewportToolbarButtonEnum,
	options: BuildViewportToolbarRegistrationOptions,
): IAppBuilderToolbarItem | undefined => {
	switch (kind) {
		case DefaultViewportToolbarButtonEnum.Ar:
			return toActionControl(
				{type: AppBuilderActionType.Ar, props: {}},
				{
					icon: "tabler:augmented-reality",
					label: "View in AR",
				},
			);
		case DefaultViewportToolbarButtonEnum.Zoom:
			return toActionControl(
				{
					type: AppBuilderActionType.Camera,
					props: {type: "zoomTo", props: {}},
				},
				{icon: "tabler:zoom-in", label: "Zoom extents"},
			);
		case DefaultViewportToolbarButtonEnum.Fullscreen:
			return toActionControl(
				{
					type: AppBuilderActionType.Fullscreen,
					props: {type: "fullscreen"},
				},
				{icon: "tabler:maximize", label: "Fullscreen"},
			);
		case DefaultViewportToolbarButtonEnum.Fullscreen3States:
			return toActionControl(
				{
					type: AppBuilderActionType.Fullscreen,
					props: {type: "fullscreen3States"},
				},
				{icon: "tabler:maximize", label: "Fullscreen"},
			);
		case DefaultViewportToolbarButtonEnum.Undo:
			return toActionControl(
				{
					type: AppBuilderActionType.Undo,
					props: {},
				},
				{icon: "tabler:arrow-back-up", label: "Undo"},
			);
		case DefaultViewportToolbarButtonEnum.Redo:
			return toActionControl(
				{
					type: AppBuilderActionType.Redo,
					props: {},
				},
				{icon: "tabler:arrow-forward-up", label: "Redo"},
			);
		case DefaultViewportToolbarButtonEnum.Reload:
			return toActionControl(
				{type: AppBuilderActionType.ResetParameterValues, props: {}},
				{
					icon: "tabler:reload",
					label: "Reset to default parameters",
				},
			);
		case DefaultViewportToolbarButtonEnum.Cameras:
			return createCamerasMenuItem(options.viewport);
		case DefaultViewportToolbarButtonEnum.HistoryMenu:
			return createHistoryMenuItem(options);
	}

	throw new Error(`Unsupported viewport icon button kind: ${kind}`);
};

// Preserve legacy DefaultViewportToolbar visibility flags while building the default
// toolbar. Undefined means enabled, matching the old DefaultViewportToolbar behavior.
const canIncludeButton = (
	kind: DefaultViewportToolbarButtonEnum,
	options: BuildViewportToolbarRegistrationOptions,
	hasFullscreen3States: boolean,
) => {
	const {
		hideJsonMenu,
		showButtons,
		excludeFullscreenWhenFullscreen3StatesPresent,
	} = options;

	if (hideJsonMenu && kind === DefaultViewportToolbarButtonEnum.HistoryMenu) {
		return false;
	}

	if (
		excludeFullscreenWhenFullscreen3StatesPresent &&
		hasFullscreen3States &&
		kind === DefaultViewportToolbarButtonEnum.Fullscreen
	) {
		return false;
	}

	switch (kind) {
		case DefaultViewportToolbarButtonEnum.Ar:
			return isButtonEnabled(showButtons?.ar);
		case DefaultViewportToolbarButtonEnum.Zoom:
			return isButtonEnabled(showButtons?.zoom);
		case DefaultViewportToolbarButtonEnum.Fullscreen:
			return isButtonEnabled(showButtons?.fullscreen);
		case DefaultViewportToolbarButtonEnum.Fullscreen3States:
			return isButtonEnabled(showButtons?.fullscreen3States);
		case DefaultViewportToolbarButtonEnum.Cameras:
			return isButtonEnabled(showButtons?.cameras);
		case DefaultViewportToolbarButtonEnum.Undo:
		case DefaultViewportToolbarButtonEnum.Redo:
			return isButtonEnabled(showButtons?.history);
		case DefaultViewportToolbarButtonEnum.Reload:
			return isButtonEnabled(showButtons?.reset);
		case DefaultViewportToolbarButtonEnum.HistoryMenu:
			return isButtonEnabled(showButtons?.historyMenu);
		default:
			return true;
	}
};

// Keep the old viewport-icon layout grouping: every standalone button or
// section group becomes one toolbar group, which keeps separators and ordering
// compatible with the previous DefaultViewportToolbar rendering.
const buildGroups = (
	layout: DefaultViewportToolbarLayoutItem[],
	options: BuildViewportToolbarRegistrationOptions,
): IAppBuilderToolbarItem[][] => {
	const hasFullscreen3States = layout.some((item) =>
		item.type === "button"
			? item.button.type ===
				DefaultViewportToolbarButtonEnum.Fullscreen3States
			: item.sections
					.flat()
					.some(
						(button) =>
							button.type ===
							DefaultViewportToolbarButtonEnum.Fullscreen3States,
					),
	);

	return layout.reduce<IAppBuilderToolbarItem[][]>((groups, item) => {
		const controls =
			item.type === "button"
				? canIncludeButton(
						item.button.type,
						options,
						hasFullscreen3States,
					)
					? [toViewportToolbarItem(item.button.type, options)].filter(
							(control): control is IAppBuilderToolbarItem =>
								Boolean(control),
						)
					: []
				: item.sections
						.flat()
						.filter((button) =>
							canIncludeButton(
								button.type,
								options,
								hasFullscreen3States,
							),
						)
						.map((button) =>
							toViewportToolbarItem(button.type, options),
						)
						.filter((control): control is IAppBuilderToolbarItem =>
							Boolean(control),
						);

		if (controls.length > 0) {
			groups.push(controls);
		}

		return groups;
	}, []);
};

export const buildViewportToolbarRegistration = (
	layout: DefaultViewportToolbarLayoutItem[],
	options: BuildViewportToolbarRegistrationOptions,
): ToolbarRegistration | undefined => {
	const groups = buildGroups(layout, options);
	if (groups.length === 0) return undefined;

	return {
		id: options.id,
		source: options.source ?? "default",
		viewportId: options.viewportId,
		side: options.side,
		align: options.align,
		order: options.order,
		visibility: options.visibility,
		ariaLabel: options.ariaLabel,
		groups,
	};
};
