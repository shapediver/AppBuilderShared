/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import "@testing-library/jest-dom";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import AppBuilderTableWidgetComponent from "../AppBuilderTableWidgetComponent";

// jsdom has no layout, so the virtualizer would render no rows: render all of them.
jest.mock("@tanstack/react-virtual", () => ({
	useVirtualizer: ({count}: {count: number}) => ({
		getVirtualItems: () =>
			Array.from({length: count}, (_, index) => ({
				index,
				start: index * 34,
				end: (index + 1) * 34,
			})),
		getTotalSize: () => count * 34,
	}),
}));

class ResizeObserverStub {
	observe() {}
	disconnect() {}
}

const records = [
	{name: "Oak", height: 20},
	{name: "Birch", height: 12},
	{name: "Maple", height: 15},
];

function renderTable() {
	return render(
		<MantineProvider>
			<AppBuilderTableWidgetComponent
				columns={[
					{
						accessor: "name",
						title: "Name",
						sortable: true,
						searchable: true,
					},
					{accessor: "height", title: "Height", sortable: true},
				]}
				records={records}
			/>
		</MantineProvider>,
	);
}

function columnValues() {
	return screen
		.getAllByRole("row")
		.slice(1)
		.map((row) => row.querySelector("td")?.textContent);
}

describe("AppBuilderTableWidgetComponent", () => {
	beforeAll(() => {
		global.ResizeObserver =
			ResizeObserverStub as unknown as typeof ResizeObserver;
	});

	it("renders headers and all records", () => {
		renderTable();
		expect(screen.getByText("Name")).toBeInTheDocument();
		expect(screen.getByText("Height")).toBeInTheDocument();
		expect(columnValues()).toEqual(["Oak", "Birch", "Maple"]);
	});

	it("sorts by a sortable column when clicking its header", () => {
		renderTable();
		fireEvent.click(screen.getByText("Name"));
		expect(columnValues()).toEqual(["Birch", "Maple", "Oak"]);
		fireEvent.click(screen.getByText(/Name/));
		expect(columnValues()).toEqual(["Oak", "Maple", "Birch"]);
	});

	it("filters records with the fuzzy column search", async () => {
		renderTable();
		fireEvent.change(screen.getByPlaceholderText("Search Name…"), {
			target: {value: "mpl"},
		});
		await waitFor(() => {
			expect(columnValues()).toEqual(["Maple"]);
		});
	});
});
