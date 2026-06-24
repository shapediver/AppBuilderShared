import {z} from "zod";

/**
 * Zod schema for filterable database settings.
 * Extracted from appbuildertypecheck to avoid a circular import with the theme registry.
 */
const filterableDatabaseDataSourceSchema = z
	.object({
		export: z
			.object({
				name: z.string(),
				sessionId: z.string(),
			})
			.optional(),
		href: z
			.string()
			.min(1)
			.refine(
				(href) => {
					// Allow static files served from the app origin (e.g. /textile-database-sample.csv).
					if (href.startsWith("/")) {
						return true;
					}
					try {
						new URL(href);
						return true;
					} catch {
						return false;
					}
				},
				{message: "href must be an absolute URL or root-relative path"},
			)
			.optional(),
		format: z.enum(["csv", "json"]).optional(),
	})
	// v1: public href or session export; href wins at runtime when both are set.
	.refine((ds) => !!ds.href || !!ds.export, {
		message: "database.dataSource requires href or export",
	});

/** One accordion filter group: column index, UI mode, and optional fixed value list. */
const filterableDatabaseFilterSchema = z.object({
	column: z.number().int().nonnegative(),
	label: z.string().min(1).optional(),
	multivalued: z.boolean().optional(),
	multiple: z.boolean().optional(),
	type: z.literal("color").optional(),
	filterValues: z.array(z.string()).optional(),
});

/** Root settings: where to load data, how to map columns to select item fields, and filter definitions. */
export const filterableDatabaseSettingsSchema = z.object({
	dataSource: filterableDatabaseDataSourceSchema,
	/** Zero-based column indices into each database row. */
	itemDataDefinition: z.object({
		value: z.number().int().nonnegative(),
		displayname: z.number().int().nonnegative().optional(),
		tooltip: z.number().int().nonnegative().optional(),
		description: z.number().int().nonnegative().optional(),
		imageUrl: z.number().int().nonnegative().optional(),
		color: z.number().int().nonnegative().optional(),
		data: z.record(z.string(), z.number().int().nonnegative()).optional(),
	}),
	filters: z.array(filterableDatabaseFilterSchema).min(1),
});
