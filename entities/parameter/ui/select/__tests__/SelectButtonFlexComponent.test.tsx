/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {
	createTheme,
	MantineProvider,
	type ButtonProps,
	type FlexProps,
} from "@mantine/core";
import {fireEvent, render, screen} from "@testing-library/react";
import type {ReactNode} from "react";
import SelectButtonFlexComponent, {
	SelectButtonFlexComponentThemeProps,
} from "../SelectButtonFlexComponent";

jest.mock("@mantine/core", () => {
	const actual =
		jest.requireActual<typeof import("@mantine/core")>("@mantine/core");

	return {
		...actual,
		Button: ({
			children,
			variant,
			color,
			size,
			fullWidth,
			...rest
		}: ButtonProps & {children?: ReactNode}) => (
			<button
				{...rest}
				data-color={color}
				data-full-width={fullWidth ? "true" : undefined}
				data-size={size}
				data-variant={variant}
			>
				{children}
			</button>
		),
		Flex: ({children, gap, wrap, direction, ...rest}: FlexProps) => (
			<div
				{...rest}
				data-testid="sbf-flex"
				data-direction={
					direction == null ? undefined : JSON.stringify(direction)
				}
				data-gap={gap == null ? undefined : String(gap)}
				data-wrap={wrap == null ? undefined : String(wrap)}
			>
				{children}
			</div>
		),
	};
});

describe("SelectButtonFlexComponent", () => {
	it("keeps default layout and protected item behavior", () => {
		render(
			<MantineProvider>
				<SelectButtonFlexComponent
					value="Oak"
					onChange={jest.fn()}
					items={["Oak", "Pine"]}
					itemData={{Oak: {color: "red"}}}
					disabled
					multiselect={false}
				/>
			</MantineProvider>,
		);

		const flex = screen.getByTestId("sbf-flex");
		expect(flex.getAttribute("data-gap")).toBe("xs");
		expect(flex.getAttribute("data-wrap")).toBe("wrap");
		const oak = screen.getByRole("button", {
			name: "Oak",
		}) as HTMLButtonElement;
		expect(oak.getAttribute("data-variant")).toBe("filled");
		expect(oak.getAttribute("data-color")).toBe("red");
		expect(oak.disabled).toBe(true);
		expect(
			(
				screen.getByRole("button", {name: "Pine"}) as HTMLButtonElement
			).getAttribute("data-variant"),
		).toBe("default");
	});

	it("uses direct style props ahead of theme and local defaults", () => {
		// useProps merges each style bag shallowly: a directly passed bag wins
		// over the theme bag for that key (no deep per-field merge).
		const theme = createTheme({
			components: {
				SelectButtonFlexComponent: SelectButtonFlexComponentThemeProps({
					flexProps: {gap: "md"},
					buttonProps: {size: "sm"},
				}),
			},
		});

		render(
			<MantineProvider theme={theme}>
				<SelectButtonFlexComponent
					value="Oak"
					onChange={jest.fn()}
					items={["Oak"]}
					multiselect={false}
					flexProps={{gap: "lg", wrap: "nowrap"}}
					buttonProps={{size: "xl", fullWidth: true}}
				/>
			</MantineProvider>,
		);

		const flex = screen.getByTestId("sbf-flex");
		expect(flex.getAttribute("data-gap")).toBe("lg");
		expect(flex.getAttribute("data-wrap")).toBe("nowrap");
		const oak = screen.getByRole("button", {
			name: "Oak",
		}) as HTMLButtonElement;
		expect(oak.getAttribute("data-size")).toBe("xl");
		expect(oak.getAttribute("data-full-width")).toBe("true");
	});

	it("applies responsive flex direction from theme (SS-9817)", () => {
		const theme = createTheme({
			components: {
				SelectButtonFlexComponent: SelectButtonFlexComponentThemeProps({
					flexProps: {direction: {base: "column", md: "row"}},
				}),
			},
		});

		render(
			<MantineProvider theme={theme}>
				<SelectButtonFlexComponent
					value="Oak"
					onChange={jest.fn()}
					items={["Oak"]}
					multiselect={false}
				/>
			</MantineProvider>,
		);

		expect(
			screen.getByTestId("sbf-flex").getAttribute("data-direction"),
		).toBe(JSON.stringify({base: "column", md: "row"}));
	});

	it("preserves selection callback behavior", () => {
		const onChange = jest.fn();

		render(
			<MantineProvider>
				<SelectButtonFlexComponent
					value="Oak"
					onChange={onChange}
					items={["Oak", "Pine"]}
					multiselect={false}
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("button", {name: "Pine"}));
		expect(onChange).toHaveBeenCalledWith("Pine");
	});

	it("builds Mantine theme defaultProps", () => {
		const defaultProps = {
			flexProps: {gap: "md" as const},
			buttonProps: {size: "sm" as const},
		};

		expect(SelectButtonFlexComponentThemeProps(defaultProps)).toEqual({
			defaultProps,
		});
	});
});
