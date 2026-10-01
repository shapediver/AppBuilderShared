/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {render, screen} from "@testing-library/react";
import {useEffect, useRef} from "react";
import AppBuilderAppShellTemplatePage from "../AppBuilderAppShellTemplatePage";

function LiveProbe() {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const node = ref.current;
		node?.setAttribute("data-live", "true");
		return () => node?.setAttribute("data-live", "false");
	}, []);

	return <div ref={ref}>container content</div>;
}

function mockMatchMedia(minWidthMatches: boolean) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: (query: string) =>
			({
				matches: query.includes("min-width") ? minWidthMatches : false,
				media: query,
				addEventListener: () => {},
				removeEventListener: () => {},
				addListener: () => {},
				removeListener: () => {},
				dispatchEvent: () => false,
				onchange: null,
			}) as MediaQueryList,
	});
}

describe("AppBuilderAppShellTemplatePage hidden containers", () => {
	it("keeps navbar containers live on desktop", () => {
		mockMatchMedia(true);

		render(
			<MantineProvider>
				<AppBuilderAppShellTemplatePage left={{node: <LiveProbe />}} />
			</MantineProvider>,
		);

		expect(
			screen.getByText("container content").getAttribute("data-live"),
		).toBe("true");
	});

	it("idles navbar containers while the mobile drawer is closed", () => {
		mockMatchMedia(false);

		render(
			<MantineProvider>
				<AppBuilderAppShellTemplatePage left={{node: <LiveProbe />}} />
			</MantineProvider>,
		);

		const content = screen.getByText("container content", {hidden: true});
		expect(content.getAttribute("data-live")).not.toBe("true");
	});
});
