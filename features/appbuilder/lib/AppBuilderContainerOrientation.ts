import {z} from "zod";

/** Single source for container orientation literals (theme JSON + context). */
export const APP_BUILDER_CONTAINER_ORIENTATIONS = [
	"unspecified",
	"horizontal",
	"vertical",
] as const;

export type AppBuilderContainerOrientationType =
	(typeof APP_BUILDER_CONTAINER_ORIENTATIONS)[number];

export const appBuilderContainerOrientationSchema = z.enum(
	APP_BUILDER_CONTAINER_ORIENTATIONS,
);
