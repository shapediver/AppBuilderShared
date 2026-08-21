import {AGENT_WINDOW_NAME, openAgentWindow} from "../openAgentWindow";

describe("openAgentWindow", () => {
	it("opens with target shapediver-agent", () => {
		const opened = {} as Window;
		const open = jest.fn().mockReturnValue(opened);
		expect(openAgentWindow("http://localhost:3001/app", open)).toBe(opened);
		expect(open).toHaveBeenCalledWith(
			"http://localhost:3001/app",
			AGENT_WINDOW_NAME,
		);
	});

	it("returns null when the popup is blocked", () => {
		const open = jest.fn().mockReturnValue(null);
		expect(openAgentWindow("http://localhost:3001/app", open)).toBeNull();
	});
});
