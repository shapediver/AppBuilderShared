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

	it("registers no listener without computation slots", () => {
		renderControl("p1", {click: {action: action("click")}});
		expect(handlers["task.start"]).toBeUndefined();
	});
});
