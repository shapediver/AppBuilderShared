import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {csvEngine} from "./csvEngine";
import {jsonEngine} from "./jsonEngine";
import type {FilterableDatabaseEngine} from "./types";

/** Guesses csv vs json from the path suffix when `dataSource.format` is omitted. */
function inferFormatFromHref(href: string | undefined): "csv" | "json" {
	if (!href) {
		return "csv";
	}

	const path = href.split(/[?#]/)[0]?.toLowerCase() ?? "";
	if (path.endsWith(".json")) {
		return "json";
	}
	return "csv";
}

/**
 * Picks the parse/fetch engine for the configured data source.
 * Export-only sources without href default to CSV unless `format: "json"` is set explicitly.
 */
export function resolveFilterableDatabaseEngine(
	settings: IFilterableDatabaseSettings,
): FilterableDatabaseEngine {
	const format =
		settings.dataSource.format ??
		inferFormatFromHref(settings.dataSource.href);

	return format === "json" ? jsonEngine : csvEngine;
}
