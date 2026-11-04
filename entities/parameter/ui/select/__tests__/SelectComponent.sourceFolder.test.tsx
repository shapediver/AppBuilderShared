/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {act, fireEvent, render, screen} from "@testing-library/react";
import {useScrollingApiStore} from "../../../model/useScrollingApiStore";
import SelectComponent from "../SelectComponent";

const source = "graphics";

function renderSelect() {
	return render(
		<MantineProvider>
			<SelectComponent
				type="grid"
				source={source}
				items={[]}
				value={null}
				onChange={jest.fn()}
			/>
		</MantineProvider>,
	);
}

/**
 * SS-10229: a source card list (artwork folders) must reopen in the folder
 * it left. Folders are `search:` items. Closing the panel used to drop the
 * scrolling API, and the next open asked the parent for the root folder.
 */
describe("SelectComponent source folder", () => {
	beforeAll(() => {
		class FakeIntersectionObserver {
			observe() {}
			unobserve() {}
			disconnect() {}
			takeRecords() {
				return [];
			}
		}

		Object.defineProperty(globalThis, "IntersectionObserver", {
			writable: true,
			configurable: true,
			value: FakeIntersectionObserver,
		});
	});

	beforeEach(() => {
		useScrollingApiStore.setState({
			scrollingApisSelect: {},
			scrollingApisInitialized: [],
			listViews: {},
		});
	});

	it("reopens in the folder that was open when the control unmounted", async () => {
		const api = useScrollingApiStore
			.getState()
			.addScrollingApiSelect(source);
		act(() => {
			useScrollingApiStore.setState((state) => ({
				scrollingApisSelect: {
					...state.scrollingApisSelect,
					[source]: {
						...api,
						items: [
							{
								item: "search:Art",
								data: {displayname: "Art"},
							},
						],
						hasNextPage: false,
						loading: false,
						resetState: 1,
					},
				},
			}));
		});

		const first = renderSelect();
		fireEvent.click(await screen.findByText("Art"));
		expect(await screen.findByText("Art")).toBeTruthy();

		const kept =
			useScrollingApiStore.getState().scrollingApisSelect[source];
		first.unmount();

		renderSelect();
		expect(await screen.findByText("Art")).toBeTruthy();
		expect(
			useScrollingApiStore.getState().scrollingApisSelect[source],
		).toBe(kept);
		expect(
			useScrollingApiStore.getState().listViews[source]?.searchAnchors,
		).toEqual(["Art"]);
		expect(screen.queryByText("Option 000")).toBeNull();
	});

	it("reads the new source's folder when the source changes", async () => {
		const graphics = useScrollingApiStore
			.getState()
			.addScrollingApiSelect("graphics");
		const borders = useScrollingApiStore
			.getState()
			.addScrollingApiSelect("borders");
		act(() => {
			useScrollingApiStore.setState((state) => ({
				scrollingApisSelect: {
					...state.scrollingApisSelect,
					graphics: {
						...graphics,
						items: [
							{
								item: "search:Art",
								data: {displayname: "Art"},
							},
						],
						hasNextPage: false,
						loading: false,
						resetState: 1,
					},
					borders: {
						...borders,
						items: [
							{
								item: "Panel",
								data: {displayname: "Panel"},
							},
						],
						hasNextPage: false,
						loading: false,
						resetState: 1,
					},
				},
			}));
		});
		useScrollingApiStore.getState().saveListView("borders", {
			searchText: "",
			searchAnchors: ["Edge"],
			appliedSearchTerms: ["Edge"],
			scrollTop: 0,
		});

		const {rerender} = render(
			<MantineProvider>
				<SelectComponent
					type="grid"
					source="graphics"
					items={[]}
					value={null}
					onChange={jest.fn()}
				/>
			</MantineProvider>,
		);
		fireEvent.click(await screen.findByText("Art"));
		expect(
			useScrollingApiStore.getState().listViews.graphics?.searchAnchors,
		).toEqual(["Art"]);

		rerender(
			<MantineProvider>
				<SelectComponent
					type="grid"
					source="borders"
					items={[]}
					value={null}
					onChange={jest.fn()}
				/>
			</MantineProvider>,
		);

		expect(await screen.findByText("Panel")).toBeTruthy();
		expect(screen.getByText("Edge")).toBeTruthy();
		expect(screen.queryByText("Art")).toBeNull();
		expect(
			useScrollingApiStore.getState().listViews.borders?.searchAnchors,
		).toEqual(["Edge"]);
		expect(
			useScrollingApiStore.getState().listViews.graphics?.searchAnchors,
		).toEqual(["Art"]);
	});
});
