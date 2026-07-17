import {createModelStateDataSchema} from "@AppBuilderLib/features/model-state/config/createModelState.zod";

/** WebMCP input = hook data without `image` (agents don't set export screenshot refs). */
export const createModelStateInputSchema = createModelStateDataSchema.omit({
	image: true,
});
