import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useAttributeVisualizationEngine} from "@AppBuilderShared/hooks/shapediver/viewer/attributeVisualization/useAttributeVisualizationEngine";
import {useAttributeWidgetVisibilityTracker} from "@AppBuilderShared/hooks/shapediver/viewer/attributeVisualization/useAttributeWidgetVisibilityTracker";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {
	AttributeVisualizationVisibility,
	IAppBuilderWidgetPropsAttributeVisualization,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	ActionIcon,
	Group,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Select,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import {
	ATTRIBUTE_VISUALIZATION,
	Gradient,
	IAttribute,
	IColorAttribute,
	IDefaultAttribute,
	IStringAttribute,
} from "@shapediver/viewer.features.attribute-visualization";
import {
	addListener,
	EVENTTYPE_SESSION,
	IEvent,
	ISDTFOverview,
	ISessionEvent,
	MaterialStandardData,
	removeListener,
	RENDERER_TYPE,
	sceneTree,
	SDTF_TYPEHINT,
	SdtfPrimitiveTypeGuard,
} from "@shapediver/viewer.session";
import {IViewportApi} from "@shapediver/viewer.viewport";
import {IconEye, IconEyeOff} from "@tabler/icons-react";
import React, {useCallback, useEffect, useId, useMemo, useState} from "react";
import ColorAttribute from "./attributes/ColorAttribute";
import DefaultAttribute, {
	IDefaultAttributeExtended,
} from "./attributes/DefaultAttribute";
import NumberAttribute, {
	INumberAttributeExtended,
} from "./attributes/NumberAttribute";
import StringAttribute from "./attributes/StringAttribute";

type IAttributeDefinition =
	| IAttribute
	| INumberAttributeExtended
	| IStringAttribute
	| IDefaultAttribute;

type StyleProps = PaperProps & {};

type AppBuilderAttributeVisualizationWidgetThemePropsType = Partial<StyleProps>;

export function AppBuilderAttributeVisualizationWidgetThemeProps(
	props: AppBuilderAttributeVisualizationWidgetThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function AppBuilderAttributeVisualizationWidgetComponent(
	props: IAppBuilderWidgetPropsAttributeVisualization &
		AppBuilderAttributeVisualizationWidgetThemePropsType,
) {
	/**
	 * Parsing of the incoming props and assigning default values if not provided
	 */
	const {
		defaultGradient = ATTRIBUTE_VISUALIZATION.BLUE_GREEN_YELLOW_RED_PURPLE_WHITE,
		initialAttribute: propsInitialAttribute,
		attributes: propsAttributes,
		visualizationMode = AttributeVisualizationVisibility.DefaultOff,
		showLegend = true,
		passiveMaterial,
		title = "Attributes",
		tooltip = "",
		...paperProps
	} = props;

	/**
	 *
	 *
	 * STATE VARIABLES
	 *
	 *
	 */

	const [attributeOverview, setAttributeOverview] = useState<
		ISDTFOverview | undefined
	>();
	const [renderedAttribute, setRenderedAttribute] = useState<
		IAttributeDefinition | undefined
	>();
	const [active, setActive] = useState<boolean>(false);
	const [loadSdTF, setLoadSdTF] = useState<boolean>(false);
	const [attributes, setAttributes] = useState<
		| (
				| string
				| {
						attribute: string;
						gradient: Gradient | undefined;
				  }
		  )[]
		| undefined
	>();

	/**
	 *
	 *
	 * HOOKS
	 *
	 *
	 */

	const widgetId = useId();

	const {ref, isVisible, hasPriority, getPriority} =
		useAttributeWidgetVisibilityTracker({
			wantsPriority:
				visualizationMode ===
				AttributeVisualizationVisibility.DefaultOn,
		});

	const {isEnabled, canBeEnabled, isInitialized} = useMemo(() => {
		return {
			isEnabled: isVisible && loadSdTF && active && hasPriority,
			isInitialized: renderedAttribute !== undefined,
			canBeEnabled: isVisible && loadSdTF,
		};
	}, [isVisible, loadSdTF, active, renderedAttribute]);

	const {viewportId} = useViewportId();

	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);

	const sessions = useShapeDiverStoreSession((state) => state.sessions);

	const {attributeVisualizationEngine} = useAttributeVisualizationEngine(
		canBeEnabled ? viewportId : "",
	);

	/**
	 *
	 *
	 * CALLBACKS
	 *
	 *
	 */

	/**
	 * Get the gradient of the attribute
	 * This is done by checking if the attributes are provided in the props
	 * and if a gradient is provided
	 * If not, the default gradient is returned
	 */
	const getGradient = useCallback(
		(attributeId: string): Gradient => {
			if (!attributes) return defaultGradient;
			const definition = attributes.find((attribute) => {
				if (typeof attribute === "string") return false;
				return attribute.attribute === attributeId;
			}) as {
				attribute: string;
				gradient?: Gradient;
			};
			if (definition && definition.gradient) {
				return definition.gradient;
			}
			return defaultGradient;
		},
		[attributes, defaultGradient],
	);

	/**
	 * Get the attribute by id
	 * This is done by checking if the attribute is available in the overview
	 * and if not, it tries to find the attribute by its key and type hint
	 * If not found, undefined is returned
	 * The gradient is also assigned to the attribute
	 * @param id
	 * @returns {IAttributeDefinition | undefined}
	 */
	const getAttributeById = useCallback(
		(id: string | undefined): IAttributeDefinition | undefined => {
			if (attributeOverview === undefined) return;
			if (id === undefined) return undefined;

			if (attributeOverview[id]) {
				const attribute = attributeOverview[id];
				if (attribute.length > 0) {
					return {
						key: id,
						type: attribute[0].typeHint as SDTF_TYPEHINT,
						min: attribute[0].min,
						max: attribute[0].max,
						values: attribute[0].values,
						countForValue: attribute[0].countForValue,
						visualization: getGradient(id),
					};
				}
			} else {
				const parts = id.split("_");
				if (parts.length > 1) {
					const attributeKey = parts[0];
					const typeHint = parts[1];
					if (attributeOverview[attributeKey]) {
						const attribute = attributeOverview[attributeKey].find(
							(attribute) => attribute.typeHint === typeHint,
						);
						if (attribute) {
							return {
								key: attributeKey,
								type: attribute.typeHint as SDTF_TYPEHINT,
								min: attribute.min,
								max: attribute.max,
								values: attribute.values,
								countForValue: attribute.countForValue,
								visualization: getGradient(id),
							};
						}
					}
				}
			}
		},
		[attributeOverview, getGradient],
	);

	/**
	 *
	 *
	 * USE EFFECTS
	 *
	 *
	 */

	/**
	 * Use effect that sets the loadSdTF state variable
	 * This is done by checking if the sessions are available
	 * and if the sdtf is loaded
	 * If the sdtf is loaded, the loadSdTF state variable is set to true
	 */
	useEffect(() => {
		const removeListenerTokens: string[] = [];

		// if just one session has loaded the sdtf, we can set the loadSdTF to true
		for (const sessionId in sessions) {
			const session = sessions[sessionId];

			removeListenerTokens.push(
				addListener(
					EVENTTYPE_SESSION.SESSION_SDTF_DELAYED_LOADED,
					(e: IEvent) => {
						const sessionEvent = e as ISessionEvent;
						if (sessionEvent.sessionId === session.id) {
							setLoadSdTF(true);
						}
					},
				),
			);
		}

		return () => {
			removeListenerTokens.forEach((token) => {
				removeListener(token);
			});
		};
	}, [sessions]);

	/**
	 * Use effect that assigns the attributes state variable
	 * This is done by checking if the attributes are provided in the props
	 * or if the attribute overview is available
	 */
	useEffect(() => {
		if (canBeEnabled === false) return;
		if (attributeOverview === undefined) return;

		const attributeIds: string[] = [];

		Object.keys(attributeOverview).map((key) => {
			const ids = createAttributeId(key, attributeOverview);
			attributeIds.push(...ids);
		});

		const providedAttributesCleaned = propsAttributes
			? propsAttributes
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

		setAttributes(providedAttributesCleaned || attributeIds);
	}, [canBeEnabled, propsAttributes, attributeOverview, defaultGradient]);

	/**
	 * Use effect that sets the initial attribute to be rendered
	 * This is done by checking if the propsInitialAttribute is provided
	 * or if the attributes are available
	 */
	useEffect(() => {
		if (attributeOverview === undefined) return;
		if (isInitialized) return;
		if (canBeEnabled === false) return;
		if (!attributes) return;

		if (propsInitialAttribute) {
			const initialAttributesCleaned = createAttributeId(
				propsInitialAttribute,
				attributeOverview,
			);

			if (initialAttributesCleaned.length > 0) {
				const initialAttribute = getAttributeById(
					initialAttributesCleaned[0],
				);
				setRenderedAttribute(initialAttribute);
				return;
			}
		} else if (attributes.length > 0) {
			const initialAttributeCleaned =
				typeof attributes[0] === "string"
					? attributes[0]
					: attributes[0].attribute;

			const initialAttribute = getAttributeById(initialAttributeCleaned);
			setRenderedAttribute(initialAttribute);
		}
	}, [
		renderedAttribute,
		canBeEnabled,
		propsInitialAttribute,
		attributeOverview,
		attributes,
		getAttributeById,
	]);

	/**
	 * Use effect that sets the active state variable depending on the visualization mode
	 */
	useEffect(() => {
		if (hasPriority === false) {
			setActive(false);
			return;
		}
		if (canBeEnabled === false) return;
		if (isInitialized) return;

		// only set this if we just created the engine
		setActive(
			visualizationMode === AttributeVisualizationVisibility.DefaultOn,
		);
	}, [hasPriority, canBeEnabled, visualizationMode]);

	/**
	 * Use effect that updates the default material of the attribute visualization engine
	 * This is done by checking if the attribute visualization engine is available
	 * and if the passive material is provided
	 */
	useEffect(() => {
		if (isEnabled === false) return;
		if (attributeVisualizationEngine) {
			attributeVisualizationEngine.updateDefaultMaterial(
				new MaterialStandardData({
					color: passiveMaterial?.color || "#666",
					opacity: passiveMaterial?.opacity || 1,
				}),
			);
		}
	}, [isEnabled, attributeVisualizationEngine, passiveMaterial]);

	/**
	 * Use effect to update the attributes of the attribute visualization engine
	 * when the rendered attributes change
	 */
	useEffect(() => {
		if (isEnabled === false) return;

		if (renderedAttribute) {
			if (SdtfPrimitiveTypeGuard.isNumberType(renderedAttribute.type)) {
				const numberAttribute =
					renderedAttribute as INumberAttributeExtended;

				attributeVisualizationEngine?.updateAttributes([
					{
						...numberAttribute,
						min: numberAttribute.customMin ?? numberAttribute.min,
						max: numberAttribute.customMax ?? numberAttribute.max,
					} as INumberAttributeExtended,
				]);
			} else if (
				!SdtfPrimitiveTypeGuard.isStringType(renderedAttribute.type) &&
				!SdtfPrimitiveTypeGuard.isColorType(renderedAttribute.type)
			) {
				const defaultAttribute =
					renderedAttribute as IDefaultAttributeExtended;
				attributeVisualizationEngine?.updateAttributes([
					{
						...defaultAttribute,
						color:
							defaultAttribute.customColor ??
							defaultAttribute.color,
					} as IDefaultAttributeExtended,
				]);
			} else {
				attributeVisualizationEngine?.updateAttributes([
					renderedAttribute,
				]);
			}
		} else {
			attributeVisualizationEngine?.updateAttributes([]);
		}
	}, [isEnabled, attributeVisualizationEngine, renderedAttribute]);

	/**
	 * Use effect that updates the attribute overview of the attribute visualization engine
	 */
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

	/**
	 * Use effect that toggles the attribute visualization
	 */
	useEffect(() => {
		if (hasPriority === false) return;
		if (canBeEnabled === false) return;

		toggleAttributeVisualization(active, viewport as IViewportApi);
	}, [canBeEnabled, hasPriority, active, viewport]);

	/**
	 *
	 *
	 * RENDERING
	 *
	 *
	 */

	/**
	 * Create the attribute element of the widget
	 * It is a memoized value that is updated when the rendered attribute changes
	 */
	const renderedAttributeElement = useMemo(() => {
		if (!renderedAttribute) return null;

		if (SdtfPrimitiveTypeGuard.isStringType(renderedAttribute.type)) {
			return (
				<StringAttribute
					name={renderedAttribute.key}
					attribute={renderedAttribute as IStringAttribute}
					showLegend={showLegend}
				/>
			);
		} else if (
			SdtfPrimitiveTypeGuard.isNumberType(renderedAttribute.type)
		) {
			return (
				<NumberAttribute
					name={renderedAttribute.key}
					attribute={renderedAttribute as INumberAttributeExtended}
					updateRange={(min: number, max: number) => {
						setRenderedAttribute({
							...renderedAttribute,
							customMin: min,
							customMax: max,
						} as INumberAttributeExtended);
					}}
					showLegend={showLegend}
					widgetId={widgetId}
				/>
			);
		} else if (SdtfPrimitiveTypeGuard.isColorType(renderedAttribute.type)) {
			return (
				<ColorAttribute
					name={renderedAttribute.key}
					attribute={renderedAttribute as IColorAttribute}
				/>
			);
		} else {
			return (
				<DefaultAttribute
					name={renderedAttribute.key}
					attribute={renderedAttribute}
					updateColor={(color) =>
						setRenderedAttribute({
							...renderedAttribute,
							customColor: color,
						} as IDefaultAttributeExtended)
					}
					widgetId={widgetId}
				/>
			);
		}
	}, [renderedAttribute, showLegend]);

	/**
	 * The attribute selection element of the widget
	 * It contains a select to select the attribute that should be displayed
	 */
	const attributeElementSelection = (
		<>
			<Select
				placeholder="Select an attribute"
				allowDeselect={false}
				data={
					attributes &&
					attributes
						.map((value) => {
							if (!attributeOverview) return undefined;

							const attributeId =
								typeof value === "string"
									? value
									: value.attribute;
							const attributeKey = getAttributeKey(
								attributeId,
								attributeOverview,
							);

							if (!attributeKey) return undefined;
							const attributeData =
								attributeOverview[attributeKey];
							if (!attributeData) return undefined;

							if (attributeData.length > 1) {
								// we know that there are multiple attributes with the same key
								// so we need to add the type hint to the label
								const attribute = getAttributeById(attributeId);

								return {
									value: attributeId,
									label:
										attributeKey +
										" (" +
										attribute?.type +
										")",
								};
							} else {
								return {
									value: attributeId,
									label: attributeKey,
								};
							}
						})
						.filter((value) => value !== undefined)
				}
				value={renderedAttribute?.key + "_" + renderedAttribute?.type}
				onChange={(attributeId) => {
					if (!attributeId) return setRenderedAttribute(undefined);
					const attribute = getAttributeById(attributeId);
					setRenderedAttribute(attribute);
				}}
			/>
		</>
	);

	return (
		<>
			<TooltipWrapper label={tooltip}>
				<Paper ref={ref} {...paperProps}>
					<Group justify="space-between" mb={"xs"}>
						<Title
							order={2} // TODO make this a style prop
						>
							{title}
						</Title>
						<ActionIcon
							onClick={() => {
								getPriority();
								setActive(!active);
							}}
						>
							{active ? <IconEye /> : <IconEyeOff />}
						</ActionIcon>
					</Group>
					<Stack
						style={
							active
								? {}
								: {
										opacity: 0.5, // Visual "disabled" effect
										pointerEvents: "none", // Disable interactions
										userSelect: "none", // Prevent text selection
									}
						}
					>
						{attributes && attributes.length > 1 ? (
							attributeElementSelection
						) : attributes && attributes.length > 0 ? (
							<Text>
								{typeof attributes[0] === "string"
									? getAttributeKey(
											attributes[0],
											attributeOverview,
										)
									: getAttributeKey(
											attributes[0].attribute,
											attributeOverview,
										)}
							</Text>
						) : null}
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
	if (!viewport) return;
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
 * Function to create the attribute id
 * This is done by checking if the attribute is available in the overview
 * and if not, it tries to find the attribute by its key and type hint
 * If not found, undefined is returned
 * The gradient is also assigned to the attribute
 * @param key
 * @param overview
 * @returns {string[]}
 */
const createAttributeId = (key: string, overview: ISDTFOverview): string[] => {
	if (!overview[key]) return [];

	const attribute = overview[key];
	return attribute.map((v) => {
		return key + "_" + v.typeHint;
	});
};

/**
 * Function to get the attribute key
 * This is done by checking if the attribute is available in the overview
 * and if not, it tries to find the attribute by its key and type hint
 * If not found, undefined is returned
 * @param id
 * @param overview
 * @returns {string | undefined}
 */
const getAttributeKey = (id: string, overview?: ISDTFOverview) => {
	if (!overview) return undefined;
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
