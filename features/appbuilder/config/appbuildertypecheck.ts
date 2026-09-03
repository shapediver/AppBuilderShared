import {ParameterStringInputMode} from "@AppBuilderLib/entities/parameter/config/ParameterStringComponent.theme.types";
import {filterableDatabaseSettingsSchema} from "@AppBuilderLib/entities/parameter/lib/filterableDatabase/filterableDatabaseSettingsSchema";
import {viewportScreenshotPropsSchema} from "@AppBuilderLib/entities/viewport/config/viewportScreenshotProps.zod";
import {createModelStateCoreSchema} from "@AppBuilderLib/features/model-state/config/createModelState.zod";
import {prettifyError, z} from "@AppBuilderLib/shared/lib/zod";
import {appBuilderThemeOtherPropsSchema} from "@AppBuilderLib/shared/mantine-props/appBuilderThemeOther.zod";
import {mantineThemeOverridePropsSchema} from "@AppBuilderLib/shared/mantine-props/themeOverride.zod";
import type {MantineTheme, MantineThemeComponent} from "@mantine/core";
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
import {
	AppBuilderActionType,
	AppBuilderContainerNameType,
	AttributeVisualizationVisibility,
	FormWidgetSubmitBehavior,
	IAppBuilder,
	IAppBuilderActionDefinition,
	IAppBuilderParameterValueSourceDefinition,
	IAppBuilderSettingsJson,
	IAppBuilderWidget,
	SavedStatesVisualization,
	SelectComponentType,
} from "./appbuilder";
import {preprocessActionDefinitionInput} from "@AppBuilderLib/features/appbuilder/lib/legacyActionToDefinition";
import {GenericToolName} from "./appbuilderagent";
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
	keyof z.infer<
		typeof MantineThemeComponentSchema
	> extends keyof MantineThemeComponent
		? true
		: false,
	keyof MantineThemeComponent extends keyof z.infer<
		typeof MantineThemeComponentSchema
	>
		? true
		: false,
];
const _checkComponent: _AssertComponentKeys = [true, true];
void _checkComponent;

// Hand-written strict schema for top-level `themeOverrides` in settings JSON.
// Doc mirror / nested component prop: `MantineThemeOverrideProps` in
// `shared/mantine-props/themeOverride.schema-input.ts` (generated `mantineThemeOverridePropsSchema` — looser `components` record).
// variantColorResolver is a function and cannot appear in JSON config, so it is excluded here.
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
	fontWeights: z.record(z.string(), z.string()),
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
	other: appBuilderThemeOtherPropsSchema,
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

// Doc-mirror `MantineThemeOverrideProps` keys must match serializable settings theme keys.
type _MantineThemeOverridePropsKeys = keyof z.infer<
	typeof mantineThemeOverridePropsSchema
>;
type _AssertThemeOverrideMirrorKeys = [
	_MantineThemeOverridePropsKeys extends _MantineThemeSchemaKeys
		? true
		: false,
	_MantineThemeSchemaKeys extends _MantineThemeOverridePropsKeys
		? true
		: false,
];
const _checkThemeOverrideMirror: _AssertThemeOverrideMirrorKeys = [true, true];
void _checkThemeOverrideMirror;

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
const ISelectParameterSettingsSchema = z
	.object({
		type: SelectComponentTypeSchema.optional(),
		itemData: z
			.record(z.string(), ISelectComponentItemDataTypeSchema)
			.optional(),
		searchable: z.boolean().optional(),
		limit: z.int().positive().optional(),
		height: z.string().optional(),
		database: filterableDatabaseSettingsSchema.optional(),
	})
	.refine(
		(s) => !s.database || s.type === "fullwidthcards" || s.type === "grid",
		{
			message:
				'database requires selectSettings.type "fullwidthcards" or "grid"',
		},
	);

export const validateSelectParameterSettings = (value: any) => {
	return ISelectParameterSettingsSchema.safeParse(value);
};

// Zod type definition for IStringParameterSelectSettings
const IStringParameterSelectSettingsSchema =
	ISelectParameterSettingsSchema.safeExtend({
		items: z.array(z.string()).optional(),
		source: z.string().optional(),
	});

// Zod type definition for IStringParameterSettings
const IStringParameterSettingsSchema = z.object({
	lines: z.int().positive().optional(),
	debounce: z.int().nonnegative().optional(),
	mode: z.enum(ParameterStringInputMode).optional(),
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
	if (value === undefined || value === null)
		return {success: false as const, error: undefined};
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
const IAppBuilderParameterValueSourcePropsScreenshotSchema =
	viewportScreenshotPropsSchema;

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

// Zod type definition for IAppBuilderParameterValueSourcePropsAgentTool
const IAppBuilderParameterValueSourcePropsAgentToolSchema = z.strictObject({
	jsonPath: z.string(),
});

// Zod type definition for IAppBuilderActionPropsCreateModelState
const IAppBuilderActionPropsCreateModelStateSchema =
	createModelStateCoreSchema.extend({
		image: IAppBuilderImageRefSchema.optional(),
		successMessage: z.string().optional(),
		errorMessage: z.string().optional(),
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
		z.strictObject({
			type: z.literal("agentTool"),
			props: IAppBuilderParameterValueSourcePropsAgentToolSchema,
		}),
	],
);

// Zod type definition for IAppBuilderActionPropsCommon
const IAppBuilderActionPropsCommonSchema = z.strictObject({
	id: z.string().optional(),
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
		title: z.string().optional(),
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
	parameterValues: z.array(IAppBuilderActionPropsSetParameterValueSchema),
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

// Zod type definition for IAppBuilderActionPropsAr
const IAppBuilderActionPropsArSchema = z.strictObject({
	viewportId: z.string().optional(),
});

// Zod type definition for IAppBuilderLegacyActionPropsAr
const IAppBuilderLegacyActionPropsArSchema =
	IAppBuilderActionPropsArSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsFullscreen
const IAppBuilderActionPropsFullscreenSchema = z.strictObject({
	type: z.enum(["fullscreen", "fullscreen3States"]).optional(),
	fullscreenId: z.string().optional(),
});

// Zod type definition for IAppBuilderLegacyActionPropsFullscreen
const IAppBuilderLegacyActionPropsFullscreenSchema =
	IAppBuilderActionPropsFullscreenSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsUndo
const IAppBuilderActionPropsUndoSchema = z.strictObject({});

// Zod type definition for IAppBuilderLegacyActionPropsUndo
const IAppBuilderLegacyActionPropsUndoSchema =
	IAppBuilderActionPropsUndoSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsRedo
const IAppBuilderActionPropsRedoSchema = z.strictObject({});

// Zod type definition for IAppBuilderLegacyActionPropsRedo
const IAppBuilderLegacyActionPropsRedoSchema =
	IAppBuilderActionPropsRedoSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsResetParameterValues
const IAppBuilderActionPropsResetParameterValuesSchema = z.strictObject({});

// Zod type definition for IAppBuilderLegacyActionPropsResetParameterValues
const IAppBuilderLegacyActionPropsResetParameterValuesSchema =
	IAppBuilderActionPropsResetParameterValuesSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsImportParameterValues
const IAppBuilderActionPropsImportParameterValuesSchema = z.strictObject({});

// Zod type definition for IAppBuilderLegacyActionPropsImportParameterValues
const IAppBuilderLegacyActionPropsImportParameterValuesSchema =
	IAppBuilderActionPropsImportParameterValuesSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsExportParameterValues
const IAppBuilderActionPropsExportParameterValuesSchema = z.strictObject({});

// Zod type definition for IAppBuilderLegacyActionPropsExportParameterValues
const IAppBuilderLegacyActionPropsExportParameterValuesSchema =
	IAppBuilderActionPropsExportParameterValuesSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

// Zod type definition for IAppBuilderActionPropsImportModelState
const IAppBuilderActionPropsImportModelStateSchema = z.strictObject({});

// Zod type definition for IAppBuilderLegacyActionPropsImportModelState
const IAppBuilderLegacyActionPropsImportModelStateSchema =
	IAppBuilderActionPropsImportModelStateSchema.extend(
		IAppBuilderActionPropsCommonSchema.shape,
	);

const IAppBuilderActionPropsCameraCommonSchema = z.strictObject({
	camera: z
		.union([
			z.looseObject({
				id: z.string().optional(),
				name: z.string().optional(),
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
			viewportId: z.string().optional(),
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
			viewportId: z.string().optional(),
			props: z
				.strictObject({})
				.extend(IAppBuilderActionPropsCameraCommonSchema.shape),
		})
		.extend(IAppBuilderActionPropsCommonSchema.shape),
	z
		.strictObject({
			type: z.literal("set"),
			viewportId: z.string().optional(),
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
			viewportId: z.string().optional(),
			props: z
				.strictObject({})
				.extend(IAppBuilderActionPropsCameraCommonSchema.shape),
		})
		.extend(IAppBuilderActionPropsCommonSchema.shape),
	z
		.strictObject({
			type: z.literal("zoomTo"),
			viewportId: z.string().optional(),
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

const IAppBuilderActionPropsSetContainerVisibilitySchema = z.strictObject({
	// The full container schema is recursive through action widgets, so validate
	// the discriminator and identity fields needed by this action here.
	container: z.union([
		z.looseObject({
			name: z.enum([
				AppBuilderContainerNameType.Left,
				AppBuilderContainerNameType.Right,
				AppBuilderContainerNameType.Top,
				AppBuilderContainerNameType.Bottom,
			]),
		}),
		z.looseObject({
			name: z.enum([
				AppBuilderContainerNameType.Anchor2d,
				AppBuilderContainerNameType.Anchor3d,
				AppBuilderContainerNameType.Toolbar,
			]),
			props: z.looseObject({id: z.string()}),
		}),
	]),
	mode: z.enum(["open", "close", "toggle"]),
});

const IAppBuilderLegacyActionPropsSetContainerVisibilitySchema =
	IAppBuilderActionPropsSetContainerVisibilitySchema.extend(
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
		type: z.literal(AppBuilderActionType.CreateModelState),
		props: IAppBuilderLegacyActionPropsCreateModelStateSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.AddToCart),
		props: IAppBuilderLegacyActionPropsAddToCartSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.SetParameterValue),
		props: IAppBuilderLegacyActionPropsSetParameterValueSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.SetParameterValues),
		props: IAppBuilderLegacyActionPropsSetParameterValuesSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.SetBrowserLocation),
		props: IAppBuilderLegacyActionPropsSetBrowserLocationSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.CloseConfigurator),
		props: IAppBuilderLegacyActionPropsCloseConfiguratorSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Ar),
		props: IAppBuilderLegacyActionPropsArSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Fullscreen),
		props: IAppBuilderLegacyActionPropsFullscreenSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Undo),
		props: IAppBuilderLegacyActionPropsUndoSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Redo),
		props: IAppBuilderLegacyActionPropsRedoSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.ResetParameterValues),
		props: IAppBuilderLegacyActionPropsResetParameterValuesSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.ImportParameterValues),
		props: IAppBuilderLegacyActionPropsImportParameterValuesSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.ExportParameterValues),
		props: IAppBuilderLegacyActionPropsExportParameterValuesSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.ImportModelState),
		props: IAppBuilderLegacyActionPropsImportModelStateSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Camera),
		props: IAppBuilderActionPropsCameraSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Sound),
		props: IAppBuilderLegacyActionPropsSoundSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.SetContainerVisibility),
		props: IAppBuilderLegacyActionPropsSetContainerVisibilitySchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.MessageToParent),
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
	// Default preserves compatibility with controls created before delegates were introduced.
	delegates: z
		.array(
			z.strictObject({
				name: z.string(),
				sessionId: z.string().optional(),
			}),
		)
		.default([]),
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
const IAppBuilderActionDefinitionSchemaBase = z.discriminatedUnion("type", [
	z.strictObject({
		type: z.literal(AppBuilderActionType.CreateModelState),
		props: IAppBuilderActionPropsCreateModelStateSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.AddToCart),
		props: IAppBuilderActionPropsAddToCartSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.SetParameterValue),
		props: IAppBuilderActionPropsSetParameterValueSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.SetParameterValues),
		props: IAppBuilderActionPropsSetParameterValuesSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.SetBrowserLocation),
		props: IAppBuilderActionPropsSetBrowserLocationSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.CloseConfigurator),
		props: IAppBuilderActionPropsCloseConfigurator,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Ar),
		props: IAppBuilderActionPropsArSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Fullscreen),
		props: IAppBuilderActionPropsFullscreenSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Undo),
		props: IAppBuilderActionPropsUndoSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Redo),
		props: IAppBuilderActionPropsRedoSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.ResetParameterValues),
		props: IAppBuilderActionPropsResetParameterValuesSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.ImportParameterValues),
		props: IAppBuilderActionPropsImportParameterValuesSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.ExportParameterValues),
		props: IAppBuilderActionPropsExportParameterValuesSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.ImportModelState),
		props: IAppBuilderActionPropsImportModelStateSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Camera),
		props: IAppBuilderActionPropsCameraSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.Sound),
		props: IAppBuilderActionPropsSoundSchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.SetContainerVisibility),
		props: IAppBuilderActionPropsSetContainerVisibilitySchema,
	}),
	z.strictObject({
		type: z.literal(AppBuilderActionType.MessageToParent),
		props: IAppBuilderActionPropsMessageToParentSchema,
	}),
]);

const IAppBuilderActionDefinitionSchema = z.preprocess(
	preprocessActionDefinitionInput,
	IAppBuilderActionDefinitionSchemaBase,
);

// Compile-time assertion: validated action definitions match IAppBuilderActionDefinition
type _AssertActionDefinition =
	z.infer<typeof IAppBuilderActionDefinitionSchema> extends IAppBuilderActionDefinition
		? true
		: false;
const _checkActionDefinition: _AssertActionDefinition = true;
void _checkActionDefinition;

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
			z.strictObject({
				name: z.string(),
				value: z.number(),
				color: z.string(),
			}),
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
	visualizationMode: z.enum(AttributeVisualizationVisibility).optional(),
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
				z.lazy(
					(): z.ZodType<IAppBuilderWidget> => IAppBuilderWidgetSchema,
				),
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
	occludeBySceneGeometry: z.boolean().optional(),
	prompt: z
		.strictObject({
			inactiveTitle: z.string().optional(),
			activeTitle: z.string().optional(),
			activeText: z.string().optional(),
		})
		.optional(),
	buttons: z
		.strictObject({
			clear: z.boolean().optional(),
		})
		.optional(),
	activeMode: z.enum(["default", "activeOnStart", "alwaysActive"]).optional(),
	presentation: z.enum(["widget", "toolbar"]).optional(),
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

const IAppBuilderToolbarItemBaseShape = {
	id: z.string().optional(),
	icon: z.string().optional(),
	label: z.string().optional(),
	tooltip: z.string().optional(),
	order: z.number().optional(),
	presentation: z.enum(["button", "item"]).optional(),
};

const IAppBuilderToolbarControlItemSchema = z.discriminatedUnion("type", [
	z.strictObject({
		...IAppBuilderToolbarItemBaseShape,
		type: z.literal("parameter"),
		props: IAppBuilderControlParameterRefSchema,
	}),
	z.strictObject({
		...IAppBuilderToolbarItemBaseShape,
		type: z.literal("export"),
		props: IAppBuilderControlExportRefSchema,
	}),
	z.strictObject({
		...IAppBuilderToolbarItemBaseShape,
		type: z.literal("action"),
		props: IAppBuilderControlActionRefSchema,
	}),
	z.strictObject({
		...IAppBuilderToolbarItemBaseShape,
		type: z.literal("output"),
		props: IAppBuilderControlOutputRefSchema,
	}),
]);

const IAppBuilderToolbarActionItemSchema = z.strictObject({
	...IAppBuilderToolbarItemBaseShape,
	type: z.literal("action"),
	props: IAppBuilderControlActionRefSchema,
});

const IAppBuilderToolbarItemSchema = z.discriminatedUnion("type", [
	...IAppBuilderToolbarControlItemSchema.options,
	z.strictObject({
		...IAppBuilderToolbarItemBaseShape,
		type: z.literal("actionMenu"),
		props: z.strictObject({
			sections: z.array(z.array(IAppBuilderToolbarActionItemSchema)),
		}),
	}),
	z.strictObject({
		...IAppBuilderToolbarItemBaseShape,
		type: z.literal("widgets"),
		props: z.strictObject({
			widgets: z.array(IAppBuilderWidgetSchema),
		}),
	}),
	z.strictObject({
		...IAppBuilderToolbarItemBaseShape,
		type: z.literal("tabs"),
		props: z.strictObject({
			tabs: z.array(IAppBuilderTabSchema),
			stickyTabs: z.boolean().optional(),
		}),
	}),
]);

const IAppBuilderToolbarContainerPropertiesSchema = z.strictObject({
	id: z.string(),
	side: z.enum(["top", "bottom", "left", "right"]).optional(),
	align: z.enum(["start", "center", "end"]).optional(),
	order: z.number().optional(),
	visibility: z.enum(["always", "onMouseActivity"]).optional(),
});

// Zod type definition for IAppBuilderContainer
const IAppBuilderContainerSchema = z.discriminatedUnion("name", [
	z
		.strictObject({
			name: z.literal(AppBuilderContainerNameType.Anchor3d),
			props: IAppBuilderAnchor3dContainerPropertiesSchema,
			stickyTabs: z.boolean().optional(),
			tabs: z.array(IAppBuilderTabSchema).optional(),
			widgets: z.array(IAppBuilderWidgetSchema).optional(),
		})
		.extend(IAppBuilderWidgetPropsCommonSchema.shape),
	z
		.strictObject({
			name: z.literal(AppBuilderContainerNameType.Anchor2d),
			props: IAppBuilderAnchor2dContainerPropertiesSchema,
			stickyTabs: z.boolean().optional(),
			tabs: z.array(IAppBuilderTabSchema).optional(),
			widgets: z.array(IAppBuilderWidgetSchema).optional(),
		})
		.extend(IAppBuilderWidgetPropsCommonSchema.shape),
	z
		.strictObject({
			name: z.literal(AppBuilderContainerNameType.Toolbar),
			props: IAppBuilderToolbarContainerPropertiesSchema,
			groups: z.array(z.array(IAppBuilderToolbarItemSchema)).optional(),
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

// Zod type definition for FilterValue ("include" | "exclude")
const FilterValueSchema = z.enum(["include", "exclude"]);

// Zod type definition for IAgentParameterRef
const IAgentParameterRefSchema = z.strictObject({
	name: z
		.string()
		.describe(
			"Id or name or displayname of the referenced parameter (in that order).",
		),
	sessionId: z
		.string()
		.optional()
		.describe(
			"Optional id of the session the referenced parameter belongs to.",
		),
	description: z
		.string()
		.optional()
		.describe(
			"Optional description of the parameter, providing further context to the agent.",
		),
});

// Zod type definition for IAgentActionControlRef.action (id required)
const IAgentEmbeddedActionSchema = IAppBuilderControlActionRefSchema.extend({
	id: z.string(),
});

// Zod type definition for IAgentActionControlRef
const IAgentActionControlRefSchema = z.strictObject({
	name: z
		.string()
		.optional()
		.describe(
			"Id or label (in that order) of the action control that should be referenced. This considers all action controls available anywhere in the App Builder output, which are part of some controls widget.",
		),
	action: IAgentEmbeddedActionSchema.optional().describe(
		"Optional embedded action control definition. If this is provided, the name property will be ignored.",
	),
	description: z
		.string()
		.optional()
		.describe(
			"Optional description of the action, providing further context to the agent.",
		),
});

// Zod type definition for AppBuilderActionType
const AppBuilderActionTypeSchema = z.enum(AppBuilderActionType);

/**
 * The "list_action_controls" tool exposes action *controls* (UI elements that
 * trigger actions), not the underlying actions themselves.
 * Depending on the action definition, triggering may show UI (e.g. a modal).
 * For headless use of underlying actions, define further generic tools or
 * specific tool definitions.
 */
// Zod type definition for GenericToolSettings
const GenericToolSettingsSchema = z.discriminatedUnion("name", [
	z.strictObject({
		name: z.literal(GenericToolName.ListParameterDefinitions),
		parameters: z
			.array(IAgentParameterRefSchema)
			.optional()
			.describe(
				"Optional list of parameters that should be exposed to the agent. In case this list is not provided, parameters will be filtered based on the filter property.",
			),
		filter: z
			.strictObject({
				hidden: FilterValueSchema.optional().describe(
					'Whether to include parameters whose "hidden" property is true. Defaults to "exclude" if not provided.',
				),
				invisible: FilterValueSchema.optional().describe(
					'Whether to include parameters that are currently not exposed in the UI (not referenced by some parameter control or accordion widget). This filter applies on top of the "hidden" filter. Defaults to "include" if not provided.',
				),
				sessionIds: z
					.array(z.string())
					.optional()
					.describe(
						"Which sessions' parameters should be exposed to the agent. If not provided, parameters of the controller session will be exposed.",
					),
			})
			.optional()
			.describe(
				"Optional filter for parameters that should be exposed to the agent. Ignored if the parameters property is provided.",
			),
	}),
	z.strictObject({
		name: z.literal(GenericToolName.GetParameterValues),
	}),
	z.strictObject({
		name: z.literal(GenericToolName.SetParameterValues),
	}),
	z.strictObject({
		name: z.literal(GenericToolName.ListActionControls),
		actions: z
			.array(IAgentActionControlRefSchema)
			.optional()
			.describe(
				"Optional list of actions that should be exposed to the agent. In case this list is not provided, actions will be filtered based on the filter property. The filter will be applied to all actions available anywhere in the App Builder output, as well as to actions available via default toolbars.",
			),
		filter: z
			.strictObject({
				types: z
					.array(AppBuilderActionTypeSchema)
					.optional()
					.describe(
						"The types of actions that should be exposed to the agent. Defaults to DefaultListActionControlType.",
					),
			})
			.optional()
			.describe(
				"Optional filter for actions that should be exposed to the agent. Ignored if the actions property is provided.",
			),
	}),
	z.strictObject({
		name: z.literal(GenericToolName.TriggerActionControl),
	}),
	z.strictObject({
		name: z.literal(GenericToolName.SetCameraPosition),
	}),
	z.strictObject({
		name: z.literal(GenericToolName.GetScreenshot),
	}),
	z.strictObject({
		name: z.literal(GenericToolName.AskUserQuestion),
	}),
	z.strictObject({
		name: z.literal(GenericToolName.GetMetric),
	}),
]);

/**
 * Settings of a tool to be executed remotely, typically by an API call,
 * the Agent2Agent protocol, model context protocol (MCP), etc.
 * To be defined.
 */
// Zod type definition for RemoteToolExecutionSettings
const RemoteToolExecutionSettingsSchema = z.strictObject({});

// Zod type definition for SpecificToolSettings
const SpecificToolSettingsSchema = z.strictObject({
	name: z.string().describe("Name of the tool. Use snake case."),
	description: z
		.string()
		.optional()
		.describe(
			"Optional description of the tool, providing context to the agent.",
		),
	inputSchema: z
		.record(z.string(), JsonValueSchema)
		.describe("Input schema for the tool."),
	actionSequence: z
		.array(IAppBuilderActionDefinitionSchema)
		.optional()
		.describe(
			"Optional sequence of actions that should be run when the tool is triggered. Information about these actions will not be exposed to the agent. Values from inputSchema can be mapped to the action properties using the agentTool parameter value source.",
		),
	remoteExecution: RemoteToolExecutionSettingsSchema.optional().describe(
		"Optional remote execution settings for the tool. Will be ignored if actionSequence is provided.",
	),
});

// Zod type definition for IAppBuilderAgent
const IAppBuilderAgentSchema = z.strictObject({
	id: z.string().describe("Unique identifier of the agent."),
	name: z
		.string()
		.describe("Display name of the agent (exposed to the user)."),
	message: z.string().describe("The agent's system prompt."),
	useGenericToolDefaults: z
		.boolean()
		.optional()
		.describe(
			"Boolean indicating whether all available generic tools shall be exposed using their default settings. Default is true. If this is set to true, settings for individual generic tools can be overridden by including them in the genericTools property. If this is set to false, only the generic tools included in the genericTools property will be available to the agent.",
		),
	genericTools: z
		.array(GenericToolSettingsSchema)
		.optional()
		.describe(
			"Settings of the generic tools that should be available to the agent.",
		),
	specificTools: z
		.array(SpecificToolSettingsSchema)
		.optional()
		.describe(
			"Definition of specific tools that should be available to the agent.",
		),
});

/** Agent-specific reference for a parameter */
export type IAgentParameterRef = z.infer<typeof IAgentParameterRefSchema>;

/**
 * Agent-specific reference for an action control.
 */
export type IAgentActionControlRef = z.infer<
	typeof IAgentActionControlRefSchema
>;

export type GenericToolSettings = z.infer<typeof GenericToolSettingsSchema>;

export type ListParameterDefinitionsToolSettings = Extract<
	GenericToolSettings,
	{name: GenericToolName.ListParameterDefinitions}
>;

export type GetParameterValuesToolSettings = Extract<
	GenericToolSettings,
	{name: GenericToolName.GetParameterValues}
>;

export type SetParameterValuesToolSettings = Extract<
	GenericToolSettings,
	{name: GenericToolName.SetParameterValues}
>;

export type ListActionControlsToolSettings = Extract<
	GenericToolSettings,
	{name: GenericToolName.ListActionControls}
>;

export type TriggerActionControlToolSettings = Extract<
	GenericToolSettings,
	{name: GenericToolName.TriggerActionControl}
>;

export type SetCameraPositionToolSettings = Extract<
	GenericToolSettings,
	{name: GenericToolName.SetCameraPosition}
>;

export type GetScreenshotToolSettings = Extract<
	GenericToolSettings,
	{name: GenericToolName.GetScreenshot}
>;

export type AskUserQuestionToolSettings = Extract<
	GenericToolSettings,
	{name: GenericToolName.AskUserQuestion}
>;

export type GetMetricToolSettings = Extract<
	GenericToolSettings,
	{name: GenericToolName.GetMetric}
>;

export type RemoteToolExecutionSettings = z.infer<
	typeof RemoteToolExecutionSettingsSchema
>;

export type SpecificToolSettings = z.infer<typeof SpecificToolSettingsSchema>;

/**
 * Definition of an agent that can be used with App Builder.
 */
export type IAppBuilderAgent = z.infer<typeof IAppBuilderAgentSchema>;

// Zod type definition for IAppBuilder
const IAppBuilderSchema = z.strictObject({
	version: z.literal("1.0"),
	parameters: z.array(IAppBuilderParameterDefinitionSchema).optional(),
	sessionId: z.string().optional(),
	containers: z.array(IAppBuilderContainerSchema),
	instances: z.array(IAppBuilderInstancesSchema).optional(),
	agents: z.array(IAppBuilderAgentSchema).optional(),
});

// Compile-time assertion: IAppBuilderSchema keys must match IAppBuilder keys
type _AssertAppBuilderKeys = [
	keyof z.infer<typeof IAppBuilderSchema> extends keyof IAppBuilder
		? true
		: false,
	keyof IAppBuilder extends keyof z.infer<typeof IAppBuilderSchema>
		? true
		: false,
];
const _checkAppBuilder: _AssertAppBuilderKeys = [true, true];
void _checkAppBuilder;

// Compile-time assertion: validated layout JSON matches IAppBuilder
type _AssertAppBuilderOutput =
	z.infer<typeof IAppBuilderSchema> extends IAppBuilder ? true : false;
const _checkAppBuilderOutput: _AssertAppBuilderOutput = true;
void _checkAppBuilderOutput;

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
	hideDefaultToolbar: z.boolean().optional(),
});

// Zod type definition for IAppBuilderSettingsSettings
const IAppBuilderSettingsSettingsSchema = z.strictObject({
	disableFallbackUi: z.boolean().optional(),
	agentUrl: z.string().optional(),
});

// Zod type definition for IAppBuilderSettingsJson
const IAppBuilderSettingsJsonSchemaBase = z.strictObject({
	version: z.literal("1.0"),
	sessions: z.array(IAppBuilderSettingsSessionSchema).optional(),
	settings: IAppBuilderSettingsSettingsSchema.optional(),
	themeOverrides: MantineThemeOverrideSchema.optional(),
	appBuilderOverride: IAppBuilderSchema.optional(),
});

const IAppBuilderSettingsJsonSchema =
	IAppBuilderSettingsJsonSchemaBase.superRefine((data, ctx) => {
		const components = data.themeOverrides?.components as
			| Record<string, {defaultProps?: unknown}>
			| undefined;
		if (!components || typeof components !== "object") return;

		validateThemeComponentsRecord(components, ctx, [
			"themeOverrides",
			"components",
		]);
	});

// Compile-time assertion: validated settings JSON matches IAppBuilderSettingsJson
type _AssertSettingsJson =
	z.infer<typeof IAppBuilderSettingsJsonSchema> extends IAppBuilderSettingsJson
		? true
		: false;
const _checkSettingsJson: _AssertSettingsJson = true;
void _checkSettingsJson;

export const validateAppBuilderSettingsJson = (value: any) => {
	return IAppBuilderSettingsJsonSchema.safeParse(value);
};

/** Zod 4 — human-readable paths and messages for AppBuilder / settings JSON validation. */
export function formatAppBuilderZodError(
	error: Parameters<typeof prettifyError>[0],
): string {
	return prettifyError(error);
}
