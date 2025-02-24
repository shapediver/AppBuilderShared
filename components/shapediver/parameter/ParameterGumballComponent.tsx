import {Button, Group, Loader, Stack, Text} from "@mantine/core";
import React, {useCallback, useEffect, useState} from "react";
import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import {
	GumballParameterValue,
	IGumballParameterProps,
} from "@shapediver/viewer.session";
import classes from "./ParameterInteractionComponent.module.css";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useGumball} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/gumball/useGumball";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import Icon from "@AppBuilderShared/components/ui/Icon";

/**
 * Parse the value of a gumball parameter and extract the transformed node names.
 * @param value
 * @returns
 */
const parseTransformation = (
	value?: string,
): {name: string; transformation: number[]}[] => {
	if (!value) return [];
	try {
		const parsed: {
			names: string[];
			transformations: number[][];
		} = JSON.parse(value);

		return parsed.names.map((name, i) => ({
			name,
			transformation: parsed.transformations[i],
		}));
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		return [];
	}
};

/**
 * Functional component that creates a switch component for a gumball parameter.
 *
 * @returns
 */
export default function ParameterGumballComponent(props: PropsParameter) {
	const {
		definition,
		handleChange,
		setOnCancelCallback,
		onCancel,
		disabled,
		value,
		state,
		sessionDependencies,
	} = useParameterComponentCommons<string>(props);

	const gumballProps = definition.settings?.props as IGumballParameterProps;

	// state for the gumball application
	const [gumballActive, setGumballActive] = useState<boolean>(false);
	// store the last confirmed value in a state to reset the transformation
	const [lastConfirmedValue, setLastConfirmedValue] = useState<
		{
			name: string;
			transformation: number[];
			localTransformations?: number[];
		}[]
	>([]);
	// store the parsed exec value in a state to react to changes
	const [parsedExecValue, setParsedExecValue] = useState<
		{
			name: string;
			transformation: number[];
			localTransformations?: number[];
		}[]
	>([]);

	const {viewportId} = useViewportId();

	// get the transformed nodes and the selected nods
	const {
		transformedNodeNames,
		setSelectedNodeNames,
		restoreTransformedNodeNames,
		handlers,
	} = useGumball(
		sessionDependencies,
		viewportId,
		gumballProps,
		gumballActive,
		parseTransformation(value),
	);

	// react to changes of the execValue and reset the last confirmed value
	useEffect(() => {
		const parsedExecValue = parseTransformation(state.execValue);
		setParsedExecValue(parsedExecValue);
		setLastConfirmedValue(parsedExecValue);
	}, [state.execValue]);
	
	// reset the transformed nodes when the definition changes
	useEffect(() => {
		const parsed = parseTransformation(state.execValue);
		if(JSON.stringify(parsed) !== JSON.stringify(parsedExecValue)) {
			setParsedExecValue(parsed);
			setLastConfirmedValue(parsed);
		}
	}, [definition]);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the gumball interaction is confirmed.
	 * It also ends the gumball interaction process and resets the selected nodes.
	 */
	const changeValue = useCallback(
		(
			transformedNodeNames: {
				name: string;
				transformation: number[];
				localTransformations?: number[];
			}[],
		) => {
			setGumballActive(false);
			const parameterValue: GumballParameterValue = {
				names: transformedNodeNames.map((node) => node.name),
				transformations: transformedNodeNames.map(
					(node) => node.transformation,
				),
			};

			// create a deep copy of the transformed node names
			const transformedNodeNamesCopy = JSON.parse(
				JSON.stringify(transformedNodeNames),
			);
			setLastConfirmedValue(transformedNodeNamesCopy);
			handleChange(JSON.stringify(parameterValue), 0);
			setSelectedNodeNames([]);
		},
		[],
	);

	/**
	 * Callback function to reset the transformed nodes.
	 * This function is called when the gumball interaction is aborted by the user.
	 * The transformed nodes are reset to the last confirmed value.
	 * It also ends the gumball.
	 */
	const resetTransformation = useCallback(() => {
		restoreTransformedNodeNames(lastConfirmedValue, transformedNodeNames);
		setGumballActive(false);
		setSelectedNodeNames([]);
	}, [lastConfirmedValue, transformedNodeNames, restoreTransformedNodeNames]);

	// extend the onCancel callback to reset the transformed nodes.
	const _onCancelCallback = useCallback(() => {
		restoreTransformedNodeNames(parsedExecValue, transformedNodeNames);
		setGumballActive(false);
		setSelectedNodeNames([]);
		setLastConfirmedValue(parsedExecValue);
	}, [parsedExecValue, transformedNodeNames]);

	useEffect(() => {
		setOnCancelCallback(() => _onCancelCallback);
	}, [_onCancelCallback]);

	/**
	 * The content of the parameter when it is active.
	 *
	 * It contains a button to confirm the gumball interaction and a button to cancel the interaction.
	 *
	 * The confirm button sets the current parameter value to the transformed nodes.
	 * The cancel button resets the transformed nodes to the last value.
	 *
	 */
	const contentActive = (
		<Stack>
			<Button
				justify="space-between"
				fullWidth
				disabled={disabled}
				className={classes.interactionButton}
				rightSection={<Loader size="sm" type="dots" />}
				onClick={resetTransformation}
			>
				<Stack>
					<Text
						size="sm"
						fw={500}
						ta="left"
						className={classes.interactionText}
					>
						{gumballProps.prompt?.activeTitle ??
							`Currently transformed: ${transformedNodeNames.length}`}
					</Text>
					<Text
						size="sm"
						fw={400}
						fs="italic"
						ta="left"
						className={classes.interactionText}
					>
						{gumballProps.prompt?.activeText ??
							"Select objects to transform"}
					</Text>
				</Stack>
			</Button>

			<Group justify="space-between" w="100%" wrap="nowrap">
				<Button
					disabled={transformedNodeNames.length === 0}
					fullWidth={true}
					variant="filled"
					onClick={() => changeValue(transformedNodeNames)}
				>
					<Text>Confirm</Text>
				</Button>
				<Button
					fullWidth={true}
					variant={"light"}
					onClick={resetTransformation}
				>
					<Text>Cancel</Text>
				</Button>
			</Group>
		</Stack>
	);

	/**
	 * The content of the parameter when it is inactive.
	 *
	 * It contains a button to start the gumball.
	 * Within the button, the number of transformed nodes is displayed.
	 */
	const contentInactive = (
		<Button
			justify="space-between"
			fullWidth={true}
			disabled={disabled}
			className={classes.interactionButton}
			rightSection={<Icon type={IconTypeEnum.IconHandFinger} />}
			variant={transformedNodeNames.length === 0 ? "light" : "filled"}
			onClick={() => setGumballActive(true)}
		>
			<Text size="sm" className={classes.interactionText}>
				{gumballProps.prompt?.inactiveTitle ?? "Start gumball"}
			</Text>
		</Button>
	);

	return (
		<>
			<>{handlers}</>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && gumballActive ? contentActive : contentInactive}
		</>
	);
}
