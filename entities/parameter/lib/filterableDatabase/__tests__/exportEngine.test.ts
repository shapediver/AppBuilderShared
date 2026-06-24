jest.mock(
	"@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters",
	() => ({
		useShapeDiverStoreParameters: {
			getState: jest.fn(),
		},
	}),
);

import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {fetchExportText} from "../exportEngine";

const mockGetState = useShapeDiverStoreParameters.getState as jest.Mock;

describe("fetchExportText", () => {
	const exportRef = {name: "database-csv", sessionId: "default"};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("requests export and returns text via actions.fetch", async () => {
		const request = jest.fn().mockResolvedValue({
			name: "database-csv",
			content: [{href: "https://example.com/export.csv", format: "csv"}],
		});
		const fetch = jest.fn().mockResolvedValue({
			ok: true,
			text: async () => "a,b\n1,2\n",
		});
		const exportStore = {
			getState: jest.fn().mockReturnValue({
				actions: {request, fetch},
			}),
		};

		mockGetState.mockReturnValue({
			getExport: jest.fn().mockReturnValue(exportStore),
		});

		await expect(fetchExportText(exportRef)).resolves.toBe("a,b\n1,2\n");
		expect(mockGetState().getExport).toHaveBeenCalledWith(
			"default",
			"database-csv",
		);
		expect(request).toHaveBeenCalled();
		expect(fetch).toHaveBeenCalledWith("https://example.com/export.csv");
	});

	it("falls back to fetchText when actions.fetch throws", async () => {
		const request = jest.fn().mockResolvedValue({
			name: "database-csv",
			content: [{href: "https://example.com/export.csv", format: "csv"}],
		});
		const fetch = jest.fn().mockRejectedValue(new Error("jwt fetch failed"));
		const exportStore = {
			getState: jest.fn().mockReturnValue({
				actions: {request, fetch},
			}),
		};

		mockGetState.mockReturnValue({
			getExport: jest.fn().mockReturnValue(exportStore),
		});

		const globalFetch = jest
			.spyOn(global, "fetch")
			.mockResolvedValue({
				ok: true,
				text: async () => "fallback,text\n",
			} as Response);

		await expect(fetchExportText(exportRef)).resolves.toBe(
			"fallback,text\n",
		);
		globalFetch.mockRestore();
	});

	it("throws when export is missing from the store", async () => {
		mockGetState.mockReturnValue({
			getExport: jest.fn().mockReturnValue(undefined),
		});

		await expect(fetchExportText(exportRef)).rejects.toThrow(
			'Export "database-csv" not found for session "default"',
		);
	});

	it("throws when export response has no download URL", async () => {
		const exportStore = {
			getState: jest.fn().mockReturnValue({
				actions: {
					request: jest.fn().mockResolvedValue({
						name: "database-csv",
						content: [],
					}),
					fetch: jest.fn(),
				},
			}),
		};

		mockGetState.mockReturnValue({
			getExport: jest.fn().mockReturnValue(exportStore),
		});

		await expect(fetchExportText(exportRef)).rejects.toThrow(
			'Export "database-csv" did not return downloadable content',
		);
	});
});
