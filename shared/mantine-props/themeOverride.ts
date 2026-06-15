import type {z} from "zod";
import {mantineThemeOverridePropsSchema} from "./themeOverride.zod";

export {mantineThemeOverridePropsSchema};
export type MantineThemeOverrideProps = z.infer<
	typeof mantineThemeOverridePropsSchema
>;
