import {ResStructureType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	PARAMETER_TYPE,
	PARAMETER_VISUALIZATION,
	TAG3D_JUSTIFICATION,
} from "@shapediver/viewer.session";
import {
	ATTRIBUTE_VISUALIZATION,
	CAMERA_TYPE,
} from "@shapediver/viewer.shared.types";
import type {MantineTheme, MantineThemeComponent} from "@mantine/core";
import {z} from "zod";
import {prettifyError} from "zod/v4";
import {
	AppBuilderContainerNameType,
	AttributeVisualizationVisibility,
	FormWidgetSubmitBehavior,
	IAppBuilderParameterValueSourceDefinition,
	IAppBuilderWidget,
	SavedStatesVisualization,
	SelectComponentType,
} from "./appbuilder";
import {validateThemeComponentsRecord} from "./validateThemeComponentsRecord";

import {JsonValueSchema} from "@AppBuilderLib/shared/lib/jsonValue";
export type {JsonValue} from "@AppBuilderLib/shared/lib/jsonValue";
export {JsonValueSchema};

// Zod schema for MantineThemeComponent (classNames, styles, vars, defaultProps are opaque JSON values)
const MantineThemeComponentSchema = z.strictObject({
	classNames: JsonValueSchema.optional(),
	styles: JsonValueSchema.optional(),
	vars: JsonValueSchema.optional(),
	defaultProps: JsonValueSchema.optional(),
});

// Compile-time assertion: MantineThemeComponentSchema keys must match MantineThemeComponent keys
type _AssertComponentKeys = [
	keyof z.infer<typeof MantineThemeComponentSchema> extends keyof MantineThemeComponent
		? true
		: false,
	keyof MantineThemeComponent extends keyof z.infer<typeof MantineThemeComponentSchema>
		? true
		: false,
];
const _checkComponent: _AssertComponentKeys = [true, true];
void _checkComponent;

// Full (non-partial) Zod schema for MantineTheme — used only for compile-time key assertions.
// variantColorResolver is a function and cannot appear in JSON config, so it is excluded here.
// The assertion below verifies all remaining keys are covered.
const MantineThemeFullSchema = z.strictObject({
	focusRing: z.enum(["auto", "always", "never"]),
	scale: z.number(),
	fontSmoothing: z.boolean(),
	white: z.string(),
	black: z.string(),
	primaryColor: z.string(),
	autoContrast: z.boolean(),
	luminanceThreshold: z.number(),
	fontFamily: z.string(),
	fontFamilyMonospace: z.string(),
	defaultRadius: z.union([z.string(), z.number()]),
	cursorType: z.enum(["default", "pointer"]),
	respectReducedMotion: z.boolean(),
	activeClassName: z.string(),
	focusClassName: z.string(),
	colors: z.record(z.string(), z.array(z.string()).min(10)),
	primaryShade: z.union([
		z.number().int().min(0).max(9),
		z.strictObject({
			light: z.number().int().min(0).max(9),
			dark: z.number().int().min(0).max(9),
		}),
	]),
	fontSizes: z.record(z.string(), z.string()),
	lineHeights: z.record(z.string(), z.string()),
	radius: z.record(z.string(), z.string()),
	spacing: z.record(z.string(), z.string()),
	breakpoints: z.record(z.string(), z.string()),
	shadows: z.record(z.string(), z.string()),
	headings: z.strictObject({
		fontFamily: z.string(),
		fontWeight: z.string(),
		textWrap: z.enum(["wrap", "nowrap", "balance", "pretty", "stable"]),
		sizes: z.strictObject({
			h1: z.strictObject({
				fontSize: z.string(),
				fontWeight: z.string().optional(),
				lineHeight: z.string(),
			}),
			h2: z.strictObject({
				fontSize: z.string(),
				fontWeight: z.string().optional(),
				lineHeight: z.string(),
			}),
			h3: z.strictObject({
				fontSize: z.string(),
				fontWeight: z.string().optional(),
				lineHeight: z.string(),
			}),
			h4: z.strictObject({
				fontSize: z.string(),
				fontWeight: z.string().optional(),
				lineHeight: z.string(),
			}),
			h5: z.strictObject({
				fontSize: z.string(),
				fontWeight: z.string().optional(),
				lineHeight: z.string(),
			}),
			h6: z.strictObject({
				fontSize: z.string(),
				fontWeight: z.string().optional(),
				lineHeight: z.string(),
			}),
		}),
	}),
	defaultGradient: z.strictObject({
		from: z.string(),
		to: z.string(),
		deg: z.number().optional(),
	}),
	components: z.record(z.string(), MantineThemeComponentSchema),
	other: z.record(z.string(), JsonValueSchema),
	// variantColorResolver is a function — excluded from JSON config schema
});

// Compile-time assertion: schema keys (minus variantColorResolver) must match MantineTheme keys.
// If Mantine adds/removes fields, tsc will fail here.
type _MantineThemeSchemaKeys = keyof z.infer<typeof MantineThemeFullSchema>;
type _MantineThemeKeys = Exclude<keyof MantineTheme, "variantColorResolver">;
type _AssertThemeKeys = [
	_MantineThemeSchemaKeys extends _MantineThemeKeys ? true : false,
	_MantineThemeKeys extends _MantineThemeSchemaKeys ? true : false,
];
const _checkTheme: _AssertThemeKeys = [true, true];
void _checkTheme;

// Partial version used for themeOverrides in config files (matches MantineThemeOverride = PartialDeep<MantineTheme>)
export const MantineThemeOverrideSchema = MantineThemeFullSchema.partial();

// Zod type definition for SelectComponentType
const selectComponentTypes = [
	"buttonflex",
	"buttongroup",
	"chipgroup",
	"dropdown",
	"color",
	"imagedropdown",
	"fullwidthcards",
	"carousel",
	"grid",
	"multiselect-checkboxes",
] as const satisfies readonly SelectComponentType[];

const SelectComponentTypeSchema = z.enum(selectComponentTypes);

// Zod type definition for ISelectComponentItemDataType
export const ISelectComponentItemDataTypeSchema = z.object({
	displayname: z.string().optional(),
	tooltip: z.string().optional(),
	description: z.string().optional(),
	imageUrl: z.string().optional(),
	color: z.string().optional(),
	hidden: z.boolean().optional(),
	data: z.record(z.string(), z.any()).optional(),
});

// Zod type definition for ISelectParameterSettings
const ISelectParameterSettingsSchema = z.object({
	type: SelectComponentTypeSchema.optional(),
  itemData: z
    .record(z.string(), ISelectComponentItemDataTypeSchema)
    .optional(),
	searchable: z.boolean().optional(),
	limit: z.int().positive().optional(),
	height: z.string().optional(),
});

export const validateSelectParameterSettings = (value: any) => {
	return ISelectParameterSettingsSchema.safeParse(value);
};

// Zod type definition for IStringParameterSelectSettings
const IStringParameterSelectSettingsSchema =
	ISelectParameterSettingsSchema.extend(
		z.object({
			items: z.array(z.string()).optional(),
			source: z.string().optional(),
		}).shape,
	);

// Zod type definition for IStringParameterSettings
const IStringParameterSettingsSchema = z.object({
	lines: z.int().positive().optional(),
	selectSettings: IStringParameterSelectSettingsSchema.optional(),
});

export const validateStringParameterSettings = (value: any) => {
	return IStringParameterSettingsSchema.safeParse(value);
};

// Zod type definition for INumberParameterSettings
const INumberParameterSettingsSchema = z.object({
	step: z.number().positive().optional(),
	marks: z
		.array(
			z.object({
				value: z.number(),
				label: z.string().optional(),
			}),
		)
		.optional(),
	restrictToMarks: z.boolean().optional(),
	min: z.number().optional(),
	max: z.number().optional(),
});

export const validateNumberParameterSettings = (value: any) => {
	if (value === undefined || value === null) return {success: false as const, error: undefined};
	return INumberParameterSettingsSchema.safeParse(value);
};

// Zod type definition for IAppBuilderParameterDefinition
const IAppBuilderParameterDefinitionSchema = z.strictObject({
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
	type: z.enum(PARAMETER_TYPE),
	visualization: z.enum(PARAMETER_VISUALIZATION).optional(),
	structure: z.enum(ResStructureType).optional(),
	group: z
		.strictObject({
			id: z.string(),
			name: z.string(),
		})
		.optional(),
	hint: z.string().optional(),
	order: z.number().optional(),
	tooltip: z.string().optional(),
	displayname: z.string().optional(),
	hidden: z.boolean(),
	settings: z.record(z.string(), JsonValueSchema).optional(),
	value: z.string().optional(),
	step: z.number().positive().optional(),
});

// Zod type definition for property "overrides" of IAppBuilderParameterRef
const IAppBuilderParameterOverridesSchema =
	IAppBuilderParameterDefinitionSchema.partial().pick({
		displayname: true,
		group: true,
		order: true,
		tooltip: true,
		hidden: true,
		settings: true,
		step: true,
	});

// Zod type definition for IAppBuilderParameterRef
const IAppBuilderParameterRefSchema = z.strictObject({
	name: z.string(),
	sessionId: z.string().optional(),
	overrides: IAppBuilderParameterOverridesSchema.optional(),
	disableIfDirty: z.boolean().optional(),
	acceptRejectMode: z.boolean().optional(),
});

// Zod type definition for property "overrides" of IAppBuilderExportRef
const IAppBuilderExportOverridesSchema = IAppBuilderParameterOverridesSchema;

// Zod type definition for IAppBuilderExportRef
const IAppBuilderExportRefSchema = z.strictObject({
	name: z.string(),
	sessionId: z.string().optional(),
	overrides: IAppBuilderExportOverridesSchema.optional(),
});

// Zod type definition for IAppBuilderImageRef
export const IAppBuilderImageRefSchema = z.strictObject({
	export: IAppBuilderExportRefSchema.pick({
		name: true,
		sessionId: true,
	}).optional(),
	href: z.string().optional(),
});

// Zod type definition for IAppBuilderParameterValueSourcePropsScreenshot
const IAppBuilderParameterValueSourcePropsScreenshotSchema = z.strictObject({
	contentType: z.string().optional(),
	quality: z.number().min(0).max(1).optional(),
	resolution: z
		.strictObject({
			width: z.number().int().positive(),
			height: z.number().int().positive(),
		})
		.optional(),
	// check if there is either a name or type present
	camera: z
		.union([
			z.looseObject({
				name: z.string(),
			}),
			z.looseObject({
				type: z.enum(CAMERA_TYPE),
			}),
		])
		.optional(),
});

// Zod type definition for IAppBuilderParameterValueSourcePropsDataOutput
const IAppBuilderParameterValueSourcePropsDataOutputSchema = z.strictObject({
	sessionId: z.string().optional(),
	name: z.string(),
});

// Zod type definition for IAppBuilderParameterValueSourcePropsExport
const IAppBuilderParameterValueSourcePropsExportSchema = z.strictObject({
	sessionId: z.string().optional(),
	name: z.string(),
	parameterValues: z
		.record(
			z.string(),
			z
				.string()
				.or(z.number())
				.or(z.boolean())
				.or(
					z.lazy(
						(): z.ZodType<IAppBuilderParameterValueSourceDefinition> =>
							IAppBuilderParameterValueSourceDefinitionSchema,
					),
				),
		)
		.optional(),
});

// Zod type definition for IAppBuilderParameterValueSourcePropsSdtf
const IAppBuilderParameterValueSourcePropsSdtfSchema = z.strictObject({
	sessionId: z.string().optional(),
	name: z.string(),
	chunk: z
		.strictObject({
			id: z.string().optional(),
			name: z.string().optional(),
		})
		.optional(),
});

// Zod type definition for IAppBuilderActionPropsCreateModelState
const IAppBuilderActionPropsCreateModelStateSchema = z.strictObject({
	includeImage: z.boolean().optional(),
	image: IAppBuilderImageRefSchema.optional(),
	includeGltf: z.boolean().optional(),
	parameterNamesToInclude: z.array(z.string()).optional(),
	parameterNamesToExclude: z.array(z.string()).optional(),
});

// Zod type definition for IAppBuilderParameterValueSourcePropsModelState
const IAppBuilderParameterValueSourcePropsModelStateSchema =
	IAppBuilderActionPropsCreateModelStateSchema.extend({
		updateUrl: z.boolean().optional(),
	});

// Zod type definition for IAppBuilderParameterValueSourceDefinition
const IAppBuilderParameterValueSourceDefinitionSchema = z.discriminatedUnion(
	"type",
	[
		z.strictObject({
			type: z.literal("dataOutput"),
			props: IAppBuilderParameterValueSourcePropsDataOutputSchema,
		}),
		z.strictObject({
			type: z.literal("export"),
			props: IAppBuilderParameterValueSourcePropsExportSchema,
		}),
		z.strictObject({
			type: z.literal("modelState"),
			props: IAppBuilderParameterValueSourcePropsModelStateSchema,
		}),
		z.strictObject({
			type: z.literal("screenshot"),
			props: IAppBuilderParameterValueSourcePropsScreenshotSchema,
		}),
		z.strictObject({
			type: z.literal("sdtf"),
			props: IAppBuilderParameterValueSourcePropsSdtfSchema,
		}),
	],
);

// Zod type definition for IAppBuilderActionPropsCommon
const IAppBuilderActionPropsCommonSchema = z.strictObject({
	label: z.string().optional(),
	icon: z.string().optional(),
	tooltip: z.string().optional(),
});

// Zod type definition for IAppBuilderLegacyActionPropsCreateModelState
const IAppBuilderLegacyActionPropsCreateModelStateSchema =
	IAppBuilderActionPropsCreateModelStateSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsAddToCart
const IAppBuilderActionPropsAddToCartSchema = z
	.strictObject({
		productId: z.string().optional(),
		quantity: z.number().optional(),
		price: z.number().optional(),
		description: z.string().optional(),
	})
	.extend(IAppBuilderActionPropsCreateModelStateSchema.shape);

// Zod type definition for IAppBuilderLegacyActionPropsAddToCart
const IAppBuilderLegacyActionPropsAddToCartSchema =
	IAppBuilderActionPropsAddToCartSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsSetParameterValue
const IAppBuilderActionPropsSetParameterValueSchema = z.strictObject({
	parameter: IAppBuilderParameterRefSchema.pick({
		name: true,
		sessionId: true,
	}),
	value: z.string().optional(),
	source: IAppBuilderParameterValueSourceDefinitionSchema.optional(),
});

// Zod type definition for IAppBuilderLegacyActionPropsSetParameterValue
const IAppBuilderLegacyActionPropsSetParameterValueSchema =
	IAppBuilderActionPropsSetParameterValueSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsSetParameterValues
const IAppBuilderActionPropsSetParameterValuesSchema = z.strictObject({
	parameterValues: z.array(
		IAppBuilderLegacyActionPropsSetParameterValueSchema,
	),
	message: z.string().optional(),
});

// Zod type definition for IAppBuilderLegacyActionPropsSetParameterValues
const IAppBuilderLegacyActionPropsSetParameterValuesSchema =
	IAppBuilderActionPropsSetParameterValuesSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsSetBrowserLocation
const IAppBuilderActionPropsSetBrowserLocationSchema = z.strictObject({
	href: z.string().optional(),
	pathname: z.string().optional(),
	search: z.string().optional(),
	hash: z.string().optional(),
	target: z.enum(["_self", "_blank", "_parent", "_top"]).optional(),
});
// Zod type definition for IAppBuilderLegacyActionPropsSetBrowserLocation
const IAppBuilderLegacyActionPropsSetBrowserLocationSchema =
	IAppBuilderActionPropsSetBrowserLocationSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsCloseConfigurator
const IAppBuilderActionPropsCloseConfigurator = z.strictObject({});

// Zod type definition for IAppBuilderLegacyActionPropsCloseConfigurator
const IAppBuilderLegacyActionPropsCloseConfiguratorSchema =
	IAppBuilderActionPropsCloseConfigurator.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

const IAppBuilderActionPropsCameraCommonSchema = z.strictObject({
	camera: z
		.union([
			z.looseObject({
            					name: z.string(),
            				}),
			z.looseObject({
            					type: z.enum(CAMERA_TYPE),
            				}),
		])
		.optional(),
	options: z.record(z.string(), JsonValueSchema).optional(),
});

// Zod type definition for IAppBuilderActionPropsCameraCommon
const IAppBuilderActionPropsCameraSchema = z.discriminatedUnion("type", [
	z
		.strictObject({
			type: z.literal("animate"),
			props: z
				.strictObject({
					path: z.array(
						z.strictObject({
							position: z.array(z.number()).length(3),
							target: z.array(z.number()).length(3),
						}),
					),
					startFromCurrent: z.boolean().optional(),
				})
				.extend(IAppBuilderActionPropsCameraCommonSchema.shape),
		})
		.extend(IAppBuilderActionPropsCommonSchema.shape),
	z
		.strictObject({
			type: z.literal("assign"),
			props: z
				.strictObject({})
				.extend(IAppBuilderActionPropsCameraCommonSchema.shape),
		})
		.extend(IAppBuilderActionPropsCommonSchema.shape),
	z
		.strictObject({
			type: z.literal("set"),
			props: z
				.strictObject({
					position: z.array(z.number()).length(3),
					target: z.array(z.number()).length(3),
				})
				.extend(IAppBuilderActionPropsCameraCommonSchema.shape),
		})
		.extend(IAppBuilderActionPropsCommonSchema.shape),
	z
		.strictObject({
			type: z.literal("reset"),
			props: z
				.strictObject({})
				.extend(IAppBuilderActionPropsCameraCommonSchema.shape),
		})
		.extend(IAppBuilderActionPropsCommonSchema.shape),
	z
		.strictObject({
			type: z.literal("zoomTo"),
			props: z
				.strictObject({
					initialPosition: z.array(z.number()).length(3).optional(),
					initialTarget: z.array(z.number()).length(3).optional(),
					nameFilter: z.array(z.string()).optional(),
				})
				.extend(IAppBuilderActionPropsCameraCommonSchema.shape),
		})
		.extend(IAppBuilderActionPropsCommonSchema.shape),
]);

// Zod type definition for IAppBuilderActionPropsSound
const IAppBuilderActionPropsSoundSchema = z.strictObject({
	href: z.string(),
	autoplay: z.boolean().optional(),
	loop: z.boolean().optional(),
	labelPlaying: z.string().optional(),
	iconPlaying: z.string().optional(),
});

// Zod type definition for IAppBuilderLegacyActionPropsSetParameterValues
const IAppBuilderLegacyActionPropsSoundSchema =
	IAppBuilderActionPropsSoundSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsMessageToParent
const IAppBuilderActionPropsMessageToParentSchema = z.strictObject({
	type: z.string(),
	data: z.record(z.string(), JsonValueSchema).optional(),
});

// Zod type definition for IAppBuilderLegacyActionPropsMessageToParent
const IAppBuilderLegacyActionPropsMessageToParentSchema =
	IAppBuilderActionPropsMessageToParentSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderLegacyActionDefinition
const IAppBuilderLegacyActionDefinitionSchema = z.discriminatedUnion("type", [
	z.strictObject({
		type: z.literal("createModelState"),
		props: IAppBuilderLegacyActionPropsCreateModelStateSchema,
	}),
	z.strictObject({
		type: z.literal("addToCart"),
		props: IAppBuilderLegacyActionPropsAddToCartSchema,
	}),
	z.strictObject({
		type: z.literal("setParameterValue"),
		props: IAppBuilderLegacyActionPropsSetParameterValueSchema,
	}),
	z.strictObject({
		type: z.literal("setParameterValues"),
		props: IAppBuilderLegacyActionPropsSetParameterValuesSchema,
	}),
	z.strictObject({
		type: z.literal("setBrowserLocation"),
		props: IAppBuilderLegacyActionPropsSetBrowserLocationSchema,
	}),
	z.strictObject({
		type: z.literal("closeConfigurator"),
		props: IAppBuilderLegacyActionPropsCloseConfiguratorSchema,
	}),
	z.strictObject({
		type: z.literal("camera"),
		props: IAppBuilderActionPropsCameraSchema,
	}),
	z.strictObject({
		type: z.literal("sound"),
		props: IAppBuilderLegacyActionPropsSoundSchema,
	}),
	z.strictObject({
		type: z.literal("messageToParent"),
		props: IAppBuilderLegacyActionPropsMessageToParentSchema,
	}),
]);

// Zod type definition for property "overrides" of IAppBuilderControlParameterRef
const IAppBuilderControlParameterRefOverridesSchema =
	IAppBuilderParameterDefinitionSchema.partial().pick({
		displayname: true,
		tooltip: true,
		hidden: true,
		settings: true,
		step: true,
	});

// Zod type definition for property "overrides" of IAppBuilderControlExportRef
const IAppBuilderControlExportRefOverridesSchema =
	IAppBuilderParameterDefinitionSchema.partial().pick({
		displayname: true,
		tooltip: true,
		hidden: true,
	});

// Zod type definition for property "overrides" of IAppBuilderControlOutputRef
const IAppBuilderControlOutputRefOverridesSchema =
	IAppBuilderParameterDefinitionSchema.partial().pick({
		displayname: true,
		tooltip: true,
		hidden: true,
	});

// Zod type definition for IAppBuilderControlParameterRef
const IAppBuilderControlParameterRefSchema = z.strictObject({
	name: z.string(),
	sessionId: z.string().optional(),
	overrides: IAppBuilderControlParameterRefOverridesSchema.optional(),
	disableIfDirty: z.boolean().optional(),
	acceptRejectMode: z.boolean().optional(),
});

// Zod type definition for IAppBuilderControlExportRef
const IAppBuilderControlExportRefSchema = z.strictObject({
	name: z.string(),
	sessionId: z.string().optional(),
	overrides: IAppBuilderControlExportRefOverridesSchema.optional(),
	parameterValues: z
		.array(IAppBuilderLegacyActionPropsSetParameterValueSchema)
		.optional(),
});

// Zod type definition for IAppBuilderActionDefinition
const IAppBuilderActionDefinitionSchema = z.discriminatedUnion("type", [
	z.strictObject({
		type: z.literal("createModelState"),
		props: IAppBuilderLegacyActionPropsCreateModelStateSchema,
	}),
	z.strictObject({
		type: z.literal("addToCart"),
		props: IAppBuilderLegacyActionPropsAddToCartSchema,
	}),
	z.strictObject({
		type: z.literal("setParameterValue"),
		props: IAppBuilderLegacyActionPropsSetParameterValueSchema,
	}),
	z.strictObject({
		type: z.literal("setParameterValues"),
		props: IAppBuilderLegacyActionPropsSetParameterValuesSchema,
	}),
	z.strictObject({
		type: z.literal("setBrowserLocation"),
		props: IAppBuilderLegacyActionPropsSetBrowserLocationSchema,
	}),
	z.strictObject({
		type: z.literal("closeConfigurator"),
		props: IAppBuilderLegacyActionPropsCloseConfiguratorSchema,
	}),
	z.strictObject({
		type: z.literal("camera"),
		props: IAppBuilderActionPropsCameraSchema,
	}),
	z.strictObject({
		type: z.literal("sound"),
		props: IAppBuilderLegacyActionPropsSoundSchema,
	}),
	z.strictObject({
		type: z.literal("messageToParent"),
		props: IAppBuilderLegacyActionPropsMessageToParentSchema,
	}),
]);

// Zod type definition for IAppBuilderControlActionRef
const IAppBuilderControlActionRefSchema = z
	.strictObject({
		definition: IAppBuilderActionDefinitionSchema,
	})
	.extend(IAppBuilderActionPropsCommonSchema.shape);

// Zod type definition for IAppBuilderControlOutputRef
const IAppBuilderControlOutputRefSchema = z.strictObject({
	name: z.string(),
	sessionId: z.string().optional(),
	overrides: IAppBuilderControlOutputRefOverridesSchema.optional(),
});

// Zod type definition for IAppBuilderControl
const IAppBuilderControlSchema = z.discriminatedUnion("type", [
	z.strictObject({
		type: z.literal("parameter"),
		props: IAppBuilderControlParameterRefSchema,
	}),
	z.strictObject({
		type: z.literal("export"),
		props: IAppBuilderControlExportRefSchema,
	}),
	z.strictObject({
		type: z.literal("action"),
		props: IAppBuilderControlActionRefSchema,
	}),
	z.strictObject({
		type: z.literal("output"),
		props: IAppBuilderControlOutputRefSchema,
	}),
]);

// Zod type definition for IAppBuilderWidgetPropsCommon
const IAppBuilderWidgetPropsCommonSchema = z.strictObject({});

// Zod type definition for IAppBuilderWidgetPropsAccordion
const IAppBuilderWidgetPropsAccordionSchema = z
	.strictObject({
		parameters: z.array(IAppBuilderParameterRefSchema).optional(),
		exports: z.array(IAppBuilderExportRefSchema).optional(),
		defaultGroupName: z.string().optional(),
	})
	.extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsText
const IAppBuilderWidgetPropsTextSchema = z
	.strictObject({
		text: z.string().optional(),
		markdown: z.string().optional(),
	})
	.extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsImage
const IAppBuilderWidgetPropsImageSchema = z
	.strictObject({
		anchor: z.string().optional(),
		alt: z.string().optional(),
		target: z.string().default("_blank"),
		isSvg: z.boolean().optional(),
	})
	.extend(IAppBuilderWidgetPropsCommonSchema.shape)
	.extend(IAppBuilderImageRefSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsRoundChart
const IAppBuilderWidgetPropsRoundChartSchema = z
	.strictObject({
		name: z.string().optional(),
		style: z.enum(["pie", "donut"]),
		labels: z.boolean().optional(),
		legend: z.boolean().optional(),
		data: z.array(
			z.strictObject({name: z.string(), value: z.number(), color: z.string()}),
		),
	})
	.extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsChartPlotSettings
const IAppBuilderWidgetPropsChartPlotSettingsSchema = z.strictObject({
	xaxis: z.boolean().optional(),
	xlabel: z.string().optional(),
	yaxis: z.boolean().optional(),
	ylabel: z.string().optional(),
	grid: z.enum(["none", "x", "y", "xy"]).optional(),
	dots: z.boolean().optional(),
	legend: z.boolean().optional(),
});

// Zod type definition for IAppBuilderWidgetPropsChartDataSet
const IAppBuilderWidgetPropsChartDataSetSchema = z.strictObject({
	keys: z.array(z.string()),
	series: z.array(
		z.strictObject({
			name: z.string(),
			color: z.string(),
			values: z.array(z.number()),
		}),
	),
});

// Zod type definition for IAppBuilderWidgetPropsChartCommon
const IAppBuilderWidgetPropsChartCommonSchema = z
	.strictObject({
		name: z.string().optional(),
		plotSettings: IAppBuilderWidgetPropsChartPlotSettingsSchema,
		data: IAppBuilderWidgetPropsChartDataSetSchema,
	})
	.extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsLineChart
const IAppBuilderWidgetPropsLineChartSchema = z
	.strictObject({
		style: z
			.enum([
				"bump",
				"linear",
				"natural",
				"monotone",
				"step",
				"stepBefore",
				"stepAfter",
			])
			.optional(),
	})
	.extend(IAppBuilderWidgetPropsChartCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsAreaChart
const IAppBuilderWidgetPropsAreaChartSchema = z
	.strictObject({
		style: z
			.enum([
				"bump",
				"linear",
				"natural",
				"monotone",
				"step",
				"stepBefore",
				"stepAfter",
			])
			.optional(),
		type: z.enum(["default", "stacked", "percent", "split"]).optional(),
	})
	.extend(IAppBuilderWidgetPropsChartCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsBarChart
const IAppBuilderWidgetPropsBarChartSchema = z
	.strictObject({
		style: z
			.enum(["default", "stacked", "percent", "waterfall"])
			.optional(),
	})
	.extend(IAppBuilderWidgetPropsChartCommonSchema.shape);

const IAppBuilderWidgetPropsAttributeVisualizationNumberGradientSchema =
	z.strictObject({
		type: z.literal("number"),
		min: z.number().optional(),
		max: z.number().optional(),
		steps: z.enum(ATTRIBUTE_VISUALIZATION).or(
			z.array(
				z.strictObject({
					value: z.number(),
					colorBefore: z.string(),
					colorAfter: z.string(),
				}),
			),
		),
	});

// Zod type definition for IAppBuilderWidgetPropsAttributeVisualizationStringGradient
const IAppBuilderWidgetPropsAttributeVisualizationStringGradientSchema =
	z.strictObject({
		type: z.literal("string"),
		defaultColor: z.string().optional(),
		labelColors: z.array(
			z.strictObject({
				values: z.array(z.string()),
				color: z.string(),
			}),
		),
	});

// Zod type definition for IAppBuilderWidgetPropsAttributeVisualizationGradient
const IAppBuilderWidgetPropsAttributeVisualizationGradientSchema = z.union([
	z.discriminatedUnion("type", [
		IAppBuilderWidgetPropsAttributeVisualizationNumberGradientSchema,
		IAppBuilderWidgetPropsAttributeVisualizationStringGradientSchema,
	]),
	z.enum(ATTRIBUTE_VISUALIZATION),
]);

// Zod type definition for IAppBuilderWidgetPropsAttributeVisualization
const IAppBuilderWidgetPropsAttributeVisualizationSchema = z.strictObject({
	title: z.string().optional(),
	tooltip: z.string().optional(),
	attributes: z
		.array(
			z
				.strictObject({
					attribute: z.string(),
					gradient:
						IAppBuilderWidgetPropsAttributeVisualizationGradientSchema.optional(),
				})
				.or(z.string()),
		)
		.optional(),
	visualizationMode: z
		.enum(AttributeVisualizationVisibility)
		.optional(),
	showLegend: z.boolean().optional(),
	defaultGradient:
		IAppBuilderWidgetPropsAttributeVisualizationGradientSchema.optional(),
	initialAttribute: z.string().optional(),
	passiveMaterial: z
		.strictObject({
			color: z.string().optional(),
			opacity: z.number().optional(),
		})
		.optional(),
	disableAttributeAnchors: z.boolean().optional(),
});

// Zod type definition for IAppBuilderWidgetPropsActions
const IAppBuilderWidgetPropsActionsSchema = z.strictObject({
	actions: z.array(IAppBuilderLegacyActionDefinitionSchema),
});

// Zod type definition for IAppBuilderWidgetPropsAgent
const IAppBuilderWidgetPropsAgentSchema = z.strictObject({
	context: z.string().optional(),
	parameterNames: z.array(z.string()).optional(),
	parameterNamesExclude: z.array(z.string()).optional(),
});

// Zod type definition for IAppBuilderWidgetPropsProgress
const IAppBuilderWidgetPropsProgressSchema = z.strictObject({
	showPercentage: z.boolean().optional(),
	showOnComplete: z.boolean().optional(),
	showMessages: z.boolean().optional(),
	delayRemoval: z.number().optional(),
});

// Zod type definition for IAppBuilderWidgetPropsSceneTreeExplorer
const IAppBuilderWidgetPropsSceneTreeExplorerSchema = z.strictObject({});

// Zod type definition for IAppBuilderWidgetPropsDesktopClientSelection
const IAppBuilderWidgetPropsDesktopClientSelectionSchema = z.strictObject({
	clientsFilter: z.array(z.string()).optional(),
	autoConnect: z.boolean().optional(),
});

// Zod type definition for IAppBuilderWidgetPropsDesktopClientOutputs
const IAppBuilderWidgetPropsDesktopClientOutputsSchema = z.strictObject({});

// Zod type definition for IAppBuilderWidgetPropsControls
const IAppBuilderWidgetPropsControlsSchema = z.strictObject({
	controls: z.array(IAppBuilderControlSchema),
});

// Zod type definition for IAppBuilderWidgetPropsForm
const IAppBuilderWidgetPropsFormSchema = z.strictObject({
	controls: z.array(IAppBuilderControlSchema).optional(),
	parameters: z.array(IAppBuilderParameterRefSchema).optional(),
	export: IAppBuilderControlExportRefSchema.optional(),
	submit: z.enum(FormWidgetSubmitBehavior).optional(),
	successMessage: z.string().optional(),
	errorMessage: z.string().optional(),
});

// Zod type definition for IAppBuilderWidgetPropsAccordionUi
const IAppBuilderWidgetPropsAccordionUiSchema = z.strictObject({
	items: z.array(
		z.strictObject({
			value: z.string().optional(),
			name: z.string(),
			icon: z.string().optional(),
			tooltip: z.string().optional(),
			widgets: z.array(
				z.lazy((): z.ZodType<IAppBuilderWidget> => IAppBuilderWidgetSchema),
			),
		}),
	),
	multiple: z.boolean().optional(),
	defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
	value: z.union([z.string(), z.array(z.string())]).optional(),
});

// Zod type definition for IAppBuilderWidgetPropsStackUi
const IAppBuilderWidgetPropsStackUiSchema = z.strictObject({
	name: z.string(),
	icon: z.string().optional(),
	tooltip: z.string().optional(),
	widgets: z.array(
		z.lazy((): z.ZodType<IAppBuilderWidget> => IAppBuilderWidgetSchema),
	),
});

// Zod type definition for IAppBuilderWidgetPropsSavedStates
const savedStatesVisualizationValues = [
	"buttonflex",
	"buttongroup",
	"chipgroup",
	"dropdown",
	"imagedropdown",
	"fullwidthcards",
	"carousel",
	"grid",
] as const satisfies readonly SavedStatesVisualization[];

const IAppBuilderWidgetPropsSavedStatesSchema = z.strictObject({
	visualization: z.enum(savedStatesVisualizationValues).optional(),
});

// Zod type definition for IAppBuilderWidgetPropsTableColumn
const IAppBuilderWidgetPropsTableColumnSchema = z.strictObject({
	accessor: z.string(),
	title: z.string().optional(),
	sortable: z.boolean().optional(),
	searchable: z.boolean().optional(),
	width: z.union([z.number(), z.string()]).optional(),
});

// Zod type definition for IAppBuilderWidgetPropsTable
const IAppBuilderWidgetPropsTableSchema = z.strictObject({
	caption: z.string().optional(),
	columns: z.array(IAppBuilderWidgetPropsTableColumnSchema),
	records: z.array(z.record(z.string(), JsonValueSchema)),
	highlightOnHover: z.boolean().optional(),
	stickyHeader: z.boolean().optional(),
	striped: z.boolean().optional(),
	withColumnBorders: z.boolean().optional(),
	withRowBorders: z.boolean().optional(),
	withTableBorder: z.boolean().optional(),
	height: z.number().optional(),
	estimateRowHeight: z.number().optional(),
	overscan: z.number().optional(),
});

// Zod type definition for IAppBuilderWidget
const IAppBuilderWidgetSchema = z.discriminatedUnion("type", [
	z.strictObject({
		type: z.literal("accordion"),
		props: IAppBuilderWidgetPropsAccordionSchema,
	}),
	z.strictObject({
		type: z.literal("text"),
		props: IAppBuilderWidgetPropsTextSchema,
	}),
	z.strictObject({
		type: z.literal("image"),
		props: IAppBuilderWidgetPropsImageSchema,
	}),
	z.strictObject({
		type: z.literal("roundChart"),
		props: IAppBuilderWidgetPropsRoundChartSchema,
	}),
	z.strictObject({
		type: z.literal("lineChart"),
		props: IAppBuilderWidgetPropsLineChartSchema,
	}),
	z.strictObject({
		type: z.literal("areaChart"),
		props: IAppBuilderWidgetPropsAreaChartSchema,
	}),
	z.strictObject({
		type: z.literal("barChart"),
		props: IAppBuilderWidgetPropsBarChartSchema,
	}),
	z.strictObject({
		type: z.literal("actions"),
		props: IAppBuilderWidgetPropsActionsSchema,
	}),
	z.strictObject({
		type: z.literal("attributeVisualization"),
		props: IAppBuilderWidgetPropsAttributeVisualizationSchema,
	}),
	z.strictObject({
		type: z.literal("agent"),
		props: IAppBuilderWidgetPropsAgentSchema,
	}),
	z.strictObject({
		type: z.literal("progress"),
		props: IAppBuilderWidgetPropsProgressSchema,
	}),
	z.strictObject({
		type: z.literal("desktopClientSelection"),
		props: IAppBuilderWidgetPropsDesktopClientSelectionSchema,
	}),
	z.strictObject({
		type: z.literal("desktopClientOutputs"),
		props: IAppBuilderWidgetPropsDesktopClientOutputsSchema,
	}),
	z.strictObject({
		type: z.literal("controls"),
		props: IAppBuilderWidgetPropsControlsSchema,
	}),
	z.strictObject({
		type: z.literal("form"),
		props: IAppBuilderWidgetPropsFormSchema,
	}),
	z.strictObject({
		type: z.literal("accordionUi"),
		props: IAppBuilderWidgetPropsAccordionUiSchema,
	}),
	z.strictObject({
		type: z.literal("sceneTreeExplorer"),
		props: IAppBuilderWidgetPropsSceneTreeExplorerSchema,
	}),
	z.strictObject({
		type: z.literal("stackUi"),
		props: IAppBuilderWidgetPropsStackUiSchema,
	}),
	z.strictObject({
		type: z.literal("savedStates"),
		props: IAppBuilderWidgetPropsSavedStatesSchema,
	}),
	z.strictObject({
		type: z.literal("table"),
		props: IAppBuilderWidgetPropsTableSchema,
	}),
]);

// Zod type definition for IAppBuilderTab
const IAppBuilderTabSchema = z
	.strictObject({
		name: z.string(),
		icon: z.string().optional(),
		tooltip: z.string().optional(),
		widgets: z.array(IAppBuilderWidgetSchema),
	})
	.extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Local strict schema mirroring ISelectionParameterProps from @shapediver/viewer.session.
// The external JsonSchema uses "strip" mode, so we define our own strict version to reject unknown keys.
// Fields match ISelectionParameterProps (no null variants — the TS type does not use null).
const SelectionColorSchema = z.union([
	z.string(),
	z.record(z.string(), JsonValueSchema),
]);
const ISelectionParameterPropsSchema = z.strictObject({
	maximumSelection: z.number().optional(),
	minimumSelection: z.number().optional(),
	nameFilter: z.array(z.string()).optional(),
	selectionColor: SelectionColorSchema.optional(),
	availableColor: SelectionColorSchema.optional(),
	deselectOnEmpty: z.boolean().optional(),
	hover: z.boolean().optional(),
	hoverColor: SelectionColorSchema.optional(),
	prompt: z
		.strictObject({
			inactiveTitle: z.string().optional(),
			activeTitle: z.string().optional(),
			activeText: z.string().optional(),
		})
		.optional(),
	activeMode: z.enum(["default", "activeOnStart"]).optional(),
});

// Zod type definition for IAppBuilderAnchor3dContainerProperties
const IAppBuilderAnchor3dContainerPropertiesSchema = z.strictObject({
	id: z.string(),
	location: z.tuple([z.number(), z.number(), z.number()]),
	allowPointerEvents: z.boolean().optional(),
	justification: z.enum(TAG3D_JUSTIFICATION).optional(),
	previewIcon: z.string().optional(),
	width: z.union([z.string(), z.number()]).optional(),
	height: z.union([z.string(), z.number()]).optional(),
	maxWidth: z.union([z.string(), z.number()]).optional(),
	maxHeight: z.union([z.string(), z.number()]).optional(),
	useContainer: z.boolean().optional(),
	useCloseButton: z.boolean().optional(),
	hideable: z.boolean().optional(),
	selectionProperties: ISelectionParameterPropsSchema.optional(),
	mobileFallback: z
		.strictObject({
			disabled: z.boolean().optional(),
			previewIcon: z.string().optional(),
			container: z
				.enum([
					AppBuilderContainerNameType.Left,
					AppBuilderContainerNameType.Right,
					AppBuilderContainerNameType.Bottom,
					AppBuilderContainerNameType.Top,
				])
				.optional(),
		})
		.optional(),
});

// Zod type definition for IAppBuilderAnchor2dContainerProperties
const IAppBuilderAnchor2dContainerPropertiesSchema = z.strictObject({
	id: z.string(),
	location: z.union([
		z.tuple([z.string(), z.string()]),
		z.tuple([z.number(), z.number()]),
	]),
	allowPointerEvents: z.boolean().optional(),
	justification: z.enum(TAG3D_JUSTIFICATION).optional(),
	previewIcon: z.string().optional(),
	useCloseButton: z.boolean().optional(),
	draggable: z.boolean().optional(),
	width: z.union([z.string(), z.number()]).optional(),
	height: z.union([z.string(), z.number()]).optional(),
	maxWidth: z.union([z.string(), z.number()]).optional(),
	maxHeight: z.union([z.string(), z.number()]).optional(),
	useContainer: z.boolean().optional(),
	selectionProperties: ISelectionParameterPropsSchema.optional(),
	mobileFallback: z
		.strictObject({
			disabled: z.boolean().optional(),
			previewIcon: z.string().optional(),
			container: z
				.enum([
					AppBuilderContainerNameType.Left,
					AppBuilderContainerNameType.Right,
					AppBuilderContainerNameType.Bottom,
					AppBuilderContainerNameType.Top,
				])
				.optional(),
		})
		.optional(),
});

// Zod type definition for IAppBuilderContainer
const IAppBuilderContainerSchema = z.discriminatedUnion("name", [
	z
		.strictObject({
			name: z.literal(AppBuilderContainerNameType.Anchor3d),
			props: IAppBuilderAnchor3dContainerPropertiesSchema,
			tabs: z.array(IAppBuilderTabSchema).optional(),
			widgets: z.array(IAppBuilderWidgetSchema).optional(),
		})
		.extend(IAppBuilderWidgetPropsCommonSchema.shape),
	z
		.strictObject({
			name: z.literal(AppBuilderContainerNameType.Anchor2d),
			props: IAppBuilderAnchor2dContainerPropertiesSchema,
			tabs: z.array(IAppBuilderTabSchema).optional(),
			widgets: z.array(IAppBuilderWidgetSchema).optional(),
		})
		.extend(IAppBuilderWidgetPropsCommonSchema.shape),
	// all other container props should be empty or undefined
	z
		.strictObject({
			name: z.enum([
				AppBuilderContainerNameType.Left,
				AppBuilderContainerNameType.Right,
				AppBuilderContainerNameType.Bottom,
				AppBuilderContainerNameType.Top,
			]),
			props: z.undefined().optional(),
			stickyTabs: z.boolean().optional(),
			tabs: z.array(IAppBuilderTabSchema).optional(),
			widgets: z.array(IAppBuilderWidgetSchema).optional(),
		})
		.extend(IAppBuilderWidgetPropsCommonSchema.shape),
]);

const IAppBuilderOutputActionsPropsSetParameterValueSchema = z.strictObject({
	parameter: z.string(),
	output: z.string(),
});

// Zod type definition for IAppBuilderInstances
const IAppBuilderInstancesSchema = z.strictObject({
	sessionId: z.string(),
	slug: z.string().optional(),
	name: z.string().optional(),
	parameterValues: z
		.record(
			z.string(),
			z
				.string()
				.or(z.number())
				.or(z.boolean())
				.or(IAppBuilderParameterValueSourceDefinitionSchema),
		)
		.optional(),
	transformations: z.array(z.array(z.number())).optional(),
	outputActions: z
		.array(
			z.discriminatedUnion("type", [
				z.strictObject({
					type: z.literal("setParameterValue"),
					props: IAppBuilderOutputActionsPropsSetParameterValueSchema,
				}),
			]),
		)
		.optional(),
});

// Zod type definition for IAppBuilder
const IAppBuilderSchema = z.strictObject({
	version: z.literal("1.0"),
	parameters: z.array(IAppBuilderParameterDefinitionSchema).optional(),
	sessionId: z.string().optional(),
	containers: z.array(IAppBuilderContainerSchema),
	instances: z.array(IAppBuilderInstancesSchema).optional(),
});

export const validateAppBuilder = (value: any) => {
	return IAppBuilderSchema.safeParse(value);
};

// Zod type definition for IAppBuilderSettingsSession
const IAppBuilderSettingsSessionSchema = z.strictObject({
	ticket: z.string().optional(),
	guid: z.string().optional(),
	modelViewUrl: z.string().optional(),
	jwtToken: z.string().optional(),
	id: z.string(),
	waitForOutputs: z.boolean().optional(),
	loadOutputs: z.boolean().optional(),
	excludeViewports: z.array(z.string()).optional(),
	initialParameterValues: z.record(z.string(), z.string()).optional(),
	slug: z.string().optional(),
	platformUrl: z.string().optional(),
	acceptRejectMode: z.boolean().optional(),
	modelStateId: z.string().optional(),
	instance: z.boolean().optional(),
	loadOnFirstUse: z.boolean().optional(),
	keepInStore: z.boolean().optional(),
});

// Zod type definition for IAppBuilderSettingsSettings
const IAppBuilderSettingsSettingsSchema = z.strictObject({
	disableFallbackUi: z.boolean().optional(),
});

// Zod type definition for IAppBuilderSettingsJson
const IAppBuilderSettingsJsonSchemaBase = z.strictObject({
	version: z.literal("1.0"),
	sessions: z.array(IAppBuilderSettingsSessionSchema).optional(),
	settings: IAppBuilderSettingsSettingsSchema.optional(),
	themeOverrides: MantineThemeOverrideSchema.optional(),
	appBuilderOverride: IAppBuilderSchema.optional(),
});

const IAppBuilderSettingsJsonSchema = IAppBuilderSettingsJsonSchemaBase.superRefine(
	(data, ctx) => {
		const components = data.themeOverrides?.components as
			| Record<string, {defaultProps?: unknown}>
			| undefined;
		if (!components || typeof components !== "object") return;

		validateThemeComponentsRecord(components, ctx, [
			"themeOverrides",
			"components",
		]);
	},
);

export const validateAppBuilderSettingsJson = (value: any) => {
	return IAppBuilderSettingsJsonSchema.safeParse(value);
};

/** Zod 4 — human-readable paths and messages for AppBuilder / settings JSON validation. */
export function formatAppBuilderZodError(
	error: Parameters<typeof prettifyError>[0],
): string {
	return prettifyError(error);
}
