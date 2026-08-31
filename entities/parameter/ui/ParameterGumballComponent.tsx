import {useInteractionOwnership} from "@AppBuilderLib/entities/parameter/model/interaction/useInteractionOwnership";
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
	GumballTransformParameterValue,
	IGumballTransformParameterProps,
	validateGumballTransformParameterSettings,
} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "../config/propsParameter";
import type {ParameterGumballComponentStyleProps as StyleProps} from "../config/theme/parameterGumballComponentTheme";
import {resolveInteractionPresentation} from "../model/interaction/resolveInteractionPresentation";
import {useGumball} from "../model/interaction/useGumball";
import {useInteractionRequestLifecycle} from "../model/interaction/useInteractionRequestLifecycle";
import {useInteractionToolbarContribution} from "../model/interaction/useInteractionToolbarContribution";
import {
	requestSelectionAutoClear,
	useSelectionAutoClear,
} from "../model/interaction/useSelectionAutoClear";
import {useParameterComponentCommons} from "../model/useParameterComponentCommons";
import classes from "./ParameterInteractionComponent.module.css";
import ParameterLabelComponent from "./ParameterLabelComponent";
import ParameterResetRow from "./ParameterResetRow";
import ParameterWrapperComponent from "./ParameterWrapperComponent";

type TransformedNode = {
	name: string;
	transformation: number[];
	localTransformations?: number[];
};

/**
 * Parse the value of a gumball parameter and extract the transformed node names.
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
 * Functional component that creates a switch component for a gumball parameter.
 *
 * @returns
 */
export default function ParameterGumballComponent(
	props: PropsParameter &
		Partial<PropsParameterWrapper> &
		Partial<IGumballTransformParameterProps>,
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
	} = useParameterComponentCommons<string>(props);

	const {namespace} = props;

	const {selectionColor, availableColor, hoverColor} = useProps(
		"ParameterGumballComponent",
		defaultStyleProps,
		props,
	);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterGumballComponent",
		defaultPropsParameterWrapper,
		props,
	);

	// get the notification store
	const notifications = useNotificationStore();

	// settings validation
	const gumballProps = useMemo(() => {
		const result = validateGumballTransformParameterSettings(
			definition.settings,
		);
		if (result.success) {
			const props = result.data.props as IGumballTransformParameterProps;
			if (!props.selectionColor) props.selectionColor = selectionColor;
			if (!props.availableColor) props.availableColor = availableColor;
			if (!props.hoverColor) props.hoverColor = hoverColor;
			return props;
		} else {
			notifications.error({
				title: "Invalid Parameter Settings",
				message: `Invalid settings for Gumball parameter "${definition.name}", see console for details.`,
			});
			Logger.warn(
				`Invalid settings for Gumball parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
			);
			return {
				selectionColor,
				availableColor,
				hoverColor,
			} as IGumballTransformParameterProps;
		}
	}, [definition.settings, selectionColor, availableColor]);

	// state for the gumball application
	const alwaysActive = gumballProps.activeMode === "alwaysActive";
	const gumballPresentation = resolveInteractionPresentation(
		gumballProps.presentation,
		alwaysActive,
	);
	const [gumballActive, setGumballActive] = useState(false);
	// store the last confirmed value in a state to reset the transformation
	const [lastConfirmedValue, setLastConfirmedValue] = useState<
		TransformedNode[]
	>([]);
	// store the parsed exec value in a state to react to changes
	const [parsedExecValue, setParsedExecValue] = useState<TransformedNode[]>(
		[],
	);
	const {viewportId} = useViewportId();
	const interactionOwnerKey = `${namespace}-${definition.id}-${viewportId}`;
	const shouldAutoClear = gumballProps.autoClear ?? false;
	const autoClearRequest = useSelectionAutoClear(interactionOwnerKey);
	const startsAutoCleared =
		shouldAutoClear && autoClearRequest?.value === value;

	// get the transformed nodes and the selected nods
	const {
		candidateNodes,
		transformedNodeNames,
		setTransformedNodeNames,
		setSelectedNodeNames,
		restoreTransformedNodeNames,
		closeTransform,
	} = useGumball(
		sessionDependencies,
		viewportId,
		gumballProps,
		gumballActive,
		startsAutoCleared ? [] : parseTransformation(value),
	);

	const gumballLabel = gumballProps.prompt?.inactiveTitle ?? "Start gumball";

	const automaticallyActivated =
		alwaysActive || gumballProps.activeMode === "activeOnStart";
	const [gumballSuspended, setGumballSuspended] = useState(false);
	const {ownershipBlocked, tryAcquireClaim} = useInteractionOwnership({
		viewportId,
		ownerKey: interactionOwnerKey,
		ownerLabel: gumballLabel,
		type: "gumball",
		// Persistent transforms can be suspended by a user-requested interaction,
		// just like persistent selection parameters.
		alwaysActive: false,
		automaticallyActivated,
		candidateNodes,
		active: gumballActive,
	});
	const gumballRegistered = gumballActive && !ownershipBlocked;
	const effectiveGumballActive = gumballRegistered && !gumballSuspended;
	useEffect(() => {
		if (ownershipBlocked) {
			setGumballSuspended(false);
			setGumballActive(false);
		} else if (automaticallyActivated) setGumballActive(true);
	}, [automaticallyActivated, ownershipBlocked]);

	const transformedNodeNamesRef = useRef(transformedNodeNames);
	useEffect(() => {
		transformedNodeNamesRef.current = transformedNodeNames;
	}, [transformedNodeNames]);
	const restartPersistentTransform = useCallback(() => {
		setGumballActive(false);
		window.requestAnimationFrame(() => {
			if (tryAcquireClaim(true)) setGumballActive(true);
		});
	}, [tryAcquireClaim]);

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
		closeTransform();
		restoreTransformedNodeNames(
			[],
			structuredClone(transformedNodeNamesRef.current),
		);
		setTransformedNodeNames([]);
		if (alwaysActive) restartPersistentTransform();
	}, [
		alwaysActive,
		autoClearRequest,
		closeTransform,
		restartPersistentTransform,
		restoreTransformedNodeNames,
		shouldAutoClear,
		state.uiValue,
		value,
	]);

	// react to changes of the execValue and reset the last confirmed value
	useEffect(() => {
		const parsedExecValue = parseTransformation(state.execValue);
		setParsedExecValue(structuredClone(parsedExecValue));
		setLastConfirmedValue(structuredClone(parsedExecValue));
		setTransformedNodeNames(
			structuredClone(startsAutoCleared ? [] : parsedExecValue),
		);
	}, [startsAutoCleared, state.execValue]);

	// reset the transformed nodes when the definition changes
	useEffect(() => {
		const parsed = parseTransformation(definition.defval);
		if (
			JSON.stringify(parsed) !==
			JSON.stringify(transformedNodeNamesRef.current)
		) {
			setParsedExecValue(structuredClone(parsed));
			setLastConfirmedValue(structuredClone(parsed));
			setTransformedNodeNames(structuredClone(parsed));
		}
	}, [JSON.stringify(definition)]);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the gumball interaction is confirmed.
	 * It also ends the gumball interaction process and resets the selected nodes.
	 */
	const changeValue = useCallback(
		(transformedNodeNames: TransformedNode[]) => {
			if (!alwaysActive) setGumballActive(false);
			const parameterValue: GumballTransformParameterValue = {
				names: transformedNodeNames.map((node) => node.name),
				transformations: transformedNodeNames.map(
					(node) => node.transformation,
				),
			};

			// create a deep copy of the transformed node names
			setLastConfirmedValue(structuredClone(transformedNodeNames));
			// if the value is already the same, do not change it
			const serializedValue = JSON.stringify(parameterValue);
			if (value === serializedValue) {
				if (shouldAutoClear)
					requestSelectionAutoClear(
						interactionOwnerKey,
						serializedValue,
					);
				else if (!alwaysActive) setSelectedNodeNames([]);
				return;
			}
			handleChange(serializedValue, 0, () => {
				if (shouldAutoClear)
					requestSelectionAutoClear(
						interactionOwnerKey,
						serializedValue,
					);
			});
			if (!alwaysActive) setSelectedNodeNames([]);
		},
		[alwaysActive, interactionOwnerKey, shouldAutoClear, value],
	);

	const restartAfterCancel = useCallback(() => {
		if (!alwaysActive) {
			setGumballActive(false);
			setSelectedNodeNames([]);
			return;
		}

		restartPersistentTransform();
	}, [alwaysActive, restartPersistentTransform]);

	/**
	 * Callback function to reset the transformed nodes.
	 * This function is called when the gumball interaction is aborted by the user.
	 * The transformed nodes are reset to the last confirmed value.
	 * It also ends the gumball.
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
			structuredClone(parsedExecValue),
			structuredClone(transformedNodeNames),
		);
		restartAfterCancel();
		setLastConfirmedValue(structuredClone(parsedExecValue));
	}, [
		closeTransform,
		parsedExecValue,
		restartAfterCancel,
		transformedNodeNames,
	]);

	useEffect(() => {
		setOnCancelCallback(() => _onCancelCallback);
	}, [_onCancelCallback]);

	const {takeOverInteraction} = useInteractionRequestLifecycle({
		viewportId,
		active: gumballRegistered,
		persistent: alwaysActive,
		onDisable: resetTransformation,
		onSuspend: () => setGumballSuspended(true),
		onResume: () => setGumballSuspended(false),
		setDisableOtherParameters: actions.setDisableOtherParameters,
	});

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
			<Group justify="space-between" className={classes.interactionMain}>
				<Flex align="center" justify="flex-start" w={"100%"}>
					<Box style={{flex: 1}}>
						<TextWeighted
							size="sm"
							fontWeight="medium"
							ta="left"
							className={classes.interactionText}
						>
							{gumballProps.prompt?.activeTitle ??
								`Currently transformed: ${transformedNodeNames.length}`}
						</TextWeighted>
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
							{gumballProps.prompt?.activeText ??
								"Select objects to transform"}
						</Text>
					</Box>
					<Box style={{width: "auto"}}>
						<Loader size={28} type="dots" />
					</Box>
				</Flex>
			</Group>

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
			rightSection={<Icon iconType={"tabler:hand-finger"} />}
			variant={transformedNodeNames.length === 0 ? "light" : "filled"}
			onClick={() => {
				takeOverInteraction();
				if (tryAcquireClaim(true)) setGumballActive(true);
			}}
		>
			<Text size="sm" className={classes.interactionText}>
				{gumballProps.prompt?.inactiveTitle ?? "Start gumball"}
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
		presentation: gumballPresentation,
		sectionId: "gumball",
		order: definition.order,
		menuVisibility: "multipleToggleable",
		menu: {
			id: "runtime-interaction-gumball-menu",
			label: "Gumball",
			icon: "tabler:axis-3d",
		},
		items: [
			createToolbarCheckboxItem({
				id: `${namespace}-${definition.id}-${viewportId}-toggle`,
				label: gumballLabel,
				checked: effectiveGumballActive,
				readOnly: alwaysActive && effectiveGumballActive,
				setChecked: (checked) => {
					if (checked) {
						takeOverInteraction();
						if (tryAcquireClaim(true)) setGumballActive(true);
					} else if (!alwaysActive) setGumballActive(false);
				},
			}),
		],
		commands: hasPendingTransformation
			? [
					createToolbarCommand({
						id: `${namespace}-${definition.id}-${viewportId}-confirm`,
						aggregationId: "gumball-confirm",
						label: "Confirm",
						icon: "tabler:check",
						order: 10,
						disabled: !hasPendingTransformation,
						execute: () => changeValue(transformedNodeNames),
					}),
					createToolbarCommand({
						id: `${namespace}-${definition.id}-${viewportId}-cancel`,
						aggregationId: "gumball-cancel",
						label: "Cancel",
						icon: "tabler:x",
						order: 20,
						disabled: !hasPendingTransformation,
						execute: resetTransformation,
					}),
				]
			: [],
	});

	if (gumballPresentation === "toolbar") return <></>;

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
					{effectiveGumballActive ? contentActive : contentInactive}
				</ParameterResetRow>
			)}
		</ParameterWrapperComponent>
	);
}
