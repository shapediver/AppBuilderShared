import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useAttributeVisualizationEngine} from "@AppBuilderShared/hooks/shapediver/viewer/attributeVisualization/useAttributeVisualizationEngine";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {
	AttributeVisualizationVisibility,
	IAppBuilderWidgetPropsAttributeVisualization,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IShapeDiverStoreSessions} from "@AppBuilderShared/types/store/shapediverStoreSession";
import {
	ActionIcon,
	Group,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Select,
	Space,
	Stack,
	Title,
} from "@mantine/core";
import {
	ATTRIBUTE_VISUALIZATION,
	Gradient,
	IAttribute,
	IColorAttribute,
	IDefaultAttribute,
	INumberAttribute,
	IStringAttribute,
} from "@shapediver/viewer.features.attribute-visualization";
import {
	addListener,
	EVENTTYPE_SESSION,
	IEvent,
	ISDTFOverview,
	ISessionEvent,
	RENDERER_TYPE,
	sceneTree,
	SDTF_TYPEHINT,
	SdtfPrimitiveTypeGuard,
} from "@shapediver/viewer.session";
import {IViewportApi} from "@shapediver/viewer.viewport";
import {IconEye, IconEyeOff} from "@tabler/icons-react";
import React, {useEffect, useMemo, useState} from "react";
import ColorAttribute from "./attributes/ColorAttribute";
import DefaultAttribute from "./attributes/DefaultAttribute";
import NumberAttribute from "./attributes/NumberAttribute";
import StringAttribute from "./attributes/StringAttribute";

type StyleProps = PaperProps & {};

type AppBuilderAttributeVisualizationWidgetThemePropsType = Partial<StyleProps>;

export function AppBuilderAttributeVisualizationWidgetThemeProps(
	props: AppBuilderAttributeVisualizationWidgetThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

const createAttributeId = (key: string, overview: ISDTFOverview): string[] => {
	if (!overview[key]) return [];

	const attribute = overview[key];

	if (attribute.length > 0) {
		return attribute.map((v) => {
			if (attribute.length > 1) {
				return key + "_" + v.typeHint;
			} else {
				return key;
			}
		});
	} else {
		return [key];
	}
};

const getAttributeKey = (id: string, overview: ISDTFOverview) => {
	if (overview[id]) {
		return id;
	} else {
		const parts = id.split("_");
		if (parts.length > 1) {
			const attributeKey = parts[0];
			const typeHint = parts[1];
			if (overview[attributeKey]) {
				const attribute = overview[attributeKey].find(
					(attribute) => attribute.typeHint === typeHint,
				);
				if (attribute) {
					return attributeKey;
				}
			}
		}
	}
};

const getGradient = (
	key: string,
	attributeDefinition:
		| (
				| string
				| {
						attribute: string;
						gradient?: Gradient;
				  }
		  )[]
		| undefined,
	defaultGradient: Gradient,
): Gradient => {
	if (attributeDefinition) {
		const definition = attributeDefinition.find((attribute) => {
			if (typeof attribute === "string") return false;
			return attribute.attribute === key;
		}) as {
			attribute: string;
			gradient?: Gradient;
		};
		if (definition && definition.gradient) {
			return definition.gradient;
		}
	}
	return defaultGradient;
};

const getAttributeById = (
	id: string | undefined,
	overview: ISDTFOverview,
	attributeDefinition:
		| (
				| string
				| {
						attribute: string;
						gradient?: Gradient;
				  }
		  )[]
		| undefined,
	defaultGradient: Gradient,
):
	| IAttribute
	| INumberAttribute
	| IStringAttribute
	| IDefaultAttribute
	| undefined => {
	if (!id) return undefined;
	if (overview[id]) {
		const attribute = overview[id];
		if (attribute.length > 0) {
			return {
				key: id,
				type: attribute[0].typeHint as SDTF_TYPEHINT,
				min: attribute[0].min,
				max: attribute[0].max,
				values: attribute[0].values,
				visualization: getGradient(
					id,
					attributeDefinition,
					defaultGradient,
				),
			};
		}
	} else {
		const parts = id.split("_");
		if (parts.length > 1) {
			const attributeKey = parts[0];
			const typeHint = parts[1];
			if (overview[attributeKey]) {
				const attribute = overview[attributeKey].find(
					(attribute) => attribute.typeHint === typeHint,
				);
				if (attribute) {
					return {
						key: attributeKey,
						type: attribute.typeHint as SDTF_TYPEHINT,
						min: attribute.min,
						max: attribute.max,
						values: attribute.values,
						visualization: getGradient(
							attributeKey,
							attributeDefinition,
							defaultGradient,
						),
					};
				}
			}
		}
	}
};

export default function AppBuilderAttributeVisualizationWidgetComponent(
	props: IAppBuilderWidgetPropsAttributeVisualization &
		AppBuilderAttributeVisualizationWidgetThemePropsType,
) {
	const [attributeOverview, setAttributeOverview] = useState<ISDTFOverview>(
		{},
	);
	const [renderedAttribute, setRenderedAttribute] = useState<
		| IAttribute
		| INumberAttribute
		| IStringAttribute
		| IDefaultAttribute
		| undefined
	>();
	const [active, setActive] = useState<boolean>(false);
	const [sdtfLoaded, setSdtfLoaded] = useState<boolean>(false);
	const cleanedProps = useMemo(() => {
		const attributeIds: string[] = [];

		const defaultGradient =
			props.defaultGradient ||
			ATTRIBUTE_VISUALIZATION.BLUE_GREEN_YELLOW_RED_PURPLE_WHITE;

		Object.keys(attributeOverview).map((key) => {
			const ids = createAttributeId(key, attributeOverview);
			attributeIds.push(...ids);
		});

		const providedAttributesCleaned = props.attributes
			? props.attributes
					.map((value) => {
						if (typeof value === "string") {
							return createAttributeId(value, attributeOverview);
						} else {
							return createAttributeId(
								value.attribute,
								attributeOverview,
							).map((id) => {
								return {
									attribute: id,
									gradient: value.gradient,
								};
							});
						}
					})
					.flat()
			: undefined;

		const initialAttributeCleaned = props.initialAttribute
			? createAttributeId(props.initialAttribute, attributeOverview)[0]
			: attributeIds[0];

		const initialAttribute = getAttributeById(
			initialAttributeCleaned,
			attributeOverview,
			providedAttributesCleaned,
			defaultGradient,
		);
		setRenderedAttribute(initialAttribute);

		return {
			title: props.title || "Attributes",
			tooltip: props.tooltip || "",
			attributes: providedAttributesCleaned || attributeIds,
			visualizationMode:
				props.visualizationMode ||
				AttributeVisualizationVisibility.DefaultOff,
			showLegend: props.showLegend || true,
			defaultGradient,
			initialAttribute: initialAttributeCleaned,
			passiveMaterial: props.passiveMaterial || {
				color: "#666",
				opacity: 1,
			},
		};
	}, [props, attributeOverview]);

	const {viewportId} = useViewportId();

	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);
	const sessions = useShapeDiverStoreSession((state) => state.sessions);

	const {attributeVisualizationEngine} = useAttributeVisualizationEngine(
		sdtfLoaded ? viewportId : "",
	);

	useEffect(() => {
		loadSdtf(sessions).then(() => {
			setSdtfLoaded(true);
		});
	}, [sessions]);

	/**
	 * Use effect to update the attributes of the attribute visualization engine
	 * when the rendered attributes change
	 */
	useEffect(() => {
		if (renderedAttribute) {
			attributeVisualizationEngine?.updateAttributes([renderedAttribute]);
		} else {
			attributeVisualizationEngine?.updateAttributes([]);
		}
	}, [attributeVisualizationEngine, renderedAttribute]);

	useEffect(() => {
		if (!attributeVisualizationEngine) return;
		setAttributeOverview(attributeVisualizationEngine.overview);

		const token = attributeVisualizationEngine.addListener(() => {
			if (!attributeVisualizationEngine) return;
			setAttributeOverview(attributeVisualizationEngine.overview);
		});

		return () => {
			if (token) attributeVisualizationEngine.removeListener(token);
		};
	}, [attributeVisualizationEngine]);

	const renderedAttributeElement = useMemo(() => {
		if (!renderedAttribute) return null;

		if (SdtfPrimitiveTypeGuard.isStringType(renderedAttribute.type)) {
			return (
				<StringAttribute
					name={renderedAttribute.key}
					attribute={renderedAttribute as IStringAttribute}
					updateAttribute={(attribute) =>
						setRenderedAttribute(attribute)
					}
					showLegend={cleanedProps.showLegend}
				/>
			);
		} else if (
			SdtfPrimitiveTypeGuard.isNumberType(renderedAttribute.type)
		) {
			return (
				<NumberAttribute
					name={renderedAttribute.key}
					attribute={renderedAttribute as INumberAttribute}
					updateAttribute={(attribute) =>
						setRenderedAttribute(attribute)
					}
					showLegend={cleanedProps.showLegend}
				/>
			);
		} else if (SdtfPrimitiveTypeGuard.isColorType(renderedAttribute.type)) {
			return (
				<ColorAttribute
					name={renderedAttribute.key}
					attribute={renderedAttribute as IColorAttribute}
					updateAttribute={(attribute) =>
						setRenderedAttribute(attribute)
					}
				/>
			);
		} else {
			return (
				<DefaultAttribute
					name={renderedAttribute.key}
					attribute={renderedAttribute}
					updateAttribute={(attribute) =>
						setRenderedAttribute(attribute)
					}
				/>
			);
		}
	}, [renderedAttribute]);

	/**
	 * The attribute element of the widget
	 * It contains a multiselect to select the attributes that should be displayed
	 * and all the attribute widgets for the selected attributes
	 */
	const attributeElementSelection = (
		<>
			<Select
				placeholder="Select an attribute"
				data={cleanedProps.attributes
					.map((value) => {
						const nameInDefinition =
							typeof value === "string" ? value : value.attribute;

						const attributeKey = getAttributeKey(
							nameInDefinition,
							attributeOverview,
						);

						if (attributeKey !== nameInDefinition) {
							// we know that there are multiple attributes with the same key
							// so we need to add the type hint to the label
							const attribute = getAttributeById(
								nameInDefinition,
								attributeOverview,
								cleanedProps.attributes,
								cleanedProps.defaultGradient,
							);

							return {
								value: nameInDefinition,
								label:
									attributeKey + " (" + attribute?.type + ")",
							};
						} else {
							return {
								value: nameInDefinition,
								label: nameInDefinition,
							};
						}
					})
					.filter((value) => value !== undefined)}
				value={renderedAttribute?.key}
				onChange={(v) => {
					if (!v) return setRenderedAttribute(undefined);
					const attribute = getAttributeById(
						v,
						attributeOverview,
						cleanedProps.attributes,
						cleanedProps.defaultGradient,
					);
					setRenderedAttribute(attribute);
				}}
			/>
		</>
	);

	return (
		<>
			<TooltipWrapper label={cleanedProps.tooltip}>
				<Paper>
					<Group justify="space-between">
						<Title
							order={2} // TODO make this a style prop
							style={{marginBottom: "20px"}} // TODO make this a style prop
						>
							{cleanedProps.title}{" "}
						</Title>
						<ActionIcon
							onClick={() => {
								toggleAttributeVisualization(
									!active,
									viewport as IViewportApi,
								);
								setActive((t) => !t);
							}}
						>
							{active ? <IconEye /> : <IconEyeOff />}
						</ActionIcon>
					</Group>
					<Stack>
						{attributeElementSelection}
						<Space />
						{renderedAttributeElement}
					</Stack>
				</Paper>
			</TooltipWrapper>
		</>
	);
}

/**
 * Function to toggle the attribute visualization
 *
 * @param toggle
 * @param viewport
 * @param sessionApis
 */
const toggleAttributeVisualization = (
	toggle: boolean,
	viewport: IViewportApi,
) => {
	if (toggle) {
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
