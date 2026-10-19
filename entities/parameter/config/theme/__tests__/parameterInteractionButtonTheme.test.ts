import {resolveParameterInteractionButtonTheme} from "../parameterInteractionButtonTheme";

describe("resolveParameterInteractionButtonTheme", () => {
	const defaults = {
		label: "Clear Selection",
		icon: "tabler:circle-off" as const,
	};

	it("uses code defaults when the theme omits the button", () => {
		expect(
			resolveParameterInteractionButtonTheme(undefined, defaults),
		).toEqual({
			label: "Clear Selection",
			tooltip: "Clear Selection",
			icon: "tabler:circle-off",
		});
	});

	it("overrides tooltip independently of the default label", () => {
		expect(
			resolveParameterInteractionButtonTheme(
				{tooltip: "Clear selection"},
				defaults,
			),
		).toEqual({
			label: "Clear Selection",
			tooltip: "Clear selection",
			icon: "tabler:circle-off",
		});
	});

	it("lets a themed label become the tooltip fallback", () => {
		expect(
			resolveParameterInteractionButtonTheme({label: "Reset"}, defaults),
		).toEqual({
			label: "Reset",
			tooltip: "Reset",
			icon: "tabler:circle-off",
		});
	});

	it("overrides the icon", () => {
		expect(
			resolveParameterInteractionButtonTheme(
				{icon: "tabler:trash"},
				defaults,
			),
		).toEqual({
			label: "Clear Selection",
			tooltip: "Clear Selection",
			icon: "tabler:trash",
		});
	});
});
