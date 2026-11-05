import {SentValues} from "@AppBuilderLib/entities/parameter/lib/sentValues";
import {useInteractionOwnership} from "@AppBuilderLib/entities/parameter/model/interaction/useInteractionOwnership";
import {useAutomaticSceneUpdatePointerHold} from "@AppBuilderLib/entities/parameter/model/useAutomaticSceneUpdatePointerHold";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {
	createToolbarCheckboxItem,
	createToolbarCommand,
} from "@AppBuilderLib/features/appbuilder/model/createToolbarItems";
import {AppBuilderLabeledActionIcon} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import TextWeighted from "@AppBuilderLib/shared/ui/text/TextWeighted";
import {Button, Group, Loader, Stack, Text, useProps} from "@mantine/core";
import {
	calculateCombinedDraggedNodes,
	IInteractionEffect,
} from "@shapediver/viewer.features.interaction";
import {
	DraggingParameterValue,
	IDraggingParameterProps,
	validateDraggingParameterSettings,
} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "../config/propsParameter";
import type {ParameterDraggingComponentStyleProps as StyleProps} from "../config/theme/parameterDraggingComponentTheme";
import {resolveParameterInteractionButtonTheme} from "../config/theme/parameterInteractionButtonTheme";
import {resolveAutomaticSceneUpdate} from "../lib/automaticSceneUpdate";
import {consumeSentDrag, type SentDrag} from "../lib/sentDragCommit";
import {resolveInteractionPresentation} from "../model/interaction/resolveInteractionPresentation";
import {useDragging} from "../model/interaction/useDragging";
import {useInteractionEnginePause} from "../model/interaction/useInteractionEngine";
import {useInteractionRequestLifecycle} from "../model/interaction/useInteractionRequestLifecycle";
import {useInteractionToolbarContribution} from "../model/interaction/useInteractionToolbarContribution";
import {useParameterComponentCommons} from "../model/useParameterComponentCommons";
import classes from "./ParameterInteractionComponent.module.css";
import ParameterLabelComponent from "./ParameterLabelComponent";
import ParameterResetRow from "./ParameterResetRow";
import ParameterWrapperComponent from "./ParameterWrapperComponent";

type DragObjects = DraggingParameterValue["objects"];

/**
 * Parse the value of a dragging parameter and extract the dragged objects.
 */
const parseDraggedNodes = (value?: string): DragObjects => {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);

		return parsed.objects ?? [];
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		return [];
	}
};

const serializeDraggedNodes = (
	executed: DragObjects,
	gestures: DragObjects,
): string =>
	JSON.stringify({
		objects: calculateCombinedDraggedNodes(executed, gestures),
	} satisfies DraggingParameterValue);

const defaultStyleProps: StyleProps = {
	draggingColor: {
		type: "pulse",
		color: "#9e27d8",
		intensity: 1,
		pulseSpeed: 0.75,
	} as IInteractionEffect,
	availableColor: {
		type: "pulse",
		color: "#ffffff",
		intensity: 0.25,
		pulseSpeed: 0.75,
	} as IInteractionEffect,
	hoverColor: {
		type: "pulse",
		color: "#ffffff",
		intensity: 0.75,
		pulseSpeed: 1.75,
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
		Partial<IDraggingParameterProps> &
		Partial<StyleProps>,
) {
	const {
		actions,
		definition,
		handleChange,
		setOnCancelCallback,
		onCancel,
		disabled,
		busy,
		executing,
		cancelPendingChange,
		showReset,
		resetToDefault,
		state,
		sessionDependencies,
	} = useParameterComponentCommons<string>(props);

	const {namespace} = props;

	const {
		draggingColor,
		availableColor,
		hoverColor,
		confirmButton: confirmButtonTheme,
		cancelButton: cancelButtonTheme,
		clearButton: clearButtonTheme,
	} = useProps("ParameterDraggingComponent", defaultStyleProps, props);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterDraggingComponent",
		defaultPropsParameterWrapper,
		props,
	);

	const notifications = useNotificationStore();

	const draggingProps = useMemo(() => {
		const result = validateDraggingParameterSettings(definition.settings);
		if (result.success) {
			const validated = result.data.props as IDraggingParameterProps;
			if (!validated.draggingColor)
				validated.draggingColor = draggingColor;
			if (!validated.availableColor)
				validated.availableColor = availableColor;
			if (!validated.hoverColor) validated.hoverColor = hoverColor;
			return validated;
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
	}, [definition.settings, draggingColor, availableColor, hoverColor]);

	const alwaysActive = draggingProps.activeMode === "alwaysActive";
	const {
		enabled: automaticSceneUpdate,
		timeout: automaticSceneUpdateTimeout,
	} = resolveAutomaticSceneUpdate(draggingProps, alwaysActive);
	const draggingPresentation = resolveInteractionPresentation(
		draggingProps.presentation,
		alwaysActive,
	);
	const [draggingActive, setDraggingActive] = useState(false);
	const [draggingSuspended, setDraggingSuspended] = useState(false);
	const [parsedExecValue, setParsedExecValue] = useState<DragObjects>(() =>
		parseDraggedNodes(state.commitValue),
	);
	const [parsedUiValue, setParsedUiValue] = useState<DragObjects>(() =>
		parseDraggedNodes(state.uiValue),
	);

	const {viewportId} = useViewportId();
	useAutomaticSceneUpdatePointerHold(viewportId, automaticSceneUpdate);
	useInteractionEnginePause(viewportId, busy);

	const {candidateNodes, draggedNodes, setDraggedNodes, restoreDraggedNodes} =
		useDragging(
			sessionDependencies,
			viewportId,
			draggingProps,
			draggingActive && !draggingSuspended,
			parsedUiValue,
		);

	const draggingLabel =
		draggingProps.prompt?.inactiveTitle ??
		`Start dragging (${parsedUiValue.length})`;
	const confirmButton = resolveParameterInteractionButtonTheme(
		confirmButtonTheme,
		{label: "Confirm", icon: "tabler:check"},
	);
	const cancelButton = resolveParameterInteractionButtonTheme(
		cancelButtonTheme,
		{label: "Cancel", icon: "tabler:x"},
	);
	const clearButton = resolveParameterInteractionButtonTheme(
		clearButtonTheme,
		{label: "Clear", icon: "tabler:circle-off"},
	);

	const automaticallyActivated =
		alwaysActive || draggingProps.activeMode === "activeOnStart";
	const {ownershipBlocked, tryAcquireClaim} = useInteractionOwnership({
		viewportId,
		ownerKey: `${namespace}-${definition.id}-${viewportId}`,
		ownerLabel: draggingLabel,
		type: "dragging",
		// An always-active drag can be suspended by a user-requested tool,
		// the same way a persistent gumball can.
		alwaysActive: false,
		automaticallyActivated,
		candidateNodes,
		active: draggingActive,
	});
	const draggingRegistered = draggingActive && !ownershipBlocked;
	const effectiveDraggingActive = draggingRegistered && !draggingSuspended;
	useEffect(() => {
		if (ownershipBlocked) {
			setDraggingSuspended(false);
			setDraggingActive(false);
		} else if (automaticallyActivated) setDraggingActive(true);
	}, [automaticallyActivated, ownershipBlocked]);

	const parsedExecRef = useRef(parsedExecValue);
	const draggedNodesRef = useRef(draggedNodes);
	const uiValueRef = useRef(state.uiValue);
	const restoreDraggedNodesRef = useRef(restoreDraggedNodes);
	parsedExecRef.current = parsedExecValue;
	draggedNodesRef.current = draggedNodes;
	uiValueRef.current = state.uiValue;
	restoreDraggedNodesRef.current = restoreDraggedNodes;

	// Gestures confirmed in this session, before the execution bakes them
	// into the parameter value. Cancel restores these matrices.
	const lastConfirmedValueRef = useRef<DragObjects>([]);
	const sentValuesRef = useRef(new SentValues());
	const sentGesturesRef = useRef<SentDrag<DragObjects[number]>[]>([]);
	const pendingClearRef = useRef<
		{parsed: DragObjects; consumedNames: string[]} | undefined
	>(undefined);
	const processedCommitRef = useRef<string | undefined>(undefined);

	const serializedCombined = serializeDraggedNodes(
		parsedExecValue,
		draggedNodes,
	);
	const dirty =
		draggedNodes.length > 0 && serializedCombined !== state.uiValue;
	const committedObjects = parseDraggedNodes(state.commitValue);
	const showClearButton =
		(draggingProps.buttons?.clear ?? true) &&
		(committedObjects.length > 0 || dirty);

	const dropConsumedGestures = useCallback((names: string[]) => {
		if (names.length === 0) return;
		const nameSet = new Set(names);
		const remaining = draggedNodesRef.current.filter(
			(node) => !nameSet.has(node.name),
		);
		draggedNodesRef.current = remaining;
		setDraggedNodes(remaining);
		lastConfirmedValueRef.current = lastConfirmedValueRef.current.filter(
			(node) => !nameSet.has(node.name),
		);
	}, []);

	const applyParsedExec = useCallback((parsed: DragObjects) => {
		parsedExecRef.current = parsed;
		setParsedExecValue(parsed);
	}, []);

	/**
	 * Send the gestures multiplied onto the last executed value.
	 * The gesture matrix is relative to that geometry, so a value that was
	 * sent but not yet executed is not the baseline.
	 */
	const changeValue = useCallback(
		(timeout = 0) => {
			const gestures = draggedNodesRef.current;
			if (gestures.length === 0) return;
			if (!alwaysActive) setDraggingActive(false);
			const serialized = serializeDraggedNodes(
				parsedExecRef.current,
				gestures,
			);
			lastConfirmedValueRef.current = structuredClone(gestures);
			if (uiValueRef.current === serialized) return;
			const lastSent =
				sentGesturesRef.current[sentGesturesRef.current.length - 1];
			if (lastSent?.value === serialized) return;
			sentValuesRef.current.record(serialized);
			sentGesturesRef.current.push({
				value: serialized,
				gestures: structuredClone(gestures),
			});
			handleChange(serialized, timeout);
		},
		[alwaysActive, handleChange],
	);

	const cancel = useCallback(() => {
		const restoreTo = structuredClone(lastConfirmedValueRef.current);
		restoreDraggedNodesRef.current(
			restoreTo,
			structuredClone(draggedNodesRef.current),
		);
		draggedNodesRef.current = restoreTo;
		setDraggedNodes(restoreTo);
		if (!alwaysActive) setDraggingActive(false);
	}, [alwaysActive]);

	const stripGestures = useCallback(() => {
		restoreDraggedNodesRef.current(
			[],
			structuredClone(draggedNodesRef.current),
		);
		draggedNodesRef.current = [];
		setDraggedNodes([]);
		lastConfirmedValueRef.current = [];
		if (!alwaysActive) setDraggingActive(false);
	}, [alwaysActive]);

	const clearDragging = useCallback(() => {
		if (automaticSceneUpdate) cancelPendingChange();
		sentValuesRef.current.clear();
		sentGesturesRef.current = [];
		pendingClearRef.current = undefined;
		if (parseDraggedNodes(state.commitValue).length === 0) {
			stripGestures();
			return;
		}
		if (!alwaysActive) setDraggingActive(false);
		resetToDefault();
	}, [
		alwaysActive,
		automaticSceneUpdate,
		cancelPendingChange,
		resetToDefault,
		state.commitValue,
		stripGestures,
	]);

	// An own commit keeps the drag matrix until the execution replaced the
	// nodes, and drops only the objects that were part of that commit. A
	// foreign commit (reset, Clear, undo, model state) is applied at once.
	const commitEffectMountedRef = useRef(false);
	useEffect(() => {
		const commitKey = `${state.commitRevision}:${state.commitValue}`;
		if (processedCommitRef.current === commitKey) return;
		processedCommitRef.current = commitKey;

		const parsed = parseDraggedNodes(state.commitValue);
		const consumed = consumeSentDrag(
			sentValuesRef.current,
			sentGesturesRef.current,
			state.commitValue ?? "",
		);
		sentGesturesRef.current = consumed.remaining;
		if (
			automaticSceneUpdate &&
			!consumed.own &&
			commitEffectMountedRef.current
		)
			cancelPendingChange();
		const mounted = commitEffectMountedRef.current;
		commitEffectMountedRef.current = true;
		// A newer value was combined from these gestures onto this
		// baseline. Moving the baseline or dropping the gestures would
		// apply that move twice, and those objects stay unavailable
		// until the newer value commits.
		if (consumed.newerPending) {
			pendingClearRef.current = undefined;
			return;
		}
		if (!mounted) {
			applyParsedExec(parsed);
			draggedNodesRef.current = [];
			setDraggedNodes([]);
			lastConfirmedValueRef.current = [];
			return;
		}
		if (consumed.own) {
			if (executing) {
				pendingClearRef.current = {
					parsed,
					consumedNames: consumed.consumedNames,
				};
				return;
			}
			pendingClearRef.current = undefined;
			applyParsedExec(parsed);
			dropConsumedGestures(consumed.consumedNames);
			return;
		}
		pendingClearRef.current = undefined;
		restoreDraggedNodesRef.current(
			[],
			structuredClone(draggedNodesRef.current),
		);
		applyParsedExec(parsed);
		draggedNodesRef.current = [];
		setDraggedNodes([]);
		lastConfirmedValueRef.current = [];
	}, [state.commitValue, state.commitRevision]);

	useEffect(() => {
		if (executing || !pendingClearRef.current) return;
		const {parsed, consumedNames} = pendingClearRef.current;
		pendingClearRef.current = undefined;
		applyParsedExec(parsed);
		dropConsumedGestures(consumedNames);
	}, [executing]);

	useEffect(() => {
		setParsedUiValue(parseDraggedNodes(state.uiValue));
	}, [state.uiValue]);

	const seenDraggedNodesRef = useRef(draggedNodes);
	const movedWhileExecutingRef = useRef(false);
	useEffect(() => {
		const moved = seenDraggedNodesRef.current !== draggedNodes;
		seenDraggedNodesRef.current = draggedNodes;
		if (!automaticSceneUpdate || !effectiveDraggingActive) return;
		if (executing) {
			if (moved) movedWhileExecutingRef.current = true;
			return;
		}
		if (!moved && !movedWhileExecutingRef.current) return;
		movedWhileExecutingRef.current = false;
		changeValue(automaticSceneUpdateTimeout);
	}, [draggedNodes, executing]);

	const _onCancelCallback = useCallback(() => {
		stripGestures();
	}, [stripGestures]);

	useEffect(() => {
		setOnCancelCallback(() => _onCancelCallback);
	}, [_onCancelCallback]);

	const {takeOverInteraction} = useInteractionRequestLifecycle({
		viewportId,
		active: draggingRegistered,
		persistent: alwaysActive,
		allowToolbarPopoverDismissal: draggingPresentation === "toolbar",
		onDisable: cancel,
		onSuspend: () => setDraggingSuspended(true),
		onResume: () => setDraggingSuspended(false),
		setDisableOtherParameters: actions.setDisableOtherParameters,
	});

	const contentActive = (
		<Stack>
			<Group justify="space-between" wrap="nowrap" align="flex-start">
				<Button
					justify="space-between"
					fullWidth
					disabled={disabled}
					className={classes.interactionButton}
					rightSection={<Loader size="sm" type="dots" />}
					onClick={automaticSceneUpdate ? undefined : cancel}
				>
					<Stack>
						<TextWeighted
							size="sm"
							fontWeight="medium"
							ta="left"
							className={classes.interactionText}
						>
							{draggingProps.prompt?.activeTitle ??
								`Currently dragged objects: ${draggedNodes.length}`}
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
				{showClearButton && (
					<AppBuilderLabeledActionIcon
						label={clearButton.label}
						tooltipLabel={clearButton.tooltip}
						icon={<Icon iconType={clearButton.icon} />}
						onClick={clearDragging}
						variant="light"
					/>
				)}
			</Group>
			{!automaticSceneUpdate && (
				<Group justify="space-between" w="100%" wrap="nowrap">
					<Button
						fullWidth={true}
						disabled={!dirty}
						variant="filled"
						onClick={() => changeValue(0)}
					>
						<Text>{confirmButton.label}</Text>
					</Button>
					<Button fullWidth={true} variant="light" onClick={cancel}>
						<Text>{cancelButton.label}</Text>
					</Button>
				</Group>
			)}
		</Stack>
	);

	const contentInactive = (
		<Button
			justify="space-between"
			fullWidth={true}
			disabled={disabled}
			className={classes.interactionButton}
			rightSection={<Icon iconType={"tabler:hand-finger"} />}
			variant={parsedUiValue.length === 0 ? "light" : "filled"}
			onClick={() => {
				takeOverInteraction();
				if (tryAcquireClaim(true)) setDraggingActive(true);
			}}
		>
			<Text size="sm" className={classes.interactionText}>
				{draggingProps.prompt?.inactiveTitle ??
					`Start dragging (${parsedUiValue.length})`}
			</Text>
		</Button>
	);

	useInteractionToolbarContribution({
		id: `${namespace}-${definition.id}-${viewportId}`,
		namespace,
		viewportId,
		presentation: draggingPresentation,
		sectionId: "dragging",
		order: definition.order,
		menu: {
			id: "runtime-interaction-dragging-menu",
			label: "Dragging",
			icon: "tabler:drag-drop",
		},
		items: [
			createToolbarCheckboxItem({
				id: `${namespace}-${definition.id}-${viewportId}-toggle`,
				label: draggingLabel,
				checked: effectiveDraggingActive,
				readOnly: alwaysActive && effectiveDraggingActive,
				setChecked: (checked) => {
					if (checked) {
						takeOverInteraction();
						if (tryAcquireClaim(true)) setDraggingActive(true);
					} else if (!alwaysActive) setDraggingActive(false);
				},
			}),
		],
		commands: [
			...(!automaticSceneUpdate
				? [
						createToolbarCommand({
							id: `${namespace}-${definition.id}-${viewportId}-confirm`,
							label: confirmButton.label,
							tooltip: confirmButton.tooltip,
							icon: confirmButton.icon,
							disabled: !dirty,
							execute: () => changeValue(0),
						}),
						createToolbarCommand({
							id: `${namespace}-${definition.id}-${viewportId}-cancel`,
							label: cancelButton.label,
							tooltip: cancelButton.tooltip,
							icon: cancelButton.icon,
							execute: cancel,
						}),
					]
				: []),
			...(showClearButton
				? [
						createToolbarCommand({
							id: `${namespace}-${definition.id}-${viewportId}-clear`,
							label: clearButton.label,
							tooltip: clearButton.tooltip,
							icon: clearButton.icon,
							execute: clearDragging,
						}),
					]
				: []),
		],
	});

	if (draggingPresentation === "toolbar") return <></>;

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && (
				<ParameterResetRow
					show={showReset}
					onClick={resetToDefault}
					disabled={disabled}
				>
					{effectiveDraggingActive ? contentActive : contentInactive}
				</ParameterResetRow>
			)}
		</ParameterWrapperComponent>
	);
}
