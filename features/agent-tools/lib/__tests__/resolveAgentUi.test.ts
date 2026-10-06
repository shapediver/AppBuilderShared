import {resolveAgentUi} from "../resolveAgentUi";

describe("resolveAgentUi", () => {
	it("defaults to iframe with history hidden", () => {
		expect(resolveAgentUi({})).toEqual({
			mode: "iframe",
			showThreadHistory: false,
		});
	});

	it("shows history for window mode when the flag is omitted", () => {
		expect(resolveAgentUi({mode: "window"})).toEqual({
			mode: "window",
			showThreadHistory: true,
		});
	});

	it("keeps an explicit history flag", () => {
		expect(
			resolveAgentUi({mode: "window", showThreadHistory: false}),
		).toEqual({
			mode: "window",
			showThreadHistory: false,
		});
		expect(
			resolveAgentUi({mode: "iframe", showThreadHistory: true}),
		).toEqual({
			mode: "iframe",
			showThreadHistory: true,
		});
	});

	it("treats unknown mode values as iframe", () => {
		expect(resolveAgentUi({mode: "sidebar"})).toEqual({
			mode: "iframe",
			showThreadHistory: false,
		});
	});
});
