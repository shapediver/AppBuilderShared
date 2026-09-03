/**
 * @jest-environment jsdom
 */
import {ISessionApi} from "@shapediver/viewer.session";
import {IGenericParameterDefinition} from "../../config/shapediverStoreParameters";
import {useShapeDiverStoreParameters} from "../useShapeDiverStoreParameters";

/**
 * Tests for the commit value of parameters.
 *
 * `commitValue` is the value a parameter is committed to (used by the next
 * execution, baseline for pending changes), `execValue` is the value of the
 * latest execution. Values committed without an execution (reset values,
 * values executed elsewhere) must reach the session (session parameters) or
 * the commit callback (generic parameters).
 */
describe("useShapeDiverStoreParameters commit value", () => {
	const store = useShapeDiverStoreParameters;
	const sessionId = "session-commit-value";
	const genericNamespace = "generic-commit-value";

	const createFakeSession = () =>
		({
			id: sessionId,
			parameters: {
				p1: {
					id: "p1",
					name: "p1",
					type: "String",
					defval: "a",
					value: "a",
					isValid: () => true,
					stringify: (value: unknown) => String(value),
				},
			},
			exports: {},
			outputs: {},
		}) as unknown as ISessionApi;

	const genericDefinition = (settings?: unknown) =>
		({
			definition: {
				id: "g1",
				name: "g1",
				type: "String",
				defval: "a",
				settings,
			},
		}) as unknown as IGenericParameterDefinition;

	const getParameter = (namespace: string, id: string) => {
		const parameter = store.getState().getParameter(namespace, id);
		if (!parameter) throw new Error("parameter store not found");
		return parameter;
	};

	afterEach(() => {
		store.getState().removeSession(sessionId);
		store.getState().removeSession(genericNamespace);
	});

	it("initializes all values with the default value", () => {
		store.getState().addSession(createFakeSession(), false);
		const {state} = getParameter(sessionId, "p1").getState();

		expect(state.uiValue).toBe("a");
		expect(state.execValue).toBe("a");
		expect(state.commitValue).toBe("a");
		expect(state.commitRevision).toBe(0);
		expect(state.dirty).toBe(false);
	});

	it("increments the commit revision on every commit", async () => {
		const executor = jest.fn(async () => undefined);
		store
			.getState()
			.addGeneric(
				genericNamespace,
				false,
				genericDefinition({resetValue: "a"}),
				executor,
				undefined,
			);
		const parameter = getParameter(genericNamespace, "g1");
		const revision = () => parameter.getState().state.commitRevision;

		// pending changes do not commit
		parameter.getState().actions.setUiValue("b");
		expect(revision()).toBe(0);
		// an execution commits, even if the committed (reset) value is unchanged
		await parameter.getState().actions.execute(true);
		expect(parameter.getState().state.commitValue).toBe("a");
		expect(revision()).toBe(1);
		// a value executed elsewhere commits
		parameter.getState().actions.setExecutedValue("c");
		expect(revision()).toBe(2);
		// executing the same value again is a commit as well
		parameter.getState().actions.setUiValue("a");
		await parameter.getState().actions.execute(true);
		expect(executor).toHaveBeenCalledTimes(2);
		expect(revision()).toBe(3);
	});

	it("setExecutedValue sets the executed value and commits it to the session", () => {
		const session = createFakeSession();
		store.getState().addSession(session, false);
		const parameter = getParameter(sessionId, "p1");

		expect(parameter.getState().actions.setExecutedValue("b")).toBe(true);

		const {state} = parameter.getState();
		expect(state.uiValue).toBe("b");
		expect(state.execValue).toBe("b");
		expect(state.commitValue).toBe("b");
		expect(session.parameters.p1.value).toBe("b");
	});

	it("setUiValue is a pending change relative to the commit value", () => {
		const session = createFakeSession();
		store.getState().addSession(session, false);
		const parameter = getParameter(sessionId, "p1");

		expect(parameter.getState().actions.setUiValue("c")).toBe(true);
		expect(parameter.getState().state.uiValue).toBe("c");
		expect(parameter.getState().state.commitValue).toBe("a");
		expect(parameter.getState().state.dirty).toBe(true);
		expect(session.parameters.p1.value).toBe("a");

		parameter.getState().actions.resetToCommitValue();
		expect(parameter.getState().state.uiValue).toBe("a");
		expect(parameter.getState().state.dirty).toBe(false);
	});

	it("executing sets the executed and the committed value", async () => {
		const executor = jest.fn(async () => undefined);
		store
			.getState()
			.addGeneric(
				genericNamespace,
				false,
				genericDefinition(),
				executor,
				undefined,
			);
		const parameter = getParameter(genericNamespace, "g1");

		parameter.getState().actions.setUiValue("b");
		expect(await parameter.getState().actions.execute(true)).toBe("b");

		const {state} = parameter.getState();
		expect(executor).toHaveBeenCalledTimes(1);
		expect(state.execValue).toBe("b");
		expect(state.commitValue).toBe("b");
		expect(state.dirty).toBe(false);
	});

	it("commits the reset value of the settings after an execution", async () => {
		const commit = jest.fn();
		store
			.getState()
			.addGeneric(
				genericNamespace,
				false,
				genericDefinition({resetValue: "reset"}),
				async () => {},
				undefined,
				commit,
			);
		const parameter = getParameter(genericNamespace, "g1");

		parameter.getState().actions.setUiValue("b");
		expect(await parameter.getState().actions.execute(true)).toBe("b");

		const {state} = parameter.getState();
		expect(state.execValue).toBe("b");
		expect(state.commitValue).toBe("reset");
		expect(state.uiValue).toBe("reset");
		expect(state.dirty).toBe(false);
		expect(commit).toHaveBeenCalledWith("g1", "reset");

		// a value executed elsewhere is reset as well
		expect(parameter.getState().actions.setExecutedValue("c")).toBe(true);
		expect(parameter.getState().state.execValue).toBe("c");
		expect(parameter.getState().state.commitValue).toBe("reset");
		expect(commit).toHaveBeenLastCalledWith("g1", "reset");
	});

	it("ignores invalid reset values", async () => {
		const definition = {
			...genericDefinition({resetValue: "invalid"}),
			isValid: (value: unknown) => value !== "invalid",
		} as IGenericParameterDefinition;
		store
			.getState()
			.addGeneric(
				genericNamespace,
				false,
				definition,
				async () => {},
				undefined,
			);
		const parameter = getParameter(genericNamespace, "g1");

		parameter.getState().actions.setUiValue("b");
		await parameter.getState().actions.execute(true);

		expect(parameter.getState().state.commitValue).toBe("b");
	});

	it("re-applies a changed reset value while the parameter is in its reset state", async () => {
		const commit = jest.fn();
		store
			.getState()
			.addGeneric(
				genericNamespace,
				false,
				genericDefinition(),
				async () => {},
				undefined,
				commit,
			);
		const parameter = getParameter(genericNamespace, "g1");

		// a model defines the reset value "r1" with the response of an execution
		parameter.getState().actions.setUiValue("x");
		await parameter.getState().actions.execute(true);
		parameter.getState().actions.setResetValue("r1");
		expect(parameter.getState().state.commitValue).toBe("r1");

		// the next execution is reset to "r1", then the model defines "r2":
		// the parameter is in its reset state and follows the new reset value
		parameter.getState().actions.setUiValue("y");
		await parameter.getState().actions.execute(true);
		expect(parameter.getState().state.commitValue).toBe("r1");
		parameter.getState().actions.setResetValue("r2");
		expect(parameter.getState().state.commitValue).toBe("r2");
		expect(parameter.getState().state.uiValue).toBe("r2");
		expect(parameter.getState().state.execValue).toBe("y");
		expect(commit).toHaveBeenLastCalledWith("g1", "r2");

		// a pending change is not overwritten by a changed reset value
		parameter.getState().actions.setUiValue("z");
		parameter.getState().actions.setResetValue("r3");
		expect(parameter.getState().state.uiValue).toBe("z");
		expect(parameter.getState().state.commitValue).toBe("r3");

		// without a reset value, the parameter in its reset state is committed
		// to the executed value again
		parameter.getState().actions.resetToCommitValue();
		parameter.getState().actions.setResetValue(undefined);
		expect(parameter.getState().state.commitValue).toBe("y");
		expect(parameter.getState().state.uiValue).toBe("y");
		expect(commit).toHaveBeenLastCalledWith("g1", "y");
	});

	it("applies a reset value changed during an execution when the execution completes", async () => {
		const commit = jest.fn();
		let resolveExecution: () => void = () => undefined;
		const executor = jest.fn(
			() =>
				new Promise<undefined>((resolve) => {
					resolveExecution = () => resolve(undefined);
				}),
		);
		store
			.getState()
			.addGeneric(
				genericNamespace,
				false,
				genericDefinition(),
				executor,
				undefined,
				commit,
			);
		const parameter = getParameter(genericNamespace, "g1");
		parameter.getState().actions.setResetValue("r1");
		expect(parameter.getState().state.commitValue).toBe("r1");

		// execution of "b" in flight, the model removes the reset value
		parameter.getState().actions.setUiValue("b");
		const execution = parameter.getState().actions.execute(true);
		await Promise.resolve();
		parameter.getState().actions.setResetValue(undefined);
		// nothing is committed while the execution is in flight
		expect(parameter.getState().state.commitValue).toBe("r1");
		expect(commit).toHaveBeenLastCalledWith("g1", "r1");

		resolveExecution();
		await execution;
		// the execution completes without a reset value: "b" is committed
		expect(parameter.getState().state.execValue).toBe("b");
		expect(parameter.getState().state.commitValue).toBe("b");
		expect(parameter.getState().state.uiValue).toBe("b");
		expect(commit).toHaveBeenCalledTimes(1);
	});

	it("commits the reset value initially and applies a registered override", () => {
		const commit = jest.fn();
		store
			.getState()
			.addGeneric(
				genericNamespace,
				false,
				genericDefinition({resetValue: "reset"}),
				async () => {},
				undefined,
				commit,
			);
		const parameter = getParameter(genericNamespace, "g1");
		// the initial computation counts as an execution
		expect(parameter.getState().state.execValue).toBe("a");
		expect(parameter.getState().state.commitValue).toBe("reset");
		expect(parameter.getState().state.uiValue).toBe("reset");
		expect(commit).toHaveBeenCalledWith("g1", "reset");

		// an override registered while nothing was reset since the last
		// execution is applied right away
		parameter.getState().actions.setExecutedValue("b");
		expect(parameter.getState().state.commitValue).toBe("reset");
		store.getState().removeSession(genericNamespace);
		store
			.getState()
			.addGeneric(
				genericNamespace,
				false,
				genericDefinition(),
				async () => {},
				undefined,
				commit,
			);
		const plain = getParameter(genericNamespace, "g1");
		expect(plain.getState().state.commitValue).toBe("a");
		plain.getState().actions.setResetValue("override");
		expect(plain.getState().state.commitValue).toBe("override");
		expect(plain.getState().state.execValue).toBe("a");
		expect(plain.getState().state.commitRevision).toBe(1);
		expect(commit).toHaveBeenLastCalledWith("g1", "override");
	});

	it("prefers a registered reset value override over the settings", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
		store
			.getState()
			.addGeneric(
				genericNamespace,
				false,
				genericDefinition({resetValue: "reset"}),
				async () => {},
				undefined,
			);
		const parameter = getParameter(genericNamespace, "g1");

		parameter.getState().actions.setResetValue("override");
		parameter.getState().actions.setUiValue("b");
		await parameter.getState().actions.execute(true);
		expect(parameter.getState().state.commitValue).toBe("override");

		// a conflicting override wins, but is reported
		parameter.getState().actions.setResetValue("other");
		expect(parameter.getState().resetValueOverride).toBe("other");

		// removing the override falls back to the settings
		parameter.getState().actions.setResetValue(undefined);
		parameter.getState().actions.setUiValue("c");
		await parameter.getState().actions.execute(true);
		expect(parameter.getState().state.commitValue).toBe("reset");
		warn.mockRestore();
	});

	it("discarding a pending change after a reset does not execute", async () => {
		const executor = jest.fn(async () => undefined);
		store
			.getState()
			.addGeneric(
				genericNamespace,
				true,
				genericDefinition({resetValue: "reset"}),
				executor,
				undefined,
			);
		const parameter = getParameter(genericNamespace, "g1");

		// execute "b", the parameter is reset
		parameter.getState().actions.setUiValue("b");
		await parameter.getState().actions.execute(true);
		expect(executor).toHaveBeenCalledTimes(1);
		expect(parameter.getState().state.execValue).toBe("b");
		expect(parameter.getState().state.commitValue).toBe("reset");

		// pending change "d" (accept/reject mode), then discard it by
		// setting the ui value back to the commit value
		parameter.getState().actions.setUiValue("d");
		const pending = parameter.getState().actions.execute(false);
		expect(parameter.getState().state.dirty).toBe(true);
		parameter.getState().actions.setUiValue("reset");
		expect(await parameter.getState().actions.execute(true)).toBe("reset");
		await expect(pending).resolves.toBe("reset");

		expect(executor).toHaveBeenCalledTimes(1);
		expect(parameter.getState().state.execValue).toBe("b");
		expect(parameter.getState().state.commitValue).toBe("reset");
		expect(parameter.getState().state.uiValue).toBe("reset");
		expect(parameter.getState().state.dirty).toBe(false);
		// nothing was executed, nothing was committed
		expect(parameter.getState().state.commitRevision).toBe(1);
	});

	it("keeps the executed and committed values when the execution fails", async () => {
		const commit = jest.fn();
		store.getState().addGeneric(
			genericNamespace,
			false,
			genericDefinition({resetValue: "reset"}),
			async () => {
				throw new Error("execution failed");
			},
			undefined,
			commit,
		);
		const parameter = getParameter(genericNamespace, "g1");

		// initially committed to the reset value
		expect(parameter.getState().state.commitValue).toBe("reset");
		expect(commit).toHaveBeenCalledTimes(1);

		parameter.getState().actions.setUiValue("b");
		expect(await parameter.getState().actions.execute(true)).toBe("reset");

		const {state} = parameter.getState();
		expect(state.execValue).toBe("a");
		expect(state.commitValue).toBe("reset");
		expect(state.uiValue).toBe("reset");
		expect(state.dirty).toBe(false);
		expect(commit).toHaveBeenCalledTimes(1);
	});

	it("calls the commit callback of generic parameters for committed values", () => {
		const commit = jest.fn();
		store
			.getState()
			.addGeneric(
				genericNamespace,
				false,
				genericDefinition(),
				async () => {},
				undefined,
				commit,
			);
		const parameter = getParameter(genericNamespace, "g1");

		expect(parameter.getState().actions.setExecutedValue("c")).toBe(true);
		expect(commit).toHaveBeenCalledWith("g1", "c");
		expect(commit).toHaveBeenCalledTimes(1);

		parameter.getState().actions.setUiValue("d");
		expect(commit).toHaveBeenCalledTimes(1);
	});
});
