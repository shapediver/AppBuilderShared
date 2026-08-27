import type {RefinementCtx} from "@AppBuilderLib/shared/lib/zod";
import {themeComponentDefaultPropsRegistry} from "./themeComponentDefaultPropsRegistry";

type ThemeComponentEntry = {defaultProps?: unknown};

function walkContainerThemeOverrides(
	containerThemeOverrides: unknown,
	ctx: RefinementCtx,
	basePath: (string | number)[],
): void {
	if (!containerThemeOverrides) return;

	for (const [template, containers] of Object.entries(
		containerThemeOverrides as Record<string, unknown>,
	)) {
		if (!containers) continue;
		for (const [containerName, containerEntry] of Object.entries(
			containers as Record<string, unknown>,
		)) {
			if (!containerEntry) continue;
			const components = (containerEntry as {components?: unknown})
				.components;
			if (!components) continue;
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

		if (entry?.defaultProps !== undefined && entry.defaultProps !== null) {
			const dp = entry.defaultProps as Record<string, unknown>;
			walkContainerThemeOverrides(dp.containerThemeOverrides, ctx, [
				...basePath,
				componentName,
				"defaultProps",
				"containerThemeOverrides",
			]);
		}
	}
}
