/**
 * @jest-environment jsdom
 */
const MockActionComponent = () => null;

jest.mock("../AppBuilderActionAddToCartComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionArComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionCameraComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionCloseConfiguratorComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionCreateModelStateComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionExportParameterValuesComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionFullscreenComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionImportModelStateComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionImportParameterValuesComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionMessageToParentComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionRedoComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionResetParameterValuesComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionSetBrowserLocationComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionSetParameterValuesComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionSoundComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionUndoComponent", () => ({
	__esModule: true,
	default: MockActionComponent,
}));
jest.mock("../AppBuilderActionBase", () => ({
	__esModule: true,
	default: MockActionComponent,
}));

import type {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import type {IAppBuilderControlActionRef} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderActionFromType} from "../AppBuilderActionFromType";

const CustomAction = () => <div />;

describe("AppBuilderActionFromType", () => {
	it("forwards toolbar render options to custom action components", () => {
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
});
