/**
 * @jest-environment jsdom
 */
import type {IAppBuilderAgent} from "../../appbuilder/config/appbuilderagent";
import {IN_SCOPE_GENERIC_TOOL_NAMES} from "../config/inScopeGenericTools";
import {resolveSpecificTools} from "../config/resolveSpecificTools";
import {
	isAskUserQuestionAllowed,
	resolveToolset,
} from "../config/resolveToolset";

describe("resolveToolset", () => {
	it("returns all in-scope generic tools when agent is undefined", () => {
		const names = resolveToolset(undefined).map((t) => t.name);
		expect(names).toEqual([...IN_SCOPE_GENERIC_TOOL_NAMES]);
		expect(names).toContain("get_output");
		expect(names).not.toContain("ask_user_question");
		expect(names).not.toContain("get_metric");
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

	it.each([
		["an object", {get_output: {name: "get_output"}}],
		["a string", "get_output"],
		["null", null],
	])("treats genericTools as unlisted when it is %s", (_label, value) => {
		const bad = value as unknown as IAppBuilderAgent["genericTools"];
		const defaults: IAppBuilderAgent = {
			id: "a",
			name: "A",
			message: "hi",
			genericTools: bad,
		};
		expect(resolveToolset(defaults).map((t) => t.name)).toEqual([
			...IN_SCOPE_GENERIC_TOOL_NAMES,
		]);
		expect(
			resolveToolset({...defaults, useGenericToolDefaults: false}),
		).toEqual([]);
		expect(
			isAskUserQuestionAllowed({
				...defaults,
				useGenericToolDefaults: false,
			}),
		).toBe(false);
	});

	it("resolveSpecificTools ignores a non-array specificTools", () => {
		const agent = {
			id: "a",
			name: "A",
			message: "hi",
			specificTools: {custom_tool: {name: "custom_tool"}},
		} as unknown as IAppBuilderAgent;
		expect(resolveSpecificTools(agent)).toEqual([]);
	});

	it("ignores non-object entries in genericTools", () => {
		const agent = {
			id: "a",
			name: "A",
			message: "hi",
			useGenericToolDefaults: false,
			genericTools: [null, "x", {name: "get_screenshot"}],
		} as unknown as IAppBuilderAgent;
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

	it("drops ask_user_question and get_metric even if listed", () => {
		const agent: IAppBuilderAgent = {
			id: "a",
			name: "A",
			message: "hi",
			useGenericToolDefaults: false,
			genericTools: [
				{name: "ask_user_question"},
				{name: "get_metric"},
				{name: "get_output"},
			],
		};
		expect(resolveToolset(agent).map((t) => t.name)).toEqual([
			"get_output",
		]);
	});
});

describe("isAskUserQuestionAllowed", () => {
	const base = {id: "a", name: "A", message: "hi"};

	it("is allowed by default", () => {
		expect(isAskUserQuestionAllowed(undefined)).toBe(true);
		expect(isAskUserQuestionAllowed(base)).toBe(true);
		expect(
			isAskUserQuestionAllowed({
				...base,
				genericTools: [{name: "get_output"}],
			}),
		).toBe(true);
	});

	it("is blocked with useGenericToolDefaults false unless listed", () => {
		expect(
			isAskUserQuestionAllowed({
				...base,
				useGenericToolDefaults: false,
				genericTools: [{name: "get_output"}],
			}),
		).toBe(false);
		expect(
			isAskUserQuestionAllowed({...base, useGenericToolDefaults: false}),
		).toBe(false);
		expect(
			isAskUserQuestionAllowed({
				...base,
				useGenericToolDefaults: false,
				genericTools: [{name: "ask_user_question"}],
			}),
		).toBe(true);
	});
});
