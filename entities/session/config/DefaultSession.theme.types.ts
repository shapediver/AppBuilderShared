import {z} from "zod";

const shapeDiverExampleModelSchema = z.strictObject({
	slug: z.string(),
	ticket: z.string(),
	modelViewUrl: z.string(),
});

/** Theme `defaultProps` for `useProps("DefaultSession", …)`. */
export const DefaultSessionThemeDefaultPropsSchema = z.strictObject({
	example: z.string().optional(),
	exampleModels: z
		.record(z.string(), shapeDiverExampleModelSchema)
		.optional(),
	id: z.string().optional(),
	ticket: z.string().optional(),
	guid: z.string().optional(),
	modelViewUrl: z.string().optional(),
	jwtToken: z.string().optional(),
	slug: z.string().optional(),
	platformUrl: z.string().optional(),
	waitForOutputs: z.boolean().optional(),
	loadOutputs: z.boolean().optional(),
	allowOutputLoading: z.boolean().optional(),
	ignoreUnknownParams: z.boolean().optional(),
	loadSdtf: z.boolean().optional(),
	excludeViewports: z.array(z.string()).optional(),
	initialParameterValues: z.record(z.string(), z.string()).optional(),
	modelStateValidationMode: z.string().optional(),
	throwOnCustomizationError: z.boolean().optional(),
	acceptRejectMode: z.boolean().optional(),
	hideAttributeVisualization: z.boolean().optional(),
	hideJsonMenu: z.boolean().optional(),
	hideSavedStates: z.boolean().optional(),
	hideDesktopClients: z.boolean().optional(),
	hideExports: z.boolean().optional(),
	loadPlatformSettingsFromViewer: z.enum(["platform", "iframe"]).optional(),
	modelStateId: z.string().optional(),
	instance: z.boolean().optional(),
	loadOnFirstUse: z.boolean().optional(),
	keepInStore: z.boolean().optional(),
});

export type DefaultSessionThemeDefaultProps = z.infer<
	typeof DefaultSessionThemeDefaultPropsSchema
>;
