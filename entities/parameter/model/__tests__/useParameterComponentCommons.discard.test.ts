/**
 * @jest-environment jsdom
 */
import {ISessionApi} from "@shapediver/viewer.session";
import {act, renderHook, waitFor} from "@testing-library/react";
import {parameterChangeScheduler} from "../parameterChangeScheduler";
import {useParameterComponentCommons} from "../useParameterComponentCommons";
import {useShapeDiverStoreParameters} from "../useShapeDiverStoreParameters";

/**
 * Tests for a pending change of a parameter component (see
 * parameterChangeScheduler) which is discarded after the component was
 * mounted again (e.g. its container was closed and opened).
 */
describe("useParameterComponentCommons discarded pending change", () => {
	const store = useShapeDiverStoreParameters;
	const sessionId = "session-commons-discard";

	let customize: jest.Mock;
	let finishCustomization: () => void;
	let unmountComponents: (() => void)[] = [];

	const createParameter = (id: string, value: string) => ({
		id,
		name: `${id}-name`,
		type: "String",
		defval: value,
		value,
		isValid: () => true,
		stringify: (v: unknown) => String(v),
	});

	const createFakeSession = () => {
		const parameters = {
			p1: createParameter("p1", "a"),
			p2: createParameter("p2", "a"),
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

	const getParameter = (id: string) => {
		const parameter = store.getState().getParameter(sessionId, id);
		if (!parameter) throw new Error("parameter store not found");
		return parameter;
	};

	const renderComponent = () => {
		const rendered = renderHook(() =>
			useParameterComponentCommons<string>({
				namespace: sessionId,
				parameterId: "p1",
			}),
		);
		unmountComponents.push(rendered.unmount);
		return rendered;
	};

	beforeEach(() => {
		// the computations end once finishCustomization is called
		const gate = new Promise<void>((resolve) => {
			finishCustomization = resolve;
		});
		customize = jest.fn(() => gate.then(() => ({})));
		store.getState().addSession(createFakeSession(), false);
	});

	afterEach(() => {
		// (before the session is removed)
		unmountComponents.forEach((unmount) => unmount());
		unmountComponents = [];
		parameterChangeScheduler.reset();
		store.getState().removeChanges(sessionId);
		store.getState().removeSession(sessionId);
	});

	/**
	 * Schedule a change of p1, mount the component again, and discard the
	 * change by a restored state (without p1: nothing commits it again) while
	 * an execution of p2 runs. The execution ends after beforeEnd.
	 */
	const discardDuringExecution = async (
		beforeEnd: (
			component: ReturnType<typeof renderComponent>,
		) => void = () => {},
	) => {
		const first = renderComponent();
		act(() => first.result.current.handleChange("b", 10000));
		first.unmount();

		// mounted again: the change waiting to be sent is shown
		const second = renderComponent();
		expect(second.result.current.value).toBe("b");

		// an execution of another parameter of the session runs
		let execution: Promise<unknown> = Promise.resolve();
		act(() => {
			const {actions} = getParameter("p2").getState();
			actions.setUiValue("c");
			execution = actions.execute(true, true);
		});
		await waitFor(() => expect(second.result.current.executing).toBe(true));
		const revision = getParameter("p1").getState().state.commitRevision;

		let restore: Promise<void> = Promise.resolve();
		act(() => {
			restore = store
				.getState()
				.batchParameterValueUpdate(
					{[sessionId]: {p2: "d"}},
					true,
					true,
					{scheduledChanges: "discard"},
				);
		});
		expect(parameterChangeScheduler.isPending(sessionId, "p1")).toBe(false);
		// a commit now would replace the value being executed
		expect(getParameter("p1").getState().state.commitRevision).toBe(
			revision,
		);

		act(() => beforeEnd(second));
		await act(async () => {
			finishCustomization();
			await Promise.all([execution, restore]);
		});
		await waitFor(() =>
			expect(second.result.current.executing).toBe(false),
		);
		return {component: second, revision};
	};

	it("commits the value at the end of the execution", async () => {
		const {component, revision} = await discardDuringExecution();

		// components which applied the change to the scene restore it (e.g. a
		// gizmo following its committed value)
		const {state} = getParameter("p1").getState();
		expect(state.commitRevision).toBe(revision + 1);
		expect(state.commitValue).toBe("a");
		expect(component.result.current.value).toBe("a");
	});

	it("does not commit a parameter with a new change", async () => {
		const {component, revision} = await discardDuringExecution(
			(component) => component.result.current.handleChange("e", 10000),
		);

		expect(getParameter("p1").getState().state.commitRevision).toBe(
			revision,
		);
		expect(parameterChangeScheduler.isPending(sessionId, "p1")).toBe(true);
		expect(component.result.current.value).toBe("e");
	});
});
