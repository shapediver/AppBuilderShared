/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
jest.mock("../AppBuilderActionAddToCartComponent", () => ({
	__esModule: true,
	default: function MockAddToCart() {
		return null;
	},
}));
jest.mock("../AppBuilderActionArComponent", () => ({
	__esModule: true,
	default: function MockAr() {
		return null;
	},
}));
jest.mock("../AppBuilderActionCameraComponent", () => ({
	__esModule: true,
	default: function MockCamera() {
		return null;
	},
}));
jest.mock("../AppBuilderActionCloseConfiguratorComponent", () => ({
	__esModule: true,
	default: function MockCloseConfigurator() {
		return null;
	},
}));
jest.mock("../AppBuilderActionCreateModelStateComponent", () => ({
	__esModule: true,
	default: function MockCreateModelState() {
		return null;
	},
}));
jest.mock("../AppBuilderActionExportParameterValuesComponent", () => ({
	__esModule: true,
	default: function MockExportParameterValues() {
		return null;
	},
}));
jest.mock("../AppBuilderActionFullscreenComponent", () => ({
	__esModule: true,
	default: function MockFullscreen() {
		return null;
	},
}));
jest.mock("../AppBuilderActionImportModelStateComponent", () => ({
	__esModule: true,
	default: function MockImportModelState() {
		return null;
	},
}));
jest.mock("../AppBuilderActionImportParameterValuesComponent", () => ({
	__esModule: true,
	default: function MockImportParameterValues() {
		return null;
	},
}));
jest.mock("../AppBuilderActionMessageToParentComponent", () => ({
	__esModule: true,
	default: function MockMessageToParent() {
		return null;
	},
}));
jest.mock("../AppBuilderActionRedoComponent", () => ({
	__esModule: true,
	default: function MockRedo() {
		return null;
	},
}));
jest.mock("../AppBuilderActionResetParameterValuesComponent", () => ({
	__esModule: true,
	default: function MockResetParameterValues() {
		return null;
	},
}));
jest.mock("../AppBuilderActionSetBrowserLocationComponent", () => ({
	__esModule: true,
	default: function MockSetBrowserLocation() {
		return null;
	},
}));
jest.mock("../AppBuilderActionSetContainerVisibilityComponent", () => ({
	__esModule: true,
	default: function MockSetContainerVisibility() {
		return null;
	},
}));
jest.mock("../AppBuilderActionSetParameterValuesComponent", () => ({
	__esModule: true,
	default: function MockSetParameterValues() {
		return null;
	},
}));
jest.mock("../AppBuilderActionSoundComponent", () => ({
	__esModule: true,
	default: function MockSound() {
		return null;
	},
}));
jest.mock("../AppBuilderActionUndoComponent", () => ({
	__esModule: true,
	default: function MockUndo() {
		return null;
	},
}));
jest.mock("../AppBuilderActionBase", () => ({
	__esModule: true,
	default: function MockActionBase() {
		return null;
	},
}));

import type {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import type {IAppBuilderControlActionRef} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderActionFromType} from "../AppBuilderActionFromType";

const CustomAction = () => <div />;

function mockDefault(modulePath: string) {
	return jest.requireMock(modulePath).default;
}

describe("AppBuilderActionFromType", () => {
	it("forwards toolbar render options to custom action components", () => {
		const actionRef: IAppBuilderControlActionRef = {
			label: "Zoom extents",
			tooltip: "Zoom the camera",
			definition: {
				type: "camera",
				props: {
					type: "zoomTo",
					props: {},
				},
			},
		};
		const componentContext: IComponentContext = {
			actions: {
				camera: {
					isAction: (definition) => definition.type === "camera",
					component: CustomAction,
				},
			},
		};

		const element = AppBuilderActionFromType(
			actionRef,
			"namespace",
			"key",
			componentContext,
			{
				presentation: "toolbarIcon",
				viewportId: "viewport-1",
				fullscreenId: "fullscreen-area",
				disabled: true,
				toolbarButtonProps: {actionIconProps: {size: 24}},
			},
		);

		expect(element?.type).toBe(CustomAction);
		expect(element?.props).toMatchObject({
			label: "Zoom extents",
			tooltip: "Zoom the camera",
			definition: undefined,
			presentation: "toolbarIcon",
			viewportId: "viewport-1",
			fullscreenId: "fullscreen-area",
			disabled: true,
			toolbarButtonProps: {actionIconProps: {size: 24}},
		});
	});

	it("returns null for malformed action refs without a definition", () => {
		const element = AppBuilderActionFromType(
			{label: "Broken"} as unknown as IAppBuilderControlActionRef,
			"namespace",
			"key",
			{
				actions: {
					camera: {
						isAction: (definition) => definition.type === "camera",
						component: CustomAction,
					},
				},
			},
		);

		expect(element).toBeNull();
	});

	it("returns null for an unregistered Viewer-only action", () => {
		const actionRef: IAppBuilderControlActionRef = {
			label: "Zoom extents",
			definition: {
				type: "camera",
				props: {
					type: "zoomTo",
					props: {},
				},
			},
		};

		const element = AppBuilderActionFromType(
			actionRef,
			"namespace",
			"key",
			{},
		);

		expect(element).toBeNull();
	});

	it("skips custom actions whose isAction does not match", () => {
		const OtherAction = () => <div />;
		const actionRef: IAppBuilderControlActionRef = {
			label: "Zoom extents",
			definition: {
				type: "camera",
				props: {
					type: "zoomTo",
					props: {},
				},
			},
		};

		const element = AppBuilderActionFromType(
			actionRef,
			"namespace",
			"key",
			{
				actions: {
					other: {
						isAction: () => false,
						component: OtherAction,
					},
					camera: {
						isAction: (definition) => definition.type === "camera",
						component: CustomAction,
					},
				},
			},
		);

		expect(element?.type).toBe(CustomAction);
	});

	it("skips a missing custom action entry then matches a later type", () => {
		const actionRef: IAppBuilderControlActionRef = {
			label: "Zoom extents",
			definition: {
				type: "camera",
				props: {
					type: "zoomTo",
					props: {},
				},
			},
		};

		const element = AppBuilderActionFromType(
			actionRef,
			"namespace",
			"key",
			{
				actions: {
					missing: undefined,
					camera: {
						isAction: (definition) => definition.type === "camera",
						component: CustomAction,
					},
				},
			} as unknown as IComponentContext,
		);

		expect(element?.type).toBe(CustomAction);
	});

	it.each([
		[
			"createModelState",
			"../AppBuilderActionCreateModelStateComponent",
			{},
		],
		["addToCart", "../AppBuilderActionAddToCartComponent", {}],
		[
			"closeConfigurator",
			"../AppBuilderActionCloseConfiguratorComponent",
			{},
		],
		[
			"importParameterValues",
			"../AppBuilderActionImportParameterValuesComponent",
			{},
		],
		[
			"exportParameterValues",
			"../AppBuilderActionExportParameterValuesComponent",
			{},
		],
		[
			"importModelState",
			"../AppBuilderActionImportModelStateComponent",
			{},
		],
		[
			"setParameterValue",
			"../AppBuilderActionSetParameterValuesComponent",
			{parameterId: "p1", value: "v"},
		],
		[
			"setParameterValues",
			"../AppBuilderActionSetParameterValuesComponent",
			{parameterValues: []},
		],
		[
			"setBrowserLocation",
			"../AppBuilderActionSetBrowserLocationComponent",
			{},
		],
		[
			"setContainerVisibility",
			"../AppBuilderActionSetContainerVisibilityComponent",
			{containerId: "c1"},
		],
		["undo", "../AppBuilderActionUndoComponent", {}],
		["redo", "../AppBuilderActionRedoComponent", {}],
		[
			"resetParameterValues",
			"../AppBuilderActionResetParameterValuesComponent",
			{},
		],
		["sound", "../AppBuilderActionSoundComponent", {}],
		["messageToParent", "../AppBuilderActionMessageToParentComponent", {}],
	] as const)("renders built-in %s action", (type, modulePath, props) => {
		const element = AppBuilderActionFromType(
			{
				label: type,
				definition: {type, props},
			} as unknown as IAppBuilderControlActionRef,
			"namespace",
			"key",
			{},
		);

		expect(element?.type).toBe(mockDefault(modulePath));
	});
});
