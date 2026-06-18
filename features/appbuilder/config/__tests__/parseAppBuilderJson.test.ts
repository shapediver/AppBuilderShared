jest.mock("../readAppBuilderValidationEnv", () => ({
	readAppBuilderValidationEnv: () => ({}),
}));

import {
	parseAppBuilderSettingsJson,
	parseAppBuilderSkeleton,
} from "../parseAppBuilderJson";

const minimalValidSettings = {
	version: "1.0" as const,
};

const minimalValidSkeleton = {
	version: "1.0" as const,
	containers: [],
};

const envOff = {};
const envOn = {VITE_VALIDATE_SETTINGS: "true"};

describe("parseAppBuilderSettingsJson", () => {
	it("returns raw when validation env is off", () => {
		const raw = {version: "9.9", sessions: []};
		expect(parseAppBuilderSettingsJson(raw, envOff)).toBe(raw);
	});

	it("returns parsed data when validation env is on and input is valid", () => {
		expect(
			parseAppBuilderSettingsJson(minimalValidSettings, envOn),
		).toEqual(minimalValidSettings);
	});

	it("throws with settings prefix when validation env is on and input is invalid", () => {
		expect(() => parseAppBuilderSettingsJson({}, envOn)).toThrow(
			/^App Builder settings invalid:\n/,
		);
	});
});

describe("parseAppBuilderSkeleton", () => {
	it("returns raw when validation env is off", () => {
		const raw = {version: "9.9"};
		expect(parseAppBuilderSkeleton(raw, envOff)).toBe(raw);
	});

	it("returns parsed data when validation env is on and input is valid", () => {
		expect(parseAppBuilderSkeleton(minimalValidSkeleton, envOn)).toEqual(
			minimalValidSkeleton,
		);
	});

	it("returns Error with layout prefix when validation env is on and input is invalid", () => {
		const result = parseAppBuilderSkeleton({}, envOn);
		expect(result).toBeInstanceOf(Error);
		expect((result as Error).message).toMatch(
			/^App Builder layout invalid:\n/,
		);
	});
});
