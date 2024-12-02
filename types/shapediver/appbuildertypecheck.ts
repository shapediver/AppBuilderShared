import { z } from "zod";
import { IconTypeEnum } from "./icons";
import { IDrawingParameterJsonSchema, IInteractionParameterJsonSchema, PARAMETER_TYPE, PARAMETER_VISUALIZATION } from "@shapediver/viewer.session";
import { ShapeDiverResponseParameterStructure } from "@shapediver/api.geometry-api-dto-v2";

// Zod type definition for IAppBuilderParameterDefinition
const IAppBuilderParameterDefinitionSchema = z.object({
	id: z.string(),
	choices: z.array(z.string()).optional(),
	decimalplaces: z.number().optional(),
	defval: z.string(),
	expression: z.string().optional(),
	format: z.array(z.string()).optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	umin: z.number().optional(),
	umax: z.number().optional(),
	vmin: z.number().optional(),
	vmax: z.number().optional(),
	interval: z.number().optional(),
	name: z.string(),
	type: z.nativeEnum(PARAMETER_TYPE),
	visualization: z.nativeEnum(PARAMETER_VISUALIZATION).optional(),
	structure: z.nativeEnum(ShapeDiverResponseParameterStructure).optional(),
	group: z.object({
		id: z.string(),
		name: z.string(),
	}).optional(),
	hint: z.string().optional(),
	order: z.number().optional(),
	tooltip: z.string().optional(),
	displayname: z.string().optional(),
	hidden: z.boolean(),
	settings: z.union([IInteractionParameterJsonSchema, IDrawingParameterJsonSchema]).optional(),
	value: z.string().optional(),
});

// Zod type definition for property "overrides" of IAppBuilderParameterRef
const IAppBuilderParameterOverridesSchema = IAppBuilderParameterDefinitionSchema.partial().pick({
	displayname: true,
	group: true,
	order: true,
	tooltip: true,
	hidden: true,
}); 

// Zod type definition for IAppBuilderParameterRef
const IAppBuilderParameterRefSchema = z.object({
	name: z.string(),
	sessionId: z.string().optional(),
	overrides: IAppBuilderParameterOverridesSchema.optional(),
	disableIfDirty: z.boolean().optional(),
	acceptRejectMode: z.boolean().optional(),
});

// Zod type definition for property "overrides" of IAppBuilderExportRef
const IAppBuilderExportOverridesSchema = IAppBuilderParameterOverridesSchema; 

// Zod type definition for IAppBuilderExportRef
const IAppBuilderExportRefSchema = z.object({
	name: z.string(),
	sessionId: z.string().optional(),
	overrides: IAppBuilderExportOverridesSchema.optional(),
});

// Zod type definition for IAppBuilderImageRef
const IAppBuilderImageRefSchema = z.object({
	export: IAppBuilderExportRefSchema.pick({"name": true, "sessionId": true}).optional(),
	href: z.string().optional(),
});

// Zod type definition for IAppBuilderActionPropsCommon
const IAppBuilderActionPropsCommonSchema = z.object({
	label: z.string().optional(),
	icon: z.nativeEnum(IconTypeEnum).optional(),
	tooltip: z.string().optional(),
});

// Zod type definition for IAppBuilderActionPropsCreateModelState
const IAppBuilderActionPropsCreateModelStateSchema = z.object({
	includeImage: z.boolean().optional(),
	image: IAppBuilderImageRefSchema.optional(),
	includeGltf: z.boolean().optional(),
}).extend(IAppBuilderActionPropsCommonSchema.shape);

// Zod type definition for IAppBuilderActionPropsAddToCart
const IAppBuilderActionPropsAddToCartSchema = z.object({
	productId: z.string().optional(),
	quantity: z.number().optional(),
	price: z.number().optional(),
	description: z.string().optional(),
}).extend(IAppBuilderActionPropsCreateModelStateSchema.shape);

// Zod type definition for IAppBuilderActionPropsSetParameterValue
const IAppBuilderActionPropsSetParameterValueSchema = z.object({
	parameter: IAppBuilderParameterRefSchema.pick({name: true, sessionId: true}),
	value: z.string(),
}).extend(IAppBuilderActionPropsCommonSchema.shape);

// Zod type definition for IAppBuilderActionPropsSetBrowserLocation
const IAppBuilderActionPropsSetBrowserLocationSchema = z.object({
	href: z.string().optional(),
	pathname: z.string().optional(),
	search: z.string().optional(),
	hash: z.string().optional(),
	target: z.enum(["_self", "_blank", "_parent", "_top"]).optional(),
}).extend(IAppBuilderActionPropsCommonSchema.shape);

// Zod type definition for IAppBuilderActionPropsCloseConfigurator
const IAppBuilderActionPropsCloseConfigurator = z.object({
}).extend(IAppBuilderActionPropsCommonSchema.shape);

// Zod type definition for IAppBuilderAction
const IAppBuilderActionSchema = z.discriminatedUnion("type", [
	z.object({type: z.literal("createModelState"), props: IAppBuilderActionPropsCreateModelStateSchema}),
	z.object({type: z.literal("addToCart"), props: IAppBuilderActionPropsAddToCartSchema}),
	z.object({type: z.literal("setParameterValue"), props: IAppBuilderActionPropsSetParameterValueSchema}),
	z.object({type: z.literal("setBrowserLocation"), props: IAppBuilderActionPropsSetBrowserLocationSchema}),
	z.object({type: z.literal("closeConfigurator"), props: IAppBuilderActionPropsCloseConfigurator}),
]);

// Zod type definition for IAppBuilderWidgetPropsCommon
const IAppBuilderWidgetPropsCommonSchema = z.object({
});

// Zod type definition for IAppBuilderWidgetPropsAccordion
const IAppBuilderWidgetPropsAccordionSchema = z.object({
	parameters: z.array(IAppBuilderParameterRefSchema).optional(),
	exports: z.array(IAppBuilderExportRefSchema).optional(),
	defaultGroupName: z.string().optional(),
}).extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsText
const IAppBuilderWidgetPropsTextSchema = z.object({
	text: z.string().optional(),
	markdown: z.string().optional(),
}).extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsImage
const IAppBuilderWidgetPropsImageSchema = z.object({
	anchor: z.string().optional(),
	alt: z.string().optional(),
	target: z.string().default("_blank"),
}).extend(IAppBuilderWidgetPropsCommonSchema.shape).extend(IAppBuilderImageRefSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsRoundChart
const IAppBuilderWidgetPropsRoundChartSchema = z.object({
	name: z.string().optional(),
	style: z.enum(["pie", "donut"]),
	labels: z.boolean().optional(),
	legend: z.boolean().optional(),
	data: z.array(z.object({name: z.string(), value: z.number(), color: z.string()})),
}).extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsChartPlotSettings
const IAppBuilderWidgetPropsChartPlotSettingsSchema = z.object({
	xaxis: z.boolean().optional(),
	xlabel: z.string().optional(),
	yaxis: z.boolean().optional(),
	ylabel: z.string().optional(),
	grid: z.enum(["none", "x", "y", "xy"]).optional(),
	dots: z.boolean().optional(),
	legend: z.boolean().optional(),
});

// Zod type definition for IAppBuilderWidgetPropsChartDataSet
const IAppBuilderWidgetPropsChartDataSetSchema = z.object({
	keys: z.array(z.string()),
	series: z.array(z.object({name: z.string(), color: z.string(), values: z.array(z.number())})),
});

// Zod type definition for IAppBuilderWidgetPropsChartCommon
const IAppBuilderWidgetPropsChartCommonSchema = z.object({
	name: z.string().optional(),
	plotSettings: IAppBuilderWidgetPropsChartPlotSettingsSchema,
	data: IAppBuilderWidgetPropsChartDataSetSchema,
}).extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsLineChart
const IAppBuilderWidgetPropsLineChartSchema = z.object({
	style: z.enum([ "bump", "linear", "natural", "monotone", "step", "stepBefore", "stepAfter"]).optional(),
}).extend(IAppBuilderWidgetPropsChartCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsAreaChart
const IAppBuilderWidgetPropsAreaChartSchema = z.object({
	style: z.enum([ "bump", "linear", "natural", "monotone", "step", "stepBefore", "stepAfter"]).optional(),
	type: z.enum([ "default", "stacked", "percent", "split"]).optional(),
}).extend(IAppBuilderWidgetPropsChartCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsBarChart
const IAppBuilderWidgetPropsBarChartSchema = z.object({
	style: z.enum([ "default", "stacked", "percent", "waterfall"]).optional(),
}).extend(IAppBuilderWidgetPropsChartCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsInteraction
const IAppBuilderWidgetPropsInteractionSchema = z.object({
	parameterName: z.string().optional(),
	interactionSettings: IInteractionParameterJsonSchema,
});

// Zod type definition for IAppBuilderWidgetPropsActions
const IAppBuilderWidgetPropsActionsSchema = z.object({
	actions: z.array(IAppBuilderActionSchema),
});

// Zod type definition for IAppBuilderWidgetPropsAgent
const IAppBuilderWidgetPropsAgentSchema = z.object({
	context: z.string().optional(),
});

// Zod type definition for IAppBuilderWidget
const IAppBuilderWidgetSchema = z.discriminatedUnion("type", [
	z.object({type: z.literal("accordion"), props: IAppBuilderWidgetPropsAccordionSchema}),
	z.object({type: z.literal("text"), props: IAppBuilderWidgetPropsTextSchema}),
	z.object({type: z.literal("image"), props: IAppBuilderWidgetPropsImageSchema}),
	z.object({type: z.literal("roundChart"), props: IAppBuilderWidgetPropsRoundChartSchema}),
	z.object({type: z.literal("lineChart"), props: IAppBuilderWidgetPropsLineChartSchema}),
	z.object({type: z.literal("areaChart"), props: IAppBuilderWidgetPropsAreaChartSchema}),
	z.object({type: z.literal("barChart"), props: IAppBuilderWidgetPropsBarChartSchema}),
	z.object({type: z.literal("interaction"), props: IAppBuilderWidgetPropsInteractionSchema}),
	z.object({type: z.literal("actions"), props: IAppBuilderWidgetPropsActionsSchema}),
	z.object({type: z.literal("agent"), props: IAppBuilderWidgetPropsAgentSchema}),
]);

// Zod type definition for IAppBuilderTab
const IAppBuilderTabSchema = z.object({
	name: z.string(),
	icon: z.nativeEnum(IconTypeEnum).optional(),
	tooltip: z.string().optional(),
	widgets: z.array(IAppBuilderWidgetSchema),
}).extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderContainer
const IAppBuilderContainerSchema = z.object({
	name: z.enum(["left", "right", "top", "bottom"]),
	tabs: z.array(IAppBuilderTabSchema).optional(),
	widgets: z.array(IAppBuilderWidgetSchema).optional(),
}).extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilder
const IAppBuilderSchema = z.object({
	version: z.literal("1.0"),
	parameters: z.array(IAppBuilderParameterDefinitionSchema).optional(),
	sessionId: z.string().optional(),
	containers: z.array(IAppBuilderContainerSchema),
});

export const validateAppBuilder = (value: any) => {
	return IAppBuilderSchema.safeParse(value);
};

// Zod type definition for IAppBuilderSettingsSession
const IAppBuilderSettingsSessionSchema = z.object({
	ticket: z.string().optional(),
	guid: z.string().optional(),
	modelViewUrl: z.string().optional(),
	jwtToken: z.string().optional(),
	id: z.string(),
	waitForOutputs: z.boolean().optional(),
	loadOutputs: z.boolean().optional(),
	excludeViewports: z.array(z.string()).optional(),
	initialParameterValues: z.record(z.string()).optional(),
	slug: z.string().optional(),
	platformUrl: z.string().optional(),
	acceptRejectMode: z.boolean().optional(),
	modelStateId: z.string().optional(),
});

// Zod type definition for IAppBuilderSettingsSettings
const IAppBuilderSettingsSettingsSchema = z.object({
	disableFallbackUi: z.boolean().optional(),
});

// Zod type definition for IAppBuilderSettingsJson
const IAppBuilderSettingsJsonSchema = z.object({
	version: z.literal("1.0"),
	sessions: z.array(IAppBuilderSettingsSessionSchema).optional(),
	settings: IAppBuilderSettingsSettingsSchema.optional(),
	themeOverrides: z.record(z.string(), z.any()).optional(),
	appBuilderOverride: IAppBuilderSchema.optional(),
});

export const validateAppBuilderSettingsJson = (value: any) => {
	return IAppBuilderSettingsJsonSchema.safeParse(value);
};
