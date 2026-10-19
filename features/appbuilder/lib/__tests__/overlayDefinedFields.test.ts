import {overlayDefinedFields} from "../overlayDefinedFields";

describe("overlayDefinedFields", () => {
	it("returns the base when the patch is omitted", () => {
		expect(overlayDefinedFields({a: 1}, undefined)).toEqual({a: 1});
	});

	it("returns the patch when the base is omitted", () => {
		expect(overlayDefinedFields(undefined, {a: 1})).toEqual({a: 1});
	});

	it("keeps the base when the patch is an empty object", () => {
		expect(overlayDefinedFields({a: 1, b: 2}, {})).toEqual({a: 1, b: 2});
	});

	it("overlays only defined patch fields", () => {
		expect(
			overlayDefinedFields(
				{container: "bottom", position: "after", disabled: false},
				{disabled: true},
			),
		).toEqual({
			container: "bottom",
			position: "after",
			disabled: true,
		});
	});

	it("does not clear a base field with an undefined patch value", () => {
		expect(
			overlayDefinedFields(
				{container: "bottom"},
				{container: undefined, position: "before"},
			),
		).toEqual({container: "bottom", position: "before"});
	});
});
