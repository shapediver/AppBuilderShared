/**
 * @jest-environment jsdom
 */
import type {
	IScrollingApi,
	IScrollingApiItemTypeSelect,
} from "@AppBuilderLib/features/ecommerce/config/scrollingapi";
import {MantineProvider} from "@mantine/core";
import {act, fireEvent, render, screen} from "@testing-library/react";
import type {FilterableDatabaseListPersistence} from "../../../model/filterableDatabase/useFilterableDatabase";
import type {FilterableDatabaseViewState} from "../../../model/filterableDatabase/useFilterableDatabaseStateStore";
import SelectComponentAsync from "../SelectComponentAsync";

function fakeScrollingApi(): IScrollingApi<IScrollingApiItemTypeSelect> {
	return {
		loading: false,
		error: undefined,
		hasNextPage: false,
		loadMore: jest.fn(async () => undefined),
		setSearchTerms: jest.fn(async () => undefined),
		setPageSize: jest.fn(async () => undefined),
		items: [{item: "a", data: {displayname: "A"}}],
		reset: jest.fn(),
		resetState: 0,
	};
}

/** In-memory stand-in for the filterable database store. */
function fakePersistence(): FilterableDatabaseListPersistence {
	let view: FilterableDatabaseViewState = {
		settingsKey: "k",
		selection: {},
		loadedCount: 0,
		searchText: "",
		searchAnchors: [],
		scrollTop: 0,
	};

	return {
		read: () => view,
		save: (patch) => {
			view = {...view, ...patch};
		},
	};
}

function renderGrid(
	api: IScrollingApi<IScrollingApiItemTypeSelect>,
	persistence: FilterableDatabaseListPersistence,
) {
	return render(
		<MantineProvider>
			<SelectComponentAsync
				type="grid"
				scrollingApi={api}
				persistence={persistence}
				value={undefined}
				onChange={jest.fn()}
				searchable
			/>
		</MantineProvider>,
	);
}

describe("SelectComponentAsync search persistence", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("restores the search text after a remount", () => {
		const api = fakeScrollingApi();
		const persistence = fakePersistence();

		const first = renderGrid(api, persistence);
		fireEvent.change(screen.getByPlaceholderText("Search"), {
			target: {value: "oak"},
		});
		first.unmount();

		renderGrid(api, persistence);

		expect(
			(screen.getByPlaceholderText("Search") as HTMLInputElement).value,
		).toBe("oak");
	});

	it("applies a search that was still debouncing when the list unmounted", () => {
		const api = fakeScrollingApi();

		const view = renderGrid(api, fakePersistence());
		fireEvent.change(screen.getByPlaceholderText("Search"), {
			target: {value: "oak"},
		});
		expect(api.setSearchTerms).not.toHaveBeenCalled();
		view.unmount();

		expect(api.setSearchTerms).toHaveBeenCalledWith(["oak"]);
		act(() => {
			jest.runAllTimers();
		});
		expect(api.setSearchTerms).toHaveBeenCalledTimes(1);
	});
});
