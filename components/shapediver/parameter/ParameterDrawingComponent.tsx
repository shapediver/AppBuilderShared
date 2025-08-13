import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import DrawingOptionsComponent from "@AppBuilderShared/components/shapediver/ui/DrawingOptionsComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {useDrawingTools} from "@AppBuilderShared/hooks/shapediver/viewer/drawing/useDrawingTools";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderShared/store/useShapeDiverStoreInteractionRequestManagement";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
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
import {PointsData} from "@shapediver/viewer.features.drawing-tools";
import {
	IDrawingParameterSettings as IDrawingParameterProps,
	RENDERER_TYPE,
	SystemInfo,
	validateDrawingParameterSettings,
} from "@shapediver/viewer.session";
import {IconCircleOff, IconPencil} from "@tabler/icons-react";
import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import classes from "./ParameterInteractionComponent.module.css";

/**
 * Parse the value of a drawing parameter and extract the points data.
 * @param value
 * @returns
 */
const parsePointsData = (value?: string): PointsData => {
	if (!value) return [];
	try {
		const valueCopy = JSON.parse(JSON.stringify(value));

		return JSON.parse(valueCopy).points;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		return [];
	}
};

/**
 * Functional component that creates a component for a drawing parameter.
 *
 * @returns
 */
export default function ParameterDrawingComponent(
	props: PropsParameter & Partial<PropsParameterWrapper>,
) {
	const {definition, handleChange, onCancel, disabled, state, value} =
		useParameterComponentCommons<string>(props);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterDrawingComponent",
		defaultPropsParameterWrapper,
		props,
	);

	// get the interaction request management
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();

	// get the viewport ID
	const {viewportId} = useViewportId();
	// get the viewport from the store
	const {viewport} = useShapeDiverStoreViewport((state) => ({
		viewport: state.viewports[viewportId],
	}));
	// get the notification context
	const notifications = useContext(NotificationContext);

	// settings validation
	const drawingProps = useMemo(() => {
		const result = validateDrawingParameterSettings(definition.settings);
		if (result.success) {
			return result.data as IDrawingParameterProps;
		} else {
			notifications.error({
				title: "Invalid Parameter Settings",
				message: `Invalid settings for Drawing parameter "${definition.name}", see console for details.`,
			});
			console.warn(
				`Invalid settings for Drawing parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
			);
			return {};
		}
	}, [definition.settings]);

	// state for the drawing application
	const [drawingActive, setDrawingActive] = useState<boolean>(false);
	// state for the interaction permission
	const [hasInteractionPermission, setHasInteractionPermission] =
		useState<boolean>(false);
	// state for the last confirmed value
	const [parsedUiValue, setParsedUiValue] = useState<PointsData>(
		parsePointsData(state.uiValue),
	);
	// reference to manage the interaction request token
	const interactionRequestTokenRef = useRef<string | undefined>(undefined);

	// update the interaction request token and activate drawing tools if necessary
	const updateInteractionRequestToken = (token: string | undefined) => {
		interactionRequestTokenRef.current = token;
		setHasInteractionPermission(token !== undefined);
	};

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the drawing is confirmed.
	 * It also ends the drawing process.
	 */
	const confirmDrawing = useCallback(
		(pointsData?: PointsData) => {
			setDrawingActive(false);
			setParsedUiValue(pointsData ?? []);
			// if the value is already the same, do not change it
			if (value === JSON.stringify({points: pointsData})) return;
			handleChange(JSON.stringify({points: pointsData}), 0);
		},
		[value],
	);

	/**
	 * Callback function to cancel the drawing.
	 * This function is called when the drawing interaction is aborted by the user.
	 */
	const cancelDrawing = useCallback(() => {
		if (drawingToolsApi) drawingToolsApi.close();
		setDrawingActive(false);
	}, []);

	/**
	 * Callback function to clear the drawing.
	 * This function is called when the user wants to clear the drawing.
	 */
	const clearDrawing = useCallback(() => {
		setPointsData([]);
		setParsedUiValue([]);
	}, []);

	// use the drawing tools
	const {pointsData, setPointsData, drawingToolsApi} = useDrawingTools(
		viewportId,
		drawingProps,
		confirmDrawing,
		cancelDrawing,
		drawingActive && hasInteractionPermission,
		parsedUiValue,
	);

	useEffect(() => {
		const parsed = parsePointsData(state.execValue);
		if (JSON.stringify(parsed) !== JSON.stringify(parsedUiValue)) {
			setPointsData(parsed);
			setParsedUiValue(parsed);
		}
	}, [definition]);

	// react to changes of the uiValue and update the drawing state if necessary
	useEffect(() => {
		const parsed = parsePointsData(state.uiValue);
		setParsedUiValue(parsed);
		// compare the parsed value with the current points data
		if (
			parsed.length !== pointsData?.length ||
			!parsed.every(
				(p, i) => JSON.stringify(p) === JSON.stringify(pointsData[i]),
			)
		) {
			setDrawingActive(false);
			setPointsData(parsed);
		}
	}, [state.uiValue]);

	// extend the onCancel callback to reset the drawing state
	const _onCancel = useMemo(
		() =>
			onCancel
				? () => {
						setDrawingActive(false);
						onCancel?.();
					}
				: undefined,
		[onCancel],
	);

	// state for the constraints
	const [isWithinConstraints, setIsWithinConstraints] =
		useState<boolean>(false);
	// state for the dirty flag
	const [dirty, setDirty] = useState<boolean>(false);

	// check if the current points data is different from the uiValue
	useEffect(() => {
		const parsed = parsePointsData(state.uiValue);

		// compare uiValue to pointsData
		if (
			parsed.length !== pointsData?.length ||
			!parsed.every(
				(p, i) => JSON.stringify(p) === JSON.stringify(pointsData[i]),
			)
		) {
			setDirty(true);
		} else {
			setDirty(false);
		}
	}, [state.uiValue, pointsData]);

	// check if the current selection is within the constraints
	useEffect(() => {
		if (pointsData) {
			const minPoints = drawingProps.geometry?.minPoints;
			const maxPoints = drawingProps.geometry?.maxPoints;

			const within =
				(minPoints === undefined || pointsData.length >= minPoints) &&
				(maxPoints === undefined || pointsData.length <= maxPoints);

			setIsWithinConstraints(within);
		} else {
			setIsWithinConstraints(false);
		}
	}, [pointsData]);

	/**
	 * Effect to manage the interaction request for the drawing.
	 * It adds an interaction request when the drawing is active and removes it when the drawing is inactive.
	 * It also cleans up the interaction request when the component is unmounted or when the drawing state changes.
	 */
	useEffect(() => {
		if (drawingActive && !interactionRequestTokenRef.current) {
			const returnedToken = addInteractionRequest({
				type: "active",
				viewportId,
				disable: cancelDrawing,
			});
			updateInteractionRequestToken(returnedToken);
		} else if (!drawingActive && interactionRequestTokenRef.current) {
			removeInteractionRequest(interactionRequestTokenRef.current);
			updateInteractionRequestToken(undefined);
		}

		return () => {
			if (interactionRequestTokenRef.current) {
				removeInteractionRequest(interactionRequestTokenRef.current);
				updateInteractionRequestToken(undefined);
			}
		};
	}, [drawingActive, cancelDrawing]);

	/**
	 * The content of the parameter when it is active.
	 *
	 * It contains a button to confirm the drawing and a button to cancel the drawing.
	 *
	 * The confirm button sets the current parameter value to the points data.
	 * The cancel button resets the points data to the last value.
	 *
	 */
	const contentActive = (
		<Stack gap={0}>
			<Group justify="space-between" className={classes.interactionMain}>
				<Flex align="center" justify="flex-start" w={"100%"}>
					<Box style={{flex: 1}}>
						<TextWeighted
							size="sm"
							fontWeight="medium"
							ta="left"
							onClick={cancelDrawing}
							className={classes.interactionText}
						>
							{drawingProps.general?.prompt?.activeTitle ??
								`Created a drawing with ${pointsData?.length} points`}
						</TextWeighted>
					</Box>
					<Box style={{width: "auto"}}>
						<ActionIcon
							onClick={clearDrawing}
							variant={
								pointsData?.length === 0 ? "light" : "filled"
							}
						>
							<Icon iconType={IconCircleOff} />
						</ActionIcon>
					</Box>
				</Flex>
				<Flex align="center" justify="flex-start" w={"100%"}>
					<Box style={{flex: 1}}>
						<Text
							size="sm"
							fs="italic"
							ta="left"
							onClick={cancelDrawing}
							className={classes.interactionText}
						>
							{drawingProps.general?.prompt?.activeText ??
								"Interact with the drawing to change the points"}
						</Text>
					</Box>
					<Box style={{width: "auto"}}>
						<Loader size={28} type="dots" />
					</Box>
				</Flex>
			</Group>

			<DrawingOptionsComponent
				viewportId={viewportId}
				drawingToolsApi={drawingToolsApi}
				drawingToolsSettings={drawingProps}
			/>

			<Group justify="space-between" w="100%" wrap="nowrap">
				<Button
					disabled={!isWithinConstraints || !dirty}
					fullWidth={true}
					variant="filled"
					onClick={() => confirmDrawing(pointsData)}
				>
					<Text>Confirm</Text>
				</Button>
				<Button
					fullWidth={true}
					variant={"light"}
					onClick={cancelDrawing}
				>
					<Text>Cancel</Text>
				</Button>
			</Group>
		</Stack>
	);

	/**
	 * The drawing tools currently don't work in Attribute Visualization mode,
	 * so we show a message that the drawing is not supported while the Attribute Visualization is active.
	 * Task: https://shapediver.atlassian.net/browse/SS-8901
	 */
	const contentAttributeVisualization = (
		<Button
			justify="space-between"
			fullWidth={true}
			disabled={disabled}
			className={classes.interactionButton}
		>
			<Text size="sm">Not supported in Attribute Visualization mode</Text>
		</Button>
	);

	/**
	 * For mobile devices, just show a warning that the drawing is not supported.
	 */
	const contentMobile = (
		<Button
			justify="space-between"
			fullWidth={true}
			disabled={disabled}
			className={classes.interactionButton}
		>
			<Text size="sm">Not supported on mobile devices</Text>
		</Button>
	);

	/**
	 * The content of the parameter when it is inactive.
	 *
	 * It contains a button to start the drawing.
	 * Within the button, the number of points within the drawing is displayed.
	 */
	const contentInactive = (
		<Button
			justify="space-between"
			fullWidth={true}
			disabled={disabled}
			className={classes.interactionButton}
			rightSection={<Icon iconType={IconPencil} />}
			variant={pointsData?.length === 0 ? "light" : "filled"}
			onClick={() => setDrawingActive(true)}
		>
			<Text size="sm" className={classes.interactionText}>
				{drawingProps.general?.prompt?.inactiveTitle ?? "Start drawing"}
			</Text>
		</Button>
	);

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={_onCancel} />
			{SystemInfo.instance.isMobile
				? contentMobile
				: viewport?.type === RENDERER_TYPE.ATTRIBUTES
					? contentAttributeVisualization
					: definition && drawingActive && hasInteractionPermission
						? contentActive
						: contentInactive}
		</ParameterWrapperComponent>
	);
}
