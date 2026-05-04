import {z} from "zod";

/**
 * Zod schemas for theme `defaultProps` of components registered here.
 * Keys MUST match the first argument of `useProps` / `usePropsAppBuilder` for that component.
 * Only listed components get deep validation; others stay opaque (Mantine JSON rules).
 */
export const themeComponentDefaultPropsRegistry = {
	Icon: z.strictObject({
		size: z.union([z.string(), z.number()]).optional(),
		stroke: z.union([z.string(), z.number()]).optional(),
	}),
} as const satisfies Record<string, z.ZodTypeAny>;

export type ThemeComponentDefaultPropsRegistryKey = keyof typeof themeComponentDefaultPropsRegistry;
