import {AppBuilderContainerOrientation} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContainerOrientation";
import {anchorFillsContainer} from "../anchorFillsContainer";

describe("anchorFillsContainer", () => {
	it("fills a horizontal container below the mobile breakpoint", () => {
		expect(
			anchorFillsContainer({
				aboveMobileBreakpoint: false,
				orientation: AppBuilderContainerOrientation.Horizontal,
			}),
		).toBe(true);
	});

	it("keeps the scroll area in a vertical container on mobile", () => {
		expect(
			anchorFillsContainer({
				aboveMobileBreakpoint: false,
				orientation: AppBuilderContainerOrientation.Vertical,
			}),
		).toBe(false);
	});

	it("keeps the floating layout above the mobile breakpoint", () => {
		for (const orientation of [
			AppBuilderContainerOrientation.Horizontal,
			AppBuilderContainerOrientation.Vertical,
			AppBuilderContainerOrientation.Unspecified,
			undefined,
		]) {
			expect(
				anchorFillsContainer({
					aboveMobileBreakpoint: true,
					orientation,
				}),
			).toBe(false);
		}
	});
});
