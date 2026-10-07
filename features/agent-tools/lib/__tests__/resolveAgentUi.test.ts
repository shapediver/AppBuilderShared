import {resolveAgentUi} from "../resolveAgentUi";

describe("resolveAgentUi", () => {
	it("defaults to iframe with history shown and a new thread on load", () => {
		expect(resolveAgentUi({})).toEqual({
			mode: "iframe",
			showThreadHistory: true,
			createThreadOnLoad: true,
		});
	});

	it("shows history and resumes for window mode when flags are omitted", () => {
		expect(resolveAgentUi({mode: "window"})).toEqual({
			mode: "window",
			showThreadHistory: true,
			createThreadOnLoad: false,
		});
	});

	it("keeps an explicit history flag without changing load behavior", () => {
		expect(
			resolveAgentUi({mode: "window", showThreadHistory: false}),
		).toEqual({
			mode: "window",
			showThreadHistory: false,
			createThreadOnLoad: false,
		});
		expect(
			resolveAgentUi({mode: "iframe", showThreadHistory: false}),
		).toEqual({
			mode: "iframe",
			showThreadHistory: false,
			createThreadOnLoad: true,
		});
	});

	it("keeps an explicit createThreadOnLoad flag without changing history", () => {
		expect(
			resolveAgentUi({mode: "iframe", createThreadOnLoad: false}),
		).toEqual({
			mode: "iframe",
			showThreadHistory: true,
			createThreadOnLoad: false,
		});
		expect(
			resolveAgentUi({mode: "window", createThreadOnLoad: true}),
		).toEqual({
			mode: "window",
			showThreadHistory: true,
			createThreadOnLoad: true,
		});
	});

	it("treats unknown mode values as iframe", () => {
		expect(resolveAgentUi({mode: "sidebar"})).toEqual({
			mode: "iframe",
			showThreadHistory: true,
			createThreadOnLoad: true,
		});
	});
});
