/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {render, screen} from "@testing-library/react";
import AppBuilderToolbarButton from "../AppBuilderToolbarButton";

jest.mock("../AppBuilderActionFromType", () => ({
	AppBuilderActionFromType: jest.fn(),
}));

jest.mock("../AppBuilderToolbarPopoverContent", () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock("@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton", () => ({
	__esModule: true,
	default: ({label, disabled}: {label: string; disabled?: boolean}) => (
		<button aria-label={label} disabled={disabled} />
	),
}));

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
			(screen.getByRole("button", {
				name: "Download result",
			}) as HTMLButtonElement).disabled,
		).toBe(true);
	});
});
