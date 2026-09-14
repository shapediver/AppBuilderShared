/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {render, screen} from "@testing-library/react";
import Markdown from "../Markdown";

describe("Markdown", () => {
	it("renders the children string", () => {
		render(
			<MantineProvider>
				<Markdown>Hello world</Markdown>
			</MantineProvider>,
		);

		expect(screen.getByText("Hello world")).toBeTruthy();
	});

	it("accepts onDirectiveWarning and still renders invalid span directives", () => {
		const onDirectiveWarning = jest.fn();

		render(
			<MantineProvider>
				<Markdown onDirectiveWarning={onDirectiveWarning}>
					{":span[still visible]"}
				</Markdown>
			</MantineProvider>,
		);

		expect(screen.getByText(":span[still visible]")).toBeTruthy();
	});
});
