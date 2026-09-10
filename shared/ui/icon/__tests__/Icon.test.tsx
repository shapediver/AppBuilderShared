/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {render} from "@testing-library/react";
import Icon from "../Icon";

describe("Icon", () => {
	it("renders an img for image URLs including SVG", () => {
		const {container} = render(
			<MantineProvider>
				<Icon iconType="https://example.com/logo.svg" />
			</MantineProvider>,
		);

		const img = container.querySelector("img");
		expect(img).toBeTruthy();
		expect(img?.getAttribute("src")).toBe("https://example.com/logo.svg");
	});

	it("renders an img for data URIs and local paths", () => {
		const {rerender, container} = render(
			<MantineProvider>
				<Icon iconType="data:image/png;base64,abc" />
			</MantineProvider>,
		);

		expect(container.querySelector("img")?.getAttribute("src")).toBe(
			"data:image/png;base64,abc",
		);

		rerender(
			<MantineProvider>
				<Icon iconType="/test.svg" />
			</MantineProvider>,
		);

		expect(container.querySelector("img")?.getAttribute("src")).toBe(
			"/test.svg",
		);
	});

	it("does not render an img for Iconify names", () => {
		const {container} = render(
			<MantineProvider>
				<Icon iconType="tabler:check" />
			</MantineProvider>,
		);

		expect(container.querySelector("img")).toBeNull();
	});
});
