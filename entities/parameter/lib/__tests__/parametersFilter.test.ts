import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {NotificationAction} from "@AppBuilderLib/features/notifications/config/notificationcontext";
import {
	filterAndValidateModelStateParameters,
	filterAndValidateParameters,
	generateParameterFeedback,
	isImportParameterArray,
} from "../parametersFilter";

function param(
	id: string,
	name: string,
	isValid: (value: unknown) => boolean = () => true,
): IShapeDiverParameter<any> {
	return {
		definition: {id, name},
		actions: {isValid},
	} as IShapeDiverParameter<any>;
}

describe("isImportParameterArray", () => {
	it("accepts an array of id/value pairs", () => {
		expect(isImportParameterArray([{id: "width", value: 10}])).toBe(true);
	});

	it("accepts optional name on each entry", () => {
		expect(
			isImportParameterArray([{id: "width", value: 10, name: "Width"}]),
		).toBe(true);
	});

	it("rejects a non-array", () => {
		expect(isImportParameterArray({id: "width", value: 10})).toBe(false);
	});

	it("rejects entries without a string id", () => {
		expect(isImportParameterArray([{value: 10}])).toBe(false);
	});
});

describe("filterAndValidateParameters", () => {
	const width = param("width", "Width");

	it("stores a valid parameter under the import id", () => {
		const result = filterAndValidateParameters(
			[width],
			[{id: "width", value: 42}],
		);

		expect(result.hasValidParameters).toBe(true);
		expect(result.validParameters).toEqual({width: 42});
		expect(result.skippedParameters).toEqual([]);
		expect(result.invalidParameters).toEqual([]);
	});

	it("matches by name when the import id is not a definition id", () => {
		const result = filterAndValidateParameters(
			[width],
			[{id: "import-key", value: 7, name: "Width"}],
		);

		expect(result.hasValidParameters).toBe(true);
		expect(result.validParameters).toEqual({"import-key": 7});
		expect(result.skippedParameters).toEqual([]);
	});

	it("keeps the id match when a name is also present", () => {
		const result = filterAndValidateParameters(
			[width, param("height", "Height", () => false)],
			[{id: "width", value: 42, name: "Height"}],
		);

		expect(result.hasValidParameters).toBe(true);
		expect(result.validParameters).toEqual({width: 42});
		expect(result.skippedParameters).toEqual([]);
	});

	it("skips entries with an empty id", () => {
		const result = filterAndValidateParameters(
			[width],
			[{id: "", value: 1, name: "Width"}],
		);

		expect(result.hasValidParameters).toBe(false);
		expect(result.validParameters).toEqual({});
		expect(result.skippedParameters).toEqual([]);
		expect(result.invalidParameters).toEqual([]);
	});

	it("skips entries whose value is undefined", () => {
		const result = filterAndValidateParameters(
			[width],
			[{id: "width", value: undefined}],
		);

		expect(result.hasValidParameters).toBe(false);
		expect(result.validParameters).toEqual({});
		expect(result.skippedParameters).toEqual([]);
	});

	it("validates a null value instead of skipping it", () => {
		const result = filterAndValidateParameters(
			[width],
			[{id: "width", value: null}],
		);

		expect(result.hasValidParameters).toBe(true);
		expect(result.validParameters).toEqual({width: null});
	});

	it("records unknown parameters as skipped by name when name is present", () => {
		const result = filterAndValidateParameters(
			[width],
			[{id: "missing", value: 1, name: "Missing"}],
		);

		expect(result.hasValidParameters).toBe(false);
		expect(result.skippedParameters).toEqual(["Missing"]);
		expect(result.invalidParameters.map((p) => p.name)).toEqual([
			"Missing",
		]);
		expect(result.validParameters).toEqual({});
	});

	it("records unknown parameters as skipped by id when name is absent", () => {
		const result = filterAndValidateParameters(
			[width],
			[{id: "missing", value: 1}],
		);

		expect(result.hasValidParameters).toBe(false);
		expect(result.skippedParameters).toEqual(["missing"]);
		expect(result.invalidParameters.map((p) => p.name)).toEqual(["missing"]);
	});

	it("records rejected values as skipped", () => {
		const result = filterAndValidateParameters(
			[param("width", "Width", () => false)],
			[{id: "width", value: 999, name: "Width"}],
		);

		expect(result.hasValidParameters).toBe(false);
		expect(result.skippedParameters).toEqual(["Width"]);
		expect(result.invalidParameters.map((p) => p.name)).toEqual(["Width"]);
		expect(result.validParameters).toEqual({});
	});

	it("keeps valid parameters and reports only failures", () => {
		const result = filterAndValidateParameters(
			[width],
			[
				{id: "width", value: 42},
				{id: "unknown", value: 1},
			],
		);

		expect(result.hasValidParameters).toBe(true);
		expect(result.validParameters).toEqual({width: 42});
		expect(result.skippedParameters).toEqual(["unknown"]);
		expect(result.invalidParameters.map((p) => p.name)).toEqual(["unknown"]);
	});
});

describe("filterAndValidateModelStateParameters", () => {
	it("validates object-keyed values the same way as the array importer", () => {
		const result = filterAndValidateModelStateParameters(
			[param("width", "Width")],
			{width: 42, unknown: 1},
		);

		expect(result.hasValidParameters).toBe(true);
		expect(result.validParameters).toEqual({width: 42});
		expect(result.skippedParameters).toEqual(["unknown"]);
	});
});

describe("generateParameterFeedback", () => {
	it("signals error when nothing validated", () => {
		const feedback = generateParameterFeedback({
			validParameters: {},
			skippedParameters: ["missing"],
			invalidParameters: [{name: "missing", message: "unused"}],
			hasValidParameters: false,
		});

		expect(feedback.type).toBe(NotificationAction.ERROR);
	});

	it("signals warning when some parameters were skipped", () => {
		const feedback = generateParameterFeedback({
			validParameters: {width: 42},
			skippedParameters: ["unknown"],
			invalidParameters: [{name: "unknown", message: "unused"}],
			hasValidParameters: true,
		});

		expect(feedback.type).toBe(NotificationAction.WARNING);
		expect(feedback.message).toContain("unused");
	});

	it("includes skipped ids when invalidParameters is empty", () => {
		const feedback = generateParameterFeedback({
			validParameters: {width: 42},
			skippedParameters: ["foo", "bar"],
			invalidParameters: [],
			hasValidParameters: true,
		});

		expect(feedback.type).toBe(NotificationAction.WARNING);
		expect(feedback.message).toContain("foo");
		expect(feedback.message).toContain("bar");
	});

	it("signals success when every parameter validated", () => {
		const feedback = generateParameterFeedback(
			{
				validParameters: {width: 42},
				skippedParameters: [],
				invalidParameters: [],
				hasValidParameters: true,
			},
			"ok",
		);

		expect(feedback.type).toBe(NotificationAction.SUCCESS);
		expect(feedback.message).toBe("ok");
	});
});
