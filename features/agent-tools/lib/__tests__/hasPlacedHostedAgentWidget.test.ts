/**
 * @jest-environment jsdom
 */
import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {
	hasPlacedHostedAgentWidget,
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
			app([{type: "hostedAgent", props: {}}]),
		);
		expect(warn).not.toHaveBeenCalled();
	});

	it("warns when two active widgets are placed", () => {
		warnDuplicateHostedAgentWidgets(
			app([
				{type: "hostedAgent", props: {}},
				{type: "hostedAgent", props: {}},
			]),
		);
		expect(warn).toHaveBeenCalledWith(
			"Multiple hostedAgent widgets are active; only one ToolsApi peer is connected.",
		);
	});

	it("does not warn when a second widget sits on an idle tab", () => {
		warnDuplicateHostedAgentWidgets(
			{
				version: "1.0",
				containers: [
					{
						name: "right",
						tabs: [
							{
								name: "One",
								widgets: [{type: "hostedAgent", props: {}}],
							},
							{
								name: "Two",
								widgets: [{type: "hostedAgent", props: {}}],
							},
						],
					},
				],
			},
			{activeTabIndices: {right: 0}},
		);
		expect(warn).not.toHaveBeenCalled();
	});

	it("warns when two widgets sit on the active tab", () => {
		warnDuplicateHostedAgentWidgets(
			{
				version: "1.0",
				containers: [
					{
						name: "right",
						tabs: [
							{
								name: "One",
								widgets: [
									{type: "hostedAgent", props: {}},
									{type: "hostedAgent", props: {}},
								],
							},
						],
					},
				],
			},
			{activeTabIndices: {right: 0}},
		);
		expect(warn).toHaveBeenCalledWith(
			"Multiple hostedAgent widgets are active; only one ToolsApi peer is connected.",
		);
	});

	it("does not warn for widgets in a closed container", () => {
		warnDuplicateHostedAgentWidgets(
			app([
				{type: "hostedAgent", props: {}},
				{type: "hostedAgent", props: {}},
			]),
			{containerOpen: {right: false}},
		);
		expect(warn).not.toHaveBeenCalled();
	});
});
