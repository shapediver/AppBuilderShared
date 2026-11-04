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
});
