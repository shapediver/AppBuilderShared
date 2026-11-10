/**
 * @jest-environment jsdom
 */

type Handler = (event: unknown) => void;

const handlers: Record<string, Handler[]> = {};

jest.mock("@shapediver/viewer.session", () => ({
	EVENTTYPE_TASK: {
		TASK_START: "task.start",
		TASK_END: "task.end",
		TASK_CANCEL: "task.cancel",
	},
	TASK_TYPE: {
		SESSION_CUSTOMIZATION: "session_customization",
		EXPORT_REQUEST: "export_request",
	},
	addListener: jest.fn((type: string, handler: Handler) => {
		(handlers[type] ??= []).push(handler);
		return `${type}#${handlers[type].length - 1}`;
	}),
	removeListener: jest.fn((token: string) => {
		const [type, index] = token.split("#");
		handlers[type][Number(index)] = () => {};
	}),
}));

const sessionParameters: Record<string, {value: unknown}> = {};
jest.mock(
	"@AppBuilderLib/entities/session/model/useShapeDiverStoreSession",
	() => ({
		useShapeDiverStoreSession: {
			getState: () => ({sessions: {s1: {parameters: sessionParameters}}}),
		},
	}),
);

jest.mock(
	"@AppBuilderLib/entities/viewport/lib/waitForAppBuilderViewport",
	() => ({
		waitForAppBuilderViewport: jest.fn(() => new Promise(() => {})),
	}),
);

jest.mock("@AppBuilderLib/entities/viewport/model/useViewportId", () => ({
	useViewportId: () => ({viewportId: "default"}),
}));

const mockRun = jest.fn();
jest.mock("../AppBuilderActionSlotRunner", () => ({
	AppBuilderActionSlotRunner: ({
		definition,
		registerTrigger,
	}: {
		definition: {type: string; props: {id: string}};
		registerTrigger: (trigger: () => void) => void;
	}) => {
		registerTrigger(() => mockRun(definition.props.id));
		return null;
	},
}));

import {
	beginComputationSpan,
	failComputationSpan,
	resetComputationSpansForTests,
} from "@AppBuilderLib/features/appbuilder/model/computationSpan";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import {render} from "@testing-library/react";
import type {
	IAppBuilderActionDefinition,
	IAppBuilderParameterControlActionSlots,
	IAppBuilderRootActionSlots,
} from "../../config/appbuilder";
import AppBuilderApplicationActionSlots, {
	AppBuilderParameterComputationSlots,
} from "../AppBuilderApplicationActionSlots";

const FAILED = "Session customization failed";
const SUPERSEDED = "The request was exceeded by another customization request";

/** An action whose `props.id` tells the test which slot ran. */
const action = (id: string) =>
	({type: "undo", props: {id}}) as unknown as IAppBuilderActionDefinition;

function emit(
	type: "task.start" | "task.end" | "task.cancel",
	id: string,
	extra: {status?: string; category?: string; sessionId?: string} = {},
) {
	for (const handler of handlers[type] ?? []) {
		handler({
			id,
			type: "session_customization",
			category: extra.category ?? "customize",
			status: extra.status,
			data: {sessionId: extra.sessionId ?? "s1"},
		});
	}
}

const ran = () => mockRun.mock.calls.map(([id]) => id);

function renderControl(
	parameterId: string,
	actionSlots: IAppBuilderParameterControlActionSlots,
) {
	return render(
		<AppBuilderParameterComputationSlots
			actionSlots={actionSlots}
			namespace="s1"
			sessionId="s1"
			parameterId={parameterId}
		/>,
	);
}

describe("useComputationSlotListeners", () => {
	beforeEach(() => {
		for (const key of Object.keys(handlers)) delete handlers[key];
		sessionParameters.p1 = {value: "1"};
		sessionParameters.p2 = {value: "1"};
		mockRun.mockReset();
		resetComputationSpansForTests();
	});

	afterEach(() => {
		const {processManagers, removeProcessManager} =
			useShapeDiverStoreProcessManager.getState();
		for (const id of Object.keys(processManagers)) removeProcessManager(id);
		resetComputationSpansForTests();
	});

	it("runs the root slots for every customization of the session", () => {
		const actionSlots: IAppBuilderRootActionSlots = {
			computationstart: {action: action("start")},
			computationend: {action: action("end")},
			computationerror: {action: action("error")},
		};
		render(
			<AppBuilderApplicationActionSlots
				actionSlots={actionSlots}
				namespace="s1"
			/>,
		);
		emit("task.start", "t1");
		emit("task.end", "t1");
		emit("task.cancel", "t2", {status: SUPERSEDED});
		emit("task.cancel", "t3", {status: FAILED});
		emit("task.end", "t4", {sessionId: "s2"});
		expect(ran()).toEqual(["start", "end", "error"]);
	});

	it("runs a parameter control's slots only for customizations that change its parameter", () => {
		const slots: IAppBuilderParameterControlActionSlots = {
			computationstart: {action: action("p1-start")},
			computationend: {action: action("p1-end")},
		};
		renderControl("p1", slots);
		renderControl("p2", {computationend: {action: action("p2-end")}});

		sessionParameters.p2.value = "2";
		emit("task.start", "t1");
		emit("task.end", "t1");
		expect(ran()).toEqual(["p2-end"]);

		mockRun.mockReset();
		sessionParameters.p1.value = "2";
		sessionParameters.p2.value = "3";
		emit("task.start", "t2");
		emit("task.end", "t2");
		expect(ran()).toEqual(["p1-start", "p1-end", "p2-end"]);
	});

	it("runs computationend of a control that has no computationstart slot", () => {
		renderControl("p1", {computationend: {action: action("end")}});
		sessionParameters.p1.value = "2";
		emit("task.start", "t1");
		emit("task.end", "t1");
		expect(ran()).toEqual(["end"]);
	});

	it("runs computationerror only for a failed customization of the parameter", () => {
		renderControl("p1", {
			computationend: {action: action("end")},
			computationerror: {action: action("error")},
		});
		sessionParameters.p1.value = "2";
		emit("task.start", "t1");
		emit("task.start", "t2");
		emit("task.cancel", "t1", {status: SUPERSEDED});
		emit("task.cancel", "t2", {status: FAILED});
		expect(ran()).toEqual(["error"]);
	});

	it("runs computationend when the last process manager of the computation ends", async () => {
		const actionSlots: IAppBuilderRootActionSlots = {
			computationstart: {action: action("start")},
			computationend: {action: action("end")},
		};
		render(
			<AppBuilderApplicationActionSlots
				actionSlots={actionSlots}
				namespace="s1"
			/>,
		);
		const store = useShapeDiverStoreProcessManager.getState();
		const first = store.createProcessManager("s1");
		let resolveFirst: () => void;
		const firstPromise = new Promise<void>((resolve) => {
			resolveFirst = resolve;
		});
		store.addProcess(first, {
			name: "Session Process",
			promise: firstPromise,
		});
		beginComputationSpan("s1", first);
		expect(ran()).toEqual(["start"]);

		emit("task.start", "t1");
		emit("task.end", "t1");
		expect(ran()).toEqual(["start"]);

		const second = useShapeDiverStoreProcessManager
			.getState()
			.createProcessManager("s1");
		let resolveSecond: () => void;
		const secondPromise = new Promise<void>((resolve) => {
			resolveSecond = resolve;
		});
		useShapeDiverStoreProcessManager.getState().addProcess(second, {
			name: "Instance Process",
			promise: secondPromise,
		});

		resolveFirst!();
		await firstPromise;
		expect(ran()).toEqual(["start"]);

		resolveSecond!();
		await secondPromise;
		expect(ran()).toEqual(["start", "end"]);
	});

	it("runs a parameter's computationend after the span closes", async () => {
		renderControl("p1", {
			computationstart: {action: action("start")},
			computationend: {action: action("end")},
		});
		sessionParameters.p1.value = "2";
		const store = useShapeDiverStoreProcessManager.getState();
		const id = store.createProcessManager("s1");
		let resolveProcess: () => void;
		const promise = new Promise<void>((resolve) => {
			resolveProcess = resolve;
		});
		store.addProcess(id, {name: "Session Process", promise});
		beginComputationSpan("s1", id);
		expect(ran()).toEqual(["start"]);

		emit("task.start", "t1");
		emit("task.end", "t1");
		expect(ran()).toEqual(["start"]);

		resolveProcess!();
		await promise;
		expect(ran()).toEqual(["start", "end"]);
	});

	it("does not run a parameter's slots for a span that did not change it", async () => {
		renderControl("p1", {
			computationstart: {action: action("start")},
			computationend: {action: action("end")},
		});
		const store = useShapeDiverStoreProcessManager.getState();
		const id = store.createProcessManager("s1");
		let resolveProcess: () => void;
		const promise = new Promise<void>((resolve) => {
			resolveProcess = resolve;
		});
		store.addProcess(id, {name: "Session Process", promise});
		beginComputationSpan("s1", id);
		emit("task.start", "t1");
		emit("task.end", "t1");
		resolveProcess!();
		await promise;
		expect(ran()).toEqual([]);
	});

	it("does not run computationend when the customize fails", async () => {
		const actionSlots: IAppBuilderRootActionSlots = {
			computationstart: {action: action("start")},
			computationend: {action: action("end")},
		};
		render(
			<AppBuilderApplicationActionSlots
				actionSlots={actionSlots}
				namespace="s1"
			/>,
		);
		const store = useShapeDiverStoreProcessManager.getState();
		const id = store.createProcessManager("s1");
		let resolveProcess: () => void;
		const promise = new Promise<void>((resolve) => {
			resolveProcess = resolve;
		});
		store.addProcess(id, {name: "Session Process", promise});
		const generation = beginComputationSpan("s1", id);
		emit("task.end", "t1");
		failComputationSpan("s1", generation);
		resolveProcess!();
		await promise;
		expect(ran()).toEqual(["start"]);
	});

	it("runs computationend of a customize that joins after an older one failed", async () => {
		const actionSlots: IAppBuilderRootActionSlots = {
			computationstart: {action: action("start")},
			computationend: {action: action("end")},
		};
		render(
			<AppBuilderApplicationActionSlots
				actionSlots={actionSlots}
				namespace="s1"
			/>,
		);
		const store = useShapeDiverStoreProcessManager.getState();
		const older = store.createProcessManager("s1");
		let resolveOlder: () => void;
		const olderPromise = new Promise<void>((resolve) => {
			resolveOlder = resolve;
		});
		store.addProcess(older, {
			name: "Session Process",
			promise: olderPromise,
		});
		const olderGeneration = beginComputationSpan("s1", older);
		failComputationSpan("s1", olderGeneration);

		const newer = useShapeDiverStoreProcessManager
			.getState()
			.createProcessManager("s1");
		let resolveNewer: () => void;
		const newerPromise = new Promise<void>((resolve) => {
			resolveNewer = resolve;
		});
		useShapeDiverStoreProcessManager.getState().addProcess(newer, {
			name: "Session Process",
			promise: newerPromise,
		});
		beginComputationSpan("s1", newer);
		emit("task.end", "t2");
		expect(ran()).toEqual(["start"]);

		resolveOlder!();
		await olderPromise;
		expect(ran()).toEqual(["start"]);

		resolveNewer!();
		await newerPromise;
		expect(ran()).toEqual(["start", "end"]);
	});

	it("registers no listener without computation slots", () => {
		renderControl("p1", {click: {action: action("click")}});
		expect(handlers["task.start"]).toBeUndefined();
	});
});
