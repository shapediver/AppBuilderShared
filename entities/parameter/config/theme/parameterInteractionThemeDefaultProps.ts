import {z} from "zod";
import {
	IDraggingParameterPropsJsonSchema,
	IGumballTransformParameterPropsJsonSchema, ISelectionParameterPropsJsonSchema,
} from "@shapediver/viewer.shared.types/dist/interfaces/parameter/IInteractionParameterSettings";

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
