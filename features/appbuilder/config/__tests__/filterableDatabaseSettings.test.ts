jest.mock("@shapediver/viewer.session", () => ({
	PARAMETER_TYPE: {
		Bool: "Bool",
		Float: "Float",
		String: "String",
	},
	PARAMETER_VISUALIZATION: {},
	TAG3D_JUSTIFICATION: {},
}));

jest.mock("@shapediver/viewer.shared.types", () => ({
	ATTRIBUTE_VISUALIZATION: {},
	CAMERA_TYPE: {},
}));

import {validateStringParameterSettings} from "../appbuildertypecheck";

const validDatabase = {
	type: "fullwidthcards",
	database: {
		dataSource: {href: "https://example.com/data.csv"},
		itemDataDefinition: {value: 0, displayname: 1},
		filters: [{column: 2}],
	},
};

describe("filterable database settings", () => {
	it("accepts selectSettings with database.href", () => {
		const result = validateStringParameterSettings({
			selectSettings: validDatabase,
		});
		expect(result.success).toBe(true);
	});

	it("accepts root-relative database href", () => {
		const result = validateStringParameterSettings({
			selectSettings: {
				...validDatabase,
				database: {
					...validDatabase.database,
					dataSource: {href: "/textile-database-sample.csv"},
				},
			},
		});
		expect(result.success).toBe(true);
	});

	it("accepts format json with href", () => {
		const result = validateStringParameterSettings({
			selectSettings: {
				...validDatabase,
				database: {
					...validDatabase.database,
					dataSource: {
						href: "https://example.com/data.json",
						format: "json",
					},
				},
			},
		});
		expect(result.success).toBe(true);
	});

	it("rejects database without href", () => {
		const result = validateStringParameterSettings({
			selectSettings: {
				...validDatabase,
				database: {
					...validDatabase.database,
					dataSource: {export: {name: "csv", sessionId: "s1"}},
				},
			},
		});
		expect(result.success).toBe(false);
	});

	it("rejects database with unsupported select type", () => {
		const result = validateStringParameterSettings({
			selectSettings: {...validDatabase, type: "dropdown"},
		});
		expect(result.success).toBe(false);
	});
});
