import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {filterVisibleParameters} from "../lib/filterVisibleParameters";

function mockParam(id: string, name: string): IShapeDiverParameter<any> {
	return {
		definition: {
			id,
			name,
			type: ResParameterType.FLOAT,
		},
	} as IShapeDiverParameter<any>;
}

describe("filterVisibleParameters", () => {
	it("returns empty array when layout refs are empty", () => {
		const params = [mockParam("a", "Slider1"), mockParam("b", "Slider2")];

		expect(filterVisibleParameters(params, [])).toEqual([]);
	});

	it("filters by ref name, id, or displayname", () => {
		const params = [
			mockParam("id-1", "Slider1"),
			mockParam("id-2", "Hidden"),
		];

		const filtered = filterVisibleParameters(params, [
			{name: "Slider1"},
			{name: "id-2"},
		]);

		expect(filtered.map((p) => p.definition.id)).toEqual(["id-1", "id-2"]);
	});
});
