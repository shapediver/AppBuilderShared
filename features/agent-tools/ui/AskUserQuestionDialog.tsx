import {
	Button,
	Group,
	Modal,
	Radio,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import {useState} from "react";
import type {AskUserQuestionItem} from "../config/askUserQuestion";
import {useAskUserQuestionStore} from "../model/useAskUserQuestionStore";

type Draft = {option: string | null; text: string};

function answerOf(draft: Draft): string {
	return draft.text.trim() || draft.option || "";
}

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
	return (
		<AskUserQuestionModal
			key={open.id}
			id={open.id}
			questions={open.questions}
		/>
	);
}

function AskUserQuestionModal(props: {
	id: string;
	questions: AskUserQuestionItem[];
}) {
	const {id, questions} = props;
	const [drafts, setDrafts] = useState<Draft[]>(() =>
		questions.map(() => ({option: null, text: ""})),
	);
	const answers = drafts.map(answerOf);
	const complete = answers.every((answer) => answer !== "");

	const update = (index: number, draft: Draft) =>
		setDrafts((current) =>
			current.map((item, i) => (i === index ? draft : item)),
		);

	return (
		<Modal
			opened
			onClose={() => useAskUserQuestionStore.getState().dismiss(id)}
			title="Question"
			centered
		>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					if (complete) {
						useAskUserQuestionStore.getState().answer(id, answers);
					}
				}}
			>
				<Stack gap="lg">
					{questions.map((item, index) => (
						<Stack gap="xs" key={index}>
							<Radio.Group
								label={item.question}
								value={drafts[index].option}
								onChange={(option) =>
									update(index, {option, text: ""})
								}
							>
								<Stack gap="xs" pt="xs">
									{item.options.map((option) => (
										<Radio
											key={option}
											value={option}
											label={option}
										/>
									))}
								</Stack>
							</Radio.Group>
							<TextInput
								aria-label={`Other answer: ${item.question}`}
								placeholder="Other answer"
								value={drafts[index].text}
								onChange={(event) =>
									update(index, {
										option: null,
										text: event.currentTarget.value,
									})
								}
							/>
						</Stack>
					))}
					{questions.length > 1 && !complete ? (
						<Text c="dimmed" size="sm">
							Answer every question to submit.
						</Text>
					) : null}
					<Group justify="flex-end">
						<Button
							variant="default"
							onClick={() =>
								useAskUserQuestionStore.getState().dismiss(id)
							}
						>
							Dismiss
						</Button>
						<Button type="submit" disabled={!complete}>
							Submit
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
