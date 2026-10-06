import {TrackerContext} from "@AppBuilderLib/shared/lib/TrackerContext";
import {
	Button,
	Dialog,
	Group,
	Stack,
	Text,
	useProps,
	type MantineThemeComponent,
} from "@mantine/core";
import {useContext, useEffect, useState} from "react";
import classes from "./NetPromoterScore.module.css";
import type {NetPromoterScoreThemeDefaultProps} from "./NetPromoterScore.theme.types";
import {shouldHideNpsPrompt, writeNpsStorage} from "./npsSurveyStorage";

const NPS_DEFAULT_OPTIONS: NonNullable<
	NetPromoterScoreThemeDefaultProps["options"]
> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => ({
	title: String(score),
	value: score,
}));

/**
 * @docAttached
 * @category shared
 * @configPath themeOverrides.components.NetPromoterScore.defaultProps
 * @displayName NetPromoterScore
 */
export interface NetPromoterScoreStyleProps extends NetPromoterScoreThemeDefaultProps {}

const defaultStyleProps: NetPromoterScoreStyleProps = {
	storageKeyPart: "appbuilder",
	message:
		"How likely are you to recommend this App to other members of your organization?",
	options: NPS_DEFAULT_OPTIONS,
	captions: {
		start: "0 \u2013 Not at all likely",
		end: "10 \u2013 Extremely likely",
	},
	openDelay: 5,
	answeredScheduleDays: 30,
	dismissedScheduleDays: 1,
	dialogProps: {
		size: 640,
		position: {bottom: 20, left: 0, right: 0},
		withCloseButton: true,
	},
	stackProps: {gap: "sm"},
	optionButtonProps: {variant: "default"},
	captionTextProps: {size: "sm"},
	digitsGroupProps: {
		gap: "xs",
		justify: "space-between",
		wrap: "wrap",
	},
	captionsGroupProps: {justify: "space-between"},
};

/** Passed to `NetPromoterScoreThemeProps({ ... })` in useCustomTheme. */
export function NetPromoterScoreThemeProps(
	props: Partial<NetPromoterScoreStyleProps>,
): MantineThemeComponent {
	return {defaultProps: props};
}

/**
 * Net Promoter Score dialog. Hosts mount this component.
 * This repository does not mount it.
 */
export default function NetPromoterScore(
	props: Partial<NetPromoterScoreStyleProps>,
) {
	const {
		storageKeyPart,
		message,
		options = NPS_DEFAULT_OPTIONS,
		captions,
		openDelay,
		answeredScheduleDays,
		dismissedScheduleDays,
		dialogProps,
		stackProps,
		questionTextProps,
		digitsGroupProps,
		optionButtonProps,
		captionsGroupProps,
		captionTextProps,
	} = useProps("NetPromoterScore", defaultStyleProps, props);
	const storageKey = `${storageKeyPart}-nps`;
	const tracker = useContext(TrackerContext);
	const [opened, setOpened] = useState(false);

	const startCaption =
		captions?.start === undefined
			? defaultStyleProps.captions?.start
			: captions.start;
	const endCaption =
		captions?.end === undefined
			? defaultStyleProps.captions?.end
			: captions.end;

	useEffect(() => {
		if (!storageKeyPart) {
			setOpened(false);
			return;
		}
		const dayCounts = {answeredScheduleDays, dismissedScheduleDays};
		if (
			shouldHideNpsPrompt(storageKey, new Date(), localStorage, dayCounts)
		) {
			setOpened(false);
			return;
		}
		if (!openDelay || openDelay <= 0) {
			setOpened(true);
			return;
		}
		const timer = setTimeout(() => {
			if (
				!shouldHideNpsPrompt(
					storageKey,
					new Date(),
					localStorage,
					dayCounts,
				)
			) {
				setOpened(true);
			}
		}, openDelay * 1000);
		return () => clearTimeout(timer);
	}, [
		storageKey,
		storageKeyPart,
		openDelay,
		answeredScheduleDays,
		dismissedScheduleDays,
	]);

	const handleDismiss = () => {
		if (!storageKeyPart) {
			setOpened(false);
			return;
		}
		writeNpsStorage(storageKey, "dismissed");
		setOpened(false);
	};

	const handleSelect = (value: (typeof options)[number]["value"]) => {
		if (!storageKeyPart) {
			setOpened(false);
			return;
		}
		tracker.trackMetric("Net Promoter Score", "NetPromoterScore", value);
		writeNpsStorage(
			storageKey,
			"answered",
			new Date(),
			localStorage,
			JSON.stringify(value),
		);
		setOpened(false);
	};

	const showQuestion = message !== undefined && message !== "";
	const showStart = startCaption !== undefined && startCaption !== "";
	const showEnd = endCaption !== undefined && endCaption !== "";

	return (
		<Dialog
			{...dialogProps}
			classNames={{closeButton: classes.closeButton}}
			className={classes.root}
			opened={opened}
			onClose={handleDismiss}
		>
			<Stack {...stackProps}>
				{showQuestion ? (
					<Text {...questionTextProps} className={classes.question}>
						{message}
					</Text>
				) : null}
				<Group {...digitsGroupProps} className={classes.digits}>
					{options.map((option, index) => (
						<Button
							key={index}
							{...optionButtonProps}
							onClick={() => handleSelect(option.value)}
						>
							{option.title}
						</Button>
					))}
				</Group>
				{showStart || showEnd ? (
					<Group {...captionsGroupProps} className={classes.captions}>
						{showStart ? (
							<Text {...captionTextProps}>{startCaption}</Text>
						) : (
							<span />
						)}
						{showEnd ? (
							<Text {...captionTextProps}>{endCaption}</Text>
						) : (
							<span />
						)}
					</Group>
				) : null}
			</Stack>
		</Dialog>
	);
}
