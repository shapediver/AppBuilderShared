import {
	ASK_USER_QUESTION_ALREADY_OPEN,
	askUserQuestionInputSchema,
	type AskUserQuestionOutput,
} from "../../config/askUserQuestion";
import {runParsedTool} from "../../lib/runParsedTool";
import {useAskUserQuestionStore} from "../useAskUserQuestionStore";

/**
 * Opens the questions in the page dialog and waits for the answer.
 * Used by WebMCP and by ToolsApi `execute`. The chat claims through ToolsApi
 * instead, so it does not wait inside `execute`.
 * Invalid input or an open question returns `{ success: false, message }`.
 */
export async function handleAskUserQuestion(
	input: unknown,
): Promise<AskUserQuestionOutput> {
	return runParsedTool(
		askUserQuestionInputSchema,
		input ?? {},
		async ({questions}) => {
			const claim = useAskUserQuestionStore
				.getState()
				.claim(questions, "page");
			if (!claim) {
				return {
					success: false,
					message: ASK_USER_QUESTION_ALREADY_OPEN,
				};
			}
			return claim.result;
		},
		(message) => ({success: false, message}),
	);
}
