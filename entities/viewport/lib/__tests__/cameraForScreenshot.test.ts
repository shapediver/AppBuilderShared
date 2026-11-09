import {cameraForScreenshot} from "../cameraForScreenshot";

const cameras = {
	front: {id: "front"},
	perspective: {id: "perspective"},
	custom: {id: "cam-1", name: "Hero"},
};

describe("cameraForScreenshot", () => {
	it("maps a display name of a nameless camera to its id", () => {
		expect(cameraForScreenshot(cameras, {name: "Front"})).toEqual({
			name: "front",
		});
	});

	it("keeps a name that already is the id", () => {
		const camera = {name: "front", quality: 1};
		expect(cameraForScreenshot(cameras, camera)).toBe(camera);
	});

	it("maps a named camera to its id and keeps the other fields", () => {
		expect(
			cameraForScreenshot(cameras, {
				name: "hero",
				position: [1, 2, 3] as [number, number, number],
			}),
		).toEqual({name: "cam-1", position: [1, 2, 3]});
	});

	it("prefers a camera with that name over a nameless camera with the same id", () => {
		const both = {
			front: {id: "front"},
			hero: {id: "hero", name: "Front"},
		};

		expect(cameraForScreenshot(both, {name: "Front"})).toEqual({
			name: "hero",
		});
		expect(cameraForScreenshot(both, {name: "front"})).toEqual({
			name: "front",
		});
	});

	it("keeps an exact name when two names differ only by case", () => {
		const both = {
			lower: {id: "lower", name: "front"},
			upper: {id: "upper", name: "Front"},
		};

		expect(cameraForScreenshot(both, {name: "Front"})).toEqual({
			name: "upper",
		});
		expect(cameraForScreenshot(both, {name: "front"})).toEqual({
			name: "lower",
		});
	});

	it("leaves an unknown camera unchanged", () => {
		const camera = {name: "Missing", type: "perspective" as const};
		expect(cameraForScreenshot(cameras, camera)).toBe(camera);
	});

	it("returns undefined when no camera is requested", () => {
		expect(cameraForScreenshot(cameras, undefined)).toBeUndefined();
		expect(cameraForScreenshot(undefined, {name: "Front"})).toEqual({
			name: "Front",
		});
	});
});
