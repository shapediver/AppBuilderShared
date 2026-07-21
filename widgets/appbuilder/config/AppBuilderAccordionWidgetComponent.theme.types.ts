import {z} from "@AppBuilderLib/shared/lib/zod";

export const AppBuilderAccordionWidgetComponentThemeDefaultPropsSchema =
	z.strictObject({
		showAcceptRejectButtons: z.boolean().optional(),
	});

export type AppBuilderAccordionWidgetComponentThemeDefaultProps = z.infer<
	typeof AppBuilderAccordionWidgetComponentThemeDefaultPropsSchema
>;
