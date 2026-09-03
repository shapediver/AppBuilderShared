import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
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
	Stack,
	Text,
	useProps,
} from "@mantine/core";
import {PointsData} from "@shapediver/viewer.features.drawing-tools";
import {
	IDrawingParameterSettings as IDrawingParameterProps,
	RENDERER_TYPE,
	validateDrawingParameterSettings,
} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "../config/propsParameter";
import {useDrawingTools} from "../model/drawing/useDrawingTools";
import {resolveInteractionPresentation} from "../model/interaction/resolveInteractionPresentation";
import {useInteractionToolbarContribution} from "../model/interaction/useInteractionToolbarContribution";
import {
	requestSelectionAutoClear,
	useSelectionAutoClear,
} from "../model/interaction/useSelectionAutoClear";
import {useParameterComponentCommons} from "../model/useParameterComponentCommons";
import {useShapeDiverStoreInteractionRequestManagement} from "../model/useShapeDiverStoreInteractionRequestManagement";
import DrawingOptionsComponent, {
	useDrawingOptions,
} from "./DrawingOptionsComponent";
import classes from "./ParameterInteractionComponent.module.css";
import ParameterLabelComponent from "./ParameterLabelComponent";
import ParameterResetRow from "./ParameterResetRow";
import ParameterWrapperComponent from "./ParameterWrapperComponent";

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

const emptyPointsData: PointsData = [];

/**
 * Functional component that creates a component for a drawing parameter.
 *
 * @returns
 */
export default function ParameterDrawingComponent(
	props: PropsParameter & Partial<PropsParameterWrapper>,
) {
	const {
		actions,
		definition,
		handleChange,
		onCancel,
		disabled,
		showReset,
		resetToDefault,
		state,
		value,
	} = useParameterComponentCommons<string>(props);

	const {namespace} = props;

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
	const drawingOwnerKey = `${namespace}-${definition.id}-${viewportId}`;
	// get the viewport from the store
	const {viewport} = useShapeDiverStoreViewport((state) => ({
		viewport: state.viewports[viewportId],
	}));
	// get the notification store
	const notifications = useNotificationStore();

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
			Logger.warn(
				`Invalid settings for Drawing parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
			);
			return {};
		}
	}, [definition.settings]);

	// state for the drawing application
	const alwaysActive = drawingProps.general?.activeMode === "alwaysActive";
	const drawingPresentation = resolveInteractionPresentation(
		drawingProps.general?.presentation,
		alwaysActive,
	);
	const shouldAutoClear = drawingProps.general?.autoClear ?? false;
	const autoClearRequest = useSelectionAutoClear(drawingOwnerKey);
	const startsAutoCleared =
		shouldAutoClear && autoClearRequest?.value === value;
	const [autoClearPending, setAutoClearPending] = useState(false);
	const [autoClearApplied, setAutoClearApplied] = useState(false);
	const [drawingResetRevision, setDrawingResetRevision] = useState(0);
	const useAutoClearedPoints =
		startsAutoCleared || autoClearPending || autoClearApplied;
	const [drawingActive, setDrawingActive] = useState<boolean>(
		alwaysActive || drawingProps.general?.activeMode === "activeOnStart",
	);
	// state for the interaction permission
	const [hasInteractionPermission, setHasInteractionPermission] =
		useState<boolean>(false);
	// state for the last confirmed value
	const [parsedUiValue, setParsedUiValue] = useState<PointsData>(
		parsePointsData(state.uiValue),
	);
	// reference to manage the interaction request token
	const interactionRequestTokenRef = useRef<string | undefined>(undefined);
	const drawingToolsApiRef =
		useRef<ReturnType<typeof useDrawingTools>["drawingToolsApi"]>(
			undefined,
		);
	const resetDrawingToCommittedRef = useRef<() => void>(() => {});

	// update the interaction request token and activate drawing tools if necessary
	const updateInteractionRequestToken = (
		token: string | undefined,
		hasPermission = token !== undefined,
	) => {
		interactionRequestTokenRef.current = token;
		setHasInteractionPermission(hasPermission);
	};

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the drawing is confirmed.
	 * It also ends the drawing process.
	 */
	const confirmDrawing = useCallback(
		(pointsData?: PointsData) => {
			const confirmedPoints = pointsData ?? emptyPointsData;
			if (!alwaysActive) setDrawingActive(false);
			// if the value is already the same, do not change it
			const serializedValue = JSON.stringify({points: confirmedPoints});
			if (shouldAutoClear) {
				setAutoClearPending(true);
				setPointsData(emptyPointsData);
				setParsedUiValue(emptyPointsData);
			} else {
				setParsedUiValue(confirmedPoints);
			}
			if (value === serializedValue) {
				if (shouldAutoClear)
					requestSelectionAutoClear(drawingOwnerKey, serializedValue);
				return;
			}
			handleChange(serializedValue, 0, () => {
				if (shouldAutoClear)
					requestSelectionAutoClear(drawingOwnerKey, serializedValue);
			});
		},
		[alwaysActive, drawingOwnerKey, shouldAutoClear, value],
	);

	/**
	 * Callback function to cancel the drawing.
	 * This function is called when the drawing interaction is aborted by the user.
	 */
	const cancelDrawing = useCallback(() => {
		if (alwaysActive) resetDrawingToCommittedRef.current();
		else {
			drawingToolsApiRef.current?.close();
			setDrawingActive(false);
		}
	}, [alwaysActive]);

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
		useAutoClearedPoints ? emptyPointsData : parsedUiValue,
		drawingResetRevision,
	);
	useEffect(() => {
		drawingToolsApiRef.current = drawingToolsApi;
	}, [drawingToolsApi]);
	const resetDrawingToCommitted = useCallback(() => {
		const committedPoints = useAutoClearedPoints
			? emptyPointsData
			: parsePointsData(state.execValue);
		setPointsData(committedPoints);
		setParsedUiValue(committedPoints);
		setDrawingResetRevision((revision) => revision + 1);
	}, [setPointsData, state.execValue, useAutoClearedPoints]);
	resetDrawingToCommittedRef.current = resetDrawingToCommitted;
	const drawingOptions = useDrawingOptions({
		viewportId,
		drawingToolsApi,
		drawingToolsSettings: drawingProps,
	});
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
		clearDrawing();
		setDrawingResetRevision((revision) => revision + 1);
		setAutoClearApplied(true);
		setAutoClearPending(false);
	}, [autoClearRequest, clearDrawing, shouldAutoClear, state.uiValue, value]);
	useEffect(() => {
		if (!shouldAutoClear) setAutoClearApplied(false);
	}, [shouldAutoClear]);

	useEffect(() => {
		const parsed = useAutoClearedPoints
			? []
			: parsePointsData(state.execValue);
		if (JSON.stringify(parsed) !== JSON.stringify(parsedUiValue)) {
			setPointsData(parsed);
			setParsedUiValue(parsed);
		}
	}, [JSON.stringify(definition), useAutoClearedPoints]);

	// react to changes of the uiValue and update the drawing state if necessary
	useEffect(() => {
		const parsed = useAutoClearedPoints
			? []
			: parsePointsData(state.uiValue);
		setParsedUiValue(parsed);
		// compare the parsed value with the current points data
		if (
			parsed.length !== pointsData?.length ||
			!parsed.every(
				(p, i) => JSON.stringify(p) === JSON.stringify(pointsData[i]),
			)
		) {
			if (!alwaysActive) setDrawingActive(false);
			setPointsData(parsed);
		}
	}, [alwaysActive, state.uiValue, useAutoClearedPoints]);

	// extend the onCancel callback to reset the drawing state
	const _onCancel = useMemo(
		() =>
			onCancel
				? () => {
						if (!alwaysActive) setDrawingActive(false);
						onCancel?.();
					}
				: undefined,
		[alwaysActive, onCancel],
	);

	// state for the constraints
	const [isWithinConstraints, setIsWithinConstraints] =
		useState<boolean>(false);
	// state for the dirty flag
	const [dirty, setDirty] = useState<boolean>(false);

	// check if the current points data is different from the uiValue
	useEffect(() => {
		const parsed = useAutoClearedPoints
			? emptyPointsData
			: parsePointsData(state.uiValue);

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
	}, [pointsData, state.uiValue, useAutoClearedPoints]);

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
		actions.setDisableOtherParameters(drawingActive && !alwaysActive);

		if (drawingActive && !interactionRequestTokenRef.current) {
			let permissionGranted = true;
			const returnedToken = addInteractionRequest(
				alwaysActive
					? {
							type: "passive",
							viewportId,
							disable: () => {
								permissionGranted = false;
								setHasInteractionPermission(false);
							},
							enable: () => setHasInteractionPermission(true),
						}
					: {
							type: "active",
							viewportId,
							disable: cancelDrawing,
						},
			);
			updateInteractionRequestToken(returnedToken, permissionGranted);
		} else if (!drawingActive && interactionRequestTokenRef.current) {
			removeInteractionRequest(interactionRequestTokenRef.current);
			updateInteractionRequestToken(undefined);
		}

		return () => {
			actions.setDisableOtherParameters(false);
			if (interactionRequestTokenRef.current) {
				removeInteractionRequest(interactionRequestTokenRef.current);
				updateInteractionRequestToken(undefined);
			}
		};
	}, [alwaysActive, drawingActive, cancelDrawing]);

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
					{!shouldAutoClear && (
						<Box style={{width: "auto"}}>
							<ActionIcon
								onClick={clearDrawing}
								variant={
									pointsData?.length === 0
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
				drawingToolsApi={drawingToolsApi}
				options={drawingOptions}
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
			rightSection={<Icon iconType={"tabler:pencil"} />}
			variant={pointsData?.length === 0 ? "light" : "filled"}
			onClick={() => setDrawingActive(true)}
		>
			<Text size="sm" className={classes.interactionText}>
				{drawingProps.general?.prompt?.inactiveTitle ?? "Start drawing"}
			</Text>
		</Button>
	);

	// Register with interaction toolbar if presentation is "toolbar"
	const drawingLabel =
		drawingProps.general?.prompt?.inactiveTitle ?? "Start drawing";

	useInteractionToolbarContribution({
		id: `${namespace}-${definition.id}-${viewportId}`,
		namespace,
		viewportId,
		presentation: drawingPresentation,
		sectionId: "drawing",
		order: definition.order,
		menuVisibility: "multipleToggleable",
		menu: {
			id: "runtime-interaction-drawing-menu",
			label: "Drawing",
			icon: "tabler:pencil",
		},
		items: [
			createToolbarCheckboxItem({
				id: `${namespace}-${definition.id}-${viewportId}-toggle`,
				label: drawingLabel,
				checked: drawingActive && hasInteractionPermission,
				readOnly:
					alwaysActive && drawingActive && hasInteractionPermission,
				setChecked: (checked) => setDrawingActive(checked),
			}),
		],
		commands: dirty
			? [
					createToolbarCommand({
						id: `${namespace}-${definition.id}-${viewportId}-confirm`,
						aggregationId: "drawing-confirm",
						label: "Confirm",
						icon: "tabler:check",
						order: 10,
						disabled: !isWithinConstraints || !dirty,
						execute: () => confirmDrawing(pointsData),
					}),
					createToolbarCommand({
						id: `${namespace}-${definition.id}-${viewportId}-cancel`,
						aggregationId: "drawing-cancel",
						label: "Cancel",
						icon: "tabler:x",
						order: 20,
						disabled: !dirty,
						execute: cancelDrawing,
					}),
					...(shouldAutoClear
						? []
						: [
								createToolbarCommand({
									id: `${namespace}-${definition.id}-${viewportId}-clear`,
									aggregationId: "drawing-clear",
									label: "Clear",
									icon: "tabler:circle-off",
									order: 30,
									execute: clearDrawing,
								}),
							]),
				]
			: [],
	});

	useInteractionToolbarContribution({
		id: `${namespace}-${definition.id}-${viewportId}-settings`,
		namespace,
		viewportId,
		presentation: drawingToolsApi ? drawingPresentation : "widget",
		sectionId: "drawing-settings",
		groupId: "drawing",
		order: definition.order,
		menu: {
			id: "runtime-interaction-drawing-settings-menu",
			label: "Drawing settings",
			icon: "tabler:settings",
		},
		items: [
			createToolbarCheckboxItem({
				id: `${namespace}-${definition.id}-${viewportId}-point-labels`,
				label: "Show Point Labels",
				icon: "tabler:tag",
				checked: drawingOptions.showPointLabels,
				disabled: !drawingActive || !hasInteractionPermission,
				setChecked: drawingOptions.setShowPointLabels,
			}),
			createToolbarCheckboxItem({
				id: `${namespace}-${definition.id}-${viewportId}-distance-labels`,
				label: "Show Distance Labels",
				icon: "tabler:ruler-measure",
				checked: drawingOptions.showDistanceLabels,
				disabled: !drawingActive || !hasInteractionPermission,
				setChecked: drawingOptions.setShowDistanceLabels,
			}),
		],
	});

	if (drawingPresentation === "toolbar") return <></>;

	const control =
		viewport?.type === RENDERER_TYPE.ATTRIBUTES
			? contentAttributeVisualization
			: definition && drawingActive && hasInteractionPermission
				? contentActive
				: contentInactive;

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={_onCancel} />
			<ParameterResetRow
				show={showReset}
				onClick={resetToDefault}
				disabled={disabled}
			>
				{control}
			</ParameterResetRow>
		</ParameterWrapperComponent>
	);
}
