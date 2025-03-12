import {defaultStyleProps} from "@AppBuilderShared/components/shapediver/parameter/ParameterSliderComponent";
import MarkdownWidgetComponent from "@AppBuilderShared/components/shapediver/ui/MarkdownWidgetComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useDrawingOptionsStore} from "@AppBuilderShared/store/useDrawingOptionsStore";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	Button,
	Checkbox,
	Collapse,
	Group,
	MantineSize,
	NumberInput,
	Slider,
	Space,
	Stack,
	Switch,
	Text,
} from "@mantine/core";
import {
	GeometryRestrictionApi,
	IDrawingToolsApi,
	PlaneRestrictionApi,
} from "@shapediver/viewer.features.drawing-tools";
import {IconChevronDown, IconChevronUp} from "@tabler/icons-react";
import React, {useEffect, useState} from "react";
import classes from "./DrawingOptionsComponent.module.css";

/**
 * Component for the drawing options.
 *
 * @param props The properties.
 * @param props.viewportId The viewport ID.
 * @param props.drawingToolsApi The drawing tools API.
 * @returns
 */
export default function DrawingOptionsComponent(props: {
	viewportId: string;
	drawingToolsApi: IDrawingToolsApi | undefined;
}) {
	const {
		showPointLabels,
		setShowPointLabels,
		showDistanceLabels,
		setShowDistanceLabels,
		gridSize,
		setGridSize,
		angleStep,
		setAngleStep,
		snapToVertices,
		setSnapToVertices,
		snapToEdges,
		setSnapToEdges,
		snapToFaces,
		setSnapToFaces,
	} = useDrawingOptionsStore();

	const {drawingToolsApi, viewportId} = props;

	// state for the options
	const [optionsOpened, setOptionsOpened] = useState(false);
	// get the viewport API
	const viewportApi = useShapeDiverStoreViewport((state) => {
		return state.viewports[viewportId];
	});

	// state for the plane restriction availability
	const [hasPlaneRestriction, setHasPlaneRestriction] = useState(false);
	// state for the geometry restriction availability
	const [hasGeometryRestriction, setHasGeometryRestriction] = useState(false);

	/**
	 * Various effects for the drawing tools API.
	 *
	 * The effects are used to set the options for the drawing tools.
	 * The options are set depending on the state of the component.
	 */

	useEffect(() => {
		if (drawingToolsApi) {
			drawingToolsApi.showPointLabels = showPointLabels;
			viewportApi.render();
		}
	}, [showPointLabels, drawingToolsApi]);

	useEffect(() => {
		if (drawingToolsApi) {
			drawingToolsApi.showDistanceLabels = showDistanceLabels;
			viewportApi.render();
		}
	}, [showDistanceLabels, drawingToolsApi]);

	useEffect(() => {
		if (drawingToolsApi) {
			const planeRestrictionApis = Object.values(
				drawingToolsApi.restrictions,
			).filter((r) => r instanceof PlaneRestrictionApi);
			planeRestrictionApis.forEach((r) => {
				(r as PlaneRestrictionApi).gridRestrictionApi.gridUnit =
					gridSize;
			});
		}
	}, [gridSize, drawingToolsApi]);

	useEffect(() => {
		if (drawingToolsApi) {
			const planeRestrictionApis = Object.values(
				drawingToolsApi.restrictions,
			).filter((r) => r instanceof PlaneRestrictionApi);
			planeRestrictionApis.forEach((r) => {
				(r as PlaneRestrictionApi).angularRestrictionApi.angleStep =
					Math.PI / angleStep;
			});
		}
	}, [angleStep, drawingToolsApi]);

	useEffect(() => {
		if (drawingToolsApi) {
			const geometryRestrictionApis = Object.values(
				drawingToolsApi.restrictions,
			).filter((r) => r instanceof GeometryRestrictionApi);
			geometryRestrictionApis.forEach((r) => {
				(r as GeometryRestrictionApi).snapToVertices = snapToVertices;
				(r as GeometryRestrictionApi).snapToEdges = snapToEdges;
				(r as GeometryRestrictionApi).snapToFaces = snapToFaces;
			});
		}
	}, [snapToVertices, snapToEdges, snapToFaces, drawingToolsApi]);

	useEffect(() => {
		if (drawingToolsApi) {
			const planeRestrictionApis = Object.values(
				drawingToolsApi.restrictions,
			).filter((r) => r instanceof PlaneRestrictionApi);
			setHasPlaneRestriction(planeRestrictionApis.length > 0);
			const geometryRestrictionApis = Object.values(
				drawingToolsApi.restrictions,
			).filter((r) => r instanceof GeometryRestrictionApi);
			setHasGeometryRestriction(geometryRestrictionApis.length > 0);
		}
	}, [drawingToolsApi]);

	/**
	 * The description of the drawing tools.
	 * This description is shown when hovering over the info button.
	 */
	const markdown = `# Adding Points
  * Starts automatically if no points exist
  * Press **Insert** to add a point at cursor position
  * Hover over a line segment to add a new point at the center

# Removing Points
  * Select points and press **Delete**

# Moving Points
  * Drag individual points or select multiple points to move together
  * Movement restrictions
    * Press **g** for grid
    * Press **a** for angles
    * Press **x**/**y**/**z** for axes

# History of Operations
  * Press **Ctrl+z** to undo
  * Press **Ctrl+y** to redo

# Update/Cancel
  * Click **Confirm** or press **Enter** to confirm changes
  * Click **Cancel** or press **Escape** to discard changes
`;

	// define the size of the components
	const size: MantineSize = "xs";

	/**
	 * The options for the drawing tools.
	 *
	 * The options are shown when the options are opened.
	 * The options are used to set the drawing tools settings.
	 * The settings are set depending on the state of the component.
	 */
	const options = (
		<Collapse
			in={optionsOpened}
			transitionDuration={250}
			transitionTimingFunction="linear"
			w={"100%"}
			className={classes.paddingRight}
		>
			<Stack>
				<TooltipWrapper
					multiline
					w={350}
					label={
						<MarkdownWidgetComponent>
							{markdown}
						</MarkdownWidgetComponent>
					}
				>
					<Button
						justify="space-between"
						fullWidth
						h="100%"
						className={classes.padding}
					>
						<Icon type={IconTypeEnum.IconInfoCircleFilled} />
						<Space />
						<Text className={classes.paddingLeft} size={size}>
							{" "}
							Hover for Details{" "}
						</Text>
					</Button>
				</TooltipWrapper>
				{drawingToolsApi && (
					<Switch
						size={size}
						checked={showPointLabels}
						onChange={() => setShowPointLabels(!showPointLabels)}
						label="Show Point Labels"
					/>
				)}
				{drawingToolsApi && (
					<Switch
						size={size}
						checked={showDistanceLabels}
						onChange={() =>
							setShowDistanceLabels(!showDistanceLabels)
						}
						label="Show Distance Labels"
					/>
				)}
				{drawingToolsApi && hasPlaneRestriction && (
					<>
						<Text size={size}> Grid Size </Text>
						<Group className={classes.sliderGroup}>
							<Slider
								size={size}
								w={defaultStyleProps.sliderWidth}
								min={0.01}
								max={100}
								step={0.01}
								value={gridSize}
								onChange={setGridSize}
							/>
							<NumberInput
								size={size}
								w={defaultStyleProps.numberWidth}
								min={0.01}
								max={100}
								step={0.01}
								value={gridSize}
								onChange={(v) => setGridSize(+v)}
							/>
						</Group>
					</>
				)}
				{drawingToolsApi && hasPlaneRestriction && (
					<>
						<Text size={size}> Angle Step </Text>
						<Group className={classes.sliderGroup}>
							<Slider
								w={defaultStyleProps.sliderWidth}
								size={size}
								min={1}
								max={32}
								step={1}
								value={angleStep}
								onChange={setAngleStep}
							/>
							<NumberInput
								size={size}
								w={defaultStyleProps.numberWidth}
								min={1}
								max={32}
								step={1}
								value={angleStep}
								onChange={(v) => setAngleStep(+v)}
							/>
						</Group>
					</>
				)}
				{drawingToolsApi && hasGeometryRestriction && (
					<>
						<Text size={size}> Snap to </Text>
						<Group>
							<Checkbox
								size={size}
								checked={snapToVertices}
								onChange={() =>
									setSnapToVertices(!snapToVertices)
								}
								label="Vertices"
							/>
							<Checkbox
								size={size}
								checked={snapToEdges}
								onChange={() => setSnapToEdges(!snapToEdges)}
								label="Edges"
							/>
							<Checkbox
								size={size}
								checked={snapToFaces}
								onChange={() => setSnapToFaces(!snapToFaces)}
								label="Faces"
							/>
						</Group>
					</>
				)}
			</Stack>
		</Collapse>
	);

	return (
		<Stack p="sm">
			<Group
				justify="space-between"
				onClick={() => setOptionsOpened((t) => !t)}
			>
				<Text size={size} fs="italic" ta="left">
					{optionsOpened ? "Hide Options" : "Show Options"}
				</Text>
				{optionsOpened ? <IconChevronUp /> : <IconChevronDown />}
			</Group>
			{options}
		</Stack>
	);
}
