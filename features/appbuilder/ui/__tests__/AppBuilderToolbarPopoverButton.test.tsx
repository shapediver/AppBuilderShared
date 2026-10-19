/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type React from "react";
import AppBuilderToolbarPopoverButton from "../AppBuilderToolbarPopoverButton";

jest.mock("../AppBuilderToolbarPopoverContent", () => {
	const ReactActual = jest.requireActual("react") as typeof import("react");

	return {
		__esModule: true,
		default: ({onActionActivate}: {onActionActivate?: () => void}) => {
			const ref = ReactActual.useRef<HTMLButtonElement>(null);
			ReactActual.useEffect(() => {
				const node = ref.current;
				node?.setAttribute("data-live", "true");
				return () => node?.setAttribute("data-live", "false");
			}, []);
			return (
				<button ref={ref} onClick={onActionActivate}>
					Activate menu action
				</button>
			);
		},
	};
});

jest.mock(
	"@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton",
	() => {
		const actual = jest.requireActual(
			"@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton",
		) as typeof import("@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton");

		return {
			...actual,
			__esModule: true,
			default: ({
				label,
				disabled,
				onClick,
			}: {
				label: string;
				disabled?: boolean;
				onClick?: React.MouseEventHandler<HTMLButtonElement>;
			}) => (
				<button
					aria-label={label}
					disabled={disabled}
					onClick={onClick}
				/>
			),
		};
	},
);

describe("AppBuilderToolbarPopoverButton", () => {
	it("closes action menus and idles their content", async () => {
		const onPopoverOpenChange = jest.fn();
		const {rerender} = render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "actions",
						type: "menu",
						label: "Actions",
						props: {
							sections: [
								{
									id: "section",
									items: [
										{
											id: "action",
											type: "action",
											label: "Action",
											props: {
												definition: {
													type: "importModelState",
													props: {},
												},
											},
										},
									],
								},
							],
						},
					}}
					buttonRenderContext={{
						namespace: "namespace",
						executing: false,
						fullscreenId: "fullscreen-root",
					}}
					popoverId="actions"
					openedPopoverId="actions"
					onPopoverOpenChange={onPopoverOpenChange}
				/>
			</MantineProvider>,
		);

		fireEvent.click(
			screen.getByRole("button", {name: "Activate menu action"}),
		);
		expect(onPopoverOpenChange).toHaveBeenCalledWith("actions", false);

		rerender(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "actions",
						type: "menu",
						label: "Actions",
						props: {
							sections: [
								{
									id: "section",
									items: [
										{
											id: "action",
											type: "action",
											label: "Action",
											props: {
												definition: {
													type: "importModelState",
													props: {},
												},
											},
										},
									],
								},
							],
						},
					}}
					buttonRenderContext={{
						namespace: "namespace",
						executing: false,
						fullscreenId: "fullscreen-root",
					}}
					popoverId="actions"
					onPopoverOpenChange={onPopoverOpenChange}
				/>
			</MantineProvider>,
		);

		await waitFor(() => {
			const menuAction = screen.getByRole("button", {
				name: "Activate menu action",
				hidden: true,
			});
			expect(menuAction.getAttribute("data-live")).toBe("false");
		});
	});

	it("does not close a popover while an interaction request is active", () => {
		const onPopoverOpenChange = jest.fn();

		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "drawing",
						type: "parameter",
						label: "Drawing",
						props: {name: "Drawing"},
					}}
					buttonRenderContext={{
						namespace: "namespace",
						executing: false,
						fullscreenId: "fullscreen-root",
					}}
					popoverId="drawing"
					openedPopoverId="drawing"
					onPopoverOpenChange={onPopoverOpenChange}
					popoverDismissalBlocked
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("button", {name: "Drawing"}));

		expect(onPopoverOpenChange).not.toHaveBeenCalled();
	});
});
