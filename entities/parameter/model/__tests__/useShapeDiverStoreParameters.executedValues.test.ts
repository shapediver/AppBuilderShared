/**
 * @jest-environment jsdom
 */
import {IGenericParameterDefinition} from "../../config/shapediverStoreParameters";
import {useShapeDiverStoreParameters} from "../useShapeDiverStoreParameters";

/**
 * Tests for values returned by generic parameter executors.
 *
 * An executor may return values which differ from the executed ones as a
 * result of the execution, e.g. a model defining a new value for a custom
 * parameter (dynamic parameter). Those values must become the executed
 * values of the parameter stores.
 */
describe("useShapeDiverStoreParameters executed values", () => {
	const store = useShapeDiverStoreParameters;
	const namespace = "generic-executed-values";

	const definition = {
		definition: {
			id: "p1",
			name: "p1",
			type: "String",
			defval: "a",
		},
	} as unknown as IGenericParameterDefinition;

	afterEach(() => {
		store.getState().removeSession(namespace);
	});

	const getParameter = () => {
		const parameter = store.getState().getParameter(namespace, "p1");
		if (!parameter) throw new Error("parameter store not found");
		return parameter;
	};

	it("keeps the executed value when the executor returns nothing", async () => {
		const executor = jest.fn(async () => undefined);
		store
			.getState()
			.addGeneric(namespace, false, definition, executor, undefined);
		const parameter = getParameter();

		expect(parameter.getState().actions.setUiValue("b")).toBe(true);
		const result = await parameter.getState().actions.execute(true);

		expect(executor).toHaveBeenCalledTimes(1);
		expect(executor.mock.calls[0][0]).toEqual({p1: "b"});
		expect(result).toBe("b");
		expect(parameter.getState().state.execValue).toBe("b");
		expect(parameter.getState().state.uiValue).toBe("b");
		expect(parameter.getState().state.dirty).toBe(false);
	});

	it("uses values returned by the executor as executed values", async () => {
		const executor = jest.fn(async () => ({p1: "set by model"}));
		store
			.getState()
			.addGeneric(namespace, false, definition, executor, undefined);
		const parameter = getParameter();

		expect(parameter.getState().actions.setUiValue("b")).toBe(true);
		const result = await parameter.getState().actions.execute(true);

		expect(executor.mock.calls[0][0]).toEqual({p1: "b"});
		expect(result).toBe("set by model");
		expect(parameter.getState().state.execValue).toBe("set by model");
		expect(parameter.getState().state.uiValue).toBe("set by model");
		expect(parameter.getState().state.dirty).toBe(false);
	});

	it("ignores returned values of parameters which were not executed", async () => {
		const executor = jest.fn(async () => ({other: "x"}));
		store
			.getState()
			.addGeneric(namespace, false, definition, executor, undefined);
		const parameter = getParameter();

		parameter.getState().actions.setUiValue("b");
		const result = await parameter.getState().actions.execute(true);

		expect(result).toBe("b");
		expect(parameter.getState().state.execValue).toBe("b");
	});
});
