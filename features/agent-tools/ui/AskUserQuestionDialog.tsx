import {Modal} from "@mantine/core";
import {useAskUserQuestionStore} from "../model/useAskUserQuestionStore";
import AskUserQuestionFields from "./AskUserQuestionFields";

/**
 * Page dialog for `ask_user_question` called through WebMCP or ToolsApi
 * `execute`. Shows nothing while the chat owns the open question.
 * Closing the dialog dismisses the question.
 */
export default function AskUserQuestionDialog() {
	const open = useAskUserQuestionStore((state) =>
		state.open?.owner === "page" ? state.open : null,
	);
	if (!open) {
		return null;
	}
	const dismiss = () => useAskUserQuestionStore.getState().dismiss(open.id);
	return (
		<Modal opened onClose={dismiss} title="Question" centered>
			<AskUserQuestionFields
				key={open.id}
				questions={open.questions}
				onSubmit={(answers) =>
					useAskUserQuestionStore.getState().answer(open.id, answers)
				}
				onDismiss={dismiss}
			/>
		</Modal>
	);
}
