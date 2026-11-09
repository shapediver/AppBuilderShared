import {shouldSubmitSelectionChange} from "../shouldSubmitSelectionChange";

describe("shouldSubmitSelectionChange", () => {
	it("commits an action whose result the parameter accepts", () => {
		expect(
			shouldSubmitSelectionChange({
				fromAction: true,
				acceptable: true,
				acceptImmediately: false,
				pending: true,
			}),
		).toBe(true);
	});

	it("does not commit an action the parameter would refuse", () => {
		expect(
			shouldSubmitSelectionChange({
				fromAction: true,
				acceptable: false,
				acceptImmediately: false,
				pending: true,
			}),
		).toBe(false);
	});

	it("leaves a click pending until the selection accepts itself", () => {
		expect(
			shouldSubmitSelectionChange({
				fromAction: false,
				acceptable: true,
				acceptImmediately: false,
				pending: true,
			}),
		).toBe(false);
	});

	it("commits a click that fills the selection", () => {
		expect(
			shouldSubmitSelectionChange({
				fromAction: false,
				acceptable: true,
				acceptImmediately: true,
				pending: true,
			}),
		).toBe(true);
	});

	it("does not submit a selection equal to the committed value", () => {
		expect(
			shouldSubmitSelectionChange({
				fromAction: true,
				acceptable: true,
				acceptImmediately: true,
				pending: false,
			}),
		).toBe(false);
	});
});
