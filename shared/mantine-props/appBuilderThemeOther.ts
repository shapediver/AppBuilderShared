import type {z} from "@AppBuilderLib/shared/lib/zod";
import {appBuilderThemeOtherPropsSchema} from "./appBuilderThemeOther.zod";

export {appBuilderThemeOtherPropsSchema};
export type AppBuilderThemeOtherProps = z.infer<
	typeof appBuilderThemeOtherPropsSchema
>;
