import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {IconThemeDefaultPropsSchema} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("Hint", …)`. */
export const HintThemeDefaultPropsSchema = z.strictObject({
	containerGroupProps: mantineGroupPropsSchema.optional(),
	groupProps: mantineGroupPropsSchema.optional(),
	iconProps: IconThemeDefaultPropsSchema.optional(),
	textProps: mantineTextPropsSchema.optional(),
	buttonProps: mantineButtonPropsSchema.optional(),
});

export type HintThemeDefaultProps = z.infer<typeof HintThemeDefaultPropsSchema>;
