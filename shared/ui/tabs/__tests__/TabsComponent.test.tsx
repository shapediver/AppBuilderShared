/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {MantineProvider} from "@mantine/core";
import {fireEvent, render, screen} from "@testing-library/react";
import TabsComponent from "../TabsComponent";

describe("TabsComponent", () => {
	it("renders the first tab content when defaultValue falls back to the first tab value", () => {
		render(
			<MantineProvider>
				<TabsComponent
					defaultValue=""
					tabs={[
						{
							name: "",
							children: [<div key="first">First content</div>],
						},
						{
							name: "Second",
							children: [<div key="second">Second content</div>],
						},
					]}
				/>
			</MantineProvider>,
		);

		expect(screen.getByText("First content")).toBeTruthy();
	});

	it("keeps fallback tab content mounted after switching away and back", () => {
		render(
			<MantineProvider>
				<TabsComponent
					defaultValue=""
					tabs={[
						{
							name: "",
							children: [<div key="first">First content</div>],
						},
						{
							name: "Second",
							children: [<div key="second">Second content</div>],
						},
					]}
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("tab", {name: "Second"}));
		expect(screen.getByText("Second content")).toBeTruthy();
		expect(screen.getByText("First content")).toBeTruthy();

		fireEvent.click(screen.getAllByRole("tab")[0]);
		expect(screen.getByText("First content")).toBeTruthy();
		expect(screen.getByText("Second content")).toBeTruthy();
	});

	it("renders nothing when there are no tabs", () => {
		const {container} = render(
			<MantineProvider>
				<TabsComponent defaultValue="" tabs={[]} />
			</MantineProvider>,
		);
		expect(container.querySelector("[role='tablist']")).toBeNull();
	});

	it("notifies the parent of the selected tab index", () => {
		const onActiveTabChange = jest.fn();
		render(
			<MantineProvider>
				<TabsComponent
					defaultValue="one"
					onActiveTabChange={onActiveTabChange}
					tabs={[
						{
							name: "one",
							children: [<div key="one">One</div>],
						},
						{
							name: "two",
							children: [<div key="two">Two</div>],
						},
					]}
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("tab", {name: "two"}));
		expect(onActiveTabChange).toHaveBeenCalledWith(1);
	});

	it("selects the tab whose value matches defaultValue even when the name differs", () => {
		render(
			<MantineProvider>
				<TabsComponent
					defaultValue="second-id"
					tabs={[
						{
							value: "first-id",
							name: "First",
							children: [<div key="first">First content</div>],
						},
						{
							value: "second-id",
							name: "Second",
							children: [<div key="second">Second content</div>],
						},
					]}
				/>
			</MantineProvider>,
		);

		expect(screen.getByText("Second content")).toBeTruthy();
		expect(screen.queryByText("First content")).toBeNull();
	});

	it("falls back to the first tab value when defaultValue is missing", () => {
		render(
			<MantineProvider>
				<TabsComponent
					defaultValue="missing"
					tabs={[
						{
							value: "alpha",
							name: "Alpha",
							children: [<div key="alpha">Alpha content</div>],
						},
						{
							value: "beta",
							name: "Beta",
							children: [<div key="beta">Beta content</div>],
						},
					]}
				/>
			</MantineProvider>,
		);

		expect(screen.getByText("Alpha content")).toBeTruthy();
		expect(screen.queryByText("Beta content")).toBeNull();
	});

	it("applies sticky styles to the tab list when stickyTabs is true", () => {
		render(
			<MantineProvider>
				<TabsComponent
					defaultValue="one"
					stickyTabs
					tabs={[
						{
							name: "one",
							children: [<div key="one">One</div>],
						},
					]}
				/>
			</MantineProvider>,
		);

		const tabList = screen.getByRole("tablist");
		expect(tabList.style.position).toBe("sticky");
		expect(tabList.style.top).toBe("0px");
		expect(tabList.style.zIndex).toBe("5");
	});

	it("does not stick the tab list by default", () => {
		render(
			<MantineProvider>
				<TabsComponent
					defaultValue="one"
					tabs={[
						{
							name: "one",
							children: [<div key="one">One</div>],
						},
					]}
				/>
			</MantineProvider>,
		);

		expect(screen.getByRole("tablist").style.position).not.toBe("sticky");
	});

	it("shows the tab tooltip label on hover", async () => {
		render(
			<MantineProvider>
				<TabsComponent
					defaultValue="one"
					tabs={[
						{
							name: "one",
							tooltip: "Hint for one",
							children: [<div key="one">One</div>],
						},
					]}
				/>
			</MantineProvider>,
		);

		fireEvent.mouseEnter(screen.getByRole("tab", {name: "one"}));
		expect((await screen.findByRole("tooltip")).textContent).toBe(
			"Hint for one",
		);
	});
});
