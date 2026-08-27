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

		fireEvent.click(screen.getAllByRole("tab")[0]);
		expect(screen.getByText("First content")).toBeTruthy();
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
});
