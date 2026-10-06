import {
	isAgentThemeMessage,
	postAgentTheme,
	serializeThemeOverrides,
} from "../agentThemeChannel";

describe("serializeThemeOverrides", () => {
	it("keeps JSON theme fields and drops functions", () => {
		const theme = serializeThemeOverrides({
			primaryColor: "gray",
			other: {forceColorScheme: "dark"},
			components: {
				Button: {defaultProps: {radius: "xs"}},
			},
		});
		expect(theme).toEqual({
			primaryColor: "gray",
			other: {forceColorScheme: "dark"},
			components: {
				Button: {defaultProps: {radius: "xs"}},
			},
		});
	});

	it("returns an empty override when no theme file is applied", () => {
		expect(serializeThemeOverrides(undefined)).toEqual({});
	});
});

describe("postAgentTheme", () => {
	it("posts the theme to the agent origin", () => {
		const peer = {postMessage: jest.fn()} as unknown as Window;
		postAgentTheme(peer, "http://localhost:3001/app", {
			primaryColor: "teal",
		});
		expect(peer.postMessage).toHaveBeenCalledWith(
			{
				type: "shapediver:agent-theme",
				themeOverrides: {primaryColor: "teal"},
			},
			"http://localhost:3001",
		);
		expect(
			isAgentThemeMessage({
				type: "shapediver:agent-theme",
				themeOverrides: {primaryColor: "teal"},
			}),
		).toBe(true);
	});
});
