import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {useSelection} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/selection/useSelection";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderShared/store/useShapeDiverStoreInteractionRequestManagement";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	ActionIcon,
	Box,
	Button,
	Flex,
	Group,
	Loader,
	Stack,
	Text,
	useProps,
} from "@mantine/core";
import {
	ISelectionParameterProps,
	SelectionParameterValue,
	validateSelectionParameterSettings,
} from "@shapediver/viewer.session";
import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import classes from "./ParameterInteractionComponent.module.css";

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

/**
 * Functional component that creates a selection parameter, allowing selection of objects in the viewport.
 *
 * @returns
 */
export default function ParameterSelectionComponent(
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
	} = useParameterComponentCommons<string>(props);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterSelectionComponent",
		defaultPropsParameterWrapper,
		props,
	);

	// get the interaction request management
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();

	// get the notification context
	const notifications = useContext(NotificationContext);

	// settings validation
	const selectionProps = useMemo(() => {
		const result = validateSelectionParameterSettings(definition.settings);
		if (result.success) {
			return result.data.props as ISelectionParameterProps;
		} else {
			notifications.error({
				title: "Invalid Parameter Settings",
				message: `Invalid settings for Selection parameter "${definition.name}", see console for details.`,
			});
			console.warn(
				`Invalid settings for Selection parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
			);
			return {};
		}
	}, [definition.settings]);

	const minimumSelection = selectionProps?.minimumSelection ?? 1;
	const maximumSelection = selectionProps?.maximumSelection ?? 1;

	// is the selection active or not?
	const [selectionActive, setSelectionActive] = useState<boolean>(false);
	// state for the dirty flag
	const [dirty, setDirty] = useState<boolean>(false);
	// state to manage the interaction request token
	const [interactionRequestToken, setInteractionRequestToken] = useState<
		string | undefined
	>(undefined);

	// get the viewport ID
	const {viewportId} = useViewportId();

	const {
		selectedNodeNames,
		setSelectedNodeNames,
		setSelectedNodeNamesAndRestoreSelection,
	} = useSelection(
		viewportId,
		selectionProps,
		selectionActive,
		parseNames(value),
	);

	// check if the current selection is within the constraints
	const acceptable =
		selectedNodeNames.length >= minimumSelection &&
		selectedNodeNames.length <= maximumSelection;
	const acceptImmediately =
		(minimumSelection === maximumSelection ||
			(minimumSelection === 0 && maximumSelection === 1)) &&
		acceptable;

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
	}, [definition]);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the selection is confirmed (by the user, or automatically).
	 * It also ends the selection process.
	 */
	const changeValue = useCallback(
		(names: string[]) => {
			setSelectionActive(false);
			const parameterValue: SelectionParameterValue = {names};

			// if the value is already the same, do not change it
			if (value === JSON.stringify(parameterValue)) return;
			handleChange(JSON.stringify(parameterValue), 0);
		},
		[value],
	);

	// check whether the selection should be accepted immediately
	useEffect(() => {
		if (acceptImmediately) changeValue(selectedNodeNames);
	}, [acceptImmediately, selectedNodeNames, changeValue]);

	/**
	 * Callback function to reset the selected node names.
	 * This function is called when the selection is aborted by the user.
	 * It also ends the selection process.
	 */
	const resetSelection = useCallback((val: string) => {
		setSelectionActive(false);
		setSelectedNodeNames(parseNames(val));
	}, []);

	// react to changes of the uiValue and update the selection state if necessary
	useEffect(() => {
		const names = parseNames(state.uiValue);
		// compare names to selectedNodeNames
		if (
			names.length !== selectedNodeNames.length ||
			!names.every((n, i) => n === selectedNodeNames[i])
		) {
			setSelectionActive(false);
			setSelectedNodeNames(names);
		}
	}, [state.uiValue]);

	/**
	 * Callback function to cancel the selection.
	 * It resets the selection to the last value and ends the selection process.
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

	/**
	 * Effect to manage the interaction request for the selection.
	 * It adds an interaction request when the selection is active and removes it when the selection is inactive.
	 * It also cleans up the interaction request when the component is unmounted or when the selection state changes.
	 */
	useEffect(() => {
		if (selectionActive && !interactionRequestToken) {
			const returnedToken = addInteractionRequest({
				type: "active",
				viewportId,
				disable: cancel,
			});
			setInteractionRequestToken(returnedToken);
		} else if (!selectionActive && interactionRequestToken) {
			removeInteractionRequest(interactionRequestToken);
			setInteractionRequestToken(undefined);
		}

		return () => {
			if (interactionRequestToken) {
				removeInteractionRequest(interactionRequestToken);
				setInteractionRequestToken(undefined);
			}
		};
	}, [selectionActive, interactionRequestToken, cancel]);

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
							<Icon type={IconTypeEnum.CircleOff} />
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

			{minimumSelection !== maximumSelection && (
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
			rightSection={<Icon type={IconTypeEnum.IconHandFinger} />}
			variant={selectedNodeNames.length === 0 ? "light" : "filled"}
			onClick={() => setSelectionActive(true)}
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
			{definition && selectionActive ? contentActive : contentInactive}
		</ParameterWrapperComponent>
	);
}
