import {
	DEFAULT_AUTOMATIC_SCENE_UPDATE_TIMEOUT,
	resolveAutomaticSceneUpdate,
} from "../automaticSceneUpdate";

describe("resolveAutomaticSceneUpdate", () => {
	it("is disabled by default", () => {
		expect(resolveAutomaticSceneUpdate(undefined, true)).toEqual({
			enabled: false,
			timeout: DEFAULT_AUTOMATIC_SCENE_UPDATE_TIMEOUT,
		});
		expect(resolveAutomaticSceneUpdate({}, true).enabled).toBe(false);
	});

	it("requires alwaysActive", () => {
		expect(
			resolveAutomaticSceneUpdate({automaticSceneUpdate: true}, false)
				.enabled,
		).toBe(false);
		expect(
			resolveAutomaticSceneUpdate({automaticSceneUpdate: true}, true)
				.enabled,
		).toBe(true);
	});

	it("uses the configured timeout", () => {
		expect(
			resolveAutomaticSceneUpdate(
				{automaticSceneUpdate: true, automaticSceneUpdateTimeout: 0},
				true,
			),
		).toEqual({enabled: true, timeout: 0});
		expect(
			resolveAutomaticSceneUpdate(
				{automaticSceneUpdate: true, automaticSceneUpdateTimeout: 1200},
				true,
			).timeout,
		).toBe(1200);
	});
});
