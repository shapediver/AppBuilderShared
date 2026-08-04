/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {fireEvent, render, screen} from "@testing-library/react";
import type React from "react";
import AppBuilderToolbarPopoverButton from "../AppBuilderToolbarPopoverButton";

jest.mock("../AppBuilderToolbarPopoverContent", () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock(
	"@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton",
	() => ({
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
			<button aria-label={label} disabled={disabled} onClick={onClick} />
		),
	}),
);

describe("AppBuilderToolbarPopoverButton", () => {
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
						buttonsDisabled: false,
						executing: false,
						hasPendingChanges: false,
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
