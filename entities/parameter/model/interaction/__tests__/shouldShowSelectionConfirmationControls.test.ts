import {shouldShowSelectionConfirmationControls} from "../shouldShowSelectionConfirmationControls";

const singleAlwaysActive = {
	effectiveSelectionActive: true,
	acceptImmediately: true,
	minimumSelection: 1,
	maximumSelection: 1,
	hasPendingSelection: false,
	hasOtherPendingSelection: false,
};

describe("shouldShowSelectionConfirmationControls", () => {
	it("hides Confirm/Cancel for an always-active 1/1 selection", () => {
		expect(
			shouldShowSelectionConfirmationControls(singleAlwaysActive),
		).toBe(false);
	});

	it("hides disabled Confirm/Cancel when only a sibling selection is pending", () => {
		expect(
			shouldShowSelectionConfirmationControls({
				...singleAlwaysActive,
				acceptImmediately: false,
				hasOtherPendingSelection: true,
			}),
		).toBe(false);
	});

	it("shows Confirm/Cancel when a 1/1 draft cannot auto-commit because a sibling is pending", () => {
		expect(
			shouldShowSelectionConfirmationControls({
				...singleAlwaysActive,
				acceptImmediately: false,
				hasPendingSelection: true,
				hasOtherPendingSelection: true,
			}),
		).toBe(true);
	});

	it("shows Confirm/Cancel for a multi selection that is being edited", () => {
		expect(
			shouldShowSelectionConfirmationControls({
				hasOtherPendingSelection: false,
				hasPendingSelection: true,
				effectiveSelectionActive: true,
				acceptImmediately: false,
				minimumSelection: 1,
				maximumSelection: 3,
			}),
		).toBe(true);
	});

	it("shows Confirm/Cancel for an optional single draft that needs confirmation", () => {
		expect(
			shouldShowSelectionConfirmationControls({
				hasOtherPendingSelection: false,
				hasPendingSelection: true,
				effectiveSelectionActive: true,
				acceptImmediately: false,
				minimumSelection: 0,
				maximumSelection: 1,
			}),
		).toBe(true);
	});
});
