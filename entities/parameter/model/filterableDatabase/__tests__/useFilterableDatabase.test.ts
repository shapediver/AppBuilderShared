/**
 * @jest-environment jsdom
 */

jest.mock("../../../lib/filterableDatabase/resolveDataSource", () => ({
	hasDataSource: () => true,
	fetchRawText: jest.fn(),
}));

import {act, render, renderHook, screen, waitFor} from "@testing-library/react";
import React from "react";
import {fetchRawText} from "../../../lib/filterableDatabase/resolveDataSource";
import {useFilterableDatabase} from "../useFilterableDatabase";
import {
	filterableDatabaseSettingsKey,
	resetFilterableDatabaseState,
	useFilterableDatabaseStateStore,
} from "../useFilterableDatabaseStateStore";

const mockFetchRawText = fetchRawText as jest.Mock;

const colorSettings = {
	dataSource: {href: "https://example.com/data.csv"},
	itemDataDefinition: {value: 0},
	filters: [
		{
			column: 4,
			columnLabel: 3,
			label: "Color",
			type: "color" as const,
			multivalued: true,
		},
	],
};

describe("useFilterableDatabase filter groups", () => {
	beforeEach(() => {
		mockFetchRawText.mockReset();
		mockFetchRawText.mockResolvedValue(
			"id,name,unused,colorName,colorHex\n1,A,,Blue,#277DA1\n",
		);
		resetFilterableDatabaseState();
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

	it("restores filters and loaded items after the control unmounts", async () => {
		mockFetchRawText.mockResolvedValue(
			[
				"id,name,unused,colorName,colorHex",
				"1,A,,Blue,#277DA1",
				"2,B,,Blue,#277DA1",
				"3,C,,Blue,#277DA1",
				"4,D,,Red,#FF0000",
			].join("\n"),
		);

		const persistenceKey = "session:elements_select";
		const {result, unmount} = renderHook(() =>
			useFilterableDatabase(colorSettings, {
				persistenceKey,
				pageSize: 2,
			}),
		);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		act(() => {
			result.current.toggleFilterValue(0, "#277DA1");
		});
		await act(async () => {
			await result.current.scrollingApi?.loadMore();
		});

		const loaded = result.current.scrollingApi?.items.map(
			(entry) => entry.item,
		);
		expect(loaded?.length).toBeGreaterThan(2);
		unmount();

		const restored = renderHook(() =>
			useFilterableDatabase(colorSettings, {
				persistenceKey,
				pageSize: 2,
			}),
		);

		expect(restored.result.current.loading).toBe(false);
		expect(restored.result.current.selection).toEqual({0: ["#277DA1"]});
		expect(
			restored.result.current.scrollingApi?.items.map(
				(entry) => entry.item,
			),
		).toEqual(loaded);
		expect(mockFetchRawText).toHaveBeenCalledTimes(1);
	});

	it("keeps filters and loaded items while the control is idle", async () => {
		mockFetchRawText.mockResolvedValue(
			[
				"id,name,unused,colorName,colorHex",
				"1,A,,Blue,#277DA1",
				"2,B,,Blue,#277DA1",
				"3,C,,Blue,#277DA1",
				"4,D,,Red,#FF0000",
			].join("\n"),
		);

		const Activity = (
			React as typeof React & {
				Activity: (props: {
					mode: "visible" | "hidden";
					children?: React.ReactNode;
				}) => React.ReactElement;
			}
		).Activity;

		function Widget() {
			const api = useFilterableDatabase(colorSettings, {
				persistenceKey: "session:elements_select",
				pageSize: 2,
			});
			const [loadedCount, setLoadedCount] = React.useState(
				api.scrollingApi?.items.length ?? 0,
			);

			return React.createElement(
				"div",
				null,
				React.createElement(
					"span",
					{"data-testid": "loading"},
					String(api.loading),
				),
				React.createElement(
					"span",
					{"data-testid": "selection"},
					JSON.stringify(api.selection),
				),
				React.createElement(
					"span",
					{"data-testid": "count"},
					String(loadedCount),
				),
				React.createElement(
					"button",
					{
						type: "button",
						onClick: () => api.toggleFilterValue(0, "#277DA1"),
					},
					"filter",
				),
				React.createElement(
					"button",
					{
						type: "button",
						onClick: () => {
							void api.scrollingApi?.loadMore().then(() => {
								setLoadedCount(
									api.scrollingApi?.items.length ?? 0,
								);
							});
						},
					},
					"more",
				),
			);
		}

		function Harness({idle}: {idle: boolean}) {
			return React.createElement(
				Activity,
				{mode: idle ? "hidden" : "visible"},
				React.createElement(Widget),
			);
		}

		const view = render(React.createElement(Harness, {idle: false}));

		await waitFor(() => {
			expect(screen.getByTestId("loading").textContent).toBe("false");
		});

		act(() => {
			screen.getByText("filter").click();
		});
		await act(async () => {
			screen.getByText("more").click();
			await Promise.resolve();
		});

		await waitFor(() => {
			expect(
				Number(screen.getByTestId("count").textContent),
			).toBeGreaterThan(2);
		});

		const selection = screen.getByTestId("selection").textContent;
		const count = screen.getByTestId("count").textContent;
		view.rerender(React.createElement(Harness, {idle: true}));
		view.rerender(React.createElement(Harness, {idle: false}));

		expect(screen.getByTestId("loading").textContent).toBe("false");
		expect(screen.getByTestId("selection").textContent).toBe(selection);
		expect(screen.getByTestId("count").textContent).toBe(count);
		expect(mockFetchRawText).toHaveBeenCalledTimes(1);
	});

	it("commits a pending text filter when the control is hidden", async () => {
		const {result, unmount} = renderHook(() =>
			useFilterableDatabase(
				{
					...colorSettings,
					filters: [{column: 1, type: "text"}],
				},
				{persistenceKey: "session:elements_select"},
			),
		);

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		act(() => {
			result.current.setFilterText(0, "Angel");
		});
		unmount();

		const restored = renderHook(() =>
			useFilterableDatabase(
				{
					...colorSettings,
					filters: [{column: 1, type: "text"}],
				},
				{persistenceKey: "session:elements_select"},
			),
		);

		expect(restored.result.current.selection).toEqual({0: ["Angel"]});
	});

	const fourRows = [
		"id,name,unused,colorName,colorHex",
		"1,A,,Blue,#277DA1",
		"2,B,,Blue,#277DA1",
		"3,C,,Blue,#277DA1",
		"4,D,,Red,#FF0000",
		"5,E,,Blue,#277DA1",
	].join("\n");

	async function filterAndLoadMore(
		result: {current: ReturnType<typeof useFilterableDatabase>},
		filter = true,
	) {
		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});
		if (filter) {
			act(() => {
				result.current.toggleFilterValue(0, "#277DA1");
			});
		}
		await act(async () => {
			await result.current.scrollingApi?.loadMore();
		});
		return result.current.scrollingApi?.items.map((entry) => entry.item);
	}

	it("fetches an export source again on remount but keeps the view", async () => {
		mockFetchRawText.mockResolvedValue(fourRows);
		const exportSettings = {
			...colorSettings,
			dataSource: {export: {name: "catalog", sessionId: "session"}},
		};
		const options = {
			persistenceKey: "session:elements_select",
			pageSize: 2,
		};

		const first = renderHook(() =>
			useFilterableDatabase(exportSettings, options),
		);
		const loaded = await filterAndLoadMore(first.result);
		expect(loaded).toHaveLength(4);
		first.unmount();

		// The export changed with the last computation: one more blue row.
		mockFetchRawText.mockResolvedValue(`${fourRows}\n6,F,,Blue,#277DA1`);
		const second = renderHook(() =>
			useFilterableDatabase(exportSettings, options),
		);
		expect(second.result.current.loading).toBe(true);
		await waitFor(() => {
			expect(second.result.current.loading).toBe(false);
		});

		expect(mockFetchRawText).toHaveBeenCalledTimes(2);
		expect(second.result.current.selection).toEqual({0: ["#277DA1"]});
		expect(second.result.current.scrollingApi?.items).toHaveLength(4);
		expect(second.result.current.scrollingApi?.hasNextPage).toBe(true);
	});

	it("does not reapply an unchanged itemData patch after a remount", async () => {
		mockFetchRawText.mockResolvedValue(fourRows);
		const options = {
			persistenceKey: "session:elements_select",
			pageSize: 2,
			itemData: {"1": {tooltip: "First"}},
		};

		const first = renderHook(() =>
			useFilterableDatabase(colorSettings, options),
		);
		const loaded = await filterAndLoadMore(first.result);
		first.unmount();

		const second = renderHook(() =>
			useFilterableDatabase(colorSettings, options),
		);
		expect(
			second.result.current.scrollingApi?.items.map(
				(entry) => entry.item,
			),
		).toEqual(loaded);
		expect(second.result.current.scrollingApi?.items[0].data).toMatchObject(
			{tooltip: "First"},
		);
	});

	it("forgets the view when the session is removed", async () => {
		mockFetchRawText.mockResolvedValue(fourRows);
		const options = {
			persistenceKey: "session:elements_select",
			pageSize: 2,
		};

		const first = renderHook(() =>
			useFilterableDatabase(colorSettings, options),
		);
		await filterAndLoadMore(first.result);
		first.unmount();

		act(() => {
			useFilterableDatabaseStateStore
				.getState()
				.removeNamespace("session");
		});

		const second = renderHook(() =>
			useFilterableDatabase(colorSettings, options),
		);
		expect(second.result.current.loading).toBe(true);
		await waitFor(() => {
			expect(second.result.current.loading).toBe(false);
		});
		expect(second.result.current.selection).toEqual({});
		expect(second.result.current.scrollingApi?.items).toHaveLength(2);
		expect(mockFetchRawText).toHaveBeenCalledTimes(2);
	});

	it("ignores saves from a control that unmounts after its session was removed", async () => {
		mockFetchRawText.mockResolvedValue(fourRows);
		const persistenceKey = "session:elements_select";
		const options = {persistenceKey, pageSize: 2};

		const first = renderHook(() =>
			useFilterableDatabase(colorSettings, options),
		);
		await filterAndLoadMore(first.result);

		// The session goes first; its controls unmount afterwards.
		act(() => {
			useFilterableDatabaseStateStore
				.getState()
				.removeNamespace("session");
		});
		first.unmount();
		expect(
			useFilterableDatabaseStateStore.getState().views[persistenceKey],
		).toBeUndefined();

		// Added back: saves count again.
		act(() => {
			useFilterableDatabaseStateStore.getState().openNamespace("session");
		});
		const second = renderHook(() =>
			useFilterableDatabase(colorSettings, options),
		);
		await waitFor(() => {
			expect(second.result.current.loading).toBe(false);
		});
		expect(second.result.current.selection).toEqual({});
		expect(second.result.current.scrollingApi?.items).toHaveLength(2);
		act(() => {
			second.result.current.toggleFilterValue(0, "#277DA1");
		});
		expect(
			useFilterableDatabaseStateStore.getState().views[persistenceKey]
				?.selection,
		).toEqual({0: ["#277DA1"]});
	});

	it("restores the applied search terms, not anchors plus field text", async () => {
		mockFetchRawText.mockResolvedValue(fourRows);
		const persistenceKey = "session:elements_select";
		// An anchor was added while "2" was still in the field: the list
		// applied only the anchor.
		useFilterableDatabaseStateStore
			.getState()
			.saveView(
				persistenceKey,
				filterableDatabaseSettingsKey(colorSettings),
				{
					searchText: "2",
					searchAnchors: ["1"],
					appliedSearchTerms: ["1"],
				},
			);

		const view = renderHook(() =>
			useFilterableDatabase(colorSettings, {persistenceKey, pageSize: 2}),
		);
		await waitFor(() => {
			expect(view.result.current.loading).toBe(false);
		});

		expect(
			view.result.current.scrollingApi?.items.map((entry) => entry.item),
		).toEqual(["1"]);
	});

	it("starts a changed database definition from its own view", async () => {
		mockFetchRawText.mockResolvedValue(fourRows);
		const persistenceKey = "session:elements_select";
		const changedSettings = {
			...colorSettings,
			filters: [{...colorSettings.filters[0], label: "Colour"}],
		};

		const view = renderHook(
			({settings}) =>
				useFilterableDatabase(settings, {persistenceKey, pageSize: 2}),
			{initialProps: {settings: colorSettings}},
		);
		await filterAndLoadMore(view.result);

		view.rerender({settings: changedSettings});
		await waitFor(() => {
			expect(view.result.current.viewVersion).toBe(2);
		});
		expect(view.result.current.selection).toEqual({});
		expect(view.result.current.scrollingApi?.items).toHaveLength(2);
		view.unmount();

		const saved =
			useFilterableDatabaseStateStore.getState().views[persistenceKey];
		expect(saved.settingsKey).toBe(
			filterableDatabaseSettingsKey(changedSettings),
		);
		expect(saved.loadedCount).toBe(2);
		expect(saved.selection).toEqual({});
	});

	it.each([
		[
			"cancelled",
			() => new Promise<string>(() => undefined), // never settles
		],
		["failed", () => Promise.reject(new Error("offline"))],
	])(
		"shows the list again when a %s definition change is reverted",
		async (_case, nextFetch) => {
			mockFetchRawText.mockResolvedValue(fourRows);
			const persistenceKey = "session:elements_select";
			const changedSettings = {
				...colorSettings,
				filters: [{...colorSettings.filters[0], label: "Colour"}],
			};

			const view = renderHook(
				({settings}) =>
					useFilterableDatabase(settings, {
						persistenceKey,
						pageSize: 2,
					}),
				{initialProps: {settings: colorSettings}},
			);
			await filterAndLoadMore(view.result);

			mockFetchRawText.mockImplementationOnce(nextFetch);
			view.rerender({settings: changedSettings});
			await waitFor(() => {
				expect(
					view.result.current.loading || !!view.result.current.error,
				).toBe(true);
			});

			view.rerender({settings: colorSettings});
			await waitFor(() => {
				expect(view.result.current.loading).toBe(false);
			});
			expect(view.result.current.error).toBeUndefined();
			expect(view.result.current.selection).toEqual({0: ["#277DA1"]});
			expect(
				view.result.current.scrollingApi?.items.length,
			).toBeGreaterThan(0);
		},
	);

	it("keeps writes of the old list out of a changed definition while it loads", async () => {
		mockFetchRawText.mockResolvedValue(fourRows);
		const persistenceKey = "session:elements_select";
		const textSettings = {
			...colorSettings,
			filters: [{column: 1, type: "text" as const}],
		};
		const changedSettings = {
			...textSettings,
			filters: [{column: 1, type: "text" as const, label: "Name"}],
		};

		const view = renderHook(
			({settings}) =>
				useFilterableDatabase(settings, {persistenceKey, pageSize: 2}),
			{initialProps: {settings: textSettings}},
		);
		await waitFor(() => {
			expect(view.result.current.loading).toBe(false);
		});

		// A text filter still waits for its debounce when the definition changes.
		act(() => {
			view.result.current.setFilterText(0, "A");
		});
		let resolveFetch: (raw: string) => void = () => undefined;
		mockFetchRawText.mockImplementationOnce(
			() => new Promise<string>((resolve) => (resolveFetch = resolve)),
		);
		view.rerender({settings: changedSettings});

		// While the new definition loads, the old list keeps writing.
		act(() => {
			view.result.current.listPersistence?.save({
				scrollTop: 99,
				searchText: "old",
			});
			view.result.current.setFilterValue(0, ["B"]);
		});
		await act(async () => {
			// Past the text filter debounce (300 ms).
			await new Promise((resolve) => setTimeout(resolve, 400));
		});
		await act(async () => {
			resolveFetch(fourRows);
		});
		await waitFor(() => {
			expect(view.result.current.viewVersion).toBe(2);
		});

		expect(view.result.current.selection).toEqual({});
		const saved =
			useFilterableDatabaseStateStore.getState().views[persistenceKey];
		expect(saved?.settingsKey).not.toBe(
			filterableDatabaseSettingsKey(changedSettings),
		);
		expect(view.result.current.listPersistence?.read()).toBeUndefined();
	});
});
