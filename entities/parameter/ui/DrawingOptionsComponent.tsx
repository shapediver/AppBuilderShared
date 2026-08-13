import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import MarkdownWidgetComponent from "@AppBuilderLib/shared/ui/markdown/MarkdownWidgetComponent";
import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {
	Button,
	Collapse,
	Group,
	MantineSize,
	Space,
	Stack,
	Switch,
	Text,
} from "@mantine/core";
import {
	GeometryRestrictionApi,
	IDrawingToolsApi,
} from "@shapediver/viewer.features.drawing-tools";
import {IDrawingParameterSettings} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";
import {useDrawingOptionsStore} from "../model/drawing/useDrawingOptionsStore";
import classes from "./DrawingOptionsComponent.module.css";

export type DrawingOptions = {
	showPointLabels: boolean;
	setShowPointLabels: (show: boolean) => void;
	showDistanceLabels: boolean;
	setShowDistanceLabels: (show: boolean) => void;
};

/** Synchronizes drawing display options with the active drawing-tools API. */
export const useDrawingOptions = ({
	viewportId,
	drawingToolsApi,
	drawingToolsSettings,
}: {
	viewportId: string;
	drawingToolsApi: IDrawingToolsApi | undefined;
	drawingToolsSettings: IDrawingParameterSettings;
}): DrawingOptions => {
	const {
		showPointLabels,
		setShowPointLabels,
		showDistanceLabels,
		setShowDistanceLabels,
	} = useDrawingOptionsStore();
	const viewportApi = useShapeDiverStoreViewport((state) => {
		return state.viewports[viewportId];
	});

	useEffect(() => {
		if (!drawingToolsApi) return;
		const options = drawingToolsSettings.general?.options;
		if (options?.showPointLabels !== undefined)
			setShowPointLabels(options.showPointLabels);
		if (options?.showDistanceLabels !== undefined)
			setShowDistanceLabels(options.showDistanceLabels);
	}, [drawingToolsApi, drawingToolsSettings]);

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

	return {
		showPointLabels,
		setShowPointLabels,
		showDistanceLabels,
		setShowDistanceLabels,
	};
};

/**
 * Component for the drawing options.
 *
 * @param props The properties.
 * @param props.viewportId The viewport ID.
 * @param props.drawingToolsApi The drawing tools API.
 * @returns
 */
export default function DrawingOptionsComponent(props: {
	drawingToolsApi: IDrawingToolsApi | undefined;
	options: DrawingOptions;
}) {
	const {
		showPointLabels,
		setShowPointLabels,
		showDistanceLabels,
		setShowDistanceLabels,
	} = props.options;

	const {drawingToolsApi} = props;

	// state for the options
	const [optionsOpened, setOptionsOpened] = useState(false);
	// state for the geometry restriction availability
	const [_hasGeometryRestriction, setHasGeometryRestriction] =
		useState(false);

	/**
	 * Various effects for the drawing tools API.
	 *
	 * The effects are used to set the options for the drawing tools.
	 * The options are set depending on the state of the component.
	 */

	useEffect(() => {
		if (drawingToolsApi) {
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
			expanded={optionsOpened}
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
						<Icon iconType={"tabler:info-circle-filled"} />
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
				{optionsOpened ? (
					<Icon iconType={"tabler:chevron-up"} />
				) : (
					<Icon iconType={"tabler:chevron-down"} />
				)}
			</Group>
			{options}
		</Stack>
	);
}
