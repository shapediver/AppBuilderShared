/**
 * @jest-environment node
 */
import {sizeAfterHandleDrag} from "../sizeAfterHandleDrag";

describe("sizeAfterHandleDrag", () => {
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

	it("grows a top-left handle when the pointer moves up and left", () => {
		expect(
			sizeAfterHandleDrag({
				...box,
				clientX: 60,
				clientY: 370,
				edgeX: "left",
				edgeY: "top",
			}),
		).toEqual({width: 424, height: 542});
	});

	it("grows a bottom-left handle when the pointer moves down and left", () => {
		expect(
			sizeAfterHandleDrag({
				...box,
				clientX: 60,
				clientY: 430,
				edgeX: "left",
				edgeY: "bottom",
			}),
		).toEqual({width: 424, height: 542});
	});

	it("grows a bottom-right handle when the pointer moves down and right", () => {
		expect(
			sizeAfterHandleDrag({
				...box,
				clientX: 140,
				clientY: 430,
				edgeX: "right",
				edgeY: "bottom",
			}),
		).toEqual({width: 424, height: 542});
	});

	it("clamps to min and max", () => {
		expect(
			sizeAfterHandleDrag({
				...box,
				clientX: 900,
				clientY: -100,
				edgeX: "left",
				edgeY: "top",
			}),
		).toEqual({width: 256, height: 800});
		expect(
			sizeAfterHandleDrag({
				...box,
				clientX: -2000,
				clientY: 4000,
				edgeX: "left",
				edgeY: "top",
			}),
		).toEqual({width: 900, height: 192});
	});
});
