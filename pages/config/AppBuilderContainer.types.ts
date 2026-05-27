import {appBuilderContainerOrientationSchema} from "~/shared/features/appbuilder/lib/AppBuilderContainerOrientation";
import {z} from "zod";
import {AppBuilderHorizontalContainerThemeDefaultPropsSchema} from "~/shared/pages/config/AppBuilderHorizontalContainer.types";
import {AppBuilderVerticalContainerThemeDefaultPropsSchema} from "~/shared/pages/config/AppBuilderVerticalContainer.types";

/**
 * JSON validation for `usePropsAppBuilder("AppBuilderContainer", …)` merged `defaultProps`.
 * `AppBuilderContainer.tsx` uses `AppBuilderContainerThemeDefaultProps` for `orientation` (and defaults);
 * it still intersects horizontal/vertical Mantine theme prop types for spreads into `Group` / `Stack`.
 * Schema = horizontal + vertical layout fields plus `orientation`.
 */
export const AppBuilderContainerThemeDefaultPropsSchema =
	AppBuilderHorizontalContainerThemeDefaultPropsSchema.merge(
		AppBuilderVerticalContainerThemeDefaultPropsSchema,
	).merge(
		z.strictObject({
			orientation: appBuilderContainerOrientationSchema.optional(),
		}),
	);

/** TypeDoc surface for merged `usePropsAppBuilder("AppBuilderContainer", …)` defaults. */
export interface AppBuilderContainerThemeDefaultProps
	extends z.infer<typeof AppBuilderContainerThemeDefaultPropsSchema> {}
