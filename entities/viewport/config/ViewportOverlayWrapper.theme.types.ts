import {mantineResponsiveSchema} from "@AppBuilderLib/shared/mantine-props/mantineResponsive.zod";
import {mantineCssLengthSchema} from "@AppBuilderLib/shared/mantine-props/primitives.zod";
import {z} from "zod";

const overlayPositionValueSchema = z.enum([
	"top-left",
	"top-right",
	"bottom-left",
	"bottom-right",
	"top-middle",
	"bottom-middle",
]);

/** Responsive overlay position (`OverlayStyleProps.position`). */
export const responsiveOverlayPositionSchema = mantineResponsiveSchema(
	overlayPositionValueSchema,
	{catchall: true},
);

/** Theme `defaultProps` for `useProps("ViewportOverlayWrapper", …)`. */
export const ViewportOverlayWrapperThemeDefaultPropsSchema = z.strictObject({
	position: responsiveOverlayPositionSchema.optional(),
	offset: mantineCssLengthSchema.optional(),
	offsetX: mantineCssLengthSchema.optional(),
	offsetY: mantineCssLengthSchema.optional(),
	className: z.string().optional(),
});

export type ViewportOverlayWrapperThemeDefaultProps = z.infer<
	typeof ViewportOverlayWrapperThemeDefaultPropsSchema
>;
