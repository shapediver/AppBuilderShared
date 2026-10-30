/**
 * @jest-environment jsdom
 */
import {ISessionApi} from "@shapediver/viewer.session";
import {
	IGenericParameterDefinition,
	IGenericParameterExecutor,
} from "../../config/shapediverStoreParameters";
import {parameterChangeScheduler} from "../parameterChangeScheduler";
import {useShapeDiverStoreParameters} from "../useShapeDiverStoreParameters";

/**
 * Tests for the pending changes of the parameter components (see
 * parameterChangeScheduler) in the requests of the parameter store: every
 * request takes them along, unless it restores a state replacing them.
 */
describe("useShapeDiverStoreParameters scheduled changes", () => {
	const store = useShapeDiverStoreParameters;
	const sessionId = "session-scheduled";
	const customNamespace = `${sessionId}_appbuilder`;

	let session: ISessionApi;
	let customize: jest.Mock;
	let customExecutor: jest.Mock;

	const createParameter = (id: string, value: string) => ({
		id,
		name: `${id}-name`,
		type: "String",
		defval: value,
		value,
		isValid: (v: unknown) => v !== "invalid",
		stringify: (v: unknown) => String(v),
	});

	const createFakeSession = () => {
		const parameters = {
			p1: createParameter("p1", "a"),
			p2: createParameter("p2", "a"),
			app: createParameter("app", "{}"),
		};
		return {
			id: sessionId,
			parameters,
			get parameterValues() {
				return Object.fromEntries(
					Object.values(parameters).map((p) => [p.id, p.value]),
				);
			},
			exports: {},
			outputs: {},
			customize,
		} as unknown as ISessionApi;
	};

	const customDefinition = {
		definition: {id: "c1", name: "c1", type: "String", defval: "x"},
	} as unknown as IGenericParameterDefinition;

	const getParameter = (namespace: string, id: string) => {
		const parameter = store.getState().getParameter(namespace, id);
		if (!parameter) throw new Error("parameter store not found");
		return parameter;
	};

	beforeEach(() => {
		customize = jest.fn(async () => ({}));
		session = createFakeSession();
		store.getState().addSession(session, false);
		// like the App Builder custom parameters: the values are sent to the
		// model as the value of a parameter of the session, with the history
		// and URL flags of this execution
		customExecutor = jest.fn<
			ReturnType<IGenericParameterExecutor>,
			Parameters<IGenericParameterExecutor>
		>(async (values, _namespace, skipHistory, _history, skipUrlUpdate) => {
			const {actions} = getParameter(sessionId, "app").getState();
			actions.setUiValue(JSON.stringify(values));
			await actions.execute(true, skipHistory, true, skipUrlUpdate);
		});
		store
			.getState()
			.addGeneric(
				customNamespace,
				false,
				customDefinition,
				customExecutor,
				sessionId,
			);
	});

	afterEach(() => {
		parameterChangeScheduler.reset();
		// changes left queued (e.g. waiting for their confirmation)
		store.getState().removeChanges(customNamespace);
		store.getState().removeChanges(sessionId);
		store.getState().removeSession(customNamespace);
		store.getState().removeSession(sessionId);
		jest.useRealTimers();
	});

	const scheduleCustomChange = (
		value: string,
		timeout: number,
		callbacks: {onSent?: () => void; onDiscard?: () => void} = {},
	) =>
		parameterChangeScheduler.schedule({
			namespace: customNamespace,
			parameterId: "c1",
			value,
			timeout,
			...callbacks,
		});

	it("sends the pending changes along with another request", async () => {
		const onSent = jest.fn();
		scheduleCustomChange("y", 2000, {onSent});

		await store
			.getState()
			.batchParameterValueUpdate({[sessionId]: {p1: "b"}});

		expect(customize).toHaveBeenCalledTimes(1);
		expect(session.parameters.p1.value).toBe("b");
		expect(JSON.parse(session.parameters.app.value as string)).toEqual({
			c1: "y",
		});
		expect(parameterChangeScheduler.size).toBe(0);
		expect(onSent).toHaveBeenCalledTimes(1);
	});

	it("sends a change with a timeout of 0 together with the pending changes", async () => {
		scheduleCustomChange("y", 2000);
		parameterChangeScheduler.schedule({
			namespace: sessionId,
			parameterId: "p1",
			value: "b",
			timeout: 0,
		});
		// the immediate change started the request already
		await waitUntil(() => customize.mock.calls.length > 0);
		await parameterChangeScheduler.flush();

		expect(customize).toHaveBeenCalledTimes(1);
		expect(session.parameters.p1.value).toBe("b");
		expect(JSON.parse(session.parameters.app.value as string)).toEqual({
			c1: "y",
		});
	});

	it("sends the pending changes once the countdown elapsed", async () => {
		jest.useFakeTimers();
		scheduleCustomChange("y", 500);
		await jest.advanceTimersByTimeAsync(499);
		expect(customExecutor).not.toHaveBeenCalled();
		await jest.advanceTimersByTimeAsync(1);

		expect(customExecutor).toHaveBeenCalledTimes(1);
		expect(customize).toHaveBeenCalledTimes(1);
		expect(
			getParameter(customNamespace, "c1").getState().state.execValue,
		).toBe("y");
	});

	it("discards the pending changes of the restored session only", async () => {
		const onDiscard = jest.fn();
		const onSent = jest.fn();
		scheduleCustomChange("y", 2000, {onDiscard, onSent});
		parameterChangeScheduler.schedule({
			namespace: "other-session",
			parameterId: "q",
			value: "q1",
			timeout: 2000,
		});

		await store.getState().restoreHistoryState({[sessionId]: {p1: "c"}});

		// the custom parameters of the restored session are dropped too
		expect(onDiscard).toHaveBeenCalledTimes(1);
		expect(onSent).not.toHaveBeenCalled();
		expect(customExecutor).not.toHaveBeenCalled();
		expect(customize).toHaveBeenCalledTimes(1);
		expect(session.parameters.p1.value).toBe("c");
		// the change of another session stays pending
		expect(parameterChangeScheduler.isPending("other-session", "q")).toBe(
			true,
		);
		expect(parameterChangeScheduler.size).toBe(1);
		parameterChangeScheduler.cancel("other-session", "q");
	});

	it("keeps the pending changes for a request of another execution", async () => {
		scheduleCustomChange("y", 2000);

		await store
			.getState()
			.batchParameterValueUpdate(
				{[sessionId]: {p1: "b"}},
				true,
				undefined,
				{
					scheduledChanges: "keep",
				},
			);

		expect(session.parameters.p1.value).toBe("b");
		expect(customExecutor).not.toHaveBeenCalled();
		expect(parameterChangeScheduler.isPending(customNamespace, "c1")).toBe(
			true,
		);
	});

	it("replaces a pending change by a value of the request", async () => {
		const onSend = jest.fn(async () => {});
		const onSent = jest.fn();
		const onDiscard = jest.fn();
		parameterChangeScheduler.schedule({
			namespace: sessionId,
			parameterId: "p1",
			value: "pending",
			timeout: 2000,
			onSend,
			onSent,
			onDiscard,
		});

		// the request names the parameter by its name
		await store
			.getState()
			.batchParameterValueUpdate({[sessionId]: {"p1-name": "b"}});

		expect(session.parameters.p1.value).toBe("b");
		// the delegates of the replaced value are not executed
		expect(onSend).not.toHaveBeenCalled();
		expect(onSent).not.toHaveBeenCalled();
		expect(onDiscard).toHaveBeenCalledTimes(1);
		expect(customize).toHaveBeenCalledTimes(1);
	});

	it("creates a history entry for pending changes taken along", async () => {
		const historyLength = () => store.getState().history.length;

		// a request skipping the history (e.g. an output action)
		const before = historyLength();
		await store
			.getState()
			.batchParameterValueUpdate({[sessionId]: {p1: "b"}}, true, true);
		expect(historyLength()).toBe(before);

		// the same request taking a change of the user along
		scheduleCustomChange("y", 2000);
		await store
			.getState()
			.batchParameterValueUpdate({[sessionId]: {p1: "c"}}, true, true);
		expect(historyLength()).toBe(before + 1);
	});

	it("creates a history entry for a pending change of the session taken along by its custom parameters", async () => {
		const historyLength = () => store.getState().history.length;
		const before = historyLength();
		// a pending change of the session
		parameterChangeScheduler.schedule({
			namespace: sessionId,
			parameterId: "p1",
			value: "b",
			timeout: 2000,
		});

		// a request skipping the history sets a custom parameter: its
		// execution takes the queued change of the session along
		await store
			.getState()
			.batchParameterValueUpdate(
				{[customNamespace]: {c1: "y"}},
				true,
				true,
			);

		expect(customize).toHaveBeenCalledTimes(1);
		expect(session.parameters.p1.value).toBe("b");
		expect(historyLength()).toBe(before + 1);
	});

	it("skips the history of a namespace without pending changes taken along", async () => {
		const historyLength = () => store.getState().history.length;
		const before = historyLength();
		// a pending change of another session (without parameters here)
		parameterChangeScheduler.schedule({
			namespace: "other-session",
			parameterId: "q",
			value: "q1",
			timeout: 2000,
		});
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

		await store
			.getState()
			.batchParameterValueUpdate({[sessionId]: {p1: "b"}}, true, true);

		expect(session.parameters.p1.value).toBe("b");
		expect(historyLength()).toBe(before);
		warn.mockRestore();
	});

	it("keeps a pending change when the request's value is invalid", async () => {
		const onDiscard = jest.fn();
		parameterChangeScheduler.schedule({
			namespace: sessionId,
			parameterId: "p1",
			value: "pending",
			timeout: 2000,
			onDiscard,
		});
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

		await store
			.getState()
			.batchParameterValueUpdate({[sessionId]: {p1: "invalid"}});

		expect(onDiscard).not.toHaveBeenCalled();
		expect(session.parameters.p1.value).toBe("pending");
		warn.mockRestore();
	});

	it("does not accept a change waiting for its confirmation", async () => {
		// p2 is in accept/reject mode, p1 is not
		store.getState().removeSession(customNamespace);
		store.getState().removeSession(sessionId);
		store
			.getState()
			.addSession(session, (definition) => definition.id === "p2");
		const p2 = getParameter(sessionId, "p2").getState().actions;
		p2.setUiValue("z");
		const p2Execution = p2.execute(false);

		parameterChangeScheduler.schedule({
			namespace: sessionId,
			parameterId: "p1",
			value: "b",
			timeout: 0,
		});
		// the execution of p1 ends although p2 waits (no hang)
		await waitUntil(
			() =>
				getParameter(sessionId, "p1").getState().state.commitValue ===
				"b",
		);

		expect(customize).toHaveBeenCalledTimes(1);
		expect(session.parameters.p1.value).toBe("b");
		// p2 still waits for its confirmation
		expect(session.parameters.p2.value).toBe("a");
		expect(store.getState().parameterChanges[sessionId]?.values).toEqual({
			p2: "z",
		});
		expect(getParameter(sessionId, "p1").getState().state.commitValue).toBe(
			"b",
		);

		// confirming it executes it
		await store.getState().parameterChanges[sessionId].accept();
		await p2Execution;
		expect(session.parameters.p2.value).toBe("z");
	});

	it("takes the pending changes along when a confirmed change is accepted", async () => {
		// p2 is in accept/reject mode, p1 has a pending change
		store.getState().removeSession(customNamespace);
		store.getState().removeSession(sessionId);
		store
			.getState()
			.addSession(session, (definition) => definition.id === "p2");
		const p2 = getParameter(sessionId, "p2").getState().actions;
		p2.setUiValue("z");
		const p2Execution = p2.execute(false);
		const onSent = jest.fn();
		parameterChangeScheduler.schedule({
			namespace: sessionId,
			parameterId: "p1",
			value: "b",
			timeout: 2000,
			onSent,
		});

		await store
			.getState()
			.batchParameterValueUpdate({}, undefined, undefined, {
				accept: {[sessionId]: ["p2"]},
			});
		await p2Execution;

		// one request
		expect(customize).toHaveBeenCalledTimes(1);
		expect(session.parameters.p1.value).toBe("b");
		expect(session.parameters.p2.value).toBe("z");
		expect(parameterChangeScheduler.size).toBe(0);
		expect(onSent).toHaveBeenCalledTimes(1);
		expect(store.getState().parameterChanges[sessionId]).toBeUndefined();
	});

	it("accepts only the given queued changes", async () => {
		// p1 and p2 are in accept/reject mode
		store.getState().removeSession(customNamespace);
		store.getState().removeSession(sessionId);
		store.getState().addSession(session, true);
		const {actions: p1} = getParameter(sessionId, "p1").getState();
		const {actions: p2} = getParameter(sessionId, "p2").getState();
		p1.setUiValue("b");
		void p1.execute(false);
		p2.setUiValue("z");
		const p2Execution = p2.execute(false);

		await store
			.getState()
			.batchParameterValueUpdate({}, undefined, undefined, {
				accept: {[sessionId]: ["p2"]},
			});
		await p2Execution;

		expect(customize).toHaveBeenCalledTimes(1);
		expect(session.parameters.p2.value).toBe("z");
		// p1 still waits for its confirmation
		expect(session.parameters.p1.value).toBe("a");
		expect(store.getState().parameterChanges[sessionId]?.values).toEqual({
			p1: "b",
		});
	});

	it("executes a change after a failed execution of other changes", async () => {
		// p2 is in accept/reject mode and waits for its confirmation
		store.getState().removeSession(customNamespace);
		store.getState().removeSession(sessionId);
		store
			.getState()
			.addSession(session, (definition) => definition.id === "p2");
		const p2 = getParameter(sessionId, "p2").getState().actions;
		p2.setUiValue("z");
		void p2.execute(false);
		const p1 = () => getParameter(sessionId, "p1").getState().state;

		// the execution of p1 fails
		customize.mockRejectedValueOnce(new Error("failed"));
		parameterChangeScheduler.schedule({
			namespace: sessionId,
			parameterId: "p1",
			value: "b",
			timeout: 0,
		});
		await waitUntil(() => customize.mock.calls.length === 1);
		await waitUntil(() => !p1().dirty && p1().uiValue === "a");

		// the next change of p1 is executed and committed
		parameterChangeScheduler.schedule({
			namespace: sessionId,
			parameterId: "p1",
			value: "c",
			timeout: 0,
		});
		await waitUntil(() => p1().commitValue === "c");
		expect(customize).toHaveBeenCalledTimes(2);
		expect(p1().uiValue).toBe("c");
	});

	it("ends an execution waiting for its confirmation when it is rejected", async () => {
		// p2 is in accept/reject mode and waits for its confirmation
		store.getState().removeSession(customNamespace);
		store.getState().removeSession(sessionId);
		store
			.getState()
			.addSession(session, (definition) => definition.id === "p2");
		const p2 = getParameter(sessionId, "p2").getState().actions;
		p2.setUiValue("z");
		void p2.execute(false);

		// a failed execution of p1 settles the changes of the session
		customize.mockRejectedValueOnce(new Error("failed"));
		parameterChangeScheduler.schedule({
			namespace: sessionId,
			parameterId: "p1",
			value: "b",
			timeout: 0,
		});
		await waitUntil(() => customize.mock.calls.length === 1);
		await waitUntil(
			() => !getParameter(sessionId, "p1").getState().state.dirty,
		);

		// p2 is changed again, then rejected: its execution ends
		p2.setUiValue("y");
		const execution = p2.execute(false);
		store.getState().parameterChanges[sessionId].reject();
		await expect(execution).resolves.toBe("a");
		expect(getParameter(sessionId, "p2").getState().state.dirty).toBe(
			false,
		);
	});

	describe("forceSameValue", () => {
		// a change of p1 is queued, the scheduled value reverts it
		const queueChange = () => {
			const {actions} = getParameter(sessionId, "p1").getState();
			actions.setUiValue("b");
			return actions.execute(false);
		};

		it("executes a value equal to the executed value if requested", async () => {
			const queued = queueChange();
			parameterChangeScheduler.schedule({
				namespace: sessionId,
				parameterId: "p1",
				value: "a",
				timeout: 500,
				forceSameValue: true,
			});

			await store.getState().batchParameterValueUpdate({});
			await queued;

			expect(customize).toHaveBeenCalledTimes(1);
			expect(session.parameters.p1.value).toBe("a");
		});

		it("drops a value equal to the executed value otherwise", async () => {
			const queued = queueChange();
			parameterChangeScheduler.schedule({
				namespace: sessionId,
				parameterId: "p1",
				value: "a",
				timeout: 500,
			});

			await store.getState().batchParameterValueUpdate({});
			await queued;

			expect(customize).not.toHaveBeenCalled();
		});
	});
});

/** Wait (on real timers) until the condition holds. */
async function waitUntil(condition: () => boolean, timeout = 2000) {
	const start = Date.now();
	while (!condition()) {
		if (Date.now() - start > timeout)
			throw new Error("condition not met in time");
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
}
