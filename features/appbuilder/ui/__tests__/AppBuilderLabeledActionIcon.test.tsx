/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import "@testing-library/jest-dom";
import {render, screen} from "@testing-library/react";
import type {ReactElement} from "react";
import {AppBuilderLabeledActionIcon} from "../AppBuilderToolbarIconButton";
import AppBuilderToolbarMenuCheckbox from "../AppBuilderToolbarMenuCheckbox";

jest.mock("@AppBuilderLib/shared/ui/icon/Icon", () => ({
	__esModule: true,
	default: ({iconType}: {iconType: string}) => (
		<span data-icon={String(iconType)} />
	),
}));

function renderThemed(ui: ReactElement, labelSide?: "bottom") {
	return render(
		<MantineProvider
			theme={{
				components: labelSide
					? {
							AppBuilderToolbarIconButton: {
								defaultProps: {labelSide, labelAlign: "center"},
							},
						}
					: {},
			}}
		>
			{ui}
		</MantineProvider>,
	);
}

describe("AppBuilderLabeledActionIcon", () => {
	it("keeps the label as the accessible name when labelSide is unset", () => {
		renderThemed(
			<AppBuilderLabeledActionIcon
				label="Reset selection"
				tooltipLabel="Clear the current selection"
				icon={<span data-icon="trash" />}
			/>,
		);

		expect(
			screen.getByRole("button", {name: "Reset selection"}),
		).toBeInTheDocument();
		expect(screen.queryByText("Reset selection")).not.toBeInTheDocument();
	});

	it("shows the label as a caption when the toolbar icon theme sets labelSide", () => {
		renderThemed(
			<AppBuilderLabeledActionIcon
				label="Reset selection"
				tooltipLabel="Clear the current selection"
				icon={<span data-icon="trash" />}
			/>,
			"bottom",
		);

		expect(screen.getByText("Reset selection")).toBeInTheDocument();
		expect(screen.getByRole("button")).not.toHaveAttribute("aria-label");
	});
});

describe("AppBuilderToolbarMenuCheckbox trailing action", () => {
	const trailingAction = {
		label: "Reset selection",
		tooltip: "Clear the current selection",
		icon: "tabler:trash" as const,
		execute: jest.fn(),
	};

	it("does not paint the trailing label without labelSide", () => {
		renderThemed(
			<AppBuilderToolbarMenuCheckbox
				label="Seat"
				checked={false}
				onChange={() => undefined}
				trailingAction={trailingAction}
			/>,
		);

		expect(screen.getByText("Seat")).toBeInTheDocument();
		expect(screen.queryByText("Reset selection")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", {name: "Reset selection"}),
		).toBeInTheDocument();
	});

	it("paints the trailing label when labelSide is set", () => {
		renderThemed(
			<AppBuilderToolbarMenuCheckbox
				label="Seat"
				checked={false}
				onChange={() => undefined}
				trailingAction={trailingAction}
			/>,
			"bottom",
		);

		expect(screen.getByText("Reset selection")).toBeInTheDocument();
	});
});
