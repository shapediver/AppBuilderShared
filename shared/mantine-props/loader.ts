import type {z} from "zod";
import {mantineLoaderPropsSchema} from "./loader.zod";

export {mantineLoaderPropsSchema};
export type MantineLoaderProps = z.infer<typeof mantineLoaderPropsSchema>;
