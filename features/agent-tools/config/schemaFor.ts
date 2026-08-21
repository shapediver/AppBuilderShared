import {z} from "@AppBuilderLib/shared/lib/zod";
import {getMetricInputSchema} from "./getMetric";
import {getParameterValuesInputSchema} from "./getParameterValues";
import {getScreenshotInputSchema} from "./getScreenshot";
import {InScopeGenericToolName} from "./inScopeGenericTools";
import {listActionControlsInputSchema} from "./listActionControls";
import {listParameterDefinitionsInputSchema} from "./listParameterDefinitions";
import {setCameraPositionInputSchema} from "./setCameraPosition";
import {setParameterValuesInputSchema} from "./setParameterValues";
import {triggerActionControlInputSchema} from "./triggerActionControl";

export const INPUT_SCHEMA_BY_TOOL = {
	[InScopeGenericToolName.ListParameterDefinitions]:
		listParameterDefinitionsInputSchema,
	[InScopeGenericToolName.GetParameterValues]: getParameterValuesInputSchema,
	[InScopeGenericToolName.SetParameterValues]: setParameterValuesInputSchema,
	[InScopeGenericToolName.ListActionControls]: listActionControlsInputSchema,
	[InScopeGenericToolName.TriggerActionControl]:
		triggerActionControlInputSchema,
	[InScopeGenericToolName.SetCameraPosition]: setCameraPositionInputSchema,
	[InScopeGenericToolName.GetScreenshot]: getScreenshotInputSchema,
	[InScopeGenericToolName.GetMetric]: getMetricInputSchema,
} satisfies Record<InScopeGenericToolName, ReturnType<typeof z.strictObject>>;

export function schemaFor<N extends InScopeGenericToolName>(
	name: N,
): (typeof INPUT_SCHEMA_BY_TOOL)[N] {
	return INPUT_SCHEMA_BY_TOOL[name];
}
