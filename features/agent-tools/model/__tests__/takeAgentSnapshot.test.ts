import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {IAppBuilderAgent} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {AGENT_SNAPSHOT_UNSET, takeAgentSnapshot} from "../takeAgentSnapshot";

function agent(id: string): IAppBuilderAgent {
	return {id, name: id, message: "hi"};
}

function data(agents?: IAppBuilderAgent[]): IAppBuilder {
	return {
		version: "1.0",
		containers: [],
		agents,
	};
}

describe("takeAgentSnapshot", () => {
	it("stays unset while App Builder data is still loading", () => {
		expect(takeAgentSnapshot(AGENT_SNAPSHOT_UNSET, undefined)).toBe("unset");
		expect(takeAgentSnapshot(AGENT_SNAPSHOT_UNSET, undefined, false)).toBe(
			"unset",
		);
	});

	it("freezes agents[0] on first loaded IAppBuilder", () => {
		const first = agent("first");
		expect(takeAgentSnapshot(AGENT_SNAPSHOT_UNSET, data([first]))).toBe(first);
	});

	it("freezes undefined agent when loaded data has no agents (defaults)", () => {
		expect(takeAgentSnapshot(AGENT_SNAPSHOT_UNSET, data())).toBeUndefined();
		expect(takeAgentSnapshot(AGENT_SNAPSHOT_UNSET, data([]))).toBeUndefined();
	});

	it("ignores later agents once a snapshot is taken", () => {
		const first = agent("first");
		const later = data([agent("later")]);
		expect(takeAgentSnapshot(first, later)).toBe(first);
		expect(takeAgentSnapshot(undefined, later)).toBeUndefined();
	});

	it("freezes undefined agent once parse settled with no data", () => {
		expect(
			takeAgentSnapshot(AGENT_SNAPSHOT_UNSET, undefined, true),
		).toBeUndefined();
	});
});
