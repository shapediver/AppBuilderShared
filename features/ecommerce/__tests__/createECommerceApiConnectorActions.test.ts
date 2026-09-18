/**
 * @jest-environment jsdom
 */
import {isCameraAction} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import {runAppBuilderActionCamera} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionCamera";
import {validateTriggerActionData} from "../config/ecommerceapitypecheck";
import {createECommerceApiConnectorActions} from "../model/createECommerceApiConnectorActions";

jest.mock("@shapediver/viewer.viewport", () => ({
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
	ORTHOGRAPHIC_CAMERA_DIRECTION: {
		CUSTOM: "custom",
		TOP: "top",
		BOTTOM: "bottom",
		LEFT: "left",
		RIGHT: "right",
		FRONT: "front",
		BACK: "back",
	},
	Box: class Box {
		union() {
			return this;
		}
	},
}));

jest.mock(
	"@AppBuilderLib/entities/parameter/lib/findNodesByNameFilter",
	() => ({
		findNodesByNameFilter: jest.fn(() => []),
	}),
);

jest.mock(
	"@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport",
	() => ({
		useShapeDiverStoreViewport: {
			getState: () => ({
				viewports: {
					vp: {
						cameras: {
							front: {id: "cam-front", name: "Front"},
						},
						camera: {
							position: [0, 0, 5],
							target: [0, 0, 0],
							type: "perspective",
							set: jest.fn().mockResolvedValue(undefined),
							reset: jest.fn().mockResolvedValue(undefined),
							animate: jest.fn().mockResolvedValue(undefined),
							calculateZoomTo: jest.fn().mockReturnValue({
								position: [1, 2, 3],
								target: [0, 0, 0],
							}),
						},
						assignCamera: jest.fn(),
						createPerspectiveCamera: jest.fn(),
						createOrthographicCamera: jest.fn(),
					},
				},
			}),
		},
	}),
);

const hostActions: IComponentContext["actions"] = {
	camera: {
		isAction: isCameraAction,
		run: runAppBuilderActionCamera,
	},
};

describe("validateTriggerActionData", () => {
	it("accepts a named assign camera action", () => {
		const result = validateTriggerActionData({
			type: "camera",
			props: {
				type: "assign",
				props: {camera: {name: "Front"}},
			},
		});
		expect(result.success).toBe(true);
	});

	it("rejects fullscreen", () => {
		const result = validateTriggerActionData({
			type: "fullscreen",
			props: {},
		});
		expect(result.success).toBe(false);
	});

	it("rejects camera set without target", () => {
		const result = validateTriggerActionData({
			type: "camera",
			props: {
				type: "set",
				props: {position: [0, 0, 5]},
			},
		});
		expect(result.success).toBe(false);
	});

	it("accepts nested executeActions", () => {
		const result = validateTriggerActionData({
			type: "executeActions",
			props: {
				mode: "sequential",
				actions: [
					{
						type: "camera",
						props: {
							type: "assign",
							props: {camera: {name: "Front"}},
						},
					},
				],
			},
		});
		expect(result.success).toBe(true);
	});

	it("rejects setParameterValues when value is not a string", () => {
		const result = validateTriggerActionData({
			type: "setParameterValues",
			props: {
				parameterValues: [{parameter: {name: "Length"}, value: 4}],
			},
		});
		expect(result.success).toBe(false);
	});

	it("accepts setParameterValues with a parameter source", () => {
		const result = validateTriggerActionData({
			type: "setParameterValues",
			props: {
				parameterValues: [
					{
						parameter: {name: "Length"},
						source: {
							type: "dataOutput",
							props: {name: "json"},
						},
					},
				],
			},
		});
		expect(result.success).toBe(true);
	});

	it("rejects createModelState actions that include custom metadata", () => {
		const result = validateTriggerActionData({
			type: "createModelState",
			props: {data: {orderId: "123"}},
		});
		expect(result.success).toBe(false);
	});

	it("rejects camera animate without a path", () => {
		const result = validateTriggerActionData({
			type: "camera",
			props: {type: "animate", props: {}},
		});
		expect(result.success).toBe(false);
	});

	it("accepts sound labelPlaying and iconPlaying", () => {
		const result = validateTriggerActionData({
			type: "sound",
			props: {
				href: "https://example.com/a.mp3",
				labelPlaying: "Stop",
				iconPlaying: "mdi:stop",
			},
		});
		expect(result.success).toBe(true);
	});
});

describe("createECommerceApiConnectorActions", () => {
	it("switches to a named camera via the host runner", async () => {
		const actions = createECommerceApiConnectorActions(
			"session",
			hostActions,
		);
		const result = await actions.triggerAction({
			type: "camera",
			props: {
				type: "assign",
				props: {camera: {name: "Front"}},
			},
		});
		expect(result.success).toBe(true);
	});

	it("returns failure when the host has no camera runner", async () => {
		const actions = createECommerceApiConnectorActions("session");
		const result = await actions.triggerAction({
			type: "camera",
			props: {
				type: "assign",
				props: {camera: {name: "Front"}},
			},
		});
		expect(result).toEqual({
			success: false,
			message: 'No runner for action type "camera".',
		});
	});

	it("returns failure when the named camera is missing", async () => {
		const actions = createECommerceApiConnectorActions(
			"session",
			hostActions,
		);
		const result = await actions.triggerAction({
			type: "camera",
			props: {
				type: "assign",
				props: {camera: {name: "Missing"}},
			},
		});
		expect(result).toEqual({
			success: false,
			message: 'Camera "Missing" not found.',
		});
	});

	it("runs nested executeActions camera assign", async () => {
		const actions = createECommerceApiConnectorActions(
			"session",
			hostActions,
		);
		const result = await actions.triggerAction({
			type: "executeActions",
			props: {
				mode: "sequential",
				actions: [
					{
						type: "camera",
						props: {
							type: "assign",
							props: {camera: {name: "Front"}},
						},
					},
				],
			},
		});
		expect(result.success).toBe(true);
	});

	it("returns failure when setParameterValues names an unknown parameter", async () => {
		const actions = createECommerceApiConnectorActions("session");
		const result = await actions.triggerAction({
			type: "setParameterValues",
			props: {
				parameterValues: [{parameter: {name: "missing"}, value: "1"}],
			},
		});
		expect(result).toEqual({
			success: false,
			message: 'Parameter "missing" not found.',
		});
	});

	it("returns found false for a missing output", async () => {
		const actions = createECommerceApiConnectorActions("session");
		const result = await actions.getOutput({output: "missing"});
		expect(result).toEqual({found: false});
	});
});
