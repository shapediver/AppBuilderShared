import {LegacyViewportIconsThemeDefaultPropsSchema} from "@AppBuilderLib/entities/viewport/config/LegacyViewportIcons.theme.types";
import {z} from "@AppBuilderLib/shared/lib/zod";

/** Theme `defaultProps` for `useProps("AppBuilderToolbar", …)`.
 * Uses the legacy `ViewportIcons` container surface so old theme defaults keep
 * matching the default viewport toolbar while new toolbars use this component key.
 */
export const AppBuilderToolbarThemeDefaultPropsSchema =
	LegacyViewportIconsThemeDefaultPropsSchema.pick({
		style: true,
		paperProps: true,
		dividerProps: true,
		transitionProps: true,
	});

export type AppBuilderToolbarThemeDefaultProps = z.infer<
	typeof AppBuilderToolbarThemeDefaultPropsSchema
>;
