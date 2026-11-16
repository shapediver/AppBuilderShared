import {z} from "@AppBuilderLib/shared/lib/zod";

/** Reply when a question is already open. The open question stays. */
export const ASK_USER_QUESTION_ALREADY_OPEN = "A question is already open.";

/** Reply when the user dismissed the question, or the chat or page closed. */
export const ASK_USER_QUESTION_DISMISSED = "dismissed";

const nonBlankString = z
	.string()
	.trim()
	.min(1, {message: "Must not be empty."});

export const askUserQuestionItemSchema = z.strictObject({
	question: nonBlankString.describe("Prompt shown to the user."),
	options: z
		.array(nonBlankString)
		.min(2, {message: "Provide at least two options."})
		.refine((options) => new Set(options).size === options.length, {
			message: "Options must be distinct.",
		})
		.describe(
			"At least two distinct options. The user picks one or types a different answer.",
		),
});

export const askUserQuestionInputSchema = z.strictObject({
	questions: z
		.array(askUserQuestionItemSchema)
		.min(1, {message: "Provide at least one question."})
		.describe("Every question is answered before the tool returns."),
});

/** One question in an ask_user_question call. */
export type AskUserQuestionItem = z.infer<typeof askUserQuestionItemSchema>;

/** Tool input. This is the agent call, not agent configuration. */
export type AskUserQuestionInput = z.infer<typeof askUserQuestionInputSchema>;

/** One answer, in the same order as the questions. */
export type AskUserQuestionAnswer = {question: string; answer: string};

export type AskUserQuestionOutput =
	| {success: true; answers: AskUserQuestionAnswer[]}
	| {success: false; message: string};

/** Reply to a chat claim. `id` is passed back on completion. */
export type AskUserQuestionClaimResult =
	| {success: true; id: string; questions: AskUserQuestionItem[]}
	| {success: false; message: string};

/**
 * Completion the chat sends for its claimed question. `answers` follows the
 * question order. Omit `answers` to dismiss.
 */
export type AskUserQuestionCompleteData = {
	id: string;
	answers?: string[];
};
