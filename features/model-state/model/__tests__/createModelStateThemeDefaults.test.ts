/**
 * @jest-environment jsdom
 */
import {
	applyCreateModelStateFilterDefaults,
	applyCreateModelStateScreenshotFallback,
	applyCreateModelStateThemeDefaults,
	useCreateModelStateThemeDefaultsStore,
} from "../createModelStateThemeDefaults";

describe("applyCreateModelStateThemeDefaults", () => {
	afterEach(() => {
		useCreateModelStateThemeDefaultsStore.getState().setDefaults({});
	});

	it("merges theme include/exclude, always-exclude, screenshot, and messages", () => {
		useCreateModelStateThemeDefaultsStore.getState().setDefaults({
			parameterNamesToAlwaysExclude: ["context"],
			parameterNamesToInclude: ["Length"],
			parameterNamesToExclude: ["Hide Door"],
			screenshotProps: {quality: 0.5},
			successMessage: "saved {modelStateId}",
			errorMessage: "failed",
		});

		const merged = applyCreateModelStateThemeDefaults({
			includeImage: true,
		});

		expect(merged.parameterNamesToAlwaysExclude).toEqual(["context"]);
		expect(merged.props.parameterNamesToInclude).toEqual(["Length"]);
		expect(merged.props.parameterNamesToExclude).toEqual(["Hide Door"]);
		expect(merged.props.screenshotProps).toEqual({quality: 0.5});
		expect(merged.successMessage).toBe("saved {modelStateId}");
		expect(merged.errorMessage).toBe("failed");
	});

	it("lets action props override theme include/exclude, screenshot, and messages", () => {
		useCreateModelStateThemeDefaultsStore.getState().setDefaults({
			parameterNamesToAlwaysExclude: ["context"],
			parameterNamesToInclude: ["Length"],
			screenshotProps: {quality: 0.2},
			successMessage: "theme",
		});

		const merged = applyCreateModelStateThemeDefaults({
			parameterNamesToInclude: ["Color"],
			screenshotProps: {quality: 0.9},
			successMessage: "action",
		});

		expect(merged.parameterNamesToAlwaysExclude).toEqual(["context"]);
		expect(merged.props.parameterNamesToInclude).toEqual(["Color"]);
		expect(merged.props.screenshotProps).toEqual({quality: 0.9});
		expect(merged.successMessage).toBe("action");
	});

	it("does not apply CreateModelStateHook screenshot or messages when merging filters only", () => {
		useCreateModelStateThemeDefaultsStore.getState().setDefaults({
			parameterNamesToAlwaysExclude: ["context"],
			screenshotProps: {quality: 0.5},
			successMessage: "saved",
		});

		const merged = applyCreateModelStateFilterDefaults({
			includeImage: true,
			data: {orderId: "123"},
		});

		expect(merged.parameterNamesToAlwaysExclude).toEqual(["context"]);
		expect(merged.props.screenshotProps).toBeUndefined();
		expect(merged.props.data).toEqual({orderId: "123"});
		expect(merged.props.includeImage).toBe(true);
	});

	it("falls back to CreateModelStateHook screenshot when the caller leaves it unset", () => {
		useCreateModelStateThemeDefaultsStore.getState().setDefaults({
			screenshotProps: {quality: 0.5},
		});

		expect(applyCreateModelStateScreenshotFallback(undefined)).toEqual({
			quality: 0.5,
		});
		expect(applyCreateModelStateScreenshotFallback({quality: 0.9})).toEqual(
			{quality: 0.9},
		);
	});
});
