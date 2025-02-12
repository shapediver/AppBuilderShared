import {Button, Group, Loader, Stack, Text} from "@mantine/core";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {
	IDraggingParameterProps,
	DraggingParameterValue,
} from "@shapediver/viewer.session";
import {calculateCombinedDraggedNodes} from "@shapediver/viewer.features.interaction";
import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useDragging} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/dragging/useDragging";
import classes from "./ParameterInteractionComponent.module.css";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";

/**
 * Parse the value of a dragging parameter and extract the dragged objects
 * @param value
 * @returns
 */
const parseDraggedNodes = (
	value?: string,
): DraggingParameterValue["objects"] => {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);

		return parsed.objects;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		return [];
	}
};

/**
 * Functional component that creates a switch component for a dragging parameter.
 *
 * @returns
 */
export default function ParameterDraggingComponent(props: PropsParameter) {
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
	const draggingProps = definition.settings?.props as IDraggingParameterProps;

	// is the dragging active or not?
	const [draggingActive, setDraggingActive] = useState<boolean>(false);
	// state for the dirty flag
	const [dirty, setDirty] = useState<boolean>(false);
	// parsed execValue
	const [parsedExecValue, setParsedExecValue] = useState<
		DraggingParameterValue["objects"]
	>([]);
	const [parsedUiValue, setParsedUiValue] = useState<
		DraggingParameterValue["objects"]
	>(parseDraggedNodes(state.uiValue));

	// get the viewport ID
	const {viewportId} = useViewportId();

	const {draggedNodes, setDraggedNodes, restoreDraggedNodes, handlers} =
		useDragging(
			sessionDependencies,
			viewportId,
			draggingProps,
			draggingActive,
			parsedUiValue,
		);

	// reference to the last confirmed value
	const lastConfirmedValueRef = useRef<DraggingParameterValue["objects"]>(
		parseDraggedNodes(value),
	);

	// reset the dragged nodes when the definition changes
	useEffect(() => {
		setDraggedNodes([]);
	}, [definition]);

	useEffect(() => {
		const parsed = parseDraggedNodes(state.uiValue);
		setParsedUiValue(parsed);
	}, [state.uiValue]);

	useEffect(() => {
		const parsed = parseDraggedNodes(state.execValue);
		setParsedExecValue(parsed);
		setDraggedNodes([]);
	}, [state.execValue]);

	useEffect(() => {
		const parsed = parseDraggedNodes(state.uiValue);

		// compare uiValue to draggedNodes
		if (
			parsed.length !== draggedNodes.length ||
			!parsed.every(
				(n, i) => JSON.stringify(n) === JSON.stringify(draggedNodes[i]),
			)
		) {
			setDirty(true);
		} else {
			setDirty(false);
		}
	}, [state.uiValue, draggedNodes]);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the dragging is confirmed (by the user, or automatically).
	 * It also ends the dragging process.
	 */
	const changeValue = useCallback(() => {
		setDraggingActive(false);
		const objects = calculateCombinedDraggedNodes(
			parsedExecValue,
			draggedNodes,
		);
		const parameterValue: DraggingParameterValue = {objects: objects};
		lastConfirmedValueRef.current = [...draggedNodes];
		handleChange(JSON.stringify(parameterValue), 0);
	}, [parsedExecValue, draggedNodes]);

	/**
	 * Callback function to reset the dragged nodes.
	 * This function is called when the dragging is aborted by the user.
	 * It also ends the dragging process.
	 */
	const resetValue = useCallback(
		(resetValue?: DraggingParameterValue["objects"]) => {
			restoreDraggedNodes(resetValue, draggedNodes);
			setDraggingActive(false);
			setDraggedNodes(resetValue ?? []);
			lastConfirmedValueRef.current = [...(resetValue ?? [])];
		},
		[draggedNodes],
	);

	/**
	 * The content of the parameter when it is active.
	 *
	 * It contains a button to confirm the dragging and a button to cancel the dragging
	 * as well as the number of dragged nodes.
	 *
	 * The cancel button resets the dragging to the last value.
	 */
	const contentActive = (
		<Stack>
			<Button
				justify="space-between"
				fullWidth
				disabled={disabled}
				className={classes.interactionButton}
				rightSection={<Loader size="sm" type="dots" />}
				onClick={() => resetValue(lastConfirmedValueRef.current)}
			>
				<Stack>
					<Text
						size="sm"
						fw={500}
						ta="left"
						className={classes.interactionText}
					>
						{draggingProps.prompt?.activeTitle ??
							`Currently dragged objects: ${lastConfirmedValueRef.current.length}`}
					</Text>
					<Text
						size="sm"
						fw={400}
						fs="italic"
						ta="left"
						className={classes.interactionText}
					>
						{draggingProps.prompt?.activeText ??
							"Drag objects in the scene to change their position."}
					</Text>
				</Stack>
			</Button>
			<Group justify="space-between" w="100%" wrap="nowrap">
				<Button
					fullWidth={true}
					disabled={!dirty}
					variant="filled"
					onClick={() => changeValue()}
				>
					<Text>Confirm</Text>
				</Button>
				<Button
					fullWidth={true}
					variant={"light"}
					onClick={() => resetValue(lastConfirmedValueRef.current)}
				>
					<Text>Cancel</Text>
				</Button>
			</Group>
		</Stack>
	);

	/**
	 * The content of the parameter when it is inactive.
	 *
	 * It contains a button to start the dragging.
	 * Within the button, the number of dragged nodes is displayed.
	 */
	const contentInactive = (
		<Button
			justify="space-between"
			fullWidth={true}
			disabled={disabled}
			className={classes.interactionButton}
			rightSection={<Icon type={IconTypeEnum.IconHandFinger} />}
			variant={parsedUiValue.length === 0 ? "light" : "filled"}
			onClick={() => setDraggingActive(true)}
		>
			<Text size="sm" className={classes.interactionText}>
				{draggingProps.prompt?.inactiveTitle ??
					`Start dragging (${parsedUiValue.length})`}
			</Text>
		</Button>
	);

	// extend the onCancel callback to reset the dragged nodes.
	const _onCancelCallback = useCallback(() => {
		resetValue();
	}, []);

	useEffect(() => {
		setOnCancelCallback(() => _onCancelCallback);
	}, [_onCancelCallback]);

	return (
		<>
			<>{handlers}</>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && draggingActive ? contentActive : contentInactive}
		</>
	);
}
