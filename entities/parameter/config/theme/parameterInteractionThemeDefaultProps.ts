import {
	IDraggingParameterPropsJsonSchema,
	IGumballTransformParameterPropsJsonSchema,
	ISelectionParameterPropsJsonSchema,
} from "@shapediver/viewer.shared.types";
import {z} from "zod";

/** TypeDoc surface for `useProps("ParameterDraggingComponent", …)` theme defaults. */
export interface ParameterDraggingComponentThemeDefaultProps extends z.infer<
	typeof IDraggingParameterPropsJsonSchema
> {}

/** TypeDoc surface for `useProps("ParameterGumballComponent", …)` theme defaults. */
export interface ParameterGumballComponentThemeDefaultProps extends z.infer<
	typeof IGumballTransformParameterPropsJsonSchema
> {}

/** TypeDoc surface for `useProps("ParameterSelectionComponent", …)` theme defaults. */
export interface ParameterSelectionComponentThemeDefaultProps extends z.infer<
	typeof ISelectionParameterPropsJsonSchema
> {}
