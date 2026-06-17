import {mantineActionIconPropsSchema} from "@AppBuilderLib/shared/mantine-props/actionIcon.zod";
import {mantineTooltipPropsSchema} from "@AppBuilderLib/shared/mantine-props/tooltip.zod";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {z} from "zod";

const viewportIconButtonActionIconPropsSchema =
	mantineActionIconPropsSchema.extend({
		variantDisabled: z.string().optional(),
	});

const viewportIconButtonIconPropsSchema = IconThemeDefaultPropsSchema.extend({
	color: z.string().optional(),
	colorDisabled: z.string().optional(),
});

/** Theme `defaultProps` for `useProps("ViewportIconButton", …)`. */
export const ViewportIconButtonThemeDefaultPropsSchema = z.strictObject({
	actionIconProps: viewportIconButtonActionIconPropsSchema.optional(),
	iconProps: viewportIconButtonIconPropsSchema.optional(),
	tooltipWrapperProps: mantineTooltipPropsSchema.optional(),
});

export type ViewportIconButtonThemeDefaultProps = z.infer<
	typeof ViewportIconButtonThemeDefaultPropsSchema
>;
