/**
 * @jest-environment jsdom
 */
import type {ISessionApi} from "@shapediver/viewer.session";
import {act, renderHook} from "@testing-library/react";
import {hasDirtyParameters} from "../../lib/hasDirtyParameters";
import {useHasDirtyParameters} from "../useHasDirtyParameters";
import {useParameter} from "../useParameter";
import {useShapeDiverStoreParameters} from "../useShapeDiverStoreParameters";

describe("dirty parameter drafts", () => {
	const store = useShapeDiverStoreParameters;
	const sessionId = "session-dirty-draft";

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

	const parameter = () => {
		const found = store.getState().getParameter(sessionId, "p1");
		if (!found) throw new Error("parameter store not found");
		return found;
	};

	beforeEach(() => {
		store.getState().addSession(createFakeSession(), false);
	});

	afterEach(() => {
		store.getState().removeSession(sessionId);
	});

	it("reports a uiValue that differs from the commit value", () => {
		expect(hasDirtyParameters(sessionId)).toBe(false);

		parameter().getState().actions.setUiValue("b");

		expect(hasDirtyParameters(sessionId)).toBe(true);
		expect(parameter().getState().state.dirty).toBe(true);
	});

	it("clears when the draft matches the commit value again", () => {
		parameter().getState().actions.setUiValue("b");
		parameter().getState().actions.setUiValue("a");

		expect(hasDirtyParameters(sessionId)).toBe(false);
	});

	it("updates useHasDirtyParameters when the draft changes", () => {
		const {result} = renderHook(() => useHasDirtyParameters(sessionId));

		expect(result.current).toBe(false);

		act(() => {
			parameter().getState().actions.setUiValue("b");
		});

		expect(result.current).toBe(true);

		act(() => {
			parameter().getState().actions.setUiValue("a");
		});

		expect(result.current).toBe(false);
	});

	it("useParameter subscribers see setUiValue without an execution", () => {
		const {result, unmount} = renderHook(() =>
			useParameter({namespace: sessionId, parameterId: "p1"}),
		);

		expect(result.current.state.uiValue).toBe("a");

		act(() => {
			result.current.actions.setUiValue("typed");
		});

		expect(result.current.state.uiValue).toBe("typed");
		expect(result.current.state.commitValue).toBe("a");
		expect(result.current.state.dirty).toBe(true);
		unmount();
	});
});
