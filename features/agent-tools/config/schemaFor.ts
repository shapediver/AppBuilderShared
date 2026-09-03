import {GenericToolName} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {getMetricInputSchema} from "./getMetric";
import {getParameterValuesInputSchema} from "./getParameterValues";
import {getScreenshotInputSchema} from "./getScreenshot";
import type {InScopeGenericToolName} from "./inScopeGenericTools";
import {listActionControlsInputSchema} from "./listActionControls";
import {listParameterDefinitionsInputSchema} from "./listParameterDefinitions";
import {setCameraPositionInputSchema} from "./setCameraPosition";
import {setParameterValuesInputSchema} from "./setParameterValues";
import {triggerActionControlInputSchema} from "./triggerActionControl";

export const INPUT_SCHEMA_BY_TOOL = {
	[GenericToolName.ListParameterDefinitions]:
		listParameterDefinitionsInputSchema,
	[GenericToolName.GetParameterValues]: getParameterValuesInputSchema,
	[GenericToolName.SetParameterValues]: setParameterValuesInputSchema,
	[GenericToolName.ListActionControls]: listActionControlsInputSchema,
	[GenericToolName.TriggerActionControl]: triggerActionControlInputSchema,
	[GenericToolName.SetCameraPosition]: setCameraPositionInputSchema,
	[GenericToolName.GetScreenshot]: getScreenshotInputSchema,
	[GenericToolName.GetMetric]: getMetricInputSchema,
} satisfies Record<InScopeGenericToolName, ReturnType<typeof z.strictObject>>;

export function schemaFor<N extends InScopeGenericToolName>(
	name: N,
): (typeof INPUT_SCHEMA_BY_TOOL)[N] {
	return INPUT_SCHEMA_BY_TOOL[name];
}
