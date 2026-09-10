/**
 * @jest-environment node
 */
import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {prepareParameterStoreValue} from "../prepareParameterStoreValue";

function stringListParam(
	choices: string[],
	isValid: (value: unknown) => boolean = () => true,
): IShapeDiverParameter<unknown> {
	return {
		definition: {
			id: "finish",
			name: "Finish",
			displayname: "Finish",
			type: ResParameterType.STRINGLIST,
			hidden: false,
			defval: "0",
			choices,
		},
		state: {uiValue: "0"},
		actions: {isValid},
		acceptRejectMode: false,
	} as unknown as IShapeDiverParameter<unknown>;
}

describe("prepareParameterStoreValue StringList", () => {
	it("rejects an index outside choices.length even when isValid accepts it", () => {
		const parameter = stringListParam(["A", "B", "C", "D"]);
		const result = prepareParameterStoreValue(parameter, 12);

		expect(result).toEqual({
			success: false,
			message: expect.stringContaining('Value 12 is not valid for parameter "Finish"'),
		});
	});

	it("accepts a 0-based index inside the choice list", () => {
		const parameter = stringListParam(["A", "B", "C", "D"]);
		expect(prepareParameterStoreValue(parameter, 3)).toEqual({
			success: true,
			storeValue: "3",
		});
	});
});
