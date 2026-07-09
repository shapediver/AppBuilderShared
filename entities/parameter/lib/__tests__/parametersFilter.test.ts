import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {NotificationAction} from "@AppBuilderLib/features/notifications/config/notificationcontext";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	filterAndValidateParameters,
	generateParameterFeedback,
} from "../parametersFilter";
function createMockParameter(
	overrides: Partial<IShapeDiverParameter<any>> & {
		definition: IShapeDiverParameter<any>["definition"];
	},
): IShapeDiverParameter<any> {
	return {
		state: {
			uiValue: overrides.state?.uiValue,
			execValue: overrides.state?.execValue,
			dirty: false,
			disableOtherParameters: false,
			stringExecValue: () => "",
		},
		actions: {
			setUiValue: () => true,
			setUiAndExecValue: () => true,
			execute: async () => "",
			isValid: overrides.actions?.isValid ?? (() => true),
			isUiValueDifferent: () => false,
			resetToDefaultValue: () => undefined,
			resetToExecValue: () => undefined,
		},
		acceptRejectMode: false,
		...overrides,
	} as IShapeDiverParameter<any>;
}

describe("filterAndValidateParameters", () => {
	const widthParam = createMockParameter({
		definition: {
			id: "width",
			name: "Width",
			type: ResParameterType.FLOAT,
			min: 0,
			max: 100,
			defval: 10,
		} as IShapeDiverParameter<any>["definition"],
	});

	it("reports unknown parameter in invalidParameters", () => {
		const result = filterAndValidateParameters(
			[widthParam],
			[{id: "missing", value: 1}],
		);

		expect(result.hasValidParameters).toBe(false);
		expect(result.skippedParameters).toEqual(["missing"]);
		expect(result.invalidParameters).toEqual([
			{
				name: "missing",
				message:
					'Parameter "missing" does not exist in the current model session.',
			},
		]);
	});

	it("reports invalid value in invalidParameters", () => {
		const result = filterAndValidateParameters(
			[
				createMockParameter({
					definition: widthParam.definition,
					actions: {isValid: () => false},
				}),
			],
			[{id: "width", value: 999}],
		);

		expect(result.hasValidParameters).toBe(false);
		expect(result.skippedParameters).toEqual(["width"]);
		expect(result.invalidParameters).toEqual([
			{
				name: "width",
				message: 'Value is not valid for parameter "width"',
			},
		]);
	});

	it("keeps valid parameters and reports only failures", () => {
		const result = filterAndValidateParameters(
			[widthParam],
			[
				{id: "width", value: 42},
				{id: "unknown", value: 1},
			],
		);

		expect(result.hasValidParameters).toBe(true);
		expect(result.validParameters).toEqual({width: 42});
		expect(result.invalidParameters).toEqual([
			{
				name: "unknown",
				message:
					'Parameter "unknown" does not exist in the current model session.',
			},
		]);
	});
});

describe("generateParameterFeedback", () => {
	it("uses invalidParameters messages for partial success warnings", () => {
		const feedback = generateParameterFeedback({
			validParameters: {width: 42},
			skippedParameters: ["unknown"],
			invalidParameters: [
				{
					name: "unknown",
					message:
						'Parameter "unknown" does not exist in the current model session.',
				},
			],
			hasValidParameters: true,
		});

		expect(feedback.type).toBe(NotificationAction.WARNING);
		expect(feedback.message).toBe(
			'Parameter "unknown" does not exist in the current model session.',
		);
	});

	it("falls back to skipped parameter names when invalidParameters is empty", () => {
		const feedback = generateParameterFeedback({
			validParameters: {width: 42},
			skippedParameters: ["foo", "bar"],
			invalidParameters: [],
			hasValidParameters: true,
		});

		expect(feedback.type).toBe(NotificationAction.WARNING);
		expect(feedback.message).toBe(
			"The following parameters could not be matched or ar invalid: foo, bar",
		);
	});
});