import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {useGumball} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/gumball/useGumball";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderShared/store/useShapeDiverStoreInteractionRequestManagement";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
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
import {
	GumballParameterValue,
	IGumballParameterProps,
	validateGumballParameterSettings,
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
 * Parse the value of a gumball parameter and extract the transformed node names.
 * @param value
 * @returns
 */
const parseTransformation = (
	value?: string,
): {name: string; transformation: number[]}[] => {
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

/**
 * Functional component that creates a switch component for a gumball parameter.
 *
 * @returns
 */
export default function ParameterGumballComponent(
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
		"ParameterGumballComponent",
		defaultPropsParameterWrapper,
		props,
	);

	// get the interaction request management
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();

	// get the notification context
	const notifications = useContext(NotificationContext);

	// settings validation
	const gumballProps = useMemo(() => {
		const result = validateGumballParameterSettings(definition.settings);
		if (result.success) {
			return result.data.props as IGumballParameterProps;
		} else {
			notifications.error({
				title: "Invalid Parameter Settings",
				message: `Invalid settings for Gumball parameter "${definition.name}", see console for details.`,
			});
			console.warn(
				`Invalid settings for Gumball parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
			);
			return {};
		}
	}, [definition.settings]);

	// state for the gumball application
	const [gumballActive, setGumballActive] = useState<boolean>(false);
	// store the last confirmed value in a state to reset the transformation
	const [lastConfirmedValue, setLastConfirmedValue] = useState<
		{
			name: string;
			transformation: number[];
			localTransformations?: number[];
		}[]
	>([]);
	// store the parsed exec value in a state to react to changes
	const [parsedExecValue, setParsedExecValue] = useState<
		{
			name: string;
			transformation: number[];
			localTransformations?: number[];
		}[]
	>([]);
	// state to manage the interaction request token
	const [interactionRequestToken, setInteractionRequestToken] = useState<
		string | undefined
	>(undefined);

	const {viewportId} = useViewportId();

	// get the transformed nodes and the selected nods
	const {
		transformedNodeNames,
		setSelectedNodeNames,
		restoreTransformedNodeNames,
	} = useGumball(
		viewportId,
		gumballProps,
		gumballActive,
		parseTransformation(value),
	);

	// react to changes of the execValue and reset the last confirmed value
	useEffect(() => {
		const parsedExecValue = parseTransformation(state.execValue);
		setParsedExecValue(parsedExecValue);
		setLastConfirmedValue(parsedExecValue);
	}, [state.execValue]);

	// reset the transformed nodes when the definition changes
	useEffect(() => {
		const parsed = parseTransformation(state.execValue);
		if (JSON.stringify(parsed) !== JSON.stringify(parsedExecValue)) {
			setParsedExecValue(parsed);
			setLastConfirmedValue(parsed);
		}
	}, [definition]);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the gumball interaction is confirmed.
	 * It also ends the gumball interaction process and resets the selected nodes.
	 */
	const changeValue = useCallback(
		(
			transformedNodeNames: {
				name: string;
				transformation: number[];
				localTransformations?: number[];
			}[],
		) => {
			setGumballActive(false);
			const parameterValue: GumballParameterValue = {
				names: transformedNodeNames.map((node) => node.name),
				transformations: transformedNodeNames.map(
					(node) => node.transformation,
				),
			};

			// create a deep copy of the transformed node names
			const transformedNodeNamesCopy = JSON.parse(
				JSON.stringify(transformedNodeNames),
			);
			setLastConfirmedValue(transformedNodeNamesCopy);
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
		restoreTransformedNodeNames(lastConfirmedValue, transformedNodeNames);
		setGumballActive(false);
		setSelectedNodeNames([]);
	}, [lastConfirmedValue, transformedNodeNames]);

	// extend the onCancel callback to reset the transformed nodes.
	const _onCancelCallback = useCallback(() => {
		restoreTransformedNodeNames(parsedExecValue, transformedNodeNames);
		setGumballActive(false);
		setSelectedNodeNames([]);
		setLastConfirmedValue(parsedExecValue);
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
		if (gumballActive && !interactionRequestToken) {
			const returnedToken = addInteractionRequest({
				type: "active",
				viewportId,
				disable: resetTransformation,
			});
			setInteractionRequestToken(returnedToken);
		} else if (!gumballActive && interactionRequestToken) {
			removeInteractionRequest(interactionRequestToken);
			setInteractionRequestToken(undefined);
		}

		return () => {
			if (interactionRequestToken) {
				removeInteractionRequest(interactionRequestToken);
				setInteractionRequestToken(undefined);
			}
		};
	}, [gumballActive, interactionRequestToken, resetTransformation]);

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
			rightSection={<Icon type={IconTypeEnum.IconHandFinger} />}
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
