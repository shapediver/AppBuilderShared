import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {useDragging} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/dragging/useDragging";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderShared/store/useShapeDiverStoreInteractionRequestManagement";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {Button, Group, Loader, Stack, Text, useProps} from "@mantine/core";
import {calculateCombinedDraggedNodes} from "@shapediver/viewer.features.interaction";
import {
	DraggingParameterValue,
	IDraggingParameterProps,
	validateDraggingParameterSettings,
} from "@shapediver/viewer.session";
import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import classes from "./ParameterInteractionComponent.module.css";

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
export default function ParameterDraggingComponent(
	props: PropsParameter & Partial<PropsParameterWrapper>,
) {
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

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterDraggingComponent",
		defaultPropsParameterWrapper,
		props,
	);

	// get the interaction request management
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();

	// get the notification context
	const notifications = useContext(NotificationContext);

	// settings validation
	const draggingProps = useMemo(() => {
		const result = validateDraggingParameterSettings(definition.settings);
		if (result.success) {
			return result.data.props as IDraggingParameterProps;
		} else {
			notifications.error({
				title: "Invalid Parameter Settings",
				message: `Invalid settings for Dragging parameter "${definition.name}", see console for details.`,
			});
			console.warn(
				`Invalid settings for Dragging parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
			);
			return {};
		}
	}, [definition.settings]);

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
	// state to manage the interaction request token
	const [interactionRequestToken, setInteractionRequestToken] = useState<
		string | undefined
	>(undefined);

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
	}, [definition]);

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
		lastConfirmedValueRef.current = [...draggedNodes];

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
			restoreDraggedNodes(resetValue, draggedNodes);
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
		if (draggingActive && !interactionRequestToken) {
			const returnedToken = addInteractionRequest({
				type: "active",
				viewportId,
				disable: cancel,
			});
			setInteractionRequestToken(returnedToken);
		} else if (!draggingActive && interactionRequestToken) {
			removeInteractionRequest(interactionRequestToken);
			setInteractionRequestToken(undefined);
		}

		return () => {
			if (interactionRequestToken) {
				removeInteractionRequest(interactionRequestToken);
				setInteractionRequestToken(undefined);
			}
		};
	}, [draggingActive, interactionRequestToken, cancel]);

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
