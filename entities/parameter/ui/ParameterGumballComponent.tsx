import {useViewportId} from "@AppBuilderLib/entities/viewport";
import {useNotificationStore} from "@AppBuilderLib/features/notifications";
import {Logger} from "@AppBuilderLib/shared/lib";
import {Icon} from "@AppBuilderLib/shared/ui/icon";
import {TextWeighted} from "@AppBuilderLib/shared/ui/text";
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
import {IInteractionEffect} from "@shapediver/viewer.features.interaction/dist/interfaces/utils/IInteractionEffectUtils";
import {
	GumballTransformParameterValue,
	IGumballTransformParameterProps,
	validateGumballTransformParameterSettings,
} from "@shapediver/viewer.session";
import {POST_PROCESSING_EFFECT_TYPE} from "@shapediver/viewer.shared.types";
import {BlendFunction, KernelSize} from "@shapediver/viewer.viewport";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "../config/propsParameter";
import type {ParameterGumballComponentStyleProps as StyleProps} from "../config/theme/parameterGumballComponentTheme";
import {
	useGumball,
	useShapeDiverStoreInteractionRequestManagement,
} from "../model";
import {useParameterComponentCommons} from "../model/useParameterComponentCommons";
import classes from "./ParameterInteractionComponent.module.css";
import ParameterLabelComponent from "./ParameterLabelComponent";
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
		value,
		state,
		sessionDependencies,
	} = useParameterComponentCommons<string>(props);

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

	// get the interaction request management
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();

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
	const [gumballActive, setGumballActive] = useState<boolean>(
		gumballProps.activeMode === "activeOnStart" ? true : false,
	);
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

	// get the transformed nodes and the selected nods
	const {
		transformedNodeNames,
		setTransformedNodeNames,
		setSelectedNodeNames,
		restoreTransformedNodeNames,
	} = useGumball(
		sessionDependencies,
		viewportId,
		gumballProps,
		gumballActive,
		parseTransformation(value),
	);

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
	 * This function is called when the gumball interaction is confirmed.
	 * It also ends the gumball interaction process and resets the selected nodes.
	 */
	const changeValue = useCallback(
		(transformedNodeNames: TransformedNode[]) => {
			setGumballActive(false);
			const parameterValue: GumballTransformParameterValue = {
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
	 * This function is called when the gumball interaction is aborted by the user.
	 * The transformed nodes are reset to the last confirmed value.
	 * It also ends the gumball.
	 */
	const resetTransformation = useCallback(() => {
		restoreTransformedNodeNames(
			structuredClone(lastConfirmedValue),
			structuredClone(transformedNodeNames),
		);
		setGumballActive(false);
		setSelectedNodeNames([]);
	}, [lastConfirmedValue, transformedNodeNames]);

	// extend the onCancel callback to reset the transformed nodes.
	const _onCancelCallback = useCallback(() => {
		restoreTransformedNodeNames(
			structuredClone(parsedExecValue),
			structuredClone(transformedNodeNames),
		);
		setGumballActive(false);
		setSelectedNodeNames([]);
		setLastConfirmedValue(structuredClone(parsedExecValue));
	}, [parsedExecValue, transformedNodeNames]);

	useEffect(() => {
		setOnCancelCallback(() => _onCancelCallback);
	}, [_onCancelCallback]);

	/**
	 * Effect to manage the interaction request for the gumball.
	 * It adds an interaction request when the gumball is active and removes it when the gumball is inactive.
	 * It also cleans up the interaction request when the component is unmounted or when the gumball state changes.
	 */
	useEffect(() => {
		actions.setDisableOtherParameters(gumballActive);

		if (gumballActive && !interactionRequestTokenRef.current) {
			const returnedToken = addInteractionRequest({
				type: "active",
				viewportId,
				disable: resetTransformation,
			});
			interactionRequestTokenRef.current = returnedToken;
		} else if (!gumballActive && interactionRequestTokenRef.current) {
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
	}, [gumballActive, resetTransformation]);

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
			onClick={() => setGumballActive(true)}
		>
			<Text size="sm" className={classes.interactionText}>
				{gumballProps.prompt?.inactiveTitle ?? "Start gumball"}
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
			{definition && gumballActive ? contentActive : contentInactive}
		</ParameterWrapperComponent>
	);
}
