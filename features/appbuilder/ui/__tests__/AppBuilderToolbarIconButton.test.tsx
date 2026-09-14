/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {render, screen} from "@testing-library/react";
import AppBuilderToolbarIconButton from "../AppBuilderToolbarIconButton";

describe("AppBuilderToolbarIconButton", () => {
	it("renders a custom image URL instead of fallback text", () => {
		const {container} = render(
			<MantineProvider>
				<AppBuilderToolbarIconButton
					label="Brand"
					iconType="https://example.com/brand.svg"
				/>
			</MantineProvider>,
		);

		expect(screen.queryByText("https://example.com/brand.svg")).toBeNull();
		expect(container.querySelector("img")?.getAttribute("src")).toBe(
			"https://example.com/brand.svg",
		);
	});

	it("still shows non-icon strings as text", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarIconButton
					label="Text icon"
					iconType="SD_AB"
				/>
			</MantineProvider>,
		);

		expect(screen.getByText("AB")).toBeTruthy();
	});
});
