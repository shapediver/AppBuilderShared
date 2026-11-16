/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import type {
	ICrossWindowApi,
	ICrossWindowPeerInfo,
} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";
import {ToolsApi} from "../api/toolsApi";
import {ToolsApiConnector} from "../api/toolsApiConnector";
import {
	ASK_USER_QUESTION_ALREADY_OPEN,
	ASK_USER_QUESTION_DISMISSED,
	askUserQuestionAnswer,
	askUserQuestionInputSchema,
} from "../config/askUserQuestion";
import {resolveToolset} from "../config/resolveToolset";
import type {IToolsApiHandlerMap} from "../config/toolsApiConnector";
import {handleAskUserQuestion} from "../model/handlers/askUserQuestion";
import {useAskUserQuestionStore} from "../model/useAskUserQuestionStore";

const questions = [
	{
		question: "Which edge should the opening sit on?",
		options: ["Left", "Right", "Top"],
	},
	{
		question: "How should the agent apply it?",
		options: ["This session only", "Save as the default"],
	},
];

function openQuestion() {
	const open = useAskUserQuestionStore.getState().open;
	if (!open) {
		throw new Error("No open question.");
	}
	return open;
}

function createMockCrossWindowApi(): ICrossWindowApi {
	const handlers = new Map<string, (data: unknown) => Promise<unknown>>();
	const peer: ICrossWindowPeerInfo = {origin: "test", name: "agent"};
	return {
		name: "app",
		peerName: "agent",
		peerIsReady: Promise.resolve(peer),
		send: async (type, data) => {
			const handler = handlers.get(type);
			if (!handler) {
				throw new Error(`No handler for ${type}`);
			}
			return handler(data) as never;
		},
		on: (type, handler) => {
			handlers.set(type, handler as (data: unknown) => Promise<unknown>);
			return {cancel: () => handlers.delete(type)};
		},
		once: async () => {
			throw new Error("once unused");
		},
		handshake: async () => peer,
		cancelHandshake: jest.fn(),
	};
}

function connect(peerWindow?: Window) {
	const mock = createMockCrossWindowApi();
	const execute = jest.fn(async (input: unknown) =>
		handleAskUserQuestion(input),
	);
	const connector = new ToolsApiConnector(
		resolveToolset(undefined),
		{ask_user_question: execute} as unknown as IToolsApiHandlerMap,
		mock,
		undefined,
		undefined,
		undefined,
		[],
		undefined,
		undefined,
		undefined,
		undefined,
		peerWindow,
	);
	return {connector, client: new ToolsApi(mock), execute};
}

beforeEach(() => {
	const open = useAskUserQuestionStore.getState().open;
	if (open) {
		useAskUserQuestionStore.getState().dismiss(open.id);
	}
});

describe("askUserQuestionInputSchema", () => {
	it("accepts questions with at least two distinct options", () => {
		expect(askUserQuestionInputSchema.safeParse({questions}).success).toBe(
			true,
		);
	});

	it.each([
		["an empty question list", {questions: []}],
		["a missing question list", {}],
		[
			"a blank prompt",
			{questions: [{question: "  ", options: ["a", "b"]}]},
		],
		["one option", {questions: [{question: "Q?", options: ["a"]}]}],
		[
			"duplicate options",
			{questions: [{question: "Q?", options: ["a", " a "]}]},
		],
		["a blank option", {questions: [{question: "Q?", options: ["a", ""]}]}],
	])("rejects %s", (_label, input) => {
		expect(askUserQuestionInputSchema.safeParse(input).success).toBe(false);
	});

	it("accepts multiSelect and rejects a non-boolean", () => {
		const item = {question: "Q?", options: ["a", "b"]};
		expect(
			askUserQuestionInputSchema.safeParse({
				questions: [{...item, multiSelect: true}],
			}).success,
		).toBe(true);
		expect(
			askUserQuestionInputSchema.safeParse({
				questions: [{...item, multiSelect: "yes"}],
			}).success,
		).toBe(false);
	});
});

describe("askUserQuestionAnswer", () => {
	const single = {question: "Q?", options: ["a", "b", "c"]};
	const multi = {...single, multiSelect: true};

	it("single select keeps the typed text, else the picked option", () => {
		expect(askUserQuestionAnswer(single, ["b"], "")).toBe("b");
		expect(askUserQuestionAnswer(single, ["b"], "  own ")).toBe("own");
		expect(askUserQuestionAnswer(single, [], " ")).toBe("");
	});

	it("multiSelect joins picked options in option order, then the text", () => {
		expect(askUserQuestionAnswer(multi, ["c", "a"], "")).toBe("a, c");
		expect(askUserQuestionAnswer(multi, ["b"], " own ")).toBe("b, own");
		expect(askUserQuestionAnswer(multi, [], "own")).toBe("own");
		expect(askUserQuestionAnswer(multi, [], "")).toBe("");
	});
});

describe("handleAskUserQuestion", () => {
	it("returns an error and shows nothing for invalid input", async () => {
		const result = await handleAskUserQuestion({questions: []});
		expect(result.success).toBe(false);
		expect(useAskUserQuestionStore.getState().open).toBeNull();
	});

	it("opens the page question and returns answers in input order", async () => {
		const pending = handleAskUserQuestion({questions});
		const open = openQuestion();
		expect(open.owner).toBe("page");
		expect(open.questions).toEqual(questions);
		useAskUserQuestionStore
			.getState()
			.answer(open.id, ["Right", "  Only on Mondays  "]);
		await expect(pending).resolves.toEqual({
			success: true,
			answers: [
				{question: questions[0].question, answer: "Right"},
				{question: questions[1].question, answer: "Only on Mondays"},
			],
		});
		expect(useAskUserQuestionStore.getState().open).toBeNull();
	});

	it("rejects a blank answer and keeps the question open", async () => {
		void handleAskUserQuestion({questions});
		const open = openQuestion();
		expect(
			useAskUserQuestionStore.getState().answer(open.id, ["Left", " "]),
		).toBeNull();
		expect(useAskUserQuestionStore.getState().open?.id).toBe(open.id);
	});

	it("returns already open for a second call and keeps the first question", async () => {
		void handleAskUserQuestion({questions});
		const first = openQuestion();
		await expect(
			handleAskUserQuestion({
				questions: [{question: "Other?", options: ["a", "b"]}],
			}),
		).resolves.toEqual({
			success: false,
			message: ASK_USER_QUESTION_ALREADY_OPEN,
		});
		expect(useAskUserQuestionStore.getState().open).toEqual(first);
	});

	it("returns dismissed when the question is dismissed", async () => {
		const pending = handleAskUserQuestion({questions});
		useAskUserQuestionStore.getState().dismiss(openQuestion().id);
		await expect(pending).resolves.toEqual({
			success: false,
			message: ASK_USER_QUESTION_DISMISSED,
		});
	});

	it("does not write parameter values", async () => {
		const batchParameterValueUpdate = jest.fn();
		useShapeDiverStoreParameters.setState({batchParameterValueUpdate});
		const pending = handleAskUserQuestion({questions});
		useAskUserQuestionStore
			.getState()
			.answer(openQuestion().id, ["Left", "This session only"]);
		await pending;
		expect(batchParameterValueUpdate).not.toHaveBeenCalled();
	});
});

describe("ToolsApi question claim", () => {
	it("claims without waiting and completes with the answers", async () => {
		const {connector, client, execute} = connect();
		const claim = await client.claimQuestion({questions});
		if (!claim.success) {
			throw new Error(claim.message);
		}
		expect(claim.questions).toEqual(questions);
		expect(openQuestion().owner).toBe("chat");
		expect(execute).not.toHaveBeenCalled();
		await expect(
			client.completeQuestion({
				id: claim.id,
				answers: ["Top", "Save as the default"],
			}),
		).resolves.toEqual({
			success: true,
			answers: [
				{question: questions[0].question, answer: "Top"},
				{
					question: questions[1].question,
					answer: "Save as the default",
				},
			],
		});
		expect(useAskUserQuestionStore.getState().open).toBeNull();
		connector.cancel();
	});

	it("returns already open for a second claim and keeps the first", async () => {
		const {connector, client} = connect();
		void handleAskUserQuestion({questions});
		const first = openQuestion();
		await expect(client.claimQuestion({questions})).resolves.toEqual({
			success: false,
			message: ASK_USER_QUESTION_ALREADY_OPEN,
		});
		expect(useAskUserQuestionStore.getState().open).toEqual(first);
		connector.cancel();
	});

	it("rejects invalid input without claiming", async () => {
		const {connector, client} = connect();
		const claim = await client.claimQuestion({questions: []});
		expect(claim.success).toBe(false);
		expect(useAskUserQuestionStore.getState().open).toBeNull();
		connector.cancel();
	});

	it("dismisses when the chat completes without answers", async () => {
		const {connector, client} = connect();
		const claim = await client.claimQuestion({questions});
		if (!claim.success) {
			throw new Error(claim.message);
		}
		await expect(client.completeQuestion({id: claim.id})).resolves.toEqual({
			success: false,
			message: ASK_USER_QUESTION_DISMISSED,
		});
		connector.cancel();
	});

	it("releases the claim when the chat sends blank answers", async () => {
		const {connector, client} = connect();
		const claim = await client.claimQuestion({questions});
		if (!claim.success) {
			throw new Error(claim.message);
		}
		const result = await client.completeQuestion({
			id: claim.id,
			answers: ["Left", " "],
		});
		expect(result.success).toBe(false);
		expect(useAskUserQuestionStore.getState().open).toBeNull();
		await expect(client.claimQuestion({questions})).resolves.toMatchObject({
			success: true,
		});
		connector.cancel();
	});

	it("releases the claim and tells the chat when the connector stops", async () => {
		const {connector, client} = connect();
		const closed = jest.fn();
		client.onQuestionClosed(closed);
		const claim = await client.claimQuestion({questions});
		if (!claim.success) {
			throw new Error(claim.message);
		}
		connector.cancel();
		await Promise.resolve();
		expect(useAskUserQuestionStore.getState().open).toBeNull();
		expect(closed).toHaveBeenCalledWith(claim.id);
	});

	it("releases the claim when the chat window closes", async () => {
		jest.useFakeTimers();
		try {
			const peer = {closed: false};
			const {connector, client} = connect(peer as unknown as Window);
			await client.claimQuestion({questions});
			peer.closed = true;
			jest.advanceTimersByTime(1000);
			expect(useAskUserQuestionStore.getState().open).toBeNull();
			connector.cancel();
		} finally {
			jest.useRealTimers();
		}
	});

	it("does not claim when ask_user_question is not enabled", async () => {
		const mock = createMockCrossWindowApi();
		const connector = new ToolsApiConnector(
			resolveToolset({
				id: "a",
				name: "A",
				message: "hi",
				useGenericToolDefaults: false,
				genericTools: [{name: "get_output"}],
			}),
			{} as IToolsApiHandlerMap,
			mock,
		);
		const client = new ToolsApi(mock);
		const claim = await client.claimQuestion({questions});
		expect(claim.success).toBe(false);
		expect(useAskUserQuestionStore.getState().open).toBeNull();
		connector.cancel();
	});
});
