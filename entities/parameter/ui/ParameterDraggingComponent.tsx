import {useViewportId} from "@AppBuilderLib/entities/viewport";
import {useNotificationStore} from "@AppBuilderLib/features/notifications";
import {Logger} from "@AppBuilderLib/shared/lib";
import {Icon} from "@AppBuilderLib/shared/ui/icon";
import {TextWeighted} from "@AppBuilderLib/shared/ui/text";
import {Button, Group, Loader, Stack, Text, useProps} from "@mantine/core";
import {calculateCombinedDraggedNodes} from "@shapediver/viewer.features.interaction";
import {IInteractionEffect} from "@shapediver/viewer.features.interaction/dist/interfaces/utils/IInteractionEffectUtils";
import {
	DraggingParameterValue,
	IDraggingParameterProps,
	validateDraggingParameterSettings,
} from "@shapediver/viewer.session";
import {POST_PROCESSING_EFFECT_TYPE} from "@shapediver/viewer.shared.types";
import {BlendFunction, KernelSize} from "@shapediver/viewer.viewport";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "../config/propsParameter";
import type {ParameterDraggingComponentStyleProps as StyleProps} from "../config/theme/parameterDraggingComponentTheme";
import {useDragging} from "../model/interaction/useDragging";
import {useParameterComponentCommons} from "../model/useParameterComponentCommons";
import {useShapeDiverStoreInteractionRequestManagement} from "../model/useShapeDiverStoreInteractionRequestManagement";
import classes from "./ParameterInteractionComponent.module.css";
import ParameterLabelComponent from "./ParameterLabelComponent";
import ParameterWrapperComponent from "./ParameterWrapperComponent";

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

const defaultStyleProps: StyleProps = {
	draggingColor: {
		properties: {
			blendFunction: BlendFunction.ALPHA,
			blur: true,
			edgeStrength: 10,
			hiddenEdgeColor: "#0d44f0",
			kernelSize: KernelSize.LARGE,
			visibleEdgeColor: "#0d44f0",
		},
		type: POST_PROCESSING_EFFECT_TYPE.OUTLINE,
	} as IInteractionEffect,
	availableColor: {
		properties: {
			blendFunction: BlendFunction.ALPHA,
			blur: true,
			edgeStrength: 10,
			hiddenEdgeColor: "#ffffff",
			kernelSize: KernelSize.LARGE,
			pulseSpeed: 0.5,
			visibleEdgeColor: "#ffffff",
		},
		type: POST_PROCESSING_EFFECT_TYPE.OUTLINE,
	} as IInteractionEffect,
	hoverColor: {
		properties: {
			blendFunction: BlendFunction.ALPHA,
			blur: true,
			edgeStrength: 10,
			hiddenEdgeColor: "#ffffff",
			kernelSize: KernelSize.LARGE,
			visibleEdgeColor: "#ffffff",
		},
		type: POST_PROCESSING_EFFECT_TYPE.OUTLINE,
	} as IInteractionEffect,
};

/**
 * Functional component that creates a switch component for a dragging parameter.
 *
 * @returns
 */
export default function ParameterDraggingComponent(
	props: PropsParameter &
		Partial<PropsParameterWrapper> &
		Partial<IDraggingParameterProps>,
) {
	const {
		actions,
		definition,
		handleChange,
		setOnCancelCallback,
		onCancel,
		disabled,
		value,
		state,
		sessionDependencies,
	} = useParameterComponentCommons<string>(props);

	const {draggingColor, availableColor, hoverColor} = useProps(
		"ParameterDraggingComponent",
		defaultStyleProps,
		props,
	);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterDraggingComponent",
		defaultPropsParameterWrapper,
		props,
	);

	// get the interaction request management
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();

	// get the notification store
	const notifications = useNotificationStore();

	// settings validation
	const draggingProps = useMemo(() => {
		const result = validateDraggingParameterSettings(definition.settings);
		if (result.success) {
			const props = result.data.props as IDraggingParameterProps;
			if (!props.draggingColor) props.draggingColor = draggingColor;
			if (!props.availableColor) props.availableColor = availableColor;
			if (!props.hoverColor) props.hoverColor = hoverColor;
			return props;
		} else {
			notifications.error({
				title: "Invalid Parameter Settings",
				message: `Invalid settings for Dragging parameter "${definition.name}", see console for details.`,
			});
			Logger.warn(
				`Invalid settings for Dragging parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
			);
			return {
				draggingColor,
				availableColor,
				hoverColor,
			} as IDraggingParameterProps;
		}
	}, [definition.settings, draggingColor, availableColor]);

	// is the dragging active or not?
	const [draggingActive, setDraggingActive] = useState<boolean>(
		draggingProps.activeMode === "activeOnStart" ? true : false,
	);
	// state for the dirty flag
	const [dirty, setDirty] = useState<boolean>(false);
	// parsed execValue
	const [parsedExecValue, setParsedExecValue] = useState<
		DraggingParameterValue["objects"]
	>([]);
	const [parsedUiValue, setParsedUiValue] = useState<
		DraggingParameterValue["objects"]
	>(parseDraggedNodes(state.uiValue));
	// reference to manage the interaction request token
	const interactionRequestTokenRef = useRef<string | undefined>(undefined);

	// get the viewport ID
	const {viewportId} = useViewportId();

	const {draggedNodes, setDraggedNodes, restoreDraggedNodes} = useDragging(
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
		const parsed = parseDraggedNodes(state.execValue);
		if (
			JSON.stringify(parsed) !==
			JSON.stringify(lastConfirmedValueRef.current)
		) {
			setParsedExecValue(parsed);
			setDraggedNodes([]);
			lastConfirmedValueRef.current = [];
		}
	}, [JSON.stringify(definition)]);

	useEffect(() => {
		const parsed = parseDraggedNodes(state.uiValue);
		setParsedUiValue(parsed);
	}, [state.uiValue]);

	useEffect(() => {
		const parsed = parseDraggedNodes(state.execValue);
		setParsedExecValue(parsed);
		setDraggedNodes([]);
		lastConfirmedValueRef.current = [];
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
		lastConfirmedValueRef.current = structuredClone(draggedNodes);

		// if the value is already the same, do not change it
		if (value === JSON.stringify(parameterValue)) return;
		handleChange(JSON.stringify(parameterValue), 0);
	}, [parsedExecValue, draggedNodes, value]);

	/**
	 * Callback function to reset the dragged nodes.
	 * This function is called when the dragging is aborted by the user.
	 * It also ends the dragging process.
	 */
	const resetValue = useCallback(
		(resetValue?: DraggingParameterValue["objects"]) => {
			restoreDraggedNodes(
				structuredClone(resetValue),
				structuredClone(draggedNodes),
			);
			setDraggingActive(false);
			setDraggedNodes(resetValue ?? []);
			lastConfirmedValueRef.current = [...(resetValue ?? [])];
		},
		[draggedNodes],
	);

	const cancel = useCallback(() => {
		// reset the dragged nodes to the last confirmed value
		resetValue(lastConfirmedValueRef.current);
	}, [resetValue]);

	/**
	 * Effect to manage the interaction request for the dragging.
	 * It adds an interaction request when the dragging is active and removes it when the dragging is inactive.
	 * It also cleans up the interaction request when the component is unmounted or when the dragging state changes.
	 */
	useEffect(() => {
		actions.setDisableOtherParameters(draggingActive);

		if (draggingActive && !interactionRequestTokenRef.current) {
			const returnedToken = addInteractionRequest({
				type: "active",
				viewportId,
				disable: cancel,
			});
			interactionRequestTokenRef.current = returnedToken;
		} else if (!draggingActive && interactionRequestTokenRef.current) {
			removeInteractionRequest(interactionRequestTokenRef.current);
			interactionRequestTokenRef.current = undefined;
		}

		return () => {
			actions.setDisableOtherParameters(false);
			if (interactionRequestTokenRef.current) {
				removeInteractionRequest(interactionRequestTokenRef.current);
				interactionRequestTokenRef.current = undefined;
			}
		};
	}, [draggingActive, cancel]);

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
					<TextWeighted
						size="sm"
						fontWeight="medium"
						ta="left"
						className={classes.interactionText}
					>
						{draggingProps.prompt?.activeTitle ??
							`Currently dragged objects: ${lastConfirmedValueRef.current.length}`}
					</TextWeighted>
					<Text
						size="sm"
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
					onClick={changeValue}
				>
					<Text>Confirm</Text>
				</Button>
				<Button fullWidth={true} variant={"light"} onClick={cancel}>
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
			rightSection={<Icon iconType={"tabler:hand-finger"} />}
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
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && draggingActive ? contentActive : contentInactive}
		</ParameterWrapperComponent>
	);
}
