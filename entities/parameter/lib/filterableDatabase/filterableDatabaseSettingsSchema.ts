import {z} from "zod";

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
	.refine((ds) => !!ds.href, {
		message: "database.dataSource.href is required in v1",
	});

const filterableDatabaseFilterSchema = z.object({
	column: z.number().int().nonnegative(),
	label: z.string().min(1).optional(),
	multivalued: z.boolean().optional(),
	multiple: z.boolean().optional(),
	type: z.literal("color").optional(),
	filterValues: z.array(z.string()).optional(),
});

export const filterableDatabaseSettingsSchema = z.object({
	dataSource: filterableDatabaseDataSourceSchema,
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
