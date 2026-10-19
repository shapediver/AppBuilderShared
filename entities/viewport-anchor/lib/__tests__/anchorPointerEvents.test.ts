import {anchorPointerEvents} from "../anchorPointerEvents";

describe("anchorPointerEvents", () => {
	it("keeps an open container clickable while a camera action is active", () => {
		expect(
			anchorPointerEvents({
				allowPointerEventsGlobal: false,
				allowPointerEvents: true,
				showContent: true,
			}),
		).toBe("auto");
	});

	it("blocks a closed preview trigger while a camera action is active", () => {
		expect(
			anchorPointerEvents({
				allowPointerEventsGlobal: false,
				allowPointerEvents: true,
				showContent: false,
			}),
		).toBe("none");
	});

	it("lets an explicit allowPointerEvents false pass clicks through an open container", () => {
		expect(
			anchorPointerEvents({
				allowPointerEventsGlobal: true,
				allowPointerEvents: false,
				showContent: true,
			}),
		).toBe("none");
		expect(
			anchorPointerEvents({
				allowPointerEventsGlobal: false,
				allowPointerEvents: false,
				showContent: true,
			}),
		).toBe("none");
	});

	it("keeps a closed preview trigger clickable when the camera is idle", () => {
		expect(
			anchorPointerEvents({
				allowPointerEventsGlobal: true,
				allowPointerEvents: false,
				showContent: false,
			}),
		).toBe("auto");
	});
});
