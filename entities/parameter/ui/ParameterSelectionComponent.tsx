import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {
	createToolbarCheckboxItem,
	createToolbarCommand,
} from "@AppBuilderLib/features/appbuilder/model/createToolbarItems";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import TextWeighted from "@AppBuilderLib/shared/ui/text/TextWeighted";
import {
	ActionIcon,
	Box,
	Button,
	Flex,
	Group,
	Loader,
	MantineThemeComponent,
	Stack,
	Text,
	useProps,
} from "@mantine/core";
import {IInteractionEffect} from "@shapediver/viewer.features.interaction";
import {
	ISelectionParameterProps,
	SelectionParameterValue,
	validateSelectionParameterSettings,
} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "../config/propsParameter";
import type {ParameterSelectionComponentStyleProps as StyleProps} from "../config/theme/parameterSelectionComponentTheme";
import {resolveInteractionPresentation} from "../model/interaction/resolveInteractionPresentation";
import {useInteractionToolbarContribution} from "../model/interaction/useInteractionToolbarContribution";
import {
	clearPendingSelection,
	hasOtherPendingSelectionInScope,
	markPendingSelection,
	usePendingSelectionRegistry,
} from "../model/interaction/usePendingSelectionRegistry";
import {useSelection} from "../model/interaction/useSelection";
import {useSelectionActivationState} from "../model/interaction/useSelectionActivationState";
import {
	requestSelectionAutoClear,
	useSelectionAutoClear,
} from "../model/interaction/useSelectionAutoClear";
import {useSelectionInteractionOwnership} from "../model/interaction/useSelectionInteractionOwnership";
import {useSuspendedSelectionRestore} from "../model/interaction/useSuspendedSelectionRestore";
import {useParameterComponentCommons} from "../model/useParameterComponentCommons";
import classes from "./ParameterInteractionComponent.module.css";
import ParameterLabelComponent from "./ParameterLabelComponent";
import ParameterWrapperComponent from "./ParameterWrapperComponent";

type SelectionParameterProps = ISelectionParameterProps & {
	buttons?: {
		clear?: boolean;
	};
};

/**
 * Parse the value of a selection parameter and extract the selected node names.
 * @param value
 * @returns
 */
const parseNames = (value?: string): string[] => {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);

		return parsed.names;
	} catch {
		return [];
	}
};

const getSelectionButtons = (settings: unknown) =>
	(settings as {props?: SelectionParameterProps} | undefined)?.props?.buttons;

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

type ParameterSelectionComponentPropsType = Partial<StyleProps>;

export function ParameterSelectionComponentThemeProps(
	props: ParameterSelectionComponentPropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a selection parameter, allowing selection of objects in the viewport.
 *
 * @returns
 */
export default function ParameterSelectionComponent(
	props: PropsParameter &
		Partial<PropsParameterWrapper> &
		Partial<ISelectionParameterProps>,
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
	} = useParameterComponentCommons<string>(props);

	const {namespace} = props;

	const {selectionColor, availableColor, hoverColor} = useProps(
		"ParameterSelectionComponent",
		defaultStyleProps,
		props,
	);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterSelectionComponent",
		defaultPropsParameterWrapper,
		props,
	);

	// get the notification store
	const notifications = useNotificationStore();
	const selectionSettingsKey = JSON.stringify(definition.settings);
	const selectionColorKey = JSON.stringify(selectionColor);
	const availableColorKey = JSON.stringify(availableColor);
	const hoverColorKey = JSON.stringify(hoverColor);

	// settings validation
	const selectionProps = useMemo(() => {
		const buttons = getSelectionButtons(definition.settings);
		const result = validateSelectionParameterSettings(definition.settings);
		if (result.success) {
			const props = result.data.props as SelectionParameterProps;
			// Keep App Builder UI settings even while an older viewer validator is
			// in use and strips fields it does not yet know about.
			if (buttons) props.buttons = buttons;
			if (!props.selectionColor) props.selectionColor = selectionColor;
			if (!props.availableColor) props.availableColor = availableColor;
			if (!props.hoverColor) props.hoverColor = hoverColor;
			return props;
		} else {
			notifications.error({
				title: "Invalid Parameter Settings",
				message: `Invalid settings for Selection parameter "${definition.name}", see console for details.`,
			});
			Logger.warn(
				`Invalid settings for Selection parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
			);
			return {
				selectionColor,
				availableColor,
				hoverColor,
			} as SelectionParameterProps;
		}
	}, [
		selectionSettingsKey,
		selectionColorKey,
		availableColorKey,
		hoverColorKey,
	]);

	const minimumSelection = selectionProps?.minimumSelection ?? 1;
	const maximumSelection = selectionProps?.maximumSelection ?? 1;
	const showClearButton = selectionProps.buttons?.clear ?? true;
	const shouldAutoClear = selectionProps.autoClear ?? false;
	const shouldShowClearButton =
		showClearButton && !(shouldAutoClear && maximumSelection === 1);
	const alwaysActive = selectionProps.activeMode === "alwaysActive";
	const presentation = resolveInteractionPresentation(
		selectionProps.presentation,
		alwaysActive,
	);
	// For alwaysActive, selection is always active.
	// For activeOnStart, selection starts active.
	// For default, selection starts inactive.
	const automaticallyActivated =
		alwaysActive || selectionProps.activeMode === "activeOnStart";
	const {
		deactivateSelection,
		effectiveSelectionActive,
		selectionRegistered,
		setOwnershipBlocked,
		setSelectionActive,
		setSuspended,
		suspended,
	} = useSelectionActivationState({alwaysActive, automaticallyActivated});

	// state for the dirty flag
	const [dirty, setDirty] = useState<boolean>(false);

	// get the viewport ID
	const {viewportId} = useViewportId();
	const selectionOwnerKey = `${namespace}-${definition.id}-${viewportId}`;
	const autoClearRequest = useSelectionAutoClear(selectionOwnerKey);
	const startsAutoCleared =
		shouldAutoClear && autoClearRequest?.value === value;

	const {
		candidateNodes,
		availableNodeNames,
		selectedNodeNames,
		setSelectedNodeNames,
		setSelectedNodeNamesAndRestoreSelection,
		requestSelectionRestore,
	} = useSelection(
		viewportId,
		selectionProps,
		effectiveSelectionActive,
		startsAutoCleared ? [] : parseNames(value),
		true,
	);
	const restoreBatchSelectionRef = useRef(false);
	const clearSelectionRef = useRef<() => void>(() => {});
	const skipNextAutomaticConfirmationRef = useRef(false);
	const clearedSinceLastConfirmationRef = useRef(false);
	useSuspendedSelectionRestore({
		suspended,
		selectedNodeNames,
		setSelectedNodeNames,
		requestSelectionRestore,
	});

	const acceptable =
		selectedNodeNames.length >= minimumSelection &&
		selectedNodeNames.length <= maximumSelection;
	// Pending and dirty state must use the same committed source. The value prop
	// can lag behind state.uiValue after a batch update, otherwise leaving a
	// phantom pending selection after Cancel.
	const committedNodeNames = parseNames(state.uiValue);
	const hasPendingSelection =
		committedNodeNames.length !== selectedNodeNames.length ||
		!committedNodeNames.every(
			(name, index) => name === selectedNodeNames[index],
		);
	const hasOtherPendingSelection = usePendingSelectionRegistry(
		selectionOwnerKey,
		`${namespace}-${viewportId}`,
		hasPendingSelection,
	);
	// Keep the established automatic behavior unless another selection parameter
	// has an outstanding pending selection. A committed batch is not pending
	// interaction state, so it must restore the normal single-selection UI.
	const hasStoredSelection = hasOtherPendingSelection;
	const acceptImmediately =
		!hasStoredSelection &&
		(selectedNodeNames.length === maximumSelection ||
			((minimumSelection === maximumSelection ||
				(minimumSelection === 0 && maximumSelection === 1)) &&
				acceptable));
	useEffect(() => {
		const parsed = parseNames(state.uiValue);

		// compare uiValue to selectedNodeNames
		if (
			parsed.length !== selectedNodeNames.length ||
			!parsed.every((n, i) => n === selectedNodeNames[i])
		) {
			setDirty(true);
		} else {
			setDirty(false);
		}
	}, [state.uiValue, selectedNodeNames]);

	// Do not overwrite a pending selection when parameter definitions refresh.
	// Pending selection state is intentionally retained until Confirm, Cancel, or
	// Clear, even when another parameter triggers a computation.
	useEffect(() => {
		const parsed = parseNames(value);
		const committed = parseNames(state.uiValue);
		const hasPendingSelection =
			committed.length !== selectedNodeNames.length ||
			!committed.every(
				(name, index) => name === selectedNodeNames[index],
			);
		if (hasPendingSelection) return;
		if (JSON.stringify(parsed) !== JSON.stringify(selectedNodeNames))
			setSelectedNodeNames(parsed);
	}, [JSON.stringify(definition), selectedNodeNames, state.uiValue, value]);

	// Batch confirmation temporarily deactivates the manager. That can emit a
	// deselection event before the new parameter value reaches this component;
	// restore the committed names once it does.
	useEffect(() => {
		if (!restoreBatchSelectionRef.current) return;
		restoreBatchSelectionRef.current = false;
		setSelectedNodeNamesAndRestoreSelection(parseNames(value));
	}, [setSelectedNodeNamesAndRestoreSelection, value]);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the selection is confirmed (by the user, or automatically).
	 * For non-alwaysActive, it also ends the selection process.
	 */
	const changeValue = useCallback(
		(names: string[]) => {
			if (
				alwaysActive &&
				hasOtherPendingSelectionInScope(
					selectionOwnerKey,
					`${namespace}-${viewportId}`,
				)
			) {
				// Another selection owns an unconfirmed draft. Automatic
				// always-active retries are expected here and stay silent.
				return;
			}
			if (!alwaysActive) {
				setSelectionActive(false);
			}
			const parameterValue: SelectionParameterValue = {names};

			// if the value is already the same, do not change it
			const selectionWasCleared = clearedSinceLastConfirmationRef.current;
			clearedSinceLastConfirmationRef.current = false;
			if (
				value === JSON.stringify(parameterValue) &&
				!selectionWasCleared
			)
				return;
			const serializedValue = JSON.stringify(parameterValue);
			handleChange(
				serializedValue,
				0,
				() => {
					if (shouldAutoClear)
						requestSelectionAutoClear(
							selectionOwnerKey,
							serializedValue,
						);
				},
				// A selection cleared only in the UI can legitimately submit the
				// same value again. Keep that exception scoped to selection.
				selectionWasCleared,
			);
		},
		[
			alwaysActive,
			namespace,
			selectionOwnerKey,
			shouldAutoClear,
			value,
			viewportId,
		],
	);

	useEffect(() => {
		if (
			skipNextAutomaticConfirmationRef.current &&
			selectedNodeNames.length === 0
		) {
			skipNextAutomaticConfirmationRef.current = false;
			return;
		}
		if (acceptImmediately) changeValue(selectedNodeNames);
	}, [acceptImmediately, changeValue, selectedNodeNames]);

	/**
	 * Callback function to reset the selected node names.
	 * For non-alwaysActive, it also ends the selection process.
	 */
	const resetSelection = useCallback(
		(val: string) => {
			if (!alwaysActive) {
				setSelectionActive(false);
			}
			// Cancel is a committed reset, so remove the draft marker before any
			// other always-active selection can attempt an automatic update.
			clearPendingSelection(selectionOwnerKey);
			setSelectedNodeNames(parseNames(val));
		},
		[alwaysActive, selectionOwnerKey, setSelectedNodeNames],
	);

	/**
	 * Callback function to cancel the selection.
	 * For alwaysActive: resets to last committed value but stays enabled.
	 * For others: resets to last value and ends selection.
	 */
	const cancel = useCallback(() => {
		resetSelection(value);
	}, [resetSelection, value]);

	/**
	 * Callback function to clear the selection.
	 */
	const clearSelection = useCallback(() => {
		// Clearing is intentionally UI-only. Optional and single selections can
		// otherwise immediately auto-confirm the empty draft.
		skipNextAutomaticConfirmationRef.current = true;
		clearedSinceLastConfirmationRef.current = true;
		// This draft must be visible to other interaction parameters before the
		// selection manager emits its clear event. Otherwise an always-active
		// selection can submit independently while this parameter is invalid.
		markPendingSelection(selectionOwnerKey, `${namespace}-${viewportId}`);
		setSelectedNodeNamesAndRestoreSelection([]);
	}, [
		namespace,
		selectionOwnerKey,
		setSelectedNodeNamesAndRestoreSelection,
		viewportId,
	]);
	clearSelectionRef.current = clearSelection;
	const appliedAutoClearRevisionRef = useRef(0);
	useEffect(() => {
		if (
			!shouldAutoClear ||
			!autoClearRequest ||
			autoClearRequest.revision <= appliedAutoClearRevisionRef.current ||
			(autoClearRequest.value !== value &&
				autoClearRequest.value !== state.uiValue)
		)
			return;

		appliedAutoClearRevisionRef.current = autoClearRequest.revision;
		clearSelectionRef.current();
	}, [autoClearRequest, shouldAutoClear, state.uiValue, value]);

	const notifyConflict = useCallback(
		(title: string, message: string) =>
			notifications.warning({title, message}),
		[notifications],
	);
	const {tryAcquireClaim, releaseInteraction, takeOverInteraction} =
		useSelectionInteractionOwnership({
			viewportId,
			namespace,
			parameterId: definition.id,
			label: definition.name,
			candidateNodes,
			alwaysActive,
			automaticallyActivated,
			selectionRegistered,
			effectiveSelectionActive,
			setSelectionActive,
			setOwnershipBlocked,
			setSuspended,
			onDisable: deactivateSelection,
			setDisableOtherParameters: actions.setDisableOtherParameters,
			onConflict: notifyConflict,
		});

	// ── Toolbar registration ────────────────────────────────────────────────
	// Register with interaction toolbar if presentation is "toolbar"
	const toolbarLabel = definition.name;
	// Fixed/optional single selections normally commit automatically. A cleared
	// auto-clear draft only exposes Confirm/Cancel when its empty value is valid.
	const hasAutomaticSelectionControls = !(
		(minimumSelection === 1 && maximumSelection === 1) ||
		(minimumSelection === 0 && maximumSelection === 1)
	);
	const showConfirmationControls =
		hasOtherPendingSelection ||
		(shouldAutoClear && selectedNodeNames.length === 0
			? minimumSelection === 0 && hasPendingSelection
			: !acceptImmediately &&
				(hasAutomaticSelectionControls ||
					(hasPendingSelection && minimumSelection === 0)));

	const items = [
		createToolbarCheckboxItem({
			id: `${namespace}-${definition.id}-${viewportId}-toggle`,
			label: `${toolbarLabel} (${selectedNodeNames.length}/${maximumSelection})`,
			checked: effectiveSelectionActive,
			// A suspended persistent selection cannot safely resume until the
			// exclusive viewport interaction releases it. A blocked selection,
			// however, can be manually retried.
			readOnly: alwaysActive && effectiveSelectionActive,
			// Kept on the parameter's own checkbox row. Future parameter settings
			// can omit this action to hide Clear for that parameter.
			trailingAction: shouldShowClearButton
				? {
						label: `Clear ${toolbarLabel}`,
						icon: "tabler:circle-off",
						execute: clearSelection,
					}
				: undefined,
			setChecked: (checked) => {
				if (checked) {
					takeOverInteraction();
					if (tryAcquireClaim(true)) setSelectionActive(true);
				} else if (!alwaysActive) setSelectionActive(false);
			},
		}),
	];
	const commands = [];
	const serializedSelectionValue = JSON.stringify({
		names: selectedNodeNames,
	});

	// Add Confirm and Cancel buttons for multi/range selections
	if (showConfirmationControls) {
		commands.push(
			createToolbarCommand({
				id: `${namespace}-${definition.id}-${viewportId}-confirm`,
				label: "Confirm",
				icon: "tabler:check",
				aggregationId: "selection-confirm",
				order: 10,
				disabled: !dirty,
				execute: () => {
					if (!acceptable) {
						notifications.warning({
							title: "Selection cannot be confirmed",
							message: `"${definition.name}" must contain between ${minimumSelection} and ${maximumSelection} selected objects.`,
						});
						return;
					}
					changeValue(selectedNodeNames);
				},
				batchUpdate: acceptable
					? {
							namespace,
							parameterId: definition.id,
							value: serializedSelectionValue,
							onComplete: shouldAutoClear
								? () =>
										requestSelectionAutoClear(
											selectionOwnerKey,
											serializedSelectionValue,
										)
								: undefined,
							prepare: () => {
								restoreBatchSelectionRef.current = true;
								if (!alwaysActive) {
									releaseInteraction();
									setSelectionActive(false);
								}
							},
						}
					: undefined,
			}),
		);
		commands.push(
			createToolbarCommand({
				id: `${namespace}-${definition.id}-${viewportId}-cancel`,
				label: "Cancel",
				icon: "tabler:x",
				aggregationId: "selection-cancel",
				order: 20,
				disabled: !dirty,
				execute: cancel,
			}),
		);
	}
	useInteractionToolbarContribution({
		id: `${namespace}-${definition.id}-${viewportId}`,
		namespace,
		viewportId,
		presentation,
		sectionId: "selection",
		order: definition.order,
		menuVisibility: "multipleToggleable",
		menu: {
			id: "runtime-interaction-selection-menu",
			label: "Selection",
			icon: "tabler:hand-finger",
		},
		items,
		commands,
	});

	// Keep this registration hook above the presentation branch. Settings can
	// switch a selection parameter between widget and toolbar presentation while
	// it is mounted, and React requires the same hook sequence in both modes.
	const onCancelCallback = useCallback(() => {
		resetSelection(state.execValue);
	}, [resetSelection, state.execValue]);

	useEffect(() => {
		setOnCancelCallback(() => onCancelCallback);
	}, [onCancelCallback, setOnCancelCallback]);

	// Toolbar presentation owns the complete interaction UI; do not leave an
	// inline wrapper or parameter label behind in the widget tree.
	if (presentation === "toolbar") return <></>;

	/**
	 * The content of the parameter when it is active.
	 *
	 * It contains a button to confirm the selection and a button to cancel the selection
	 * as well as the number of selected nodes and the selection constraints.
	 *
	 * The confirm button is only enabled if the selection is within the constraints.
	 * The cancel button resets the selection to the last value.
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
							{selectionProps.prompt?.activeTitle ??
								`Currently selected: ${selectedNodeNames.length}`}
						</TextWeighted>
					</Box>
					{shouldShowClearButton && (
						<Box style={{width: "auto"}}>
							<ActionIcon
								onClick={clearSelection}
								variant={
									selectedNodeNames.length === 0
										? "light"
										: "filled"
								}
							>
								<Icon iconType={"tabler:circle-off"} />
							</ActionIcon>
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
							{selectionProps.prompt?.activeText ??
								(minimumSelection === maximumSelection
									? `Select ${minimumSelection} object${minimumSelection > 1 ? "s" : ""}`
									: `Select between ${minimumSelection} and ${maximumSelection} objects`)}
						</Text>
					</Box>
					<Box style={{width: "auto"}}>
						<Loader size={28} type="dots" />
					</Box>
				</Flex>
			</Group>

			{!(
				minimumSelection === maximumSelection &&
				Object.values(availableNodeNames).length >= minimumSelection
			) && (
				<Group justify="space-between" w="100%" wrap="nowrap">
					<Button
						fullWidth={true}
						disabled={!acceptable || !dirty}
						variant="filled"
						onClick={() => changeValue(selectedNodeNames)}
					>
						<Text>Confirm</Text>
					</Button>
					<Button fullWidth={true} variant={"light"} onClick={cancel}>
						<Text>Cancel</Text>
					</Button>
				</Group>
			)}
		</Stack>
	);

	/**
	 * The content of the parameter when it is inactive.
	 *
	 * It contains a button to start the selection.
	 * Within the button, the number of selected nodes is displayed.
	 */
	const contentInactive = (
		<Button
			justify="space-between"
			fullWidth={true}
			disabled={disabled}
			className={classes.interactionButton}
			rightSection={<Icon iconType={"tabler:hand-finger"} />}
			variant={selectedNodeNames.length === 0 ? "light" : "filled"}
			onClick={() => {
				if (tryAcquireClaim(true)) setSelectionActive(true);
			}}
		>
			<Text size="sm" className={classes.interactionText}>
				{selectionProps.prompt?.inactiveTitle ??
					`Start selection (${selectedNodeNames.length})`}
			</Text>
		</Button>
	);

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && effectiveSelectionActive
				? contentActive
				: contentInactive}
		</ParameterWrapperComponent>
	);
}
