import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useAttributeOverview} from "@AppBuilderShared/hooks/shapediver/viewer/attributeVisualization/useAttributeOverview";
import useAttributeSelection from "@AppBuilderShared/hooks/shapediver/viewer/attributeVisualization/useAttributeSelection";
import {useAttributeVisualizationEngine} from "@AppBuilderShared/hooks/shapediver/viewer/attributeVisualization/useAttributeVisualizationEngine";
import {useAttributeWidgetVisibilityTracker} from "@AppBuilderShared/hooks/shapediver/viewer/attributeVisualization/useAttributeWidgetVisibilityTracker";
import {
	createAttributeId,
	useConvertAttributeInputData,
} from "@AppBuilderShared/hooks/shapediver/viewer/attributeVisualization/useConvertAttributeInputData";
import {useSdTFData} from "@AppBuilderShared/hooks/shapediver/viewer/useSdTFData";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {
	AttributeVisualizationVisibility,
	IAppBuilderWidgetPropsAttributeVisualization,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	ActionIcon,
	Group,
	GroupProps,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Select,
	Stack,
	Title,
	TitleProps,
	useProps,
} from "@mantine/core";
import {
	ATTRIBUTE_VISUALIZATION,
	Gradient,
	IAttribute,
	IColorAttribute,
	IDefaultAttribute,
	isStringGradient,
	IStringAttribute,
} from "@shapediver/viewer.features.attribute-visualization";
import {
	ISDTFOverview,
	MaterialStandardData,
	RENDERER_TYPE,
	SDTF_TYPEHINT,
	SdtfPrimitiveTypeGuard,
} from "@shapediver/viewer.session";
import {IViewportApi} from "@shapediver/viewer.viewport";
import React, {useCallback, useEffect, useId, useMemo, useState} from "react";
import SelectedAttributeComponent from "../../ui/SelectedAttributeComponent";
import ViewportAnchor3d from "../../viewport/anchors/ViewportAnchor3d";
import ColorAttribute from "./attributes/ColorAttribute";
import DefaultAttribute, {
	IDefaultAttributeExtended,
} from "./attributes/DefaultAttribute";
import NumberAttribute, {
	INumberAttributeExtended,
} from "./attributes/NumberAttribute";
import StringAttribute from "./attributes/StringAttribute";

export type IAttributeDefinition =
	| IAttribute
	| INumberAttributeExtended
	| IStringAttribute
	| IDefaultAttribute;

type StyleProps = {
	widgetProps?: Partial<PaperProps>;
	widgetGroupProps?: Partial<GroupProps>;
	titleProps?: Partial<TitleProps>;
};
const defaultStyleProps: Partial<StyleProps> = {
	widgetGroupProps: {
		justify: "space-between",
		mb: "xs",
	},
};

type AppBuilderAttributeVisualizationWidgetThemePropsType = Partial<StyleProps>;

const defaultGeneralGradient: Gradient = ATTRIBUTE_VISUALIZATION.TURBO;
const defaultNumberGradient: Gradient = ATTRIBUTE_VISUALIZATION.VIRIDIS;

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
		defaultGradient,
		initialAttribute: propsInitialAttribute,
		attributes: propsAttributes,
		visualizationMode = AttributeVisualizationVisibility.DefaultOff,
		showLegend = true,
		passiveMaterial,
		title = "Attributes",
		tooltip = "",
		...rest
	} = props;

	const {widgetProps, titleProps, widgetGroupProps} = useProps(
		"AppBuilderAttributeVisualizationWidgetComponent",
		defaultStyleProps,
		rest,
	);

	/**
	 *
	 *
	 * STATE VARIABLES
	 *
	 *
	 */
	const [renderedAttribute, setRenderedAttribute] = useState<
		IAttributeDefinition | undefined
	>();
	const [hasBeenLoaded, setHasBeenLoaded] = useState<boolean>(false);
	const [active, setActive] = useState<boolean>(false);

	/**
	 *
	 *
	 * HOOKS
	 *
	 *
	 */

	const {viewportId} = useViewportId();

	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);
	const widgetId = useId();
	const {ref, isVisible, hasPriority, requestPriority, removePriority} =
		useAttributeWidgetVisibilityTracker({
			viewport,
			wantsPriority: hasBeenLoaded
				? active
				: visualizationMode ===
					AttributeVisualizationVisibility.DefaultOn,
		});

	const {sdTFDataLoaded} = useSdTFData();

	const {isEnabled, canBeEnabled, isInitialized} = useMemo(() => {
		return {
			isEnabled: sdTFDataLoaded && active && hasPriority,
			isInitialized: renderedAttribute !== undefined,
			canBeEnabled: isVisible && sdTFDataLoaded,
		};
	}, [isVisible, sdTFDataLoaded, active, renderedAttribute]);

	const {attributeVisualizationEngine} = useAttributeVisualizationEngine(
		sdTFDataLoaded ? viewportId : "",
	);
	const {attributeOverview} = useAttributeOverview(
		attributeVisualizationEngine,
	);
	const {attributes} = useConvertAttributeInputData(
		attributeOverview,
		propsAttributes,
	);
	const attributeSelectionData = useAttributeSelection(
		viewportId,
		active,
		renderedAttribute,
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
			if (!attributes) return defaultGradient || defaultGeneralGradient;
			const definition = attributes.find((attribute) => {
				if (typeof attribute === "string") return false;
				return attribute.attribute === attributeId;
			}) as {
				attribute: string;
				gradient?: Gradient;
			};

			const parts = attributeId.split("_");

			// remove the last part of the attributeId
			// this is the type hint, which is not needed for the comparison
			const typeHint = parts.pop();
			const type = typeHint || "string";

			if (definition && definition.gradient) {
				if (typeof definition.gradient === "string")
					return definition.gradient as Gradient;

				if (
					SdtfPrimitiveTypeGuard.isNumberType(type) &&
					isStringGradient(definition.gradient)
				) {
					// in this case we use the default gradient for numbers
					return defaultGradient || defaultNumberGradient;
				}

				return definition.gradient;
			}

			return defaultGradient
				? defaultGradient
				: SdtfPrimitiveTypeGuard.isNumberType(type)
					? defaultNumberGradient
					: defaultGeneralGradient;
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
					// remove the last part of the attributeId
					// this is the type hint, which is not needed for the comparison
					const typeHint = parts.pop();
					// recombine the party in case of underscores in the key
					const attributeKey = parts.join("_");
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
	 * Handle the attribute change
	 * This is done by checking if the attribute is available in the overview
	 * and if not, it tries to find the attribute by its key and type hint
	 * @param id
	 * @returns {string | undefined}
	 */
	const handleAttributeChange = useCallback(
		(attributeId: string | null) => {
			if (!attributeId) return setRenderedAttribute(undefined);
			const attribute = getAttributeById(attributeId);
			setRenderedAttribute(attribute);
		},
		[getAttributeById],
	);

	/**
	 *
	 *
	 * USE EFFECTS
	 *
	 *
	 */

	/**
	 * Use effect that sets the initial attribute to be rendered
	 * This is done by checking if the propsInitialAttribute is provided
	 * or if the attributes are available
	 */
	useEffect(() => {
		if (attributeOverview === undefined) return;
		if (isInitialized) return;
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
		canBeEnabled,
		propsInitialAttribute,
		attributeOverview,
		attributes,
		isInitialized,
		getAttributeById,
	]);

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
	 * Use effect that sets the hasBeenLoaded state variable
	 * This is done by checking if the widget is visible once
	 * after that point the hasBeenLoaded state variable is set to true
	 */
	useEffect(() => {
		if (isVisible && sdTFDataLoaded) {
			if (!hasBeenLoaded) {
				setHasBeenLoaded(true);
			}
		}
	}, [isVisible, sdTFDataLoaded, hasBeenLoaded]);

	useEffect(() => {
		if (isInitialized === false) return;
		if (!attributeOverview) return;

		// update the current rendered attribute according to the attribute overview
		if (renderedAttribute) {
			const attributeIds = createAttributeId(
				renderedAttribute.key,
				attributeOverview,
			);
			const attributeId =
				attributeIds.find((attributeId) => {
					const parts = attributeId.split("_");
					// remove the last part of the attributeId
					// this is the type hint, which is not needed for the comparison
					const typeHint = parts.pop();
					// recombine the party in case of underscores in the key
					const attributeKey = parts.join("_");
					return (
						attributeKey === renderedAttribute.key &&
						typeHint === renderedAttribute.type
					);
				}) || attributeIds[0];

			const attribute = getAttributeById(attributeId);
			if (attribute) {
				// set custom values to the current ones
				if (SdtfPrimitiveTypeGuard.isNumberType(attribute.type)) {
					const numberAttribute =
						attribute as INumberAttributeExtended;
					const currentAttribute =
						renderedAttribute as INumberAttributeExtended;
					setRenderedAttribute({
						...numberAttribute,
						customMin: currentAttribute.customMin,
						customMax: currentAttribute.customMax,
					} as INumberAttributeExtended);
				} else if (
					!SdtfPrimitiveTypeGuard.isStringType(attribute.type) &&
					!SdtfPrimitiveTypeGuard.isColorType(attribute.type)
				) {
					const defaultAttribute =
						attribute as IDefaultAttributeExtended;
					const currentAttribute =
						renderedAttribute as IDefaultAttributeExtended;
					setRenderedAttribute({
						...defaultAttribute,
						customColor:
							currentAttribute.customColor ||
							defaultAttribute.color,
					} as IDefaultAttributeExtended);
				} else {
					setRenderedAttribute(attribute);
				}
			} else {
				// if the attribute is not available in the overview, we set it to undefined
				setRenderedAttribute(undefined);
			}
		}
	}, [isInitialized, attributeOverview]);

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
	 * UseEffect that reacts to changes to the hasPriority state variable
	 * Please read the comment in the function to understand the different scenarios
	 */
	useEffect(() => {
		if (!isInitialized) return;
		if (!canBeEnabled) return;

		if (hasPriority === true) {
			// the priority was assigned to this widget
			// if it was not active, we set the active state variable to true
			if (!active) setActive(true);
			toggleAttributeVisualization(true, viewport as IViewportApi);
		} else if (hasPriority === false && active === true) {
			// only if the widget can be enabled we set the wasActive state variable to false
			// this means that the widget was disabled by another widget being enabled
			setActive(false);
		}
	}, [canBeEnabled, hasPriority, isInitialized, viewport, active]);

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
	 * memoized data for the select options
	 */
	const selectOptions = useMemo(() => {
		if (!attributes || !attributeOverview) return [];

		return attributes
			.map((value) => {
				if (!attributeOverview) return undefined;

				const attributeId =
					typeof value === "string" ? value : value.attribute;
				const attributeKey = getAttributeKey(
					attributeId,
					attributeOverview,
				);

				if (!attributeKey) return undefined;
				const attributeData = attributeOverview[attributeKey];
				if (!attributeData) return undefined;

				if (attributeData.length > 1) {
					// we know that there are multiple attributes with the same key
					// so we need to add the type hint to the label
					const attribute = getAttributeById(attributeId);

					return {
						value: attributeId,
						label: attributeKey + " (" + attribute?.type + ")",
					};
				} else {
					return {
						value: attributeId,
						label: attributeKey,
					};
				}
			})
			.filter((value) => value !== undefined);
	}, [attributes, attributeOverview, getAttributeById]);

	/**
	 * The attribute selection element of the widget
	 * It contains a select to select the attribute that should be displayed
	 */
	const attributeElementSelection = (
		<>
			<Select
				placeholder="Select an attribute"
				allowDeselect={false}
				readOnly={attributes && attributes.length < 2}
				style={
					attributes && attributes.length < 2
						? {
								pointerEvents: "none", // disables user interaction
							}
						: {}
				}
				rightSection={
					attributes && attributes.length < 2 ? <></> : null
				}
				data={selectOptions}
				value={renderedAttribute?.key + "_" + renderedAttribute?.type}
				onChange={handleAttributeChange}
			/>
		</>
	);

	return (
		<>
			<TooltipWrapper label={tooltip}>
				<Paper ref={ref} {...widgetProps}>
					<Group {...widgetGroupProps}>
						<Title {...titleProps}>{title}</Title>
						<ActionIcon
							onClick={() => {
								if (!isInitialized) return;
								if (!canBeEnabled) return;

								if (active) {
									if (hasPriority) removePriority();
									setActive(false);
								} else {
									if (!hasPriority) requestPriority();
									setActive(true);
								}

								toggleAttributeVisualization(
									!active,
									viewport as IViewportApi,
								);
							}}
						>
							{active ? (
								<Icon iconType={"tabler:eye"} />
							) : (
								<Icon iconType={"tabler:eye-off"} />
							)}
						</ActionIcon>
					</Group>
					<Stack
						style={
							active
								? {}
								: {
										opacity: 0.25, // Visual "disabled" effect
										pointerEvents: "none", // Disable interactions
										userSelect: "none", // Prevent text selection
									}
						}
					>
						{attributeElementSelection}
						{renderedAttributeElement}
					</Stack>
				</Paper>
			</TooltipWrapper>
			{active && attributeSelectionData && (
				<ViewportAnchor3d
					location={attributeSelectionData.location}
					id={`${widgetId}_anchor`}
					element={
						<SelectedAttributeComponent
							renderedAttribute={renderedAttribute}
							attributes={attributes}
							selectedItemData={
								attributeSelectionData.selectedItemData
							}
							handleAttributeChange={handleAttributeChange}
						/>
					}
				/>
			)}
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
	if (toggle && viewport.type !== RENDERER_TYPE.ATTRIBUTES) {
		viewport.type = RENDERER_TYPE.ATTRIBUTES;
	} else if (!toggle && viewport.type !== RENDERER_TYPE.STANDARD) {
		viewport.type = RENDERER_TYPE.STANDARD;
	}
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
			// remove the last part of the attributeId
			// this is the type hint, which is not needed for the comparison
			const typeHint = parts.pop();
			// recombine the party in case of underscores in the key
			const attributeKey = parts.join("_");

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
