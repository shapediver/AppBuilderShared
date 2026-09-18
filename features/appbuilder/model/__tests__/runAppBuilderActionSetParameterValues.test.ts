/**
 * @jest-environment jsdom
 */
const mockResolveParameterValueSources = jest.fn();

jest.mock(
	"@AppBuilderLib/entities/parameter/lib/resolveParameterValueSources",
	() => ({
		resolveParameterValueSources: (...args: unknown[]) =>
			mockResolveParameterValueSources(...args),
	}),
);

import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {runAppBuilderActionSetParameterValues} from "../runAppBuilderActionSetParameterValues";

function parameterStore(
	id: string,
	options?: {different?: boolean; valid?: boolean},
) {
	const valid = options?.valid ?? true;
	const setUiValue = jest.fn(() => valid);
	const isUiValueDifferent = jest.fn(() => options?.different ?? true);
	const isValid = jest.fn(() => valid);
	return {
		getState: () => ({
			definition: {id, name: id},
			actions: {setUiValue, isUiValueDifferent, isValid},
		}),
		setUiValue,
		isUiValueDifferent,
		isValid,
	};
}

describe("runAppBuilderActionSetParameterValues", () => {
	const originalGetState = useShapeDiverStoreParameters.getState;

	afterEach(() => {
		useShapeDiverStoreParameters.getState = originalGetState;
		mockResolveParameterValueSources.mockReset();
	});

	it("resolves value sources and batches the resulting values", async () => {
		const target = parameterStore("p1");
		const batchParameterValueUpdate = jest.fn(async () => {});
		mockResolveParameterValueSources.mockResolvedValue(["resolved-file"]);
		useShapeDiverStoreParameters.getState = () =>
			({
				getParameter: () => target,
				batchParameterValueUpdate,
			}) as unknown as ReturnType<typeof originalGetState>;

		await runAppBuilderActionSetParameterValues(
			{
				parameterValues: [
					{
						parameter: {name: "p1"},
						source: {
							type: "dataOutput",
							props: {name: "json"},
						},
					},
				],
			},
			{namespace: "session", viewportId: "viewport_1"},
		);

		expect(mockResolveParameterValueSources).toHaveBeenCalledWith(
			[
				{
					id: "p1",
					value: {type: "dataOutput", props: {name: "json"}},
					namespace: "session",
				},
			],
			{namespace: "session", viewportId: "viewport_1"},
		);
		expect(target.setUiValue).toHaveBeenCalledWith("resolved-file");
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			session: {p1: "resolved-file"},
		});
	});

	it("skips source resolution when every item already has a value", async () => {
		const target = parameterStore("p1");
		const batchParameterValueUpdate = jest.fn(async () => {});
		useShapeDiverStoreParameters.getState = () =>
			({
				getParameter: () => target,
				batchParameterValueUpdate,
			}) as unknown as ReturnType<typeof originalGetState>;

		await runAppBuilderActionSetParameterValues(
			{
				parameterValues: [{parameter: {name: "p1"}, value: "literal"}],
			},
			{namespace: "session"},
		);

		expect(mockResolveParameterValueSources).not.toHaveBeenCalled();
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			session: {p1: "literal"},
		});
	});

	it("fails when a value source is agentTool", async () => {
		await expect(
			runAppBuilderActionSetParameterValues(
				{
					parameterValues: [
						{
							parameter: {name: "p1"},
							source: {
								type: "agentTool",
								props: {jsonPath: "$.length"},
							},
						},
					],
				},
				{namespace: "session"},
			),
		).rejects.toThrow("agentTool");
	});

	it("throws when the parameter is missing", async () => {
		useShapeDiverStoreParameters.getState = () =>
			({
				getParameter: () => undefined,
				batchParameterValueUpdate: jest.fn(async () => {}),
			}) as unknown as ReturnType<typeof originalGetState>;

		await expect(
			runAppBuilderActionSetParameterValues(
				{
					parameterValues: [
						{parameter: {name: "missing"}, value: "1"},
					],
				},
				{namespace: "session", strict: true},
			),
		).rejects.toThrow('Parameter "missing" not found.');
	});

	it("throws when neither value nor source is defined", async () => {
		const target = parameterStore("p1");
		useShapeDiverStoreParameters.getState = () =>
			({
				getParameter: () => target,
				batchParameterValueUpdate: jest.fn(async () => {}),
			}) as unknown as ReturnType<typeof originalGetState>;

		await expect(
			runAppBuilderActionSetParameterValues(
				{parameterValues: [{parameter: {name: "p1"}}]},
				{namespace: "session", strict: true},
			),
		).rejects.toThrow('No value or source defined for parameter "p1".');
	});

	it("throws when setUiValue rejects the value", async () => {
		const target = parameterStore("p1", {valid: false});
		useShapeDiverStoreParameters.getState = () =>
			({
				getParameter: () => target,
				batchParameterValueUpdate: jest.fn(async () => {}),
			}) as unknown as ReturnType<typeof originalGetState>;

		await expect(
			runAppBuilderActionSetParameterValues(
				{
					parameterValues: [{parameter: {name: "p1"}, value: "bad"}],
				},
				{namespace: "session", strict: true},
			),
		).rejects.toThrow('Invalid value for parameter "p1".');
		expect(target.setUiValue).not.toHaveBeenCalled();
	});

	it("does not mutate earlier parameters when a later batch entry is invalid", async () => {
		const first = parameterStore("p1");
		const second = parameterStore("p2", {valid: false});
		const batchParameterValueUpdate = jest.fn(async () => {});
		useShapeDiverStoreParameters.getState = () =>
			({
				getParameter: (_namespace: string, name: string) =>
					name === "p1" ? first : second,
				batchParameterValueUpdate,
			}) as unknown as ReturnType<typeof originalGetState>;

		await expect(
			runAppBuilderActionSetParameterValues(
				{
					parameterValues: [
						{parameter: {name: "p1"}, value: "ok"},
						{parameter: {name: "p2"}, value: "bad"},
					],
				},
				{namespace: "session", strict: true},
			),
		).rejects.toThrow('Invalid value for parameter "p2".');
		expect(first.setUiValue).not.toHaveBeenCalled();
		expect(second.setUiValue).not.toHaveBeenCalled();
		expect(batchParameterValueUpdate).not.toHaveBeenCalled();
	});

	it("does not mutate earlier parameters when a later batch entry is missing", async () => {
		const first = parameterStore("p1");
		const batchParameterValueUpdate = jest.fn(async () => {});
		useShapeDiverStoreParameters.getState = () =>
			({
				getParameter: (_namespace: string, name: string) =>
					name === "p1" ? first : undefined,
				batchParameterValueUpdate,
			}) as unknown as ReturnType<typeof originalGetState>;

		await expect(
			runAppBuilderActionSetParameterValues(
				{
					parameterValues: [
						{parameter: {name: "p1"}, value: "ok"},
						{parameter: {name: "missing"}, value: "1"},
					],
				},
				{namespace: "session", strict: true},
			),
		).rejects.toThrow('Parameter "missing" not found.');
		expect(first.setUiValue).not.toHaveBeenCalled();
		expect(batchParameterValueUpdate).not.toHaveBeenCalled();
	});

	it("skips a missing parameter and applies the rest when not strict", async () => {
		const first = parameterStore("p1");
		const batchParameterValueUpdate = jest.fn(async () => {});
		const warn = jest.spyOn(Logger, "warn").mockImplementation(() => {});
		useShapeDiverStoreParameters.getState = () =>
			({
				getParameter: (_namespace: string, name: string) =>
					name === "p1" ? first : undefined,
				batchParameterValueUpdate,
			}) as unknown as ReturnType<typeof originalGetState>;

		try {
			await runAppBuilderActionSetParameterValues(
				{
					parameterValues: [
						{parameter: {name: "p1"}, value: "ok"},
						{parameter: {name: "missing"}, value: "1"},
					],
				},
				{namespace: "session"},
			);
			expect(first.setUiValue).toHaveBeenCalledWith("ok");
			expect(batchParameterValueUpdate).toHaveBeenCalledWith({
				session: {p1: "ok"},
			});
			expect(warn).toHaveBeenCalled();
		} finally {
			warn.mockRestore();
		}
	});
});
