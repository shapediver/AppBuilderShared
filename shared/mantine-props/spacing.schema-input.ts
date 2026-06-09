/**
 * Serializable Mantine size tokens + CSS length.
 * Aligns with `MantineSize`, `LoaderProps["size"]`, and spacing-related Mantine props.
 * @see https://mantine.dev/styles/size/
 */
/** Mantine component `size` tokens (no numeric literal — unlike spacing props). */
export type MantineSizeToken = "xs" | "sm" | "md" | "lg" | "xl" | string;

export type MantineSpacing = "xs" | "sm" | "md" | "lg" | "xl" | string | number;
