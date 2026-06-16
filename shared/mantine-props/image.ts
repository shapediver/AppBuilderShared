import type {z} from "zod";
import {mantineImagePropsSchema} from "./image.zod";

export {mantineImagePropsSchema};
export type MantineImageProps = z.infer<typeof mantineImagePropsSchema>;
