import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {
	IAppBuilder,
	IAppBuilderControlActionRef,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {ListActionControlsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {AgentToolsDeps} from "../model/agentToolsDeps";
import {handleTriggerActionControl} from "../model/handlers/triggerActionControl";
import {runActionControl} from "../model/runActionControl";

const defaultListSettings: ListActionControlsToolSettings = {
	name: "list_action_controls",
};

const emptyApp: IAppBuilder = {version: "1.0", containers: []};

function actionRef(
	overrides: Partial<IAppBuilderControlActionRef> &
		Pick<IAppBuilderControlActionRef, "definition">,
): IAppBuilderControlActionRef {
	return overrides;
}

function param(
	id: string,
	opts: {type?: ResParameterType} = {},
): IShapeDiverParameter<unknown> {
	return {
		definition: {
			id,
			name: id,
			type: opts.type ?? ResParameterType.FLOAT,
			hidden: false,
			defval: 0,
			min: 0,
			max: 100,
		},
		state: {uiValue: 1},
		actions: {isValid: () => true},
		acceptRejectMode: false,
	} as unknown as IShapeDiverParameter<unknown>;
}

function createDeps(overrides: Partial<AgentToolsDeps> = {}): AgentToolsDeps {
	return {
		controllerNamespace: "c",
		getLiveParameters: () => [],
		listSessionNamespaces: () => ["c"],
		getAppBuilder: () => emptyApp,
		batchParameterValueUpdate: jest.fn().mockResolvedValue(undefined),
		getDefaultToolbarActions: () => [
			actionRef({definition: {type: "undo", props: {}}}),
		],
		createModelState: jest.fn().mockResolvedValue({success: true}),
		importModelState: jest.fn().mockResolvedValue({success: true}),
		undo: jest.fn().mockResolvedValue({success: true}),
		redo: jest.fn().mockResolvedValue({success: true}),
		resetParameters: jest.fn().mockResolvedValue({success: true}),
		setCamera: jest.fn().mockResolvedValue({success: true}),
		...overrides,
	};
}

describe("handleTriggerActionControl", () => {
	it("returns does not exist when the name is unknown", async () => {
		const result = await handleTriggerActionControl(
			{name: "missing"},
			defaultListSettings,
			createDeps(),
		);

		expect(result).toEqual({
			success: false,
			message: 'Action "missing" does not exist.',
		});
	});

	it("calls deps.undo for a listed undo action", async () => {
		const deps = createDeps();
		const result = await handleTriggerActionControl(
			{name: "undo"},
			defaultListSettings,
			deps,
		);

		expect(deps.undo).toHaveBeenCalledTimes(1);
		expect(result).toEqual({success: true});
	});

	it("returns success false with a message string when input fails Zod", async () => {
		const result = await handleTriggerActionControl(
			{name: "undo", extra: true},
			defaultListSettings,
			createDeps(),
		);

		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
		expect(result).not.toHaveProperty("errors");
	});

	it("treats a filtered-out action as unknown", async () => {
		const result = await handleTriggerActionControl(
			{name: "undo"},
			{name: "list_action_controls", filter: {types: ["sound"]}},
			createDeps(),
		);

		expect(result).toEqual({
			success: false,
			message: 'Action "undo" does not exist.',
		});
	});

	it("matches listed name from label", async () => {
		const deps = createDeps({
			getDefaultToolbarActions: () => [
				actionRef({
					label: "Undo",
					definition: {type: "undo", props: {}},
				}),
			],
		});

		const result = await handleTriggerActionControl(
			{name: "Undo"},
			defaultListSettings,
			deps,
		);

		expect(deps.undo).toHaveBeenCalledTimes(1);
		expect(result).toEqual({success: true});
	});

	it("triggers an embedded settings.actions ref", async () => {
		const deps = createDeps({getDefaultToolbarActions: () => []});
		const result = await handleTriggerActionControl(
			{name: "save"},
			{
				name: "list_action_controls",
				actions: [
					{
						action: {
							id: "save",
							definition: {
								type: "createModelState",
								props: {includeImage: true},
							},
						},
					},
				],
			},
			deps,
		);

		expect(deps.createModelState).toHaveBeenCalledWith({includeImage: true});
		expect(result).toEqual({success: true});
	});
});

describe("runActionControl", () => {
	it("returns not supported for custom and unsupported types", async () => {
		const result = await runActionControl(
			actionRef({
				id: "fs",
				definition: {type: "fullscreen", props: {}},
			}),
			createDeps(),
		);

		expect(result).toEqual({
			success: false,
			message: "not supported",
		});
	});

	it("returns addToCart is not available when the dep is missing", async () => {
		const result = await runActionControl(
			actionRef({
				definition: {type: "addToCart", props: {productId: "sku"}},
			}),
			createDeps(),
		);

		expect(result).toEqual({
			success: false,
			message: "addToCart is not available",
		});
	});

	it("calls deps.addToCart with props when present", async () => {
		const addToCart = jest.fn().mockResolvedValue({success: true});
		const props = {productId: "sku", quantity: 2};
		const result = await runActionControl(
			actionRef({definition: {type: "addToCart", props}}),
			createDeps({addToCart}),
		);

		expect(addToCart).toHaveBeenCalledWith(props);
		expect(result).toEqual({success: true});
	});

	it("returns Camera action subtype not supported when camera is not set", async () => {
		const result = await runActionControl(
			actionRef({
				definition: {
					type: "camera",
					props: {type: "reset", props: {}},
				},
			}),
			createDeps(),
		);

		expect(result).toEqual({
			success: false,
			message: "Camera action subtype not supported",
		});
	});

	it("sets camera position and target for the set subtype", async () => {
		const deps = createDeps();
		const result = await runActionControl(
			actionRef({
				definition: {
					type: "camera",
					props: {
						type: "set",
						props: {
							position: [1, 2, 3],
							target: [0, 1, 0],
						},
					},
				},
			}),
			deps,
		);

		expect(deps.setCamera).toHaveBeenCalledWith({
			position: [1, 2, 3],
			target: [0, 1, 0],
		});
		expect(result).toEqual({success: true});
	});

	it("maps setParameterValues definition props through resolve helpers", async () => {
		const batchParameterValueUpdate = jest
			.fn()
			.mockResolvedValue(undefined);
		const deps = createDeps({
			getLiveParameters: () => [param("width")],
			batchParameterValueUpdate,
		});

		const result = await runActionControl(
			actionRef({
				definition: {
					type: "setParameterValues",
					props: {
						parameterValues: [
							{
								parameter: {name: "width"},
								value: "10",
							},
						],
					},
				},
			}),
			deps,
		);

		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			c: {width: "10"},
		});
		expect(result).toEqual({success: true});
	});

	it("returns not supported for setParameterValue with source only", async () => {
		const batchParameterValueUpdate = jest
			.fn()
			.mockResolvedValue(undefined);
		const deps = createDeps({
			getLiveParameters: () => [param("width")],
			batchParameterValueUpdate,
		});

		const result = await runActionControl(
			actionRef({
				definition: {
					type: "setParameterValue",
					props: {
						parameter: {name: "width"},
						source: {type: "screenshot", props: {}},
					},
				},
			}),
			deps,
		);

		expect(result).toEqual({
			success: false,
			message: "not supported",
		});
		expect(batchParameterValueUpdate).not.toHaveBeenCalled();
	});

	it("fails the whole setParameterValues batch when any item is source-only", async () => {
		const batchParameterValueUpdate = jest
			.fn()
			.mockResolvedValue(undefined);
		const deps = createDeps({
			getLiveParameters: () => [param("width"), param("height")],
			batchParameterValueUpdate,
		});

		const result = await runActionControl(
			actionRef({
				definition: {
					type: "setParameterValues",
					props: {
						parameterValues: [
							{
								parameter: {name: "width"},
								value: "10",
							},
							{
								parameter: {name: "height"},
								source: {type: "screenshot", props: {}},
							},
						],
					},
				},
			}),
			deps,
		);

		expect(result).toEqual({
			success: false,
			message: "not supported",
		});
		expect(batchParameterValueUpdate).not.toHaveBeenCalled();
	});

	it("returns not supported when isCustomComponentContextAction is true", async () => {
		const createModelState = jest.fn().mockResolvedValue({success: true});
		const result = await runActionControl(
			actionRef({
				definition: {type: "createModelState", props: {}},
			}),
			createDeps({
				createModelState,
				isCustomComponentContextAction: () => true,
			}),
		);

		expect(result).toEqual({
			success: false,
			message: "not supported",
		});
		expect(createModelState).not.toHaveBeenCalled();
	});

	it("runs createModelState when isCustomComponentContextAction is omitted", async () => {
		const createModelState = jest.fn().mockResolvedValue({success: true});
		const result = await runActionControl(
			actionRef({
				definition: {
					type: "createModelState",
					props: {includeImage: true},
				},
			}),
			createDeps({createModelState}),
		);

		expect(createModelState).toHaveBeenCalledWith({includeImage: true});
		expect(result).toEqual({success: true});
	});

	it("returns createModelState failure message", async () => {
		const result = await runActionControl(
			actionRef({
				definition: {type: "createModelState", props: {}},
			}),
			createDeps({
				createModelState: jest.fn().mockResolvedValue({
					success: false,
					message: "save failed",
				}),
			}),
		);

		expect(result).toEqual({
			success: false,
			message: "save failed",
		});
	});

	it("still calls importModelState when props have no id", async () => {
		const importModelState = jest.fn().mockResolvedValue({success: true});
		const result = await runActionControl(
			actionRef({
				definition: {type: "importModelState", props: {}},
			}),
			createDeps({importModelState}),
		);

		expect(importModelState).toHaveBeenCalled();
		expect(result).toEqual({success: true});
	});

	it("returns success false when importModelState throws", async () => {
		const result = await runActionControl(
			actionRef({
				definition: {type: "importModelState", props: {}},
			}),
			createDeps({
				importModelState: jest.fn().mockRejectedValue(new Error("boom")),
			}),
		);

		expect(result).toEqual({success: false, message: "boom"});
	});

	it("calls deps.redo and deps.resetParameters", async () => {
		const deps = createDeps();

		await expect(
			runActionControl(
				actionRef({definition: {type: "redo", props: {}}}),
				deps,
			),
		).resolves.toEqual({success: true});
		expect(deps.redo).toHaveBeenCalledTimes(1);

		await expect(
			runActionControl(
				actionRef({
					definition: {type: "resetParameterValues", props: {}},
				}),
				deps,
			),
		).resolves.toEqual({success: true});
		expect(deps.resetParameters).toHaveBeenCalledWith("c");
	});

	it("returns not supported for sound unless playSound exists", async () => {
		const sound = actionRef({
			definition: {type: "sound", props: {href: "s.mp3"}},
		});

		await expect(runActionControl(sound, createDeps())).resolves.toEqual({
			success: false,
			message: "not supported",
		});

		const playSound = jest.fn().mockResolvedValue({success: true});
		await expect(
			runActionControl(sound, createDeps({playSound})),
		).resolves.toEqual({success: true});
		expect(playSound).toHaveBeenCalledWith({href: "s.mp3"});
	});

	it("returns success false when a handler throws", async () => {
		const result = await runActionControl(
			actionRef({definition: {type: "undo", props: {}}}),
			createDeps({
				undo: jest.fn().mockRejectedValue(new Error("history empty")),
			}),
		);

		expect(result).toEqual({
			success: false,
			message: "history empty",
		});
	});
});
