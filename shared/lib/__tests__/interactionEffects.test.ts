const warn = jest.fn();

jest.mock("@shapediver/viewer.session", () => ({
	MATERIAL_TYPE: {STANDARD: "standard"},
	MaterialStandardData: class {
		constructor(public properties: unknown) {}
	},
}));

jest.mock("@shapediver/viewer.viewport", () => ({
	MaterialEngine: {
		instance: {
			createMaterialDataFromDefinition: jest.fn(async (definition) => ({
				material: definition,
			})),
		},
	},
	POST_PROCESSING_EFFECT_TYPE: {OUTLINE: "outline"},
}));

jest.mock("../logger", () => ({
	Logger: {warn: (...args: unknown[]) => warn(...args)},
}));

import {parseInteractionEffect} from "../interactionEffects";

describe("parseInteractionEffect", () => {
	beforeEach(() => warn.mockClear());

	it("passes null and undefined through", async () => {
		expect(await parseInteractionEffect(null)).toBeNull();
		expect(await parseInteractionEffect(undefined)).toBeUndefined();
	});

	it("accepts outline and pulse effects", async () => {
		const outline = {type: "outline", properties: {}};
		const pulse = {type: "pulse", intensity: 0};
		expect(await parseInteractionEffect(outline as never)).toBe(outline);
		expect(await parseInteractionEffect(pulse as never)).toBe(pulse);
		expect(warn).not.toHaveBeenCalled();
	});

	it("drops an effect without a valid type and warns once", async () => {
		// The "Move Vase" dragging parameters of SS-10616 sent this value.
		const invalid = {type: null, intensity: 0};
		expect(await parseInteractionEffect(invalid as never)).toBeUndefined();
		expect(await parseInteractionEffect(invalid as never)).toBeUndefined();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0][0]).toContain('{"type":null,"intensity":0}');
	});

	it("drops an unsupported post-processing type", async () => {
		const bloom = {type: "selectiveBloom", properties: {}};
		expect(await parseInteractionEffect(bloom as never)).toBeUndefined();
		expect(warn).toHaveBeenCalledTimes(1);
	});
});
