import {isAppBuilderValidationEnabled} from "../appBuilderSettingsValidationEnv";

describe("isAppBuilderValidationEnabled", () => {
	it("is false when env var is unset", () => {
		expect(isAppBuilderValidationEnabled({})).toBe(
			false,
		);
	});

	it("is true for true or 1", () => {
		expect(
			isAppBuilderValidationEnabled({
				VITE_VALIDATE_SETTINGS: "true",
			}),
		).toBe(true);
		expect(
			isAppBuilderValidationEnabled({
				VITE_VALIDATE_SETTINGS: "1",
			}),
		).toBe(true);
	});

	it("is false for other values", () => {
		expect(
			isAppBuilderValidationEnabled({
				VITE_VALIDATE_SETTINGS: "false",
			}),
		).toBe(false);
	});
});
