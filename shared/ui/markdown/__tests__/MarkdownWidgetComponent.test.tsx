/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {render, screen} from "@testing-library/react";
import * as fs from "node:fs";
import * as path from "node:path";
import MarkdownWidgetComponent, {
	MarkdownWidgetComponentProps,
} from "../MarkdownWidgetComponent";

describe("MarkdownWidgetComponent", () => {
	it("still default-exports a renderer from the widget path", () => {
		render(
			<MantineProvider>
				<MarkdownWidgetComponent>widget body</MarkdownWidgetComponent>
			</MantineProvider>,
		);

		expect(screen.getByText("widget body")).toBeTruthy();
	});

	it("keeps MarkdownWidgetComponentProps as a theme helper", () => {
		const component = MarkdownWidgetComponentProps({
			anchorTarget: "_self",
		});

		expect(component.defaultProps).toEqual({anchorTarget: "_self"});
	});

	it("renders via the inner Markdown module", () => {
		const source = fs.readFileSync(
			path.join(__dirname, "../MarkdownWidgetComponent.tsx"),
			"utf8",
		);

		expect(source).toMatch(/from ["']\.\/Markdown["']/);
	});
});
