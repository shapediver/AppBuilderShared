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
import {runAppBuilderActionSetParameterValues} from "../runAppBuilderActionSetParameterValues";

function parameterStore(id: string, options?: {different?: boolean}) {
	const setUiValue = jest.fn(() => true);
	const isUiValueDifferent = jest.fn(() => options?.different ?? true);
	return {
		getState: () => ({
			definition: {id, name: id},
			actions: {setUiValue, isUiValueDifferent},
		}),
		setUiValue,
		isUiValueDifferent,
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
});
