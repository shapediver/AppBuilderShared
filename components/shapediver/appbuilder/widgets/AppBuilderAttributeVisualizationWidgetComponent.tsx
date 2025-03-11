import ColorAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/ColorAttribute";
import DefaultAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/DefaultAttribute";
import NumberAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/NumberAttribute";
import SelectedAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/SelectedAttribute";
import StringAttribute from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/StringAttribute";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {IShapeDiverStoreSessions} from "@AppBuilderShared/types/store/shapediverStoreSession";
import {
	ActionIcon,
	Grid,
	Group,
	MultiSelect,
	Paper,
	Slider,
	Space,
	Stack,
	Switch,
	Text,
	Title,
} from "@mantine/core";
import {
	AttributeVisualizationEngine,
	IAttribute,
	ILayer,
} from "@shapediver/viewer.features.attribute-visualization";
import {
	addListener,
	EVENTTYPE_SESSION,
	IEvent,
	ISDTFOverview,
	ISessionEvent,
	MaterialStandardData,
	RENDERER_TYPE,
	sceneTree,
	SdtfPrimitiveTypeGuard,
} from "@shapediver/viewer.session";
import {IViewportApi} from "@shapediver/viewer.viewport";
import {IconChevronDown, IconChevronUp} from "@tabler/icons-react";
import React, {useCallback, useEffect, useRef, useState} from "react";

export default function AppBuilderAttributeVisualizationWidgetComponent() {
	const {viewportId} = useViewportId();

	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);
	const sessions = useShapeDiverStoreSession((state) => state.sessions);

	const attributeVisualizationEngineRef =
		useRef<AttributeVisualizationEngine | null>(null);

	const [active, setActive] = useState<boolean>(false);
	const [eventListenerToken, setEventListenerToken] = useState<string | null>(
		null,
	);
	const [layerOptionsOpened, setLayerOptionsOpened] = useState(false);
	const [attributeOptionsOpened, setAttributeOptionsOpened] = useState(true);

	const [attributeOverview, setAttributeOverview] = useState<ISDTFOverview>(
		{},
	);
	const [attributeLayers, setAttributeLayers] = useState<{
		[key: string]: ILayer;
	}>({});

	const [renderedAttributes, setRenderedAttributes] = useState<IAttribute[]>(
		[],
	);
	const [selectedValues, setSelectedValues] = useState<
		{name: string; type: string}[]
	>([]);
	const [defaultLayer, setDefaultLayer] = useState<ILayer>({
		color: "#666",
		opacity: 1,
		enabled: true,
	});

	/**
	 * Use effect to update the attributes of the attribute visualization engine
	 * when the rendered attributes change
	 */
	useEffect(() => {
		attributeVisualizationEngineRef.current?.updateAttributes(
			renderedAttributes,
		);
	}, [renderedAttributes]);

	/**
	 * Use effect to update the default layer of the attribute visualization engine
	 * when the default layer changes
	 */
	useEffect(() => {
		attributeVisualizationEngineRef.current?.updateDefaultLayer(
			defaultLayer,
		);
	}, [defaultLayer]);

	/**
	 * Callback to handle the activation toggle of the attribute visualization
	 * It will create a new attribute visualization engine when the attribute visualization is activated
	 * and set the attributes and layers of the engine
	 */
	const handleActivationToggle = useCallback(
		async (v: boolean) => {
			await toggleAttributeVisualization(v, viewport, sessions);
			setActive(v);

			if (v) {
				attributeVisualizationEngineRef.current =
					createAttributeVisualizationEngine(viewport);
				setAttributeOverview(
					attributeVisualizationEngineRef.current.overview,
				);
				setAttributeLayers(
					attributeVisualizationEngineRef.current.layers,
				);

				setEventListenerToken(
					attributeVisualizationEngineRef.current.addListener(() => {
						if (!attributeVisualizationEngineRef.current) return;
						setAttributeOverview(
							attributeVisualizationEngineRef.current.overview,
						);
						setAttributeLayers(
							attributeVisualizationEngineRef.current.layers,
						);
					}),
				);
			} else {
				if (eventListenerToken)
					attributeVisualizationEngineRef.current?.removeListener(
						eventListenerToken,
					);
				attributeVisualizationEngineRef.current = null;
				setEventListenerToken(null);
			}
		},
		[viewport],
	);

	/**
	 * Callback to update an attribute in the rendered attributes
	 * It will update the attribute in the rendered attributes if it already exists
	 * or add the attribute to the rendered attributes if it does not exist
	 */
	const updateAttribute = useCallback((attribute: IAttribute) => {
		setRenderedAttributes((prev) => {
			const newRenderedAttributes = [...prev];
			const index = newRenderedAttributes.findIndex(
				(attr) =>
					attr.key === attribute.key && attr.type === attribute.type,
			);
			if (index !== -1) {
				newRenderedAttributes[index] = attribute;
			} else {
				newRenderedAttributes.push(attribute);
			}

			return newRenderedAttributes;
		});
	}, []);

	/**
	 * Callback to remove an attribute from the rendered attributes
	 */
	const removeAttribute = useCallback((name: string, type: string) => {
		setSelectedValues((prev) => {
			const newSelectedValues = [...prev];
			const index = newSelectedValues.findIndex(
				(value) => value.name === name && value.type === type,
			);
			if (index !== -1) newSelectedValues.splice(index, 1);

			return newSelectedValues;
		});

		setRenderedAttributes((prev) => {
			const newRenderedAttributes = [...prev];
			const index = newRenderedAttributes.findIndex(
				(attr) => attr.key === name && attr.type === type,
			);
			if (index !== -1) newRenderedAttributes.splice(index, 1);

			return newRenderedAttributes;
		});
	}, []);

	/**
	 * Callback to change the order of an attribute in the rendered attributes
	 */
	const changeOrder = useCallback(
		(name: string, type: string, direction: "up" | "down") => {
			setSelectedValues((prev) => {
				const newSelectedValues = [...prev];
				const index = newSelectedValues.findIndex(
					(value) => value.name === name && value.type === type,
				);
				if (index !== -1) {
					if (direction === "up" && index > 0) {
						const temp = newSelectedValues[index - 1];
						newSelectedValues[index - 1] = newSelectedValues[index];
						newSelectedValues[index] = temp;
					} else if (
						direction === "down" &&
						index < newSelectedValues.length - 1
					) {
						const temp = newSelectedValues[index + 1];
						newSelectedValues[index + 1] = newSelectedValues[index];
						newSelectedValues[index] = temp;
					}
				}

				return newSelectedValues;
			});

			setRenderedAttributes((prev) => {
				const newRenderedAttributes = [...prev];
				const index = newRenderedAttributes.findIndex(
					(attr) => attr.key === name && attr.type === type,
				);
				if (index !== -1) {
					if (direction === "up" && index > 0) {
						const temp = newRenderedAttributes[index - 1];
						newRenderedAttributes[index - 1] =
							newRenderedAttributes[index];
						newRenderedAttributes[index] = temp;
					} else if (
						direction === "down" &&
						index < newRenderedAttributes.length - 1
					) {
						const temp = newRenderedAttributes[index + 1];
						newRenderedAttributes[index + 1] =
							newRenderedAttributes[index];
						newRenderedAttributes[index] = temp;
					}
				}

				return newRenderedAttributes;
			});
		},
		[],
	);

	/**
	 * Callback to update a layer in the attribute visualization engine
	 * It will update the layer in the attribute visualization engine and the attribute layers state
	 */
	const updateLayer = useCallback((name: string, layer: ILayer) => {
		setAttributeLayers((prev) => {
			const newAttributeLayers = {...prev};
			newAttributeLayers[name] = layer;

			return newAttributeLayers;
		});

		const currentLayers = attributeVisualizationEngineRef.current?.layers;
		if (!currentLayers) return;

		currentLayers[name] = layer;
		attributeVisualizationEngineRef.current?.updateLayers(currentLayers);
	}, []);

	/**
	 * The layer element of the widget
	 * It contains the default layer and all attribute layers
	 * The default layer is the layer that is used for all attributes that do not have a specific layer
	 * The attribute layers are the layers that are used for specific attributes
	 */
	const layerElement = (
		<>
			<Group
				justify="space-between"
				onClick={() => setLayerOptionsOpened((t) => !t)}
			>
				<Title order={5}> Layers </Title>
				{layerOptionsOpened ? <IconChevronUp /> : <IconChevronDown />}
			</Group>
			{layerOptionsOpened && (
				<Paper>
					<Stack w={"100%"}>
						<Text>default</Text>

						<Grid align="center">
							<Grid.Col span={"auto"}>
								<Slider
									min={0}
									max={1}
									step={0.01}
									value={defaultLayer.opacity}
									size={"sm"}
									onChangeEnd={(v) =>
										setDefaultLayer({
											...defaultLayer,
											opacity: v,
										})
									}
								/>
							</Grid.Col>
							<Grid.Col span={"content"}>
								<ActionIcon
									title="Toggle Layer"
									size={"sm"}
									onClick={() =>
										setDefaultLayer({
											...defaultLayer,
											enabled: !defaultLayer.enabled,
										})
									}
									variant={
										defaultLayer.enabled
											? "filled"
											: "light"
									}
								>
									<Icon type={IconTypeEnum.CircleOff} />
								</ActionIcon>
							</Grid.Col>
						</Grid>
					</Stack>
					{Object.keys(attributeLayers).map((key) => {
						const layer = attributeLayers[key];

						return (
							<Stack key={key} w={"100%"}>
								<Text>{key}</Text>
								<Grid align="center">
									<Grid.Col span={"auto"}>
										<Slider
											min={0}
											max={1}
											step={0.01}
											value={layer.opacity}
											size={"sm"}
											onChangeEnd={(v) =>
												updateLayer(key, {
													...layer,
													opacity: v,
												})
											}
										/>
									</Grid.Col>
									<Grid.Col span={"content"}>
										<ActionIcon
											title="Toggle Layer"
											size={"sm"}
											onClick={() =>
												updateLayer(key, {
													...layer,
													enabled: !layer.enabled,
												})
											}
											variant={
												layer.enabled
													? "filled"
													: "light"
											}
										>
											<Icon
												type={IconTypeEnum.CircleOff}
											/>
										</ActionIcon>
									</Grid.Col>
								</Grid>
							</Stack>
						);
					})}
				</Paper>
			)}
		</>
	);

	/**
	 * The attribute element of the widget
	 * It contains a multiselect to select the attributes that should be displayed
	 * and all the attribute widgets for the selected attributes
	 */
	const attributeElement = (
		<>
			<Group
				justify="space-between"
				onClick={() => setAttributeOptionsOpened((t) => !t)}
			>
				<Title order={5}> Attributes </Title>
				{attributeOptionsOpened ? (
					<IconChevronUp />
				) : (
					<IconChevronDown />
				)}
			</Group>
			{
				// we have to use the display style here, because the components still need to be rendered
				// even if the attribute options are not opened
				<div
					style={{display: attributeOptionsOpened ? "block" : "none"}}
				>
					<MultiSelect
						clearable
						placeholder="Select an attribute"
						data={Object.entries(attributeOverview)
							.map(([key, value]) => {
								return value.map((v) => ({
									value: `${key}_${v.typeHint}`,
									label:
										value.length > 1
											? `${key} - ${v.typeHint}`
											: key,
								}));
							})
							.flat()}
						value={selectedValues.map((value) => {
							return value.name + "_" + value.type;
						})}
						onChange={(v) => {
							const newSelectedValues = v.map((value) => {
								const [name, type] = value.split("_");

								return {name, type};
							});
							setSelectedValues(newSelectedValues);

							// remove from the rendered attributes if it is not selected anymore
							const newRenderedAttributes =
								renderedAttributes.filter((attr) => {
									return newSelectedValues.find(
										(value) =>
											value.name === attr.key &&
											value.type === attr.type,
									);
								});
							setRenderedAttributes(newRenderedAttributes);
						}}
					/>
					<Space />
					{selectedValues &&
						selectedValues.map((value) => {
							const key = value.name;
							if (!attributeOverview[key]) return null;
							const attribute = attributeOverview[key].find(
								(v) => v.typeHint === value.type,
							);
							if (!attribute) return null;

							const attributeKey = `${key}_${attribute.typeHint}`;

							if (
								SdtfPrimitiveTypeGuard.isNumberType(
									attribute.typeHint,
								)
							) {
								return (
									<NumberAttribute
										key={attributeKey}
										name={key}
										attribute={attribute}
										updateAttribute={updateAttribute}
										removeAttribute={removeAttribute}
										changeOrder={changeOrder}
									/>
								);
							} else if (
								SdtfPrimitiveTypeGuard.isStringType(
									attribute.typeHint,
								)
							) {
								return (
									<StringAttribute
										key={attributeKey}
										name={key}
										attribute={attribute}
										updateAttribute={updateAttribute}
										removeAttribute={removeAttribute}
										changeOrder={changeOrder}
									/>
								);
							} else if (
								SdtfPrimitiveTypeGuard.isColorType(
									attribute.typeHint,
								)
							) {
								return (
									<ColorAttribute
										key={attributeKey}
										name={key}
										attribute={attribute}
										updateAttribute={updateAttribute}
										removeAttribute={removeAttribute}
										changeOrder={changeOrder}
									/>
								);
							} else {
								return (
									<DefaultAttribute
										key={attributeKey}
										name={key}
										attribute={attribute}
										updateAttribute={updateAttribute}
										removeAttribute={removeAttribute}
										changeOrder={changeOrder}
									/>
								);
							}
						})}
				</div>
			}
		</>
	);

	return (
		<>
			<Paper>
				<Group
					justify="space-between"
					style={active ? {marginBottom: "10px"} : {}}
				>
					<Title order={3}> Attribute Visualization </Title>
					<Switch
						checked={active === true}
						onChange={(e) =>
							handleActivationToggle(e.currentTarget.checked)
						}
					/>
				</Group>
				{active && (
					<Stack>
						{layerElement}
						{attributeElement}
						<SelectedAttribute
							viewportId={viewportId}
							active={active}
							selectedValues={selectedValues}
							setSelectedValues={setSelectedValues}
							removeAttribute={removeAttribute}
						/>
					</Stack>
				)}
			</Paper>
		</>
	);
}

/**
 * Function to create a new attribute visualization engine
 *
 * @param viewport
 * @returns
 */
const createAttributeVisualizationEngine = (viewport: IViewportApi) => {
	const attributeVisualizationEngine = new AttributeVisualizationEngine(
		viewport,
	);
	attributeVisualizationEngine.updateLayerMaterialType("standard");
	attributeVisualizationEngine.updateDefaultMaterial(
		new MaterialStandardData({color: "#666"}),
	);
	attributeVisualizationEngine.updateDefaultLayer({
		color: "#666",
		opacity: 1,
		enabled: true,
	});
	attributeVisualizationEngine.updateVisualizedMaterialType("standard");

	return attributeVisualizationEngine;
};

/**
 * Function to toggle the attribute visualization
 *
 * @param toggle
 * @param viewport
 * @param sessionApis
 */
const toggleAttributeVisualization = async (
	toggle: boolean,
	viewport: IViewportApi,
	sessionApis: IShapeDiverStoreSessions,
) => {
	if (toggle) {
		await loadSdtf(sessionApis);
		viewport.type = RENDERER_TYPE.ATTRIBUTES;
		// TODO why is this necessary?
		sceneTree.root.updateVersion();
		viewport.update();
	} else {
		viewport.type = RENDERER_TYPE.STANDARD;
		// TODO why is this necessary?
		sceneTree.root.updateVersion();
		viewport.update();
	}
};

/**
 * Function to load the sdtf data of the session apis
 *
 * @param sessionApis
 */
const loadSdtf = async (sessionApis: IShapeDiverStoreSessions) => {
	const promises = [];
	for (const key in sessionApis) {
		const sessionApi = sessionApis[key];

		if (sessionApi.loadSdtf === false) {
			sessionApi.loadSdtf = true;
			promises.push(
				await new Promise<void>((resolve) =>
					addListener(
						EVENTTYPE_SESSION.SESSION_SDTF_DELAYED_LOADED,
						(e: IEvent) => {
							const sessionEvent = e as ISessionEvent;
							if (sessionEvent.sessionId === sessionApi.id)
								resolve();
						},
					),
				),
			);
		}
	}
};
