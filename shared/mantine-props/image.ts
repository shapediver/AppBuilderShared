import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineImagePropsSchema} from "./image.zod";

export {mantineImagePropsSchema};
export type MantineImageProps = z.infer<typeof mantineImagePropsSchema>;
