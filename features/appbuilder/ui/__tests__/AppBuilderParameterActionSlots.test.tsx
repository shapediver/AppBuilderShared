/**
 * @jest-environment jsdom
 */

type Handler = (event: unknown) => void;

const handlers: Record<string, Handler[]> = {};

jest.mock("@shapediver/viewer.session", () => ({
	EVENTTYPE: {
		TASK: {
			TASK_START: "task.start",
			TASK_END: "task.end",
			TASK_CANCEL: "task.cancel",
		},
	},
	addListener: jest.fn((type: string, handler: Handler) => {
		(handlers[type] ??= []).push(handler);
		return `${type}#${handlers[type].length}`;
	}),
	removeListener: jest.fn(),
}));

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
	markParametersInCustomization,
	resetParameterComputationEvents,
} from "@AppBuilderLib/entities/parameter/model/parameterComputationEvents";
import {render} from "@testing-library/react";
import type {
	IAppBuilderActionDefinition,
	IAppBuilderParameterControlActionSlots,
} from "../../config/appbuilder";
import AppBuilderParameterActionSlots from "../AppBuilderParameterActionSlots";

const FAILED = "Session customization failed";
const SUPERSEDED = "The request was exceeded by another customization request";

/** An action whose `props.id` tells the test which slot ran. */
const action = (id: string) =>
	({type: "undo", props: {id}}) as unknown as IAppBuilderActionDefinition;

function emit(
	type: "task.start" | "task.end" | "task.cancel",
	sessionId: string,
	extra: {status?: string; category?: string} = {},
) {
	for (const handler of handlers[type] ?? []) {
		handler({
			type: "session_customization",
			category: "customize",
			data: {sessionId},
			...extra,
		});
	}
}

const slots: IAppBuilderParameterControlActionSlots = {
	computationstart: {action: action("start")},
	computationend: [{action: action("end-1")}, {action: action("end-2")}],
	computationerror: {action: action("error")},
};

function renderControl(
	parameterId: string,
	overrides: Partial<
		React.ComponentProps<typeof AppBuilderParameterActionSlots>
	> = {},
) {
	return render(
		<AppBuilderParameterActionSlots
			actionSlots={slots}
			namespace="default"
			sessionId="default"
			parameterId={parameterId}
			{...overrides}
		/>,
	);
}

const ran = () => mockRun.mock.calls.map(([id]) => id);

describe("AppBuilderParameterActionSlots", () => {
	beforeEach(() => {
		resetParameterComputationEvents();
		for (const key of Object.keys(handlers)) delete handlers[key];
		mockRun.mockClear();
	});

	it("runs computationstart and computationend of the changed parameter", () => {
		renderControl("a");
		markParametersInCustomization("default", ["a"]);

		emit("task.start", "default");
		expect(ran()).toEqual(["start"]);

		emit("task.end", "default");
		expect(ran()).toEqual(["start", "end-1", "end-2"]);
	});

	it("does not run the slots of a parameter that was not part of the customization", () => {
		renderControl("a");
		renderControl("b");
		markParametersInCustomization("default", ["b"]);

		emit("task.start", "default");
		emit("task.end", "default");

		// only the control of b ran (the slots of a share the same ids)
		expect(ran()).toEqual(["start", "end-1", "end-2"]);
	});

	it("runs the slots of every parameter of one customization", () => {
		const a = renderControl("a", {
			actionSlots: {computationend: {action: action("a-end")}},
		});
		const b = renderControl("b", {
			actionSlots: {computationend: {action: action("b-end")}},
		});
		expect(a.container).toBeDefined();
		expect(b.container).toBeDefined();
		markParametersInCustomization("default", ["a", "b"]);

		emit("task.end", "default");
		expect(ran().sort()).toEqual(["a-end", "b-end"]);
	});

	it("runs every control of the same parameter", () => {
		renderControl("a", {
			actionSlots: {computationend: {action: action("first")}},
		});
		renderControl("a", {
			actionSlots: {computationend: {action: action("second")}},
		});
		markParametersInCustomization("default", ["a"]);

		emit("task.end", "default");
		expect(ran().sort()).toEqual(["first", "second"]);
	});

	it("ignores the customization of another session", () => {
		renderControl("a");
		markParametersInCustomization("other", ["a"]);

		emit("task.end", "other");
		expect(ran()).toEqual([]);
	});

	it("runs computationerror and not computationend when the customization fails", () => {
		renderControl("a");
		markParametersInCustomization("default", ["a"]);

		emit("task.cancel", "default", {status: FAILED});
		expect(ran()).toEqual(["error"]);
	});

	it("runs neither computationend nor computationerror when superseded", () => {
		renderControl("a");
		markParametersInCustomization("default", ["a"]);

		emit("task.cancel", "default", {status: SUPERSEDED});
		expect(ran()).toEqual([]);

		// the newer customization includes the parameter
		emit("task.end", "default");
		expect(ran()).toEqual(["end-1", "end-2"]);
	});

	it("ignores an instance computation", () => {
		renderControl("a");
		markParametersInCustomization("default", ["a"]);

		emit("task.end", "default", {category: "customize_parallel"});
		expect(ran()).toEqual([]);
	});

	it("does not run after unmount", () => {
		const {unmount} = renderControl("a");
		unmount();
		markParametersInCustomization("default", ["a"]);

		emit("task.end", "default");
		expect(ran()).toEqual([]);
	});

	it("uses the latest action of a changed slot", () => {
		const {rerender} = renderControl("a", {
			actionSlots: {computationend: {action: action("old")}},
		});
		rerender(
			<AppBuilderParameterActionSlots
				actionSlots={{computationend: {action: action("new")}}}
				namespace="default"
				sessionId="default"
				parameterId="a"
			/>,
		);
		markParametersInCustomization("default", ["a"]);

		emit("task.end", "default");
		expect(ran()).toEqual(["new"]);
	});
});
