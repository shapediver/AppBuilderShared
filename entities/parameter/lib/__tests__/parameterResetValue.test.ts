import {IShapeDiverParameterDefinition} from "../../config/parameter";
import {getResetValue} from "../parameterResetValue";

const definition = (settings?: unknown) =>
	({
		id: "p",
		name: "p",
		type: "String",
		defval: "default",
		settings,
	}) as unknown as IShapeDiverParameterDefinition;

describe("getResetValue", () => {
	it("returns undefined without a resetValue setting", () => {
		expect(getResetValue(definition())).toBeUndefined();
		expect(getResetValue(definition({}))).toBeUndefined();
		expect(getResetValue(definition({resetValue: null}))).toBeUndefined();
	});

	it("returns the defined reset value", () => {
		expect(getResetValue(definition({resetValue: '{"names":[]}'}))).toBe(
			'{"names":[]}',
		);
		expect(getResetValue(definition({resetValue: 0}))).toBe(0);
		expect(getResetValue(definition({resetValue: false}))).toBe(false);
	});
});
