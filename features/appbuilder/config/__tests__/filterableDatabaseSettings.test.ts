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

	it("accepts filters without columnLabel", () => {
		const result = filterableDatabaseSettingsSchema.safeParse(baseSettings);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.filters[0].columnLabel).toBeUndefined();
		}
	});

	it("accepts columnLabel on color and text filters", () => {
		const result = filterableDatabaseSettingsSchema.safeParse({
			...baseSettings,
			filters: [
				{
					column: 4,
					columnLabel: 3,
					label: "Color",
					type: "color",
					multivalued: true,
				},
				{column: 1, columnLabel: 1, label: "Name", type: "text"},
			],
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.filters[0].columnLabel).toBe(3);
			expect(result.data.filters[1].columnLabel).toBe(1);
		}
	});

	it("rejects a negative columnLabel", () => {
		const result = filterableDatabaseSettingsSchema.safeParse({
			...baseSettings,
			filters: [{column: 4, columnLabel: -1}],
		});

		expect(result.success).toBe(false);
	});

	it("rejects a non-integer columnLabel", () => {
		const result = filterableDatabaseSettingsSchema.safeParse({
			...baseSettings,
			filters: [{column: 4, columnLabel: 1.5}],
		});

		expect(result.success).toBe(false);
	});
});
