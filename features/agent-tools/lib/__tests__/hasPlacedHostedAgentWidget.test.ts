/**
 * @jest-environment jsdom
 */
import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {
	hasPlacedHostedAgentWidget,
	placedHostedAgentId,
	warnDuplicateHostedAgentWidgets,
} from "../hasPlacedHostedAgentWidget";

function app(
	widgets: IAppBuilder["containers"][0]["widgets"],
	agents?: IAppBuilder["agents"],
): IAppBuilder {
	return {
		version: "1.0",
		containers: [
			{
				name: "right",
				widgets,
			},
		],
		...(agents ? {agents} : {}),
	};
}

describe("hasPlacedHostedAgentWidget", () => {
	it("finds a hostedAgent widget", () => {
		expect(
			hasPlacedHostedAgentWidget(
				app([
					{
						type: "hostedAgent",
						props: {title: "Bookshelf agent", height: "100%"},
					},
				]),
			),
		).toBe(true);
	});

	it("ignores generic iframe widgets", () => {
		expect(
			hasPlacedHostedAgentWidget(
				app([
					{
						type: "iframe",
						props: {url: "http://localhost:3001"},
					},
				]),
			),
		).toBe(false);
	});

	it("is false when there is no layout", () => {
		expect(hasPlacedHostedAgentWidget(undefined)).toBe(false);
	});

	it("finds hostedAgent nested in a stack", () => {
		expect(
			hasPlacedHostedAgentWidget(
				app([
					{
						type: "stackUi",
						props: {
							name: "Agent",
							widgets: [{type: "hostedAgent", props: {}}],
						},
					},
				]),
			),
		).toBe(true);
	});
});

describe("placedHostedAgentId", () => {
	it("returns the first placed agentId", () => {
		expect(
			placedHostedAgentId(
				app([{type: "hostedAgent", props: {agentId: "other"}}]),
			),
		).toBe("other");
	});

	it("is undefined when the widget omits agentId", () => {
		expect(
			placedHostedAgentId(app([{type: "hostedAgent", props: {}}])),
		).toBeUndefined();
	});
});

describe("warnDuplicateHostedAgentWidgets", () => {
	let warn: jest.SpyInstance;

	beforeEach(() => {
		warn = jest.spyOn(Logger, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		warn.mockRestore();
	});

	it("does not warn for a single widget", () => {
		warnDuplicateHostedAgentWidgets(
			app([{type: "hostedAgent", props: {agentId: "a"}}]),
		);
		expect(warn).not.toHaveBeenCalled();
	});

	it("warns when two widgets share an agentId", () => {
		warnDuplicateHostedAgentWidgets(
			app([
				{type: "hostedAgent", props: {agentId: "bookshelf"}},
				{type: "hostedAgent", props: {agentId: "bookshelf"}},
			]),
		);
		expect(warn).toHaveBeenCalledWith(
			'Multiple hostedAgent widgets target agent "bookshelf".',
		);
	});

	it("warns when two widgets omit agentId and share agents[0]", () => {
		warnDuplicateHostedAgentWidgets(
			app(
				[
					{type: "hostedAgent", props: {}},
					{type: "hostedAgent", props: {}},
				],
				[{id: "configurator", name: "Bookshelf", message: "hi"}],
			),
		);
		expect(warn).toHaveBeenCalledWith(
			'Multiple hostedAgent widgets target agent "configurator".',
		);
	});

	it("does not warn for different agentIds", () => {
		warnDuplicateHostedAgentWidgets(
			app([
				{type: "hostedAgent", props: {agentId: "a"}},
				{type: "hostedAgent", props: {agentId: "b"}},
			]),
		);
		expect(warn).not.toHaveBeenCalled();
	});
});
