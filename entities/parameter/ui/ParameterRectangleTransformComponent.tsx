import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {useInteractionOwnership} from "@AppBuilderLib/entities/parameter/model/interaction/useInteractionOwnership";
import {useParameterComponentCommons} from "@AppBuilderLib/entities/parameter/model/useParameterComponentCommons";
import ParameterLabelComponent from "@AppBuilderLib/entities/parameter/ui/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderLib/entities/parameter/ui/ParameterWrapperComponent";
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
	IRectangleTransformParameterProps,
	RectangleTransformParameterValue,
	validateRectangleTransformParameterSettings,
} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import type {ParameterRectangleTransformComponentStyleProps as StyleProps} from "../config/theme/parameterRectangleTransformComponentTheme";
import {resolveInteractionPresentation} from "../model/interaction/resolveInteractionPresentation";
import {useInteractionRequestLifecycle} from "../model/interaction/useInteractionRequestLifecycle";
import {useInteractionToolbarContribution} from "../model/interaction/useInteractionToolbarContribution";
import {useRectangleTransform} from "../model/interaction/useRectangleTransform";
import {
	requestSelectionAutoClear,
	useSelectionAutoClear,
} from "../model/interaction/useSelectionAutoClear";
import classes from "./ParameterInteractionComponent.module.css";

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
		Partial<IRectangleTransformParameterProps>,
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

	const {namespace} = props;

	const {selectionColor, availableColor, hoverColor} = useProps(
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
	}, [definition.settings, selectionColor, availableColor]);

	// state for the rectangle transform application
	const alwaysActive = rectangleTransformProps.activeMode === "alwaysActive";
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
	// store the parsed exec value in a state to react to changes
	const [parsedExecValue, setParsedExecValue] = useState<TransformedNode[]>(
		[],
	);
	const {viewportId} = useViewportId();
	const interactionOwnerKey = `${namespace}-${definition.id}-${viewportId}`;
	const shouldAutoClear = rectangleTransformProps.autoClear ?? false;
	const autoClearRequest = useSelectionAutoClear(interactionOwnerKey);
	const startsAutoCleared =
		shouldAutoClear && autoClearRequest?.value === value;

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
		startsAutoCleared ? [] : parseTransformation(value),
	);

	const rtLabel =
		rectangleTransformProps.prompt?.inactiveTitle ??
		"Start rectangle transform";

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
	 * This function is called when the rectangle transform interaction is confirmed.
	 * It also ends the rectangle transform interaction process and resets the selected nodes.
	 */
	const changeValue = useCallback(
		(transformedNodeNames: TransformedNode[]) => {
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
		active: rectangleTransformRegistered,
		persistent: alwaysActive,
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
		commands: hasPendingTransformation
			? [
					createToolbarCommand({
						id: `${namespace}-${definition.id}-${viewportId}-confirm`,
						aggregationId: "rectangle-transform-confirm",
						label: "Confirm",
						icon: "tabler:check",
						order: 10,
						disabled: !hasPendingTransformation,
						execute: () => changeValue(transformedNodeNames),
					}),
					createToolbarCommand({
						id: `${namespace}-${definition.id}-${viewportId}-cancel`,
						aggregationId: "rectangle-transform-cancel",
						label: "Cancel",
						icon: "tabler:x",
						order: 20,
						disabled: !hasPendingTransformation,
						execute: resetTransformation,
					}),
				]
			: [],
	});

	if (rectanglePresentation === "toolbar") return <></>;

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && effectiveRectangleActive
				? contentActive
				: contentInactive}
		</ParameterWrapperComponent>
	);
}
