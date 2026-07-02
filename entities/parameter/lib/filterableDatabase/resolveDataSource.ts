import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {fetchExportText} from "./exportEngine";
import {resolveFilterableDatabaseEngine} from "./resolveEngine";

/** True when settings declare a static href and/or a ShapeDiver session export. */
export function hasDataSource(settings: IFilterableDatabaseSettings): boolean {
	const {href, export: exportRef} = settings.dataSource;
	return !!href || !!exportRef;
}

/**
 * Loads unparsed database text from the configured source.
 * Precedence: `href` (via format-specific engine) over session `export`.
 */
export async function fetchRawText(
	settings: IFilterableDatabaseSettings,
): Promise<string> {
	const {href, export: exportRef} = settings.dataSource;

	if (href) {
		return resolveFilterableDatabaseEngine(settings).fetch(href);
	}

	if (exportRef) {
		return fetchExportText(exportRef);
	}

	throw new Error("database.dataSource requires href or export");
}
