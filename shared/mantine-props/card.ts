import type {z} from "zod";
import {mantineCardPropsSchema} from "./card.zod";

export {mantineCardPropsSchema};
export type MantineCardProps = z.infer<typeof mantineCardPropsSchema>;
