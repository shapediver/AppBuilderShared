/**
 * @jest-environment node
 */
import {sizeAfterBottomLeftDrag} from "../sizeAfterBottomLeftDrag";

describe("sizeAfterBottomLeftDrag", () => {
	const box = {
		startWidth: 384,
		startHeight: 512,
		startClientX: 100,
		startClientY: 400,
		minWidth: 256,
		minHeight: 192,
		maxWidth: 900,
		maxHeight: 800,
	};

	it("grows width when the pointer moves left and height when it moves down", () => {
		expect(
			sizeAfterBottomLeftDrag({
				...box,
				clientX: 60,
				clientY: 430,
			}),
		).toEqual({width: 424, height: 542});
	});

	it("clamps to min and max", () => {
		expect(
			sizeAfterBottomLeftDrag({
				...box,
				clientX: 900,
				clientY: -100,
			}),
		).toEqual({width: 256, height: 192});
		expect(
			sizeAfterBottomLeftDrag({
				...box,
				clientX: -2000,
				clientY: 4000,
			}),
		).toEqual({width: 900, height: 800});
	});
});
