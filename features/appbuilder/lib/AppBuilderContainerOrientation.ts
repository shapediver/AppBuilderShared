import {z} from "@AppBuilderLib/shared/lib/zod";
import {AppBuilderContainerNameType} from "../config/appbuilder";

/** Flex orientation of an App Builder container (theme JSON + context). */
export enum AppBuilderContainerOrientation {
	Unspecified = "unspecified",
	Horizontal = "horizontal",
	Vertical = "vertical",
}

/** Single source for container orientation literals (theme JSON + context). */
export const APP_BUILDER_CONTAINER_ORIENTATIONS = [
	AppBuilderContainerOrientation.Unspecified,
	AppBuilderContainerOrientation.Horizontal,
	AppBuilderContainerOrientation.Vertical,
] as const;

export type AppBuilderContainerOrientationType =
	AppBuilderContainerOrientation;

export const appBuilderContainerOrientationSchema = z.enum(
	APP_BUILDER_CONTAINER_ORIENTATIONS,
);

export type AppBuilderContainerResolvedOrientation =
	| AppBuilderContainerOrientation.Horizontal
	| AppBuilderContainerOrientation.Vertical;

/**
 * Resolve container flex orientation.
 * Explicit horizontal/vertical wins. Else inherit a resolved parent.
 * Else name default: top/bottom horizontal, other names vertical.
 */
export function resolveAppBuilderContainerOrientation(
	orientation: AppBuilderContainerOrientationType | undefined,
	parentOrientation: AppBuilderContainerOrientationType | undefined,
	name: string,
): AppBuilderContainerResolvedOrientation {
	if (
		orientation === AppBuilderContainerOrientation.Horizontal ||
		orientation === AppBuilderContainerOrientation.Vertical
	) {
		return orientation;
	}
	if (
		parentOrientation === AppBuilderContainerOrientation.Horizontal ||
		parentOrientation === AppBuilderContainerOrientation.Vertical
	) {
		return parentOrientation;
	}
	return name === AppBuilderContainerNameType.Top ||
		name === AppBuilderContainerNameType.Bottom
		? AppBuilderContainerOrientation.Horizontal
		: AppBuilderContainerOrientation.Vertical;
}
