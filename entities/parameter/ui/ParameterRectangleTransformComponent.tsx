import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {resolveAutomaticSceneUpdate} from "@AppBuilderLib/entities/parameter/lib/automaticSceneUpdate";
import {hasLocalTransformationDelta} from "@AppBuilderLib/entities/parameter/lib/transformedNodes";
import {useInteractionOwnership} from "@AppBuilderLib/entities/parameter/model/interaction/useInteractionOwnership";
import {useParameterComponentCommons} from "@AppBuilderLib/entities/parameter/model/useParameterComponentCommons";
import ParameterLabelComponent from "@AppBuilderLib/entities/parameter/ui/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderLib/entities/parameter/ui/ParameterWrapperComponent";
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
import {
	Box,
	Button,
	Flex,
	Group,
	Loader,
	Stack,
	Text,
	useProps,
} from "@mantine/core";
import {IInteractionEffect} from "@shapediver/viewer.features.interaction";
import {
	IRectangleTransformParameterProps,
	RectangleTransformParameterValue,
	validateRectangleTransformParameterSettings,
} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {resolveParameterInteractionButtonTheme} from "../config/theme/parameterInteractionButtonTheme";
import type {ParameterRectangleTransformComponentStyleProps as StyleProps} from "../config/theme/parameterRectangleTransformComponentTheme";
import {resolveInteractionPresentation} from "../model/interaction/resolveInteractionPresentation";
import {useInteractionRequestLifecycle} from "../model/interaction/useInteractionRequestLifecycle";
import {useInteractionToolbarContribution} from "../model/interaction/useInteractionToolbarContribution";
import {useRectangleTransform} from "../model/interaction/useRectangleTransform";
import classes from "./ParameterInteractionComponent.module.css";
import ParameterResetRow from "./ParameterResetRow";

type TransformedNode = {
	name: string;
	transformation: number[];
	localTransformations?: number[];
};

/**
 * Parse the value of a rectangle transform parameter and extract the transformed node names.
 * @param value
 * @returns
 */
const parseTransformation = (value?: string): TransformedNode[] => {
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

const defaultStyleProps: StyleProps = {
	selectionColor: {
		type: "pulse",
		color: "#0d44f0",
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
 * Functional component that creates a rectangle transform component for a rectangle transform parameter.
 *
 * @returns
 */
export default function ParameterRectangleTransformComponent(
	props: PropsParameter &
		Partial<PropsParameterWrapper> &
		Partial<IRectangleTransformParameterProps> &
		Partial<StyleProps>,
) {
	const {
		actions,
		definition,
		handleChange,
		setOnCancelCallback,
		onCancel,
		disabled,
		showReset,
		resetToDefault,
		value,
		state,
		sessionDependencies,
		executing,
		cancelPendingChange,
	} = useParameterComponentCommons<string>(props);

	const {namespace} = props;

	const {
		selectionColor,
		availableColor,
		hoverColor,
		confirmButton: confirmButtonTheme,
		cancelButton: cancelButtonTheme,
		clearButton: clearButtonTheme,
	} = useProps(
		"ParameterRectangleTransformComponent",
		defaultStyleProps,
		props,
	);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterRectangleTransformComponent",
		defaultPropsParameterWrapper,
		props,
	);

	// get the notification store
	const notifications = useNotificationStore();

	// settings validation
	const rectangleTransformProps = useMemo(() => {
		const result = validateRectangleTransformParameterSettings(
			definition.settings,
		);
		if (result.success) {
			const props = result.data
				.props as IRectangleTransformParameterProps;
			if (!props.selectionColor) props.selectionColor = selectionColor;
			if (!props.availableColor) props.availableColor = availableColor;
			if (!props.hoverColor) props.hoverColor = hoverColor;
			return props;
		} else {
			notifications.error({
				title: "Invalid Parameter Settings",
				message: `Invalid settings for Rectangle Transform parameter "${definition.name}", see console for details.`,
			});
			Logger.warn(
				`Invalid settings for Rectangle Transform parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
			);
			return {
				selectionColor,
				availableColor,
				hoverColor,
			} as IRectangleTransformParameterProps;
		}
	}, [definition.settings, selectionColor, availableColor, hoverColor]);

	// state for the rectangle transform application
	const alwaysActive = rectangleTransformProps.activeMode === "alwaysActive";
	const {
		enabled: automaticSceneUpdate,
		timeout: automaticSceneUpdateTimeout,
	} = resolveAutomaticSceneUpdate(rectangleTransformProps, alwaysActive);
	const rectanglePresentation = resolveInteractionPresentation(
		rectangleTransformProps.presentation,
		alwaysActive,
	);
	const [rectangleTransformActive, setRectangleTransformActive] =
		useState(false);
	// store the last confirmed value in a state to reset the transformation
	const [lastConfirmedValue, setLastConfirmedValue] = useState<
		TransformedNode[]
	>([]);
	// store the parsed commit value in a state to react to changes
	const [parsedCommitValue, setParsedCommitValue] = useState<
		TransformedNode[]
	>([]);
	const {viewportId} = useViewportId();
	const interactionOwnerKey = `${namespace}-${definition.id}-${viewportId}`;

	// get the transformed nodes and the selected nodes
	const {
		candidateNodes,
		transformedNodeNames,
		setTransformedNodeNames,
		setSelectedNodeNames,
		restoreTransformedNodeNames,
		closeTransform,
	} = useRectangleTransform(
		sessionDependencies,
		viewportId,
		rectangleTransformProps,
		rectangleTransformActive,
		parseTransformation(value),
		true,
		executing,
	);

	const rtLabel =
		rectangleTransformProps.prompt?.inactiveTitle ??
		"Start rectangle transform";
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
		alwaysActive || rectangleTransformProps.activeMode === "activeOnStart";
	const [rectangleTransformSuspended, setRectangleTransformSuspended] =
		useState(false);
	const {ownershipBlocked, tryAcquireClaim} = useInteractionOwnership({
		viewportId,
		ownerKey: interactionOwnerKey,
		ownerLabel: rtLabel,
		type: "rectangleTransform",
		// Persistent transforms can be suspended by a user-requested interaction,
		// just like persistent selection parameters.
		alwaysActive: false,
		automaticallyActivated,
		candidateNodes,
		active: rectangleTransformActive,
	});
	const rectangleTransformRegistered =
		rectangleTransformActive && !ownershipBlocked;
	const effectiveRectangleActive =
		rectangleTransformRegistered && !rectangleTransformSuspended;
	useEffect(() => {
		if (ownershipBlocked) {
			setRectangleTransformSuspended(false);
			setRectangleTransformActive(false);
		} else if (automaticallyActivated) setRectangleTransformActive(true);
	}, [automaticallyActivated, ownershipBlocked]);

	const transformedNodeNamesRef = useRef(transformedNodeNames);
	useEffect(() => {
		transformedNodeNamesRef.current = transformedNodeNames;
	}, [transformedNodeNames]);
	const restartPersistentTransform = useCallback(() => {
		setRectangleTransformActive(false);
		window.requestAnimationFrame(() => {
			if (tryAcquireClaim(true)) setRectangleTransformActive(true);
		});
	}, [tryAcquireClaim]);

	// The value sent by this component (Confirm or an automatic scene update):
	// its commit is the confirmation of the transformation shown in the scene.
	const sentValueRef = useRef<string | undefined>(undefined);
	// The restore of an own confirmation, deferred to the end of its execution.
	const pendingRestoreRef = useRef<
		{parsed: TransformedNode[]; previous: TransformedNode[]} | undefined
	>(undefined);

	// Apply a committed transformation to the scene: the transformations the
	// tool applied to the nodes are replaced by the committed ones. Nothing
	// changes when the nodes were replaced by an output update meanwhile (the
	// executed transformation is part of the model output then). Otherwise the
	// gizmo is stale, it is closed and restarted if always active.
	const applyCommittedTransformation = useCallback(
		(parsed: TransformedNode[], previous: TransformedNode[]) => {
			const changed = restoreTransformedNodeNames(
				structuredClone(parsed),
				structuredClone(previous),
			);
			if (!changed) return;
			closeTransform();
			if (alwaysActive) restartPersistentTransform();
		},
		[
			alwaysActive,
			closeTransform,
			restartPersistentTransform,
			restoreTransformedNodeNames,
		],
	);

	// React to commits of the parameter and reset the last confirmed value.
	// An own confirmation is shown in the scene already: the transformations
	// applied by the tool are kept until the execution replaced the nodes, which
	// avoids a jump back to the previous placement while the request runs. Any
	// other commit (a reset value after the execution, a cleared value, undo, a
	// model state) is applied to the scene right away.
	useEffect(() => {
		const parsed = parseTransformation(state.commitValue);
		// A transformation still waiting for its automatic scene update was
		// made on the scene before this commit, it is dropped.
		if (automaticSceneUpdate) cancelPendingChange();
		setParsedCommitValue(structuredClone(parsed));
		setLastConfirmedValue(structuredClone(parsed));
		setTransformedNodeNames(structuredClone(parsed));
		const previous = structuredClone(transformedNodeNamesRef.current);
		if (state.commitValue === sentValueRef.current) {
			sentValueRef.current = undefined;
			// a custom parameter commits once its execution ended, a session
			// parameter before: the restore waits for a running execution
			if (executing) {
				pendingRestoreRef.current = {parsed, previous};
				return;
			}
		}
		pendingRestoreRef.current = undefined;
		applyCommittedTransformation(parsed, previous);
	}, [state.commitValue, state.commitRevision]);

	useEffect(() => {
		if (executing || !pendingRestoreRef.current) return;
		const {parsed, previous} = pendingRestoreRef.current;
		pendingRestoreRef.current = undefined;
		applyCommittedTransformation(parsed, previous);
	}, [executing]);

	// reset the transformed nodes when the definition changes
	useEffect(() => {
		const parsed = parseTransformation(definition.defval);
		if (
			JSON.stringify(parsed) !==
			JSON.stringify(transformedNodeNamesRef.current)
		) {
			setParsedCommitValue(structuredClone(parsed));
			setLastConfirmedValue(structuredClone(parsed));
			setTransformedNodeNames(structuredClone(parsed));
		}
	}, [JSON.stringify(definition)]);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the rectangle transform interaction is confirmed.
	 * It also ends the rectangle transform interaction process and resets the selected nodes.
	 */
	const changeValue = useCallback(
		(transformedNodeNames: TransformedNode[], timeout = 0) => {
			if (!alwaysActive) setRectangleTransformActive(false);
			const parameterValue: RectangleTransformParameterValue = {
				names: transformedNodeNames.map((node) => node.name),
				transformations: transformedNodeNames.map(
					(node) => node.transformation,
				),
			};

			// create a deep copy of the transformed node names
			setLastConfirmedValue(structuredClone(transformedNodeNames));
			// if the value is already the same, do not change it
			const serializedValue = JSON.stringify(parameterValue);
			// compare with the store: the local value keeps a cancelled pending change
			if (state.uiValue === serializedValue) {
				if (!alwaysActive) setSelectedNodeNames([]);
				return;
			}
			sentValueRef.current = serializedValue;
			handleChange(serializedValue, timeout);
			if (!alwaysActive) setSelectedNodeNames([]);
		},
		[alwaysActive, state.uiValue],
	);

	const restartAfterCancel = useCallback(() => {
		if (!alwaysActive) {
			setRectangleTransformActive(false);
			setSelectedNodeNames([]);
			return;
		}

		restartPersistentTransform();
	}, [alwaysActive, restartPersistentTransform]);

	/**
	 * Callback function to reset the transformed nodes.
	 * This function is called when the rectangle transform interaction is aborted by the user.
	 * The transformed nodes are reset to the last confirmed value.
	 * It also ends the rectangle transform.
	 */
	const resetTransformation = useCallback(() => {
		closeTransform();
		restoreTransformedNodeNames(
			structuredClone(lastConfirmedValue),
			structuredClone(transformedNodeNames),
		);
		restartAfterCancel();
	}, [
		closeTransform,
		lastConfirmedValue,
		restartAfterCancel,
		transformedNodeNames,
	]);

	// extend the onCancel callback to reset the transformed nodes.
	const _onCancelCallback = useCallback(() => {
		closeTransform();
		restoreTransformedNodeNames(
			structuredClone(parsedCommitValue),
			structuredClone(transformedNodeNames),
		);
		restartAfterCancel();
		setLastConfirmedValue(structuredClone(parsedCommitValue));
	}, [
		closeTransform,
		parsedCommitValue,
		restartAfterCancel,
		transformedNodeNames,
	]);

	useEffect(() => {
		setOnCancelCallback(() => _onCancelCallback);
	}, [_onCancelCallback]);

	// Automatic scene update (always active tools only): a moved handle sends
	// the transformation like Confirm would, debounced by the timeout. The
	// identity transformations emitted on creation of the gizmo are not sent.
	const hasLocalTransformation =
		hasLocalTransformationDelta(transformedNodeNames);
	// A move while a request is in flight is not sent: after our own request
	// the gizmo is recreated on the new nodes and the move is dropped; after
	// another parameter's execution the move is sent once it ends.
	const seenTransformedNodeNamesRef = useRef(transformedNodeNames);
	const movedWhileExecutingRef = useRef(false);
	useEffect(() => {
		const moved =
			seenTransformedNodeNamesRef.current !== transformedNodeNames;
		seenTransformedNodeNamesRef.current = transformedNodeNames;
		if (!automaticSceneUpdate || !effectiveRectangleActive) return;
		if (!hasLocalTransformation) {
			movedWhileExecutingRef.current = false;
			return;
		}
		if (executing) {
			if (moved) movedWhileExecutingRef.current = true;
			return;
		}
		// the execution ended: only a move made during it is sent, a stale
		// local transformation of a gizmo about to be recreated is not
		if (!moved && !movedWhileExecutingRef.current) return;
		movedWhileExecutingRef.current = false;
		changeValue(transformedNodeNames, automaticSceneUpdateTimeout);
	}, [transformedNodeNames, executing]);

	// Clear: the committed transformations are undone (the parameter is reset
	// to its default value and executed), a pending transformation is dropped.
	const clearTransformation = useCallback(() => {
		if (automaticSceneUpdate) cancelPendingChange();
		sentValueRef.current = undefined;
		if (parsedCommitValue.length === 0) {
			// nothing is committed: only the pending transformation is undone
			_onCancelCallback();
			return;
		}
		if (!alwaysActive) {
			setRectangleTransformActive(false);
			setSelectedNodeNames([]);
		}
		resetToDefault();
	}, [
		alwaysActive,
		automaticSceneUpdate,
		cancelPendingChange,
		parsedCommitValue,
		resetToDefault,
		_onCancelCallback,
	]);
	// Clear can be turned off by the "buttons.clear" setting (default true)
	const showClearButton =
		(rectangleTransformProps.buttons?.clear ?? true) &&
		(parsedCommitValue.length > 0 || hasLocalTransformation);

	const {takeOverInteraction} = useInteractionRequestLifecycle({
		viewportId,
		active: rectangleTransformRegistered,
		persistent: alwaysActive,
		allowToolbarPopoverDismissal: rectanglePresentation === "toolbar",
		onDisable: resetTransformation,
		onSuspend: () => setRectangleTransformSuspended(true),
		onResume: () => setRectangleTransformSuspended(false),
		setDisableOtherParameters: actions.setDisableOtherParameters,
	});

	/**
	 * The content of the parameter when it is active.
	 *
	 * It contains a button to confirm the rectangle transform interaction and a button to cancel the interaction.
	 *
	 * The confirm button sets the current parameter value to the transformed nodes.
	 * The cancel button resets the transformed nodes to the last value.
	 *
	 */
	const contentActive = (
		<Stack>
			<Group justify="space-between" className={classes.interactionMain}>
				<Flex align="center" justify="flex-start" w={"100%"}>
					<Box style={{flex: 1}}>
						<TextWeighted
							size="sm"
							fontWeight="medium"
							ta="left"
							className={classes.interactionText}
						>
							{rectangleTransformProps.prompt?.activeTitle ??
								`Currently transformed: ${transformedNodeNames.length}`}
						</TextWeighted>
					</Box>
					{showClearButton && (
						<Box style={{width: "auto"}}>
							<AppBuilderLabeledActionIcon
								label={clearButton.label}
								tooltipLabel={clearButton.tooltip}
								icon={<Icon iconType={clearButton.icon} />}
								onClick={clearTransformation}
								variant="light"
							/>
						</Box>
					)}
				</Flex>
				<Flex align="center" justify="flex-start" w={"100%"}>
					<Box style={{flex: 1}}>
						<Text
							size="sm"
							fs="italic"
							ta="left"
							className={classes.interactionText}
						>
							{rectangleTransformProps.prompt?.activeText ??
								"Select objects to transform"}
						</Text>
					</Box>
					<Box style={{width: "auto"}}>
						<Loader size={28} type="dots" />
					</Box>
				</Flex>
			</Group>

			{!automaticSceneUpdate && (
				<Group justify="space-between" w="100%" wrap="nowrap">
					<Button
						disabled={transformedNodeNames.length === 0}
						fullWidth={true}
						variant="filled"
						onClick={() => changeValue(transformedNodeNames)}
					>
						<Text>{confirmButton.label}</Text>
					</Button>
					<Button
						fullWidth={true}
						variant={"light"}
						onClick={resetTransformation}
					>
						<Text>{cancelButton.label}</Text>
					</Button>
				</Group>
			)}
		</Stack>
	);

	/**
	 * The content of the parameter when it is inactive.
	 *
	 * It contains a button to start the rectangle transform.
	 * Within the button, the number of transformed nodes is displayed.
	 */
	const contentInactive = (
		<Button
			justify="space-between"
			fullWidth={true}
			disabled={disabled}
			className={classes.interactionButton}
			rightSection={<Icon iconType={"tabler:hand-finger"} />}
			variant={transformedNodeNames.length === 0 ? "light" : "filled"}
			onClick={() => {
				takeOverInteraction();
				if (tryAcquireClaim(true)) setRectangleTransformActive(true);
			}}
		>
			<Text size="sm" className={classes.interactionText}>
				{rectangleTransformProps.prompt?.inactiveTitle ??
					"Start rectangle transform"}
			</Text>
		</Button>
	);
	const hasPendingTransformation =
		JSON.stringify(transformedNodeNames) !==
		JSON.stringify(lastConfirmedValue);

	// Register with interaction toolbar if presentation is "toolbar"

	useInteractionToolbarContribution({
		id: `${namespace}-${definition.id}-${viewportId}`,
		namespace,
		viewportId,
		presentation: rectanglePresentation,
		sectionId: "rectangle-transform",
		order: definition.order,
		menuVisibility: "multipleToggleable",
		menu: {
			id: "runtime-interaction-rectangle-transform-menu",
			label: "Rectangle transform",
			icon: "tabler:vector",
		},
		items: [
			createToolbarCheckboxItem({
				id: `${namespace}-${definition.id}-${viewportId}-toggle`,
				label: rtLabel,
				checked: effectiveRectangleActive,
				readOnly: alwaysActive && effectiveRectangleActive,
				setChecked: (checked) => {
					if (checked) {
						takeOverInteraction();
						if (tryAcquireClaim(true))
							setRectangleTransformActive(true);
					} else if (!alwaysActive)
						setRectangleTransformActive(false);
				},
			}),
		],
		// with automatic scene updates a moved handle is sent after the idle
		// timeout: there is nothing to confirm or cancel, only Clear remains
		commands: [
			...(hasPendingTransformation && !automaticSceneUpdate
				? [
						createToolbarCommand({
							id: `${namespace}-${definition.id}-${viewportId}-confirm`,
							aggregationId: "rectangle-transform-confirm",
							label: confirmButton.label,
							tooltip: confirmButton.tooltip,
							icon: confirmButton.icon,
							order: 10,
							disabled: !hasPendingTransformation,
							execute: () => changeValue(transformedNodeNames),
						}),
						createToolbarCommand({
							id: `${namespace}-${definition.id}-${viewportId}-cancel`,
							aggregationId: "rectangle-transform-cancel",
							label: cancelButton.label,
							tooltip: cancelButton.tooltip,
							icon: cancelButton.icon,
							order: 20,
							disabled: !hasPendingTransformation,
							execute: resetTransformation,
						}),
					]
				: []),
			...(showClearButton
				? [
						createToolbarCommand({
							id: `${namespace}-${definition.id}-${viewportId}-clear`,
							aggregationId: "rectangle-transform-clear",
							label: clearButton.label,
							tooltip: clearButton.tooltip,
							icon: clearButton.icon,
							order: 30,
							execute: clearTransformation,
						}),
					]
				: []),
		],
	});

	if (rectanglePresentation === "toolbar") return <></>;

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
					{effectiveRectangleActive ? contentActive : contentInactive}
				</ParameterResetRow>
			)}
		</ParameterWrapperComponent>
	);
}
