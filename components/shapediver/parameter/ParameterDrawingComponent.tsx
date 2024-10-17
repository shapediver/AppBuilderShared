import Icon from "../../ui/Icon";
import ParameterLabelComponent from "./ParameterLabelComponent";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button, Group, Loader, Space, Stack, Text } from "@mantine/core";
import { IconTypeEnum } from "../../../types/shapediver/icons";
import { IDrawingParameterSettings as IDrawingParameterProps } from "@shapediver/viewer";
import { PointsData } from "@shapediver/viewer.features.drawing-tools";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useDrawingTools } from "shared/hooks/shapediver/viewer/drawing/useDrawingTools";
import { useParameterComponentCommons } from "../../../hooks/shapediver/parameters/useParameterComponentCommons";
import { useViewportId } from "../../../hooks/shapediver/viewer/useViewportId";
import DrawingOptionsComponent from "../ui/DrawingOptionsComponent";
import { NotificationContext } from "shared/context/NotificationContext";
import { useDrawingOptionsStore } from "shared/store/useDrawingOptionsStore";

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
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	catch (e) {
		return [];
	}
};

/**
 * Functional component that creates a component for a drawing parameter.
 *
 * @returns
 */
export default function ParameterDrawingComponent(props: PropsParameter) {
	const {
		definition,
		handleChange,
		onCancel,
		disabled,
		state
	} = useParameterComponentCommons<string>(props);

	// get the viewport ID
	const { viewportId } = useViewportId();

	// get the active parameter from the store
	const { activeParameter, setActiveParameter } = useDrawingOptionsStore();
	// get the notification context
	const notifications = useContext(NotificationContext);

	// get the drawing parameter properties
	const drawingProps = definition.settings as IDrawingParameterProps;

	// state for the drawing application
	const [drawingActive, setDrawingActive] = useState<boolean>(false);
	// state for the last confirmed value
	const [parsedUiValue, setParsedUiValue] = useState<PointsData>(parsePointsData(state.uiValue));

	/**
	 * Callback function to activate the drawing.
	 * 
	 * If another drawing parameter is already active, a notification is shown.
	 * Otherwise, the drawing is activated and the active parameter ID is set.
	 */
	const activateDrawing = useCallback(() => {
		if (activeParameter === undefined) {
			setDrawingActive(true);
			setActiveParameter(definition.id);
		} else {
			notifications.show({
				title: "A drawing parameter is already active",
				message: "Please confirm or cancel the current drawing parameter first."
			});
		}
	}, [activeParameter]);

	/**
	 * Callback function to deactivate the drawing.
	 * The drawing is deactivated and the active parameter ID is reset.
	 */
	const deactivateDrawing = useCallback(() => {
		setDrawingActive(false);
		setActiveParameter(undefined);
	}, []);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the drawing is confirmed.
	 * It also ends the drawing process.
	 */
	const confirmDrawing = useCallback((pointsData?: PointsData) => {
		deactivateDrawing();
		setParsedUiValue(pointsData ?? []);
		handleChange(JSON.stringify({ points: pointsData }), 0);
	}, []);

	/**
	 * Callback function to cancel the drawing.
	 * This function is called when the drawing interaction is aborted by the user.
	 */
	const cancelDrawing = useCallback(() => {
		if (drawingToolsApi) drawingToolsApi.close();
		deactivateDrawing();
	}, []);

	// use the drawing tools
	const { pointsData, setPointsData, drawingToolsApi } = useDrawingTools(
		viewportId,
		drawingProps,
		confirmDrawing,
		cancelDrawing,
		drawingActive,
		parsedUiValue
	);

	// react to changes of the uiValue and update the drawing state if necessary
	useEffect(() => {
		const parsed = parsePointsData(state.uiValue);
		// compare the parsed value with the current points data
		if (parsed.length !== pointsData?.length ||
			!parsed.every((p, i) => JSON.stringify(p) === JSON.stringify(pointsData[i]))
		) {
			deactivateDrawing();
			setPointsData(parsed);
			setParsedUiValue(parsed);
		}
	}, [state.uiValue]);

	// extend the onCancel callback to reset the drawing state
	const _onCancel = useMemo(() => onCancel ? () => {
		deactivateDrawing();
		onCancel?.();
	} : undefined, [onCancel]);

	// state for the constraints
	const [isWithinConstraints, setIsWithinConstraints] = useState<boolean>(false);	
	// state for the dirty flag
	const [dirty, setDirty] = useState<boolean>(false);

	// check if the current points data is different from the uiValue
	useEffect(() => {
		const parsed = parsePointsData(state.uiValue);

		// compare uiValue to pointsData
		if (parsed.length !== pointsData?.length || !parsed.every((p, i) => JSON.stringify(p) === JSON.stringify(pointsData[i]))) {
			setDirty(true);
		} else {
			setDirty(false);
		}
	}, [state.uiValue, pointsData]);

	// check if the current selection is within the constraints
	useEffect(() => {
		if(pointsData) {
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
	 * The content of the parameter when it is active.
	 * 
	 * It contains a button to confirm the drawing and a button to cancel the drawing.
	 * 
	 * The confirm button sets the current parameter value to the points data.
	 * The cancel button resets the points data to the last value.
	 * 
	 */
	const contentActive =
		<Stack gap={0}>
			<Button justify="space-between" fullWidth h="100%" disabled={disabled} m=""
				rightSection={<Loader type="dots" />}
			>
				<Stack>
					<Space />
					<Text size="sm" fw={500} ta="left" onClick={cancelDrawing}>
						Created a drawing with {pointsData?.length} points
					</Text>
					<Text size="sm" fw={400} fs="italic" ta="left" onClick={cancelDrawing}>
						Interact with the drawing to change the points
					</Text>
					<Space />
				</Stack>
			</Button>

			<DrawingOptionsComponent viewportId={viewportId} drawingToolsApi={drawingToolsApi} />

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
					onClick={cancelDrawing}>
					<Text>Cancel</Text>
				</Button>
			</Group>
		</Stack>;


	/**
	 * The content of the parameter when it is inactive.
	 * 
	 * It contains a button to start the drawing.
	 * Within the button, the number of points within the drawing is displayed.
	 */
	const contentInactive =
		<Button justify="space-between" fullWidth={true} disabled={disabled}
			rightSection={<Icon type={IconTypeEnum.Pencil} />}
			variant={pointsData?.length === 0 ? "light" : "filled"}
			onClick={activateDrawing}>
			<Text size="sm">
				Start drawing
			</Text>
		</Button>;

	return <>
		<ParameterLabelComponent {...props} cancel={_onCancel} />
		{
			definition &&
				drawingActive ? contentActive : contentInactive
		}
	</>;
}