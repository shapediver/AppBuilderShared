import type {RefinementCtx} from "zod";
import {themeComponentDefaultPropsRegistry} from "./themeComponentDefaultPropsRegistry";

type ThemeComponentEntry = {defaultProps?: unknown};

function walkContainerThemeOverrides(
	containerThemeOverrides: unknown,
	ctx: RefinementCtx,
	basePath: (string | number)[],
): void {
	if (!containerThemeOverrides || typeof containerThemeOverrides !== "object")
		return;

	for (const [template, containers] of Object.entries(
		containerThemeOverrides as Record<string, unknown>,
	)) {
		if (!containers || typeof containers !== "object") continue;
		for (const [containerName, containerEntry] of Object.entries(
			containers as Record<string, unknown>,
		)) {
			if (!containerEntry || typeof containerEntry !== "object") continue;
			const components = (containerEntry as {components?: unknown})
				.components;
			if (!components || typeof components !== "object") continue;
			validateThemeComponentsRecord(
				components as Record<string, ThemeComponentEntry>,
				ctx,
				[...basePath, template, containerName, "components"],
			);
		}
	}
}

export function validateThemeComponentsRecord(
	components: Record<string, ThemeComponentEntry>,
	ctx: RefinementCtx,
	basePath: (string | number)[],
): void {
	for (const [componentName, entry] of Object.entries(components)) {
		const schema =
			themeComponentDefaultPropsRegistry[
				componentName as keyof typeof themeComponentDefaultPropsRegistry
			];

		if (entry?.defaultProps !== undefined && schema) {
			const parsed = schema.safeParse(entry.defaultProps);
			if (!parsed.success) {
				const defaultPropsPath = [
					...basePath,
					componentName,
					"defaultProps",
				];
				for (const issue of parsed.error.issues) {
					ctx.addIssue({
						...issue,
						path: [...defaultPropsPath, ...issue.path],
					});
				}
			}
		}

		if (
			entry?.defaultProps !== undefined &&
			typeof entry.defaultProps === "object"
		) {
			const dp = entry.defaultProps as Record<string, unknown>;
			const nested = dp.containerThemeOverrides;
			if (nested !== undefined) {
				walkContainerThemeOverrides(nested, ctx, [
					...basePath,
					componentName,
					"defaultProps",
					"containerThemeOverrides",
				]);
			}
		}
	}
}
