import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {csvEngine} from "./csvEngine";
import {jsonEngine} from "./jsonEngine";
import type {FilterableDatabaseEngine} from "./types";

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

export function resolveFilterableDatabaseEngine(
	settings: IFilterableDatabaseSettings,
): FilterableDatabaseEngine {
	const format =
		settings.dataSource.format ??
		inferFormatFromHref(settings.dataSource.href);

	return format === "json" ? jsonEngine : csvEngine;
}
