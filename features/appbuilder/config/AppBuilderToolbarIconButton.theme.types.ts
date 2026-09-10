import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineActionIconPropsSchema} from "@AppBuilderLib/shared/mantine-props/actionIcon.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {mantineTooltipPropsSchema} from "@AppBuilderLib/shared/mantine-props/tooltip.zod";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";

const appBuilderToolbarIconButtonActionIconPropsSchema =
	mantineActionIconPropsSchema.extend({
		variantDisabled: z.string().optional(),
	});

const appBuilderToolbarIconButtonIconPropsSchema =
	IconThemeDefaultPropsSchema.extend({
		color: z.string().optional(),
		colorDisabled: z.string().optional(),
	});

/** Theme `defaultProps` for `useProps("AppBuilderToolbarIconButton", …)`. */
export const AppBuilderToolbarIconButtonThemeDefaultPropsSchema =
	z.strictObject({
		actionIconProps:
			appBuilderToolbarIconButtonActionIconPropsSchema.optional(),
		iconProps: appBuilderToolbarIconButtonIconPropsSchema.optional(),
		tooltipWrapperProps: mantineTooltipPropsSchema.optional(),
		labelSide: z.enum(["top", "bottom", "left", "right"]).optional(),
		labelAlign: z.enum(["start", "center", "end"]).optional(),
		labelProps: mantineTextPropsSchema.optional(),
	});

export type AppBuilderToolbarIconButtonThemeDefaultProps = z.infer<
	typeof AppBuilderToolbarIconButtonThemeDefaultPropsSchema
>;
