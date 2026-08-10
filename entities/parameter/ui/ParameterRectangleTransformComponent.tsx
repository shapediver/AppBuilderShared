import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {useParameterComponentCommons} from "@AppBuilderLib/entities/parameter/model/useParameterComponentCommons";
import ParameterLabelComponent from "@AppBuilderLib/entities/parameter/ui/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderLib/entities/parameter/ui/ParameterWrapperComponent";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {useInteractionOwnership} from "@AppBuilderLib/entities/parameter/model/interaction/useInteractionOwnership";
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
import {
	createToolbarCheckboxItem,
	createToolbarCommand,
} from "@AppBuilderLib/features/appbuilder/model/createToolbarItems";
import {useRectangleTransform} from "../model/interaction/useRectangleTransform";
import {useInteractionToolbarContribution} from "../model/interaction/useInteractionToolbarContribution";
import {useShapeDiverStoreInteractionRequestManagement} from "../model/useShapeDiverStoreInteractionRequestManagement";
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
		intensity: 0.4,
		pulseSpeed: 1,
	} as IInteractionEffect,
	availableColor: {
		type: "pulse",
		color: "#ffffff",
		intensity: 0.4,
		pulseSpeed: 1,
	} as IInteractionEffect,
	hoverColor: {
		type: "pulse",
		color: "#ffffff",
		intensity: 0.4,
		pulseSpeed: 1.5,
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

	// get the interaction request management
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();

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
	const rectanglePresentation =
		rectangleTransformProps.presentation ?? "widget";
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
	// reference to manage the interaction request token
	const interactionRequestTokenRef = useRef<string | undefined>(undefined);

	const {viewportId} = useViewportId();

	// get the transformed nodes and the selected nodes
	const {
		candidateNodes,
		transformedNodeNames,
		setTransformedNodeNames,
		setSelectedNodeNames,
		restoreTransformedNodeNames,
	} = useRectangleTransform(
		sessionDependencies,
		viewportId,
		rectangleTransformProps,
		rectangleTransformActive,
		parseTransformation(value),
	);

	const rtLabel =
		rectangleTransformProps.prompt?.inactiveTitle ??
		"Start rectangle transform";

	const automaticallyActivated =
		rectangleTransformProps.activeMode === "activeOnStart";
	const {ownershipBlocked, tryAcquireClaim} = useInteractionOwnership({
		viewportId,
		ownerKey: `${namespace}-${definition.id}-${viewportId}`,
		ownerLabel: rtLabel,
		type: "rectangleTransform",
		alwaysActive: false,
		automaticallyActivated,
		candidateNodes,
		active: rectangleTransformActive,
	});
	const effectiveRectangleActive = rectangleTransformActive && !ownershipBlocked;
	useEffect(() => {
		if (ownershipBlocked) setRectangleTransformActive(false);
		else if (automaticallyActivated) setRectangleTransformActive(true);
	}, [automaticallyActivated, ownershipBlocked]);

	const transformedNodeNamesRef = useRef(transformedNodeNames);
	useEffect(() => {
		transformedNodeNamesRef.current = transformedNodeNames;
	}, [transformedNodeNames]);

	// react to changes of the execValue and reset the last confirmed value
	useEffect(() => {
		const parsedExecValue = parseTransformation(state.execValue);
		setParsedExecValue(structuredClone(parsedExecValue));
		setLastConfirmedValue(structuredClone(parsedExecValue));
		setTransformedNodeNames(structuredClone(parsedExecValue));
	}, [state.execValue]);

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
			setRectangleTransformActive(false);
			const parameterValue: RectangleTransformParameterValue = {
				names: transformedNodeNames.map((node) => node.name),
				transformations: transformedNodeNames.map(
					(node) => node.transformation,
				),
			};

			// create a deep copy of the transformed node names
			setLastConfirmedValue(structuredClone(transformedNodeNames));
			// if the value is already the same, do not change it
			if (value === JSON.stringify(parameterValue)) return;
			handleChange(JSON.stringify(parameterValue), 0);
			setSelectedNodeNames([]);
		},
		[value],
	);

	/**
	 * Callback function to reset the transformed nodes.
	 * This function is called when the rectangle transform interaction is aborted by the user.
	 * The transformed nodes are reset to the last confirmed value.
	 * It also ends the rectangle transform.
	 */
	const resetTransformation = useCallback(() => {
		restoreTransformedNodeNames(
			structuredClone(lastConfirmedValue),
			structuredClone(transformedNodeNames),
		);
		setRectangleTransformActive(false);
		setSelectedNodeNames([]);
	}, [lastConfirmedValue, transformedNodeNames]);

	// extend the onCancel callback to reset the transformed nodes.
	const _onCancelCallback = useCallback(() => {
		restoreTransformedNodeNames(
			structuredClone(parsedExecValue),
			structuredClone(transformedNodeNames),
		);
		setRectangleTransformActive(false);
		setSelectedNodeNames([]);
		setLastConfirmedValue(structuredClone(parsedExecValue));
	}, [parsedExecValue, transformedNodeNames]);

	useEffect(() => {
		setOnCancelCallback(() => _onCancelCallback);
	}, [_onCancelCallback]);

	/**
	 * Effect to manage the interaction request for the rectangle transform.
	 * It adds an interaction request when the rectangle transform is active and removes it when inactive.
	 * It also cleans up the interaction request when the component is unmounted or when the state changes.
	 */
	useEffect(() => {
		actions.setDisableOtherParameters(effectiveRectangleActive);

		if (effectiveRectangleActive && !interactionRequestTokenRef.current) {
			const returnedToken = addInteractionRequest({
				type: "active",
				viewportId,
				disable: resetTransformation,
			});
			interactionRequestTokenRef.current = returnedToken;
		} else if (
			!effectiveRectangleActive &&
			interactionRequestTokenRef.current
		) {
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
	}, [effectiveRectangleActive, resetTransformation]);

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
			onClick={() => { if (tryAcquireClaim(true)) setRectangleTransformActive(true); }}
		>
			<Text size="sm" className={classes.interactionText}>
				{rectangleTransformProps.prompt?.inactiveTitle ??
					"Start rectangle transform"}
			</Text>
		</Button>
	);

	// Register with interaction toolbar if presentation is "toolbar"

	useInteractionToolbarContribution({
		id: `${namespace}-${definition.id}-${viewportId}`,
		namespace,
		viewportId,
		presentation: rectanglePresentation,
		sectionId: "rectangle-transform",
		order: definition.order,
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
				setChecked: (checked) => {
					if (checked) {
						if (tryAcquireClaim(true)) setRectangleTransformActive(true);
					} else setRectangleTransformActive(false);
				},
			}),
		],
		commands: [
			createToolbarCommand({
				id: `${namespace}-${definition.id}-${viewportId}-confirm`,
				label: "Confirm",
				icon: "tabler:check",
				disabled: transformedNodeNames.length === 0,
				execute: () => changeValue(transformedNodeNames),
			}),
			createToolbarCommand({
				id: `${namespace}-${definition.id}-${viewportId}-cancel`,
				label: "Cancel",
				icon: "tabler:x",
				disabled: transformedNodeNames.length === 0,
				execute: resetTransformation,
			}),
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
			{definition && effectiveRectangleActive
				? contentActive
				: contentInactive}
		</ParameterWrapperComponent>
	);
}
