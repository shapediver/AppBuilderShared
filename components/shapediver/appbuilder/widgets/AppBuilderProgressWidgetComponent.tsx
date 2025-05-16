import {AppBuilderContainerContext} from "@AppBuilderShared/context/AppBuilderContext";
import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {IAppBuilderWidgetPropsProgress} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IProgress} from "@AppBuilderShared/types/store/shapediverStoreProcessManager";
import {
	Group,
	MantineStyleProp,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Progress,
	Stack,
	Text,
	useProps,
} from "@mantine/core";
import React, {
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

type StyleProps = PaperProps & {
	barwidth: string | number | undefined;
	numberwidth: string | number | undefined;
};

/**
 * Default style properties for the progress widget.
 * These properties are used to set the default width of the progress bar and the percentage text.
 */
const defaultStyleProps: Partial<StyleProps> = {
	barwidth: "80%",
	numberwidth: "15%",
};

type AppBuilderProgressWidgetThemePropsType = Partial<StyleProps>;

export function AppBuilderProgressWidgetThemeProps(
	props: AppBuilderProgressWidgetThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Function to create a progress bar and the percentage text.
 * If showPercentage is true, it will show the percentage text next to the progress bar.
 *
 * This function was separated from the main component to avoid code duplication.
 *
 * @param percentage
 * @param showPercentage
 * @param themeProps
 * @returns
 */
const createProgressBar = (
	percentage: number,
	showPercentage: boolean | undefined,
	themeProps: {
		barwidth: string | number | undefined;
		numberwidth: string | number | undefined;
	},
) => {
	if (showPercentage) {
		return (
			<Group justify="space-between" w="100%" wrap="nowrap">
				<Progress
					value={percentage}
					animated={percentage > 0 && percentage < 100}
					transitionDuration={200}
					w={themeProps.barwidth}
				/>
				<Group align="right">
					<Text w={themeProps.numberwidth}>
						{percentage.toFixed(0)}%
					</Text>
				</Group>
			</Group>
		);
	} else {
		return (
			<Progress
				value={percentage}
				animated={percentage > 0 && percentage < 100}
				transitionDuration={200}
			/>
		);
	}
};

export default function AppBuilderProgressWidgetComponent(
	props: IAppBuilderWidgetPropsProgress &
		AppBuilderProgressWidgetThemePropsType,
) {
	const {...rest} = props;
	/**
	 * Assign default values to the props.
	 * This is done to avoid undefined values in the component.
	 */
	const delayRemoval = props.delayRemoval ?? 1500;
	const showOnComplete = props.showOnComplete ?? false;
	const showMessages = props.showMessages ?? false;
	const showPercentage = props.showPercentage ?? true;

	const [progress, setProgress] = useState<{
		[key: string]: {
			percentage: number;
			messages: string[];
		};
	}>({});

	const themeProps = useProps(
		"AppBuilderProgressWidgetComponent",
		defaultStyleProps,
		rest,
	);
	const context = useContext(AppBuilderContainerContext);

	const {processManagers} = useShapeDiverStoreProcessManager();

	// useRef to store the timeout id
	// this is used to remove the timeout when the another process manager is added
	const timeoutRef = useRef<number | undefined>(undefined);

	// useCallback to notify the progress change
	// we calculate the percentage and the messages
	// and set the progress state
	const notify = useCallback(
		(
			id: string,
			progress: {
				[key: string]: IProgress[];
			},
		) => {
			let percentage = 0;
			const messages: string[] = [];
			for (const key in progress) {
				const lastIndex = progress[key].length - 1;

				percentage += progress[key][lastIndex].percentage;

				if (progress[key][lastIndex].msg) {
					messages.push(progress[key][lastIndex].msg);
				} else {
					messages.push("Loading...");
				}
			}

			percentage /= Object.keys(progress).length;
			percentage *= 100;

			setProgress((prev) => {
				return {
					...prev,
					[id]: {
						percentage,
						messages,
					},
				};
			});
		},
		[],
	);

	useEffect(() => {
		const removeProgressChange: (() => void)[] = [];

		// add the progress change callback to all process managers
		Object.values(processManagers).forEach((processManager) => {
			removeProgressChange.push(
				processManager.notifyProgressChange((progress) => {
					notify(processManager.id, progress);
				}),
			);
		});

		// clear the timeout if it exists
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = undefined;
		}

		/**
		 * Remove the progress bars of process managers that are not in the store anymore.
		 * This is done to avoid showing progress bars for process managers that are not running anymore.
		 *
		 * We do this either delayed or directly, depending on the delayRemoval prop.
		 */
		if (delayRemoval) {
			// remove the progress after a delay
			timeoutRef.current = setTimeout(() => {
				setProgress((prev) => {
					const newProgress = {...prev};
					Object.keys(newProgress).forEach((key) => {
						if (!processManagers[key]) {
							delete newProgress[key];
						}
					});
					return newProgress;
				});
				clearTimeout(timeoutRef.current);
				timeoutRef.current = undefined;
			}, delayRemoval) as unknown as number;
		} else {
			// remove the process managers progresses that are not in the store anymore
			setProgress((prev) => {
				const newProgress = {...prev};
				Object.keys(newProgress).forEach((key) => {
					if (!processManagers[key]) {
						delete newProgress[key];
					}
				});
				return newProgress;
			});
		}

		return () => {
			removeProgressChange.forEach((remove) => remove());
		};
	}, [processManagers, notify]);

	const styleProps: MantineStyleProp = {};
	if (context.orientation === "horizontal") {
		styleProps.height = "100%";
	} else if (context.orientation === "vertical") {
		styleProps.overflowX = "auto";
	}

	const collectedElements = [];

	/**
	 * Iterate over the progress object and create a progress bar for each process manager.
	 * The progress bar shows the percentage and the messages if showMessages is true.
	 */
	for (const key in progress) {
		const {percentage, messages} = progress[key];

		collectedElements.push(
			<Stack key={key}>
				{createProgressBar(percentage, showPercentage, themeProps)}
				{showMessages && messages && messages.length > 0 && (
					<Stack>
						{messages.map((message, index) => (
							<Text key={`${key}-${index}`}>{message}</Text>
						))}
					</Stack>
				)}
			</Stack>,
		);
	}

	// if there are no process managers in the store and showOnComplete is true,
	// show a progress bar with 100% completion
	if (collectedElements.length === 0) {
		if (showOnComplete) {
			return (
				<Paper {...themeProps} style={styleProps}>
					<Stack>
						{createProgressBar(100, showPercentage, themeProps)}
					</Stack>
				</Paper>
			);
		} else {
			return null;
		}
	} else {
		return (
			<Paper {...themeProps} style={styleProps}>
				<Stack>{collectedElements}</Stack>
			</Paper>
		);
	}
}
