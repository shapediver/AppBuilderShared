jest.mock("../exportEngine", () => ({
	fetchExportText: jest.fn(),
}));

jest.mock("../resolveEngine", () => ({
	resolveFilterableDatabaseEngine: jest.fn(),
}));

import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {fetchExportText} from "../exportEngine";
import {resolveFilterableDatabaseEngine} from "../resolveEngine";
import {fetchRawText, hasDataSource} from "../resolveDataSource";

const mockFetchExportText = fetchExportText as jest.Mock;
const mockResolveEngine = resolveFilterableDatabaseEngine as jest.Mock;

const baseSettings = (
	dataSource: IFilterableDatabaseSettings["dataSource"],
): IFilterableDatabaseSettings => ({
	dataSource,
	itemDataDefinition: {value: 0},
	filters: [{column: 1}],
});

describe("hasDataSource", () => {
	it("returns true when href is set", () => {
		expect(
			hasDataSource(baseSettings({href: "https://example.com/data.csv"})),
		).toBe(true);
	});

	it("returns true when export is set", () => {
		expect(
			hasDataSource(
				baseSettings({
					export: {name: "csv", sessionId: "default"},
				}),
			),
		).toBe(true);
	});

	it("returns false when neither href nor export is set", () => {
		expect(hasDataSource(baseSettings({}))).toBe(false);
	});
});

describe("fetchRawText", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("uses href when both href and export are set", async () => {
		const fetch = jest.fn().mockResolvedValue("href-data");
		mockResolveEngine.mockReturnValue({fetch});

		const settings = baseSettings({
			href: "https://example.com/data.csv",
			export: {name: "csv", sessionId: "default"},
		});

		await expect(fetchRawText(settings)).resolves.toBe("href-data");
		expect(fetch).toHaveBeenCalledWith("https://example.com/data.csv");
		expect(mockFetchExportText).not.toHaveBeenCalled();
	});

	it("uses export when href is absent", async () => {
		mockFetchExportText.mockResolvedValue("export-data");

		const settings = baseSettings({
			export: {name: "csv", sessionId: "default"},
		});

		await expect(fetchRawText(settings)).resolves.toBe("export-data");
		expect(mockFetchExportText).toHaveBeenCalledWith({
			name: "csv",
			sessionId: "default",
		});
		expect(mockResolveEngine).not.toHaveBeenCalled();
	});

	it("throws when neither href nor export is set", async () => {
		await expect(fetchRawText(baseSettings({}))).rejects.toThrow(
			"database.dataSource requires href or export",
		);
	});
});
