import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {
	createToolbarCheckboxItem,
	createToolbarCommand,
} from "@AppBuilderLib/features/appbuilder/model/createToolbarItems";
import {AppBuilderLabeledActionIcon} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
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
import {
	resolveParameterInteractionButtonTheme,
	type ParameterInteractionConfirmCancelClearThemeProps,
} from "../config/theme/parameterInteractionButtonTheme";
import {resolveAutomaticSceneUpdate} from "../lib/automaticSceneUpdate";
import {drawingPointsEqual} from "../lib/drawingPoints";
import {getResetValue} from "../lib/parameterResetValue";
import {useDrawingTools} from "../model/drawing/useDrawingTools";
import {resolveInteractionPresentation} from "../model/interaction/resolveInteractionPresentation";
import {useInteractionToolbarContribution} from "../model/interaction/useInteractionToolbarContribution";
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
	props: PropsParameter &
		Partial<PropsParameterWrapper> &
		Partial<ParameterInteractionConfirmCancelClearThemeProps>,
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

	const {
		clearButton: clearButtonTheme,
		confirmButton: confirmButtonTheme,
		cancelButton: cancelButtonTheme,
	} = useProps("ParameterDrawingComponent", {}, props);

	const clearButton = resolveParameterInteractionButtonTheme(
		clearButtonTheme,
		{label: "Clear", icon: "tabler:circle-off"},
	);
	const confirmButton = resolveParameterInteractionButtonTheme(
		confirmButtonTheme,
		{label: "Confirm", icon: "tabler:check"},
	);
	const cancelButton = resolveParameterInteractionButtonTheme(
		cancelButtonTheme,
		{label: "Cancel", icon: "tabler:x"},
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
	const {
		enabled: automaticSceneUpdate,
		timeout: automaticSceneUpdateTimeout,
	} = resolveAutomaticSceneUpdate(drawingProps.behavior, alwaysActive);
	// The drawing tools call onUpdate on their own after the idle timeout when
	// behavior.automaticSceneUpdate is set. App Builder supports this for
	// always active drawings only and provides the default timeout.
	const drawingToolsProps = useMemo(() => {
		const behavior = drawingProps.behavior;
		if (automaticSceneUpdate) {
			return {
				...drawingProps,
				behavior: {
					...behavior,
					automaticSceneUpdate: true,
					automaticSceneUpdateTimeout,
				},
			};
		}
		// not always active: the flag is ignored (an explicit false still wins
		// over the deprecated autoUpdate and is kept)
		if (behavior?.automaticSceneUpdate !== true) return drawingProps;
		const {
			automaticSceneUpdate: _ignored,
			automaticSceneUpdateTimeout: _ignoredTimeout,
			...rest
		} = behavior;
		return {...drawingProps, behavior: rest};
	}, [automaticSceneUpdate, automaticSceneUpdateTimeout, drawingProps]);
	// a closing point of a closed drawing is not reported by the drawing tools
	const closedDrawing =
		drawingProps.geometry?.close === true ||
		drawingProps.geometry?.autoClose === true;
	const drawingPresentation = resolveInteractionPresentation(
		drawingProps.general?.presentation,
		alwaysActive,
	);
	const [drawingResetRevision, setDrawingResetRevision] = useState(0);
	// The settings menu (point and distance labels) can be turned off by the
	// "general.buttons.settings" setting (default true). The cast goes once the
	// Viewer types of the released package declare the setting.
	const showSettings =
		(
			drawingProps.general?.buttons as
				| {clear?: boolean; settings?: boolean}
				| null
				| undefined
		)?.settings ?? true;
	// A drawing which is reset to an empty drawing after each execution (see
	// the "resetValue" setting) has nothing to clear. Clear can also be turned
	// off by the "general.buttons.clear" setting (default true).
	const resetValue = getResetValue(definition);
	const showClearButton =
		(drawingProps.general?.buttons?.clear ?? true) &&
		!(
			resetValue !== undefined &&
			actions.isValid(resetValue) &&
			parsePointsData(resetValue as string).length === 0
		);
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
			// keep the state if the points did not change, a new array would
			// recreate the drawing tools
			setParsedUiValue((previous) =>
				JSON.stringify(previous) === JSON.stringify(confirmedPoints)
					? previous
					: confirmedPoints,
			);
			if (value === serializedValue) return;
			handleChange(serializedValue, 0);
		},
		[alwaysActive, value],
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
		// With automatic scene updates there is no Confirm to send the cleared
		// drawing, and the drawing tools' idle timer only reacts to changes made
		// with the tools: the empty drawing is sent right away when it is a
		// valid value (no minimum number of points), otherwise it is sent once
		// the user drew the minimum number of points again.
		const minPoints = drawingProps.geometry?.minPoints;
		if (automaticSceneUpdate && (minPoints === undefined || minPoints <= 0))
			confirmDrawing([]);
	}, [
		automaticSceneUpdate,
		confirmDrawing,
		drawingProps.geometry?.minPoints,
	]);

	// the drawing tools are recreated whenever these callbacks change, keep
	// them stable
	const confirmDrawingRef = useRef(confirmDrawing);
	confirmDrawingRef.current = confirmDrawing;
	const cancelDrawingRef = useRef(cancelDrawing);
	cancelDrawingRef.current = cancelDrawing;
	const onDrawingUpdate = useCallback(
		(points: PointsData) => confirmDrawingRef.current(points),
		[],
	);
	const onDrawingCancel = useCallback(() => cancelDrawingRef.current(), []);

	// use the drawing tools
	const {pointsData, setPointsData, drawingToolsApi} = useDrawingTools(
		viewportId,
		drawingToolsProps,
		onDrawingUpdate,
		onDrawingCancel,
		drawingActive && hasInteractionPermission,
		parsedUiValue,
		drawingResetRevision,
	);
	useEffect(() => {
		drawingToolsApiRef.current = drawingToolsApi;
	}, [drawingToolsApi]);
	const resetDrawingToCommitted = useCallback(() => {
		const committedPoints = parsePointsData(state.commitValue);
		setPointsData(committedPoints);
		setParsedUiValue(committedPoints);
		setDrawingResetRevision((revision) => revision + 1);
	}, [setPointsData, state.commitValue]);
	resetDrawingToCommittedRef.current = resetDrawingToCommitted;
	const drawingOptions = useDrawingOptions({
		viewportId,
		drawingToolsApi,
		drawingToolsSettings: drawingProps,
	});
	// React to commits of the parameter: in case the parameter was reset after
	// an execution (see the "resetValue" setting), the committed value differs
	// from the executed value and the drawing is reset to the committed value.
	useEffect(() => {
		if (state.commitValue === state.execValue) return;
		resetDrawingToCommittedRef.current();
	}, [state.commitValue, state.commitRevision]);

	useEffect(() => {
		const parsed = parsePointsData(state.commitValue);
		if (JSON.stringify(parsed) !== JSON.stringify(parsedUiValue)) {
			setPointsData(parsed);
			setParsedUiValue(parsed);
		}
	}, [JSON.stringify(definition)]);

	// react to changes of the uiValue and update the drawing state if necessary
	useEffect(() => {
		const parsed = parsePointsData(state.uiValue);
		setParsedUiValue((previous) =>
			JSON.stringify(previous) === JSON.stringify(parsed)
				? previous
				: parsed,
		);
		// compare the parsed value with the current points data
		if (!drawingPointsEqual(parsed, pointsData, closedDrawing)) {
			if (!alwaysActive) setDrawingActive(false);
			setPointsData(parsed);
		}
	}, [alwaysActive, state.uiValue]);

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
		const parsed = parsePointsData(state.uiValue);
		// compare uiValue to pointsData (a closing point of the value is not
		// reported by the drawing tools, it must not make the drawing dirty)
		setDirty(!drawingPointsEqual(parsed, pointsData, closedDrawing));
	}, [pointsData, state.uiValue]);

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
					{showClearButton && (
						<Box style={{width: "auto"}}>
							<AppBuilderLabeledActionIcon
								label={clearButton.label}
								tooltipLabel={clearButton.tooltip}
								icon={<Icon iconType={clearButton.icon} />}
								onClick={clearDrawing}
								variant={
									pointsData?.length === 0
										? "light"
										: "filled"
								}
							/>
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

			{showSettings && (
				<DrawingOptionsComponent
					drawingToolsApi={drawingToolsApi}
					options={drawingOptions}
				/>
			)}

			<Group justify="space-between" w="100%" wrap="nowrap">
				{!automaticSceneUpdate && (
					<Button
						disabled={!isWithinConstraints || !dirty}
						fullWidth={true}
						variant="filled"
						onClick={() => confirmDrawing(pointsData)}
					>
						<Text>{confirmButton.label}</Text>
					</Button>
				)}
				{!automaticSceneUpdate && (
					<Button
						fullWidth={true}
						variant={"light"}
						onClick={cancelDrawing}
					>
						<Text>{cancelButton.label}</Text>
					</Button>
				)}
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
		// with automatic scene updates the change is sent after the idle
		// timeout: there is nothing to confirm or cancel, only Clear remains
		commands: dirty
			? [
					...(automaticSceneUpdate
						? []
						: [
								createToolbarCommand({
									id: `${namespace}-${definition.id}-${viewportId}-confirm`,
									aggregationId: "drawing-confirm",
									label: confirmButton.label,
									tooltip: confirmButton.tooltip,
									icon: confirmButton.icon,
									order: 10,
									disabled: !isWithinConstraints || !dirty,
									execute: () => confirmDrawing(pointsData),
								}),
								createToolbarCommand({
									id: `${namespace}-${definition.id}-${viewportId}-cancel`,
									aggregationId: "drawing-cancel",
									label: cancelButton.label,
									tooltip: cancelButton.tooltip,
									icon: cancelButton.icon,
									order: 20,
									disabled: !dirty,
									execute: cancelDrawing,
								}),
							]),
					...(showClearButton
						? [
								createToolbarCommand({
									id: `${namespace}-${definition.id}-${viewportId}-clear`,
									aggregationId: "drawing-clear",
									label: clearButton.label,
									tooltip: clearButton.tooltip,
									icon: clearButton.icon,
									order: 30,
									execute: clearDrawing,
								}),
							]
						: []),
				]
			: [],
	});

	useInteractionToolbarContribution({
		id: `${namespace}-${definition.id}-${viewportId}-settings`,
		namespace,
		viewportId,
		// a "widget" presentation does not contribute to the toolbar
		presentation:
			showSettings && drawingToolsApi ? drawingPresentation : "widget",
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
