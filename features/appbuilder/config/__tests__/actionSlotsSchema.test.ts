jest.mock("@shapediver/viewer.session", () => ({
	PARAMETER_TYPE: {
		Bool: "Bool",
		Float: "Float",
		String: "String",
		StringList: "StringList",
		File: "File",
		Color: "Color",
		Int: "Int",
		Even: "Even",
		Odd: "Odd",
		Drawing: "Drawing",
		Interaction: "Interaction",
	},
	PARAMETER_VISUALIZATION: {
		SLIDER: "slider",
	},
}));

jest.mock("@shapediver/viewer.shared.types", () => ({
	...jest.requireActual("@shapediver/viewer.shared.types"),
	ATTRIBUTE_VISUALIZATION: {
		LINEAR: "linear",
	},
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
	TAG3D_JUSTIFICATION: {
		LEFT: "left",
		CENTER: "center",
		RIGHT: "right",
	},
}));

import {validateAppBuilder} from "../appbuildertypecheck";

const undo = {type: "undo", props: {}};

const layout = (actionSlots?: unknown, containers: unknown[] = []) => ({
	version: "1.0" as const,
	containers,
	...(actionSlots === undefined ? {} : {actionSlots}),
});

const leftContainer = (actionSlots?: unknown) => ({
	name: "left",
	...(actionSlots === undefined ? {} : {actionSlots}),
});

describe("action slot schema", () => {
	it("accepts UI events and custom events on a container", () => {
		const result = validateAppBuilder(
			layout(undefined, [
				leftContainer({
					click: {action: undo},
					pointerenter: [{action: undo}],
					"custom:item-selected": {action: undo},
				}),
			]),
		);
		expect(result.success).toBe(true);
	});

	it("rejects application events and eventProps on a UI node", () => {
		const computation = validateAppBuilder(
			layout(undefined, [
				leftContainer({
					computationstart: {action: undo},
				}),
			]),
		);
		expect(computation.success).toBe(false);

		const withProps = validateAppBuilder(
			layout(undefined, [
				leftContainer({
					click: {
						action: undo,
						eventProps: {type: "session", props: {}},
					},
				}),
			]),
		);
		expect(withProps.success).toBe(false);
	});

	it("rejects unknown names and invalid custom event names", () => {
		const unknown = validateAppBuilder(
			layout(undefined, [leftContainer({notAnEvent: {action: undo}})]),
		);
		expect(unknown.success).toBe(false);

		const custom = validateAppBuilder(
			layout(undefined, [leftContainer({"custom:Item": {action: undo}})]),
		);
		expect(custom.success).toBe(false);
	});

	it("accepts root application events with matching eventProps", () => {
		const result = validateAppBuilder(
			layout({
				appready: {action: undo},
				click: {action: undo},
				computationstart: {
					action: undo,
					eventProps: {type: "session", props: {sessionId: "s1"}},
				},
				exportstart: [
					{
						action: undo,
						eventProps: {type: "export", props: {name: "GLB"}},
					},
				],
				selecton: {
					action: undo,
					eventProps: {
						type: "selection",
						props: {nameFilter: ["Door"]},
					},
				},
				"custom:item-selected": {action: undo},
			}),
		);
		expect(result.success).toBe(true);
	});

	it("rejects selection slots without a nameFilter", () => {
		const missing = validateAppBuilder(
			layout({
				selecton: {
					action: undo,
					eventProps: {type: "selection", props: {hover: true}},
				},
			}),
		);
		expect(missing.success).toBe(false);

		const empty = validateAppBuilder(
			layout({
				selecton: {
					action: undo,
					eventProps: {type: "selection", props: {nameFilter: []}},
				},
			}),
		);
		expect(empty.success).toBe(false);

		const noProps = validateAppBuilder(
			layout({
				selecton: {action: undo},
			}),
		);
		expect(noProps.success).toBe(false);
	});

	it("rejects eventProps whose type does not match the root event", () => {
		const wrongType = validateAppBuilder(
			layout({
				exportstart: {
					action: undo,
					eventProps: {type: "session", props: {}},
				},
			}),
		);
		expect(wrongType.success).toBe(false);

		const appreadyProps = validateAppBuilder(
			layout({
				appready: {
					action: undo,
					eventProps: {type: "session", props: {}},
				},
			}),
		);
		expect(appreadyProps.success).toBe(false);

		const selectProps = validateAppBuilder(
			layout({
				selecton: {
					action: undo,
					eventProps: {type: "export", props: {}},
				},
			}),
		);
		expect(selectProps.success).toBe(false);
	});

	it("rejects application events on a toolbar item", () => {
		const result = validateAppBuilder(
			layout(undefined, [
				{
					name: "toolbar",
					props: {id: "toolbar"},
					groups: [
						[
							{
								type: "action",
								props: {definition: undo},
								actionSlots: {
									computationend: {action: undo},
								},
							},
						],
					],
				},
			]),
		);
		expect(result.success).toBe(false);
	});
});

const controlsContainer = (control: unknown) => [
	{
		name: "left",
		widgets: [{type: "controls", props: {controls: [control]}}],
	},
];

const parameterControl = (control: Record<string, unknown> = {}) => ({
	type: "parameter",
	props: {name: "elements_select", sessionId: "default_appbuilder"},
	...control,
});

describe("parameter control computation slots", () => {
	it("accepts computation slots on a parameter control without eventProps", () => {
		const result = validateAppBuilder(
			layout(
				undefined,
				controlsContainer(
					parameterControl({
						actionSlots: {
							computationstart: {action: undo},
							computationend: [{action: undo}, {action: undo}],
							computationerror: {action: undo},
							click: {action: undo},
							"custom:item-selected": {action: undo},
						},
					}),
				),
			),
		);
		expect(result.success).toBe(true);
	});

	it("accepts the example of the ticket", () => {
		const result = validateAppBuilder(
			layout(
				undefined,
				controlsContainer(
					parameterControl({
						actionSlots: {
							computationend: {
								action: {
									type: "setContainerVisibility",
									props: {
										container: {
											name: "anchor2d",
											props: {id: "Artwork"},
										},
										mode: "close",
									},
								},
							},
						},
					}),
				),
			),
		);
		expect(result.success).toBe(true);
	});

	it("rejects eventProps on a computation slot of a parameter control", () => {
		for (const eventProps of [
			{type: "session", props: {}},
			{type: "session", props: {sessionId: "s1"}},
			{type: "export", props: {}},
		]) {
			const result = validateAppBuilder(
				layout(
					undefined,
					controlsContainer(
						parameterControl({
							actionSlots: {
								computationend: {action: undo, eventProps},
							},
						}),
					),
				),
			);
			expect(result.success).toBe(false);
		}
	});

	it("rejects computation slots inside props.overrides", () => {
		const result = validateAppBuilder(
			layout(
				undefined,
				controlsContainer({
					type: "parameter",
					props: {
						name: "elements_select",
						overrides: {
							actionSlots: {computationend: {action: undo}},
						},
					},
				}),
			),
		);
		expect(result.success).toBe(false);
	});

	it("rejects other application events on a parameter control", () => {
		for (const eventName of ["appready", "exportend", "selecton"]) {
			const result = validateAppBuilder(
				layout(
					undefined,
					controlsContainer(
						parameterControl({
							actionSlots: {[eventName]: {action: undo}},
						}),
					),
				),
			);
			expect(result.success).toBe(false);
		}
	});

	it("rejects computation slots on export, output, and action controls", () => {
		const controls = [
			{type: "export", props: {name: "Obj Export"}},
			{type: "output", props: {name: "Output"}},
			{type: "action", props: {definition: undo}},
		];
		for (const control of controls) {
			for (const eventName of [
				"computationstart",
				"computationend",
				"computationerror",
			]) {
				const result = validateAppBuilder(
					layout(
						undefined,
						controlsContainer({
							...control,
							actionSlots: {[eventName]: {action: undo}},
						}),
					),
				);
				expect(result.success).toBe(false);
			}
		}
	});

	it("still accepts UI slots on export, output, and action controls", () => {
		const controls = [
			{type: "export", props: {name: "Obj Export"}},
			{type: "output", props: {name: "Output"}},
			{type: "action", props: {definition: undo}},
		];
		for (const control of controls) {
			const result = validateAppBuilder(
				layout(
					undefined,
					controlsContainer({
						...control,
						actionSlots: {click: {action: undo}},
					}),
				),
			);
			expect(result.success).toBe(true);
		}
	});

	it("keeps the root computation slots with eventProps", () => {
		const result = validateAppBuilder(
			layout({
				computationend: {
					action: undo,
					eventProps: {type: "session", props: {sessionId: "s1"}},
				},
			}),
		);
		expect(result.success).toBe(true);
	});
});
