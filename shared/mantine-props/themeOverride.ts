import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineThemeOverridePropsSchema} from "./themeOverride.zod";

export {mantineThemeOverridePropsSchema};
export type MantineThemeOverrideProps = z.infer<
	typeof mantineThemeOverridePropsSchema
>;
