import {
	Button,
	Checkbox,
	Group,
	Radio,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import {useState} from "react";
import {
	askUserQuestionAnswer,
	type AskUserQuestionItem,
} from "../config/askUserQuestion";

type Draft = {picked: string[]; text: string};

export type AskUserQuestionFieldsProps = {
	questions: AskUserQuestionItem[];
	/** Called with one non-empty answer per question, in question order. */
	onSubmit: (answers: string[]) => void;
	onDismiss: () => void;
};

/**
 * Form for an open `ask_user_question`: per question, the options (checkboxes
 * for `multiSelect`, else radios), a text field for another answer, and
 * Dismiss and Submit. Used by the page dialog and the agent chat.
 */
export default function AskUserQuestionFields(
	props: AskUserQuestionFieldsProps,
) {
	const {questions, onSubmit, onDismiss} = props;
	const [drafts, setDrafts] = useState<Draft[]>(() =>
		questions.map(() => ({picked: [], text: ""})),
	);
	const answers = questions.map((item, index) =>
		askUserQuestionAnswer(
			item,
			drafts[index]?.picked ?? [],
			drafts[index]?.text ?? "",
		),
	);
	const complete = answers.every((answer) => answer !== "");

	const update = (index: number, draft: Draft) =>
		setDrafts((current) =>
			current.map((item, i) => (i === index ? draft : item)),
		);

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				if (complete) {
					onSubmit(answers);
				}
			}}
		>
			<Stack gap="md">
				{questions.map((item, index) => {
					const draft = drafts[index] ?? {picked: [], text: ""};
					return (
						<Stack gap="xs" key={index}>
							{item.multiSelect ? (
								<Checkbox.Group
									label={item.question}
									value={draft.picked}
									onChange={(picked) =>
										update(index, {...draft, picked})
									}
								>
									<Stack gap="xs" pt="xs">
										{item.options.map((option) => (
											<Checkbox
												key={option}
												value={option}
												label={option}
											/>
										))}
									</Stack>
								</Checkbox.Group>
							) : (
								<Radio.Group
									label={item.question}
									value={draft.picked[0] ?? null}
									onChange={(option) =>
										update(index, {
											picked: [option],
											text: "",
										})
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
							)}
							<TextInput
								aria-label={`Other answer: ${item.question}`}
								placeholder="Other answer"
								value={draft.text}
								onChange={(event) =>
									update(index, {
										// Single select: typing replaces the option.
										picked: item.multiSelect
											? draft.picked
											: [],
										text: event.currentTarget.value,
									})
								}
							/>
						</Stack>
					);
				})}
				{questions.length > 1 && !complete ? (
					<Text c="dimmed" size="sm">
						Answer every question to submit.
					</Text>
				) : null}
				<Group justify="flex-end">
					<Button variant="default" onClick={onDismiss}>
						Dismiss
					</Button>
					{/* Filled, like the agent chat's Send button. */}
					<Button type="submit" variant="filled" disabled={!complete}>
						Submit
					</Button>
				</Group>
			</Stack>
		</form>
	);
}
