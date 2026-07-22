import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";

/** Theme `defaultProps` for `useProps("ViewportAcceptRejectButtons", …)`. */
export const ViewportAcceptRejectButtonsThemeDefaultPropsSchema =
	z.strictObject({
		groupProps: mantineGroupPropsSchema.optional(),
		buttonProps: mantineButtonPropsSchema.optional(),
		acceptButtonProps: mantineButtonPropsSchema.optional(),
		rejectButtonProps: mantineButtonPropsSchema.optional(),
		iconProps: IconThemeDefaultPropsSchema.optional(),
		textProps: mantineTextPropsSchema.optional(),
		showButtons: z.boolean().optional(),
	});

export type ViewportAcceptRejectButtonsThemeDefaultProps = z.infer<
	typeof ViewportAcceptRejectButtonsThemeDefaultPropsSchema
>;
