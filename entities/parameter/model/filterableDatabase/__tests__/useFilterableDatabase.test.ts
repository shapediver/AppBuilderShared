/**
 * @jest-environment jsdom
 */

jest.mock("../../../lib/filterableDatabase/resolveDataSource", () => ({
	hasDataSource: () => true,
	fetchRawText: jest.fn(),
}));

import {renderHook, waitFor} from "@testing-library/react";
import {fetchRawText} from "../../../lib/filterableDatabase/resolveDataSource";
import {useFilterableDatabase} from "../useFilterableDatabase";

const mockFetchRawText = fetchRawText as jest.Mock;

describe("useFilterableDatabase filter groups", () => {
	beforeEach(() => {
		mockFetchRawText.mockReset();
		mockFetchRawText.mockResolvedValue(
			"id,name,unused,colorName,colorHex\n1,A,,Blue,#277DA1\n",
		);
	});

	it("builds color nodes with hex value, columnLabel text, and hex color", async () => {
		const {result} = renderHook(() =>
			useFilterableDatabase({
				dataSource: {href: "https://example.com/data.csv"},
				itemDataDefinition: {value: 0},
				filters: [
					{
						column: 4,
						columnLabel: 3,
						label: "Color",
						type: "color",
						multivalued: true,
					},
				],
			}),
		);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.filterGroups[0].nodes).toEqual([
			{value: "#277DA1", label: "Blue", color: "#277DA1"},
		]);
	});
});
