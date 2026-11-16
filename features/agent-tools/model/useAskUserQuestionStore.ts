import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {
	ASK_USER_QUESTION_DISMISSED,
	type AskUserQuestionItem,
	type AskUserQuestionOutput,
} from "../config/askUserQuestion";

/**
 * Who shows the open question. `page` renders the page dialog (WebMCP and
 * ToolsApi `execute`). `chat` means the agent chat claimed it and renders it.
 */
export type AskUserQuestionOwner = "page" | "chat";

export type OpenAskUserQuestion = {
	id: string;
	owner: AskUserQuestionOwner;
	questions: AskUserQuestionItem[];
};

export type AskUserQuestionClaim = {
	id: string;
	/** Resolves when the question is answered or dismissed. Never rejects. */
	result: Promise<AskUserQuestionOutput>;
};

export type AskUserQuestionStore = {
	/** The single open question, or `null`. */
	open: OpenAskUserQuestion | null;
	/** Opens a question. `null` when one is already open; that one stays. */
	claim: (
		questions: AskUserQuestionItem[],
		owner: AskUserQuestionOwner,
	) => AskUserQuestionClaim | null;
	/**
	 * Answers the open question `id`. One non-blank answer per question, in
	 * question order. Returns the tool result, or `null` when `id` is not open
	 * or the answers do not fit.
	 */
	answer: (id: string, answers: string[]) => AskUserQuestionOutput | null;
	/** Dismisses the open question `id`. `null` when `id` is not open. */
	dismiss: (id: string) => AskUserQuestionOutput | null;
};

const resolvers = new Map<string, (output: AskUserQuestionOutput) => void>();
let nextId = 0;

/**
 * The page keeps one open `ask_user_question` at a time. The handler waits on
 * the claim's `result`; the page dialog or the chat completes it.
 */
export const useAskUserQuestionStore = create<AskUserQuestionStore>()(
	devtools(
		(set, get) => {
			const finish = (
				id: string,
				output: AskUserQuestionOutput,
			): AskUserQuestionOutput | null => {
				if (get().open?.id !== id) {
					return null;
				}
				const resolve = resolvers.get(id);
				resolvers.delete(id);
				set({open: null}, false, "finish");
				resolve?.(output);
				return output;
			};

			return {
				open: null,
				claim: (questions, owner) => {
					if (get().open) {
						return null;
					}
					nextId += 1;
					const id = `ask-user-question-${nextId}`;
					const result = new Promise<AskUserQuestionOutput>(
						(resolve) => resolvers.set(id, resolve),
					);
					set({open: {id, owner, questions}}, false, "claim");
					return {id, result};
				},
				answer: (id, answers) => {
					const open = get().open;
					if (
						open?.id !== id ||
						!Array.isArray(answers) ||
						answers.length !== open.questions.length
					) {
						return null;
					}
					const trimmed = answers.map((answer) =>
						typeof answer === "string" ? answer.trim() : "",
					);
					if (trimmed.some((answer) => answer === "")) {
						return null;
					}
					return finish(id, {
						success: true,
						answers: open.questions.map((item, index) => ({
							question: item.question,
							answer: trimmed[index],
						})),
					});
				},
				dismiss: (id) =>
					finish(id, {
						success: false,
						message: ASK_USER_QUESTION_DISMISSED,
					}),
			};
		},
		{...devtoolsSettings, name: "askUserQuestion"},
	),
);
