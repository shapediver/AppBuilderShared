/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {fireEvent, render, screen} from "@testing-library/react";
import type React from "react";
import AppBuilderToolbarButton from "../AppBuilderToolbarButton";

jest.mock("../AppBuilderActionFromType", () => ({
	AppBuilderActionFromType: jest.fn(),
}));

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

jest.mock("@AppBuilderLib/entities/export/model/useExports", () => ({
	useExports: () => [
		{
			definition: {
				hidden: false,
			},
		},
	],
}));

jest.mock("@AppBuilderLib/entities/export/model/useExecuteExport", () => ({
	useExecuteExport: () => jest.fn(),
}));

describe("AppBuilderToolbarButton", () => {
	it("disables export toolbar buttons while toolbar actions are disabled", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarButton
					toolbarItem={{
						type: "export",
						props: {name: "Download result"},
					}}
					buttonRenderContext={{
						namespace: "namespace",
						buttonsDisabled: true,
						executing: false,
						hasPendingChanges: false,
						fullscreenId: "fullscreen-root",
					}}
				/>
			</MantineProvider>,
		);

		expect(
			(
				screen.getByRole("button", {
					name: "Download result",
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
	});

	it("does not close a popover while an interaction request is active", () => {
		const onPopoverOpenChange = jest.fn();

		render(
			<MantineProvider>
				<AppBuilderToolbarButton
					toolbarItem={{
						type: "parameter",
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
					hasActiveInteractionRequest
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("button", {name: "Drawing"}));

		expect(onPopoverOpenChange).not.toHaveBeenCalled();
	});
});
