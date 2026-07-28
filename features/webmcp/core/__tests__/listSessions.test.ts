import type {ToolDeps} from "../deps";
import {listSessionsTool} from "../listSessions";

function mockDeps(overrides: Partial<ToolDeps> = {}): ToolDeps {
	return {
		namespace: "main",
		getLiveParameters: () => [],
		listParameterNamespaces: () => ["session-a", "session-b"],
		batchParameterValueUpdate: jest.fn(),
		createModelState: jest.fn(),
		importModelState: jest.fn(),
		...overrides,
	};
}

describe("listSessionsTool", () => {
	it("execute returns sessions from listParameterNamespaces", async () => {
		const output = await listSessionsTool.execute(
			mockDeps(),
			{},
			new AbortController().signal,
		);
		expect(output).toEqual({
			sessions: [{sessionId: "session-a"}, {sessionId: "session-b"}],
		});
	});

	it("format returns next-step hint", () => {
		expect(
			listSessionsTool.format({
				sessions: [{sessionId: "session-a"}],
			}),
		).toBe(
			"Found 1 sessions. Next you can use one of the sessionIds with list_parameter_definitions.",
		);
	});

	it("name and annotations match WebMCP registration", () => {
		expect(listSessionsTool.name).toBe("list_sessions");
		expect(listSessionsTool.annotations).toEqual({
			readOnlyHint: true,
			untrustedContentHint: true,
		});
	});
});
