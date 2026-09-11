/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {render, screen} from "@testing-library/react";
import SelectImageDropDownComponent from "../SelectImageDropDownComponent";

function renderImageDropDown(
	itemData: Record<
		string,
		{displayname?: string; imageUrl?: string; description?: string}
	>,
	value = "choice-a",
) {
	return render(
		<MantineProvider>
			<SelectImageDropDownComponent
				value={value}
				onChange={jest.fn()}
				items={["choice-a"]}
				itemData={itemData}
			/>
		</MantineProvider>,
	);
}

describe("SelectImageDropDownComponent", () => {
	it("shows only the image when displayname is empty", () => {
		renderImageDropDown({
			"choice-a": {
				displayname: "",
				imageUrl: "https://example.com/stone.png",
			},
		});

		expect(
			document.querySelectorAll(
				'img[src="https://example.com/stone.png"]',
			).length,
		).toBeGreaterThan(0);
		expect(screen.queryAllByText("choice-a")).toHaveLength(0);
		for (const group of document.querySelectorAll(".mantine-Group-root")) {
			expect(group.querySelector("p")).toBeNull();
		}
	});

	it("does not leave a label column when displayname is whitespace", () => {
		renderImageDropDown({
			"choice-a": {
				displayname: " ",
				imageUrl: "https://example.com/stone.png",
			},
		});

		expect(screen.queryAllByText("choice-a")).toHaveLength(0);
		for (const group of document.querySelectorAll(".mantine-Group-root")) {
			expect(group.querySelector("p")).toBeNull();
		}
	});

	it("shows an explicit displayname", () => {
		renderImageDropDown({
			"choice-a": {
				displayname: "Granite",
				imageUrl: "https://example.com/stone.png",
			},
		});

		expect(screen.queryAllByText("Granite").length).toBeGreaterThan(0);
		expect(screen.queryAllByText("choice-a")).toHaveLength(0);
	});

	it("falls back to the choice name when displayname is omitted", () => {
		renderImageDropDown({
			"choice-a": {
				imageUrl: "https://example.com/stone.png",
			},
		});

		expect(screen.queryAllByText("choice-a").length).toBeGreaterThan(0);
	});
});
