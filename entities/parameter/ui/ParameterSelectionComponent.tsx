import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {
	createToolbarCheckboxItem,
	createToolbarCommand,
} from "@AppBuilderLib/features/appbuilder/model/createToolbarItems";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import TextWeighted from "@AppBuilderLib/shared/ui/text/TextWeighted";
import {ToolbarMenuItem} from "@AppBuilderShared/features/appbuilder/config/toolbarRenderTypes";
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
import {POST_PROCESSING_EFFECT_TYPE} from "@shapediver/viewer.shared.types";
import {BlendFunction, KernelSize} from "@shapediver/viewer.viewport";
import {useCallback, useEffect, useMemo, useState} from "react";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "../config/propsParameter";
import type {ParameterSelectionComponentStyleProps as StyleProps} from "../config/theme/parameterSelectionComponentTheme";
import {resolveInteractionPresentation} from "../model/interaction/resolveInteractionPresentation";
import {useInteractionToolbarContribution} from "../model/interaction/useInteractionToolbarContribution";
import {useSelection} from "../model/interaction/useSelection";
import {useSelectionInteractionOwnership} from "../model/interaction/useSelectionInteractionOwnership";
import {useParameterComponentCommons} from "../model/useParameterComponentCommons";
import classes from "./ParameterInteractionComponent.module.css";
import ParameterLabelComponent from "./ParameterLabelComponent";
import ParameterWrapperComponent from "./ParameterWrapperComponent";

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

const defaultStyleProps: StyleProps = {
	selectionColor: {
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

	// settings validation
	const selectionProps = useMemo(() => {
		const result = validateSelectionParameterSettings(definition.settings);
		if (result.success) {
			const props = result.data.props as ISelectionParameterProps;
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
			} as ISelectionParameterProps;
		}
	}, [definition.settings, selectionColor, availableColor]);

	const minimumSelection = selectionProps?.minimumSelection ?? 1;
	const maximumSelection = selectionProps?.maximumSelection ?? 1;
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
	const [selectionActive, setSelectionActive] = useState<boolean>(
		automaticallyActivated,
	);

	// Track whether this persistent selection is suspended by an exclusive tool.
	// Always-active selections use passive interaction requests so the store can
	// disable (suspend) and later re-enable (resume) them when exclusive tools
	// claim and release the viewport.
	const [suspended, setSuspended] = useState(false);
	const [ownershipBlocked, setOwnershipBlocked] = useState(
		automaticallyActivated,
	);
	const effectiveSelectionActive =
		!suspended && !ownershipBlocked && (alwaysActive || selectionActive);
	// Keep a suspended always-active request registered for later resume, but do
	// not register selections whose candidate ownership was rejected.
	const selectionRegistered =
		!ownershipBlocked && (alwaysActive || selectionActive);

	// state for the dirty flag
	const [dirty, setDirty] = useState<boolean>(false);

	// get the viewport ID
	const {viewportId} = useViewportId();

	const {
		candidateNodes,
		availableNodeNames,
		selectedNodeNames,
		setSelectedNodeNames,
		setSelectedNodeNamesAndRestoreSelection,
	} = useSelection(
		viewportId,
		selectionProps,
		effectiveSelectionActive,
		parseNames(value),
	);

	const acceptable =
		selectedNodeNames.length >= minimumSelection &&
		selectedNodeNames.length <= maximumSelection;
	// Always-active multi-selections submit immediately when their configured
	// maximum is reached. Non-persistent selections retain the established
	// fixed/single auto-commit behavior.
	const acceptImmediately =
		(alwaysActive && selectedNodeNames.length === maximumSelection) ||
		((minimumSelection === maximumSelection ||
			(minimumSelection === 0 && maximumSelection === 1)) &&
			acceptable);

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

	// reset the selected node names when the definition changes
	useEffect(() => {
		const parsed = parseNames(value);
		if (JSON.stringify(parsed) !== JSON.stringify(selectedNodeNames))
			setSelectedNodeNames(parsed);
	}, [JSON.stringify(definition)]);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the selection is confirmed (by the user, or automatically).
	 * For non-alwaysActive, it also ends the selection process.
	 */
	const changeValue = useCallback(
		(names: string[]) => {
			if (!alwaysActive) {
				setSelectionActive(false);
			}
			const parameterValue: SelectionParameterValue = {names};

			// if the value is already the same, do not change it
			if (value === JSON.stringify(parameterValue)) return;
			handleChange(JSON.stringify(parameterValue), 0);
		},
		[value, alwaysActive],
	);

	// Preserve the established immediate-update path. The canonical-value check
	// in changeValue prevents duplicate parameter updates.
	useEffect(() => {
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
			setSelectedNodeNames(parseNames(val));
		},
		[alwaysActive],
	);

	// react to changes of the uiValue and update the selection state if necessary
	useEffect(() => {
		const names = parseNames(state.uiValue);
		// compare names to selectedNodeNames
		if (
			names.length !== selectedNodeNames.length ||
			!names.every((n, i) => n === selectedNodeNames[i])
		) {
			if (!alwaysActive) {
				setSelectionActive(false);
			}
			setSelectedNodeNames(names);
		}
	}, [state.uiValue, alwaysActive]);

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
		setSelectedNodeNamesAndRestoreSelection([]);
	}, []);

	const restoreSelection = useCallback(
		() => setSelectedNodeNames(parseNames(value)),
		[parseNames, setSelectedNodeNames, value],
	);
	const notifyConflict = useCallback(
		(title: string, message: string) =>
			notifications.warning({title, message}),
		[notifications],
	);
	const {tryAcquireClaim} = useSelectionInteractionOwnership({
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
		cancel,
		restoreSelection,
		setDisableOtherParameters: actions.setDisableOtherParameters,
		onConflict: notifyConflict,
	});

	// ── Toolbar registration ────────────────────────────────────────────────
	// Register with interaction toolbar if presentation is "toolbar"
	const toolbarLabel = definition.name;
	// Fixed/optional single selections use the immediate-update path, so their
	// Confirm and Cancel controls would be redundant. Multi and range selections
	// retain explicit confirmation controls.
	const showConfirmationControls = !(
		(minimumSelection === 1 && maximumSelection === 1) ||
		(minimumSelection === 0 && maximumSelection === 1)
	);

	const items: ToolbarMenuItem[] = [];

	items.push(
		createToolbarCheckboxItem({
			id: `${namespace}-${definition.id}-${viewportId}-toggle`,
			label: `${toolbarLabel} (${selectedNodeNames.length})`,
			checked: effectiveSelectionActive,
			readOnly: alwaysActive,
			setChecked: (checked) => {
				if (alwaysActive) return;
				if (checked) {
					if (tryAcquireClaim(true)) setSelectionActive(true);
				} else setSelectionActive(false);
			},
		}),
	);

	// Add Confirm and Cancel buttons for multi/range selections
	if (showConfirmationControls) {
		items.push(
			createToolbarCommand({
				id: `${namespace}-${definition.id}-${viewportId}-confirm`,
				label: "Confirm",
				icon: "tabler:check",
				disabled: !showConfirmationControls || !acceptable || !dirty,
				execute: () => changeValue(selectedNodeNames),
			}),
		);
		items.push(
			createToolbarCommand({
				id: `${namespace}-${definition.id}-${viewportId}-cancel`,
				label: "Cancel",
				icon: "tabler:x",
				disabled: !showConfirmationControls || !acceptable || !dirty,
				execute: cancel,
			}),
		);
	}
	items.push(
		createToolbarCommand({
			id: `${namespace}-${definition.id}-${viewportId}-clear`,
			label: "Clear",
			icon: "tabler:circle-off",
			execute: clearSelection,
		}),
	);

	useInteractionToolbarContribution({
		id: `${namespace}-${definition.id}-${viewportId}`,
		namespace,
		viewportId,
		presentation,
		menu: {
			id: `${namespace}-${definition.id}-${viewportId}-selection-menu`,
			label: toolbarLabel,
			icon: "tabler:hand-finger",
		},
		items,
	});

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

	// extend the onCancel callback to reset the selected node names.
	const _onCancelCallback = useCallback(() => {
		resetSelection(state.execValue);
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
			{definition && effectiveSelectionActive
				? contentActive
				: contentInactive}
		</ParameterWrapperComponent>
	);
}
