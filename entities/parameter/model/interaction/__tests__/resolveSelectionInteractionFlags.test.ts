import {resolveSelectionInteractionFlags} from "../resolveSelectionInteractionFlags";

describe("resolveSelectionInteractionFlags", () => {
	it("keeps hover on and select off when the maximum is 0", () => {
		expect(
			resolveSelectionInteractionFlags({
				maximumSelection: 0,
				hover: true,
			}),
		).toEqual({select: false, hover: true});
	});

	it("does not hover when hover is false", () => {
		expect(
			resolveSelectionInteractionFlags({
				maximumSelection: 0,
				hover: false,
			}),
		).toEqual({select: false, hover: false});
		expect(
			resolveSelectionInteractionFlags({
				hover: false,
			}),
		).toEqual({select: true, hover: false});
	});

	it("still selects when the maximum is omitted", () => {
		expect(
			resolveSelectionInteractionFlags({
				hover: true,
			}),
		).toEqual({select: true, hover: true});
	});
});
