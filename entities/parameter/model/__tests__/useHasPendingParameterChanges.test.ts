/**
 * @jest-environment jsdom
 */
import type {ISessionApi} from "@shapediver/viewer.session";
import {act, renderHook} from "@testing-library/react";
import {parameterChangeScheduler} from "../parameterChangeScheduler";
import {useHasPendingParameterChanges} from "../useHasPendingParameterChanges";
import {useShapeDiverStoreParameters} from "../useShapeDiverStoreParameters";

describe("useHasPendingParameterChanges", () => {
	const store = useShapeDiverStoreParameters;
	const sessionId = "session-pending-changes";

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

	const schedule = (namespace: string) =>
		parameterChangeScheduler.schedule({
			namespace,
			parameterId: "p1",
			value: "b",
			timeout: 10000,
		});

	beforeEach(() => {
		store.getState().addSession(createFakeSession(), false);
	});

	afterEach(() => {
		parameterChangeScheduler.reset();
		store.getState().removeSession(sessionId);
	});

	it("waits for a change of a parameter component waiting to be sent", () => {
		const {result, unmount} = renderHook(() =>
			useHasPendingParameterChanges(sessionId),
		);
		expect(result.current).toBe(false);

		act(() => schedule(sessionId));
		expect(result.current).toBe(true);

		act(() => parameterChangeScheduler.cancel(sessionId, "p1"));
		expect(result.current).toBe(false);
		unmount();
	});

	it("does not wait for a change of another session", () => {
		const {result, unmount} = renderHook(() =>
			useHasPendingParameterChanges(sessionId),
		);
		act(() => schedule("other-session"));
		expect(result.current).toBe(false);
		unmount();
	});

	it("ignores the changes waiting to be sent if requested", () => {
		const {result, unmount} = renderHook(() =>
			useHasPendingParameterChanges(sessionId, false),
		);
		act(() => schedule(sessionId));
		expect(result.current).toBe(false);
		unmount();
	});
});
