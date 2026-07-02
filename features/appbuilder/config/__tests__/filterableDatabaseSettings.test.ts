import {filterableDatabaseSettingsSchema} from "@AppBuilderLib/entities/parameter/lib/filterableDatabase/filterableDatabaseSettingsSchema";

const baseSettings = {
	dataSource: {href: "/sample.csv"},
	itemDataDefinition: {value: 0},
	filters: [{column: 0}],
};

describe("filterableDatabaseSettingsSchema", () => {
	it("accepts inline: true on a filter", () => {
		const result = filterableDatabaseSettingsSchema.safeParse({
			...baseSettings,
			filters: [
				{column: 1, label: "Name", type: "text", inline: true},
				{column: 3, label: "Category", multiple: true},
			],
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.filters[0].inline).toBe(true);
		}
	});
});
