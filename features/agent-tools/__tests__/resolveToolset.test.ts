import type {IAppBuilderAgent} from "../../appbuilder/config/appbuilderagent";
import {IN_SCOPE_GENERIC_TOOL_NAMES} from "../config/inScopeGenericTools";
import {resolveToolset} from "../config/resolveToolset";

describe("resolveToolset", () => {
	it("returns all in-scope generic tools when agent is undefined", () => {
		const names = resolveToolset(undefined).map((t) => t.name);
		expect(names).toEqual([...IN_SCOPE_GENERIC_TOOL_NAMES]);
		expect(names).not.toContain("ask_user_question");
	});

	it("ignores specificTools", () => {
		const agent: IAppBuilderAgent = {
			id: "a",
			name: "A",
			message: "hi",
			specificTools: [
				{name: "custom_tool", inputSchema: {type: "object"}},
			],
		};
		expect(resolveToolset(agent).map((t) => t.name)).not.toContain(
			"custom_tool",
		);
	});

	it("useGenericToolDefaults false keeps only listed generic tools", () => {
		const agent: IAppBuilderAgent = {
			id: "a",
			name: "A",
			message: "hi",
			useGenericToolDefaults: false,
			genericTools: [{name: "get_screenshot"}],
		};
		expect(resolveToolset(agent).map((t) => t.name)).toEqual([
			"get_screenshot",
		]);
	});

	it("overlays genericTools settings when defaults are on", () => {
		const agent: IAppBuilderAgent = {
			id: "a",
			name: "A",
			message: "hi",
			genericTools: [
				{
					name: "list_parameter_definitions",
					filter: {hidden: "include"},
				},
			],
		};
		const list = resolveToolset(agent).find(
			(t) => t.name === "list_parameter_definitions",
		);
		expect(list?.settings).toMatchObject({
			name: "list_parameter_definitions",
			filter: {hidden: "include"},
		});
		expect(resolveToolset(agent)).toHaveLength(
			IN_SCOPE_GENERIC_TOOL_NAMES.length,
		);
	});

	it("drops ask_user_question even if listed", () => {
		const agent: IAppBuilderAgent = {
			id: "a",
			name: "A",
			message: "hi",
			useGenericToolDefaults: false,
			genericTools: [
				{name: "ask_user_question"},
				{name: "get_metric"},
			],
		};
		expect(resolveToolset(agent).map((t) => t.name)).toEqual(["get_metric"]);
	});
});
