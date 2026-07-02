import type {z} from "zod";
import {appBuilderThemeOtherPropsSchema} from "./appBuilderThemeOther.zod";

export {appBuilderThemeOtherPropsSchema};
export type AppBuilderThemeOtherProps = z.infer<
	typeof appBuilderThemeOtherPropsSchema
>;
