import {mapLegacyViewportIconsThemeToDefaultToolbarOptions} from "../legacyViewportIconsTheme";

describe("mapLegacyViewportIconsThemeToDefaultToolbarOptions", () => {
	describe("historyMenu when enableImportExportButtons or enableModelStateButtons specified", () => {
		it("honors explicit false for enableImportExportButtons (model-state undefined)", () => {
			const result = mapLegacyViewportIconsThemeToDefaultToolbarOptions({
				enableImportExportButtons: false,
			});
			expect(result.showButtons.historyMenu).toBe(false);
		});

		it("honors explicit false for enableModelStateButtons (import-export undefined)", () => {
			const result = mapLegacyViewportIconsThemeToDefaultToolbarOptions({
				enableModelStateButtons: false,
			});
			expect(result.showButtons.historyMenu).toBe(false);
		});

		it("honors explicit false when both specified as false", () => {
			const result = mapLegacyViewportIconsThemeToDefaultToolbarOptions({
				enableImportExportButtons: false,
				enableModelStateButtons: false,
			});
			expect(result.showButtons.historyMenu).toBe(false);
		});

		it("returns true when enableImportExportButtons is true", () => {
			const result = mapLegacyViewportIconsThemeToDefaultToolbarOptions({
				enableImportExportButtons: true,
			});
			expect(result.showButtons.historyMenu).toBe(true);
		});

		it("returns true when enableModelStateButtons is true", () => {
			const result = mapLegacyViewportIconsThemeToDefaultToolbarOptions({
				enableModelStateButtons: true,
			});
			expect(result.showButtons.historyMenu).toBe(true);
		});

		it("returns true when one is true and other is false", () => {
			const result = mapLegacyViewportIconsThemeToDefaultToolbarOptions({
				enableImportExportButtons: true,
				enableModelStateButtons: false,
			});
			expect(result.showButtons.historyMenu).toBe(true);
		});
	});

	describe("historyMenu fallback when neither import-export nor model-state specified", () => {
		it("uses enableHistoryMenuButton when provided", () => {
			const result = mapLegacyViewportIconsThemeToDefaultToolbarOptions({
				enableHistoryMenuButton: true,
			});
			expect(result.showButtons.historyMenu).toBe(true);
		});

		it("uses enableHistoryMenuButton false when provided", () => {
			const result = mapLegacyViewportIconsThemeToDefaultToolbarOptions({
				enableHistoryMenuButton: false,
			});
			expect(result.showButtons.historyMenu).toBe(false);
		});

		it("leaves historyMenu undefined when no legacy history menu flag is specified", () => {
			const result = mapLegacyViewportIconsThemeToDefaultToolbarOptions(
				{},
			);
			expect(result.showButtons.historyMenu).toBeUndefined();
		});
	});
});
