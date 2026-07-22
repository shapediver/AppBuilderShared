import type {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineCardPropsSchema} from "./card.zod";

export {mantineCardPropsSchema};
export type MantineCardProps = z.infer<typeof mantineCardPropsSchema>;
