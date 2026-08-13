import {z} from "@AppBuilderLib/shared/lib/zod";

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

/**
 * Resolve container flex orientation.
 * Explicit horizontal/vertical wins. Else inherit a resolved parent.
 * Else name default: top/bottom horizontal, other names vertical.
 */
export function resolveAppBuilderContainerOrientation(
	orientation: AppBuilderContainerOrientationType | undefined,
	parentOrientation: AppBuilderContainerOrientationType | undefined,
	name: string,
): "horizontal" | "vertical" {
	if (orientation === "horizontal" || orientation === "vertical") {
		return orientation;
	}
	if (
		parentOrientation === "horizontal" ||
		parentOrientation === "vertical"
	) {
		return parentOrientation;
	}
	return name === "top" || name === "bottom" ? "horizontal" : "vertical";
}
