import {
	AppBuilderContainerNameType,
	type IAppBuilder,
	type IAppBuilderControlActionRef,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {ListActionControlsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {listActionControlsInputSchema} from "../config/listActionControls";
import {
	collectActionControls,
	collectFromToolbarItems,
} from "../lib/collectActionControls";
import type {AgentToolsDeps} from "../model/agentToolsDeps";
import {handleListActionControls} from "../model/handlers/listActionControls";

const defaultSettings: ListActionControlsToolSettings = {
	name: "list_action_controls",
};

const emptyApp: IAppBuilder = {version: "1.0", containers: []};

function undoAction(
	overrides: Partial<IAppBuilderControlActionRef> = {},
): IAppBuilderControlActionRef {
	return {
		definition: {type: "undo", props: {}},
		...overrides,
	};
}

function fullscreenAction(
	overrides: Partial<IAppBuilderControlActionRef> = {},
): IAppBuilderControlActionRef {
	return {
		definition: {type: "fullscreen", props: {}},
		...overrides,
	};
}

function ids(actions: ReturnType<typeof collectActionControls>): string[] {
	return actions.map((action) => action.id);
}

describe("collectActionControls", () => {
	it("returns toolbar undo when app is empty and types default", () => {
		const actions = collectActionControls({
			appBuilder: emptyApp,
			defaultToolbarActions: [undoAction()],
			settings: defaultSettings,
		});

		expect(actions).toEqual([{id: "undo", name: "undo", type: "undo"}]);
	});

	it("drops undo when filter.types is sound only", () => {
		const actions = collectActionControls({
			appBuilder: emptyApp,
			defaultToolbarActions: [undoAction()],
			settings: {
				name: "list_action_controls",
				filter: {types: ["sound"]},
			},
		});

		expect(actions).toEqual([]);
	});

	it("keeps only the explicit actions name when provided", () => {
		const actions = collectActionControls({
			appBuilder: emptyApp,
			defaultToolbarActions: [undoAction(), fullscreenAction({id: "x"})],
			settings: {
				name: "list_action_controls",
				actions: [{name: "x"}],
			},
		});

		expect(ids(actions)).toEqual(["x"]);
	});

	it("collects action controls from widgets, forms, and toolbars", () => {
		const appBuilder: IAppBuilder = {
			version: "1.0",
			containers: [
				{
					name: AppBuilderContainerNameType.Left,
					widgets: [
						{
							type: "controls",
							props: {
								controls: [
									{
										type: "action",
										props: undoAction({id: "fromControls"}),
									},
									{type: "parameter", props: {name: "width"}},
								],
							},
						},
						{
							type: "form",
							props: {
								controls: [
									{
										type: "action",
										props: undoAction({
											id: "fromForm",
											label: "Form Undo",
										}),
									},
								],
							},
						},
						{
							type: "stackUi",
							props: {
								name: "stack",
								widgets: [
									{
										type: "controls",
										props: {
											controls: [
												{
													type: "action",
													props: undoAction({
														id: "fromStack",
													}),
												},
											],
										},
									},
								],
							},
						},
					],
					tabs: [
						{
							name: "tab",
							widgets: [
								{
									type: "accordionUi",
									props: {
										items: [
											{
												name: "item",
												widgets: [
													{
														type: "controls",
														props: {
															controls: [
																{
																	type: "action",
																	props: undoAction(
																		{
																			id: "fromTab",
																		},
																	),
																},
															],
														},
													},
												],
											},
										],
									},
								},
							],
						},
					],
				},
				{
					name: AppBuilderContainerNameType.Toolbar,
					props: {id: "tb"},
					groups: [
						[
							{
								type: "action",
								props: undoAction({id: "fromToolbar"}),
							},
							{
								type: "actionMenu",
								props: {
									sections: [
										[
											{
												type: "action",
												props: undoAction({
													id: "fromMenu",
												}),
											},
										],
									],
								},
							},
							{
								type: "widgets",
								props: {
									widgets: [
										{
											type: "controls",
											props: {
												controls: [
													{
														type: "action",
														props: undoAction({
															id: "fromPanel",
														}),
													},
												],
											},
										},
									],
								},
							},
							{
								type: "tabs",
								props: {
									tabs: [
										{
											name: "t",
											widgets: [
												{
													type: "controls",
													props: {
														controls: [
															{
																type: "action",
																props: undoAction(
																	{
																		id: "fromToolbarTab",
																	},
																),
															},
														],
													},
												},
											],
										},
									],
								},
							},
						],
					],
				},
			],
		};

		expect(
			ids(
				collectActionControls({
					appBuilder,
					defaultToolbarActions: [],
					settings: defaultSettings,
				}),
			),
		).toEqual([
			"fromTab",
			"fromControls",
			"fromForm",
			"fromStack",
			"fromToolbar",
			"fromMenu",
			"fromPanel",
			"fromToolbarTab",
		]);
	});

	it("uses label as identity when id is missing", () => {
		const actions = collectActionControls({
			appBuilder: undefined,
			defaultToolbarActions: [undoAction({label: "Undo"})],
			settings: defaultSettings,
		});

		expect(actions).toEqual([{id: "Undo", name: "Undo", type: "undo"}]);
	});

	it("matches explicit actions name against label", () => {
		const actions = collectActionControls({
			appBuilder: emptyApp,
			defaultToolbarActions: [undoAction({label: "Undo"})],
			settings: {
				name: "list_action_controls",
				actions: [{name: "Undo"}],
			},
		});

		expect(ids(actions)).toEqual(["Undo"]);
	});

	it("merges toolbar item-level label onto the action ref", () => {
		const appBuilder: IAppBuilder = {
			version: "1.0",
			containers: [
				{
					name: AppBuilderContainerNameType.Toolbar,
					props: {id: "tb"},
					groups: [
						[
							{
								type: "action",
								label: "Undo",
								props: {definition: {type: "undo", props: {}}},
							},
						],
					],
				},
			],
		};

		expect(
			collectActionControls({
				appBuilder,
				defaultToolbarActions: [],
				settings: defaultSettings,
			}),
		).toEqual([{id: "Undo", name: "Undo", type: "undo"}]);

		expect(
			ids(
				collectActionControls({
					appBuilder,
					defaultToolbarActions: [],
					settings: {
						name: "list_action_controls",
						actions: [{name: "Undo"}],
					},
				}),
			),
		).toEqual(["Undo"]);
	});

	it("lists embedded settings.actions refs that are not in the UI", () => {
		const actions = collectActionControls({
			appBuilder: emptyApp,
			defaultToolbarActions: [],
			settings: {
				name: "list_action_controls",
				actions: [
					{
						action: {
							id: "save",
							definition: {type: "createModelState", props: {}},
						},
					},
				],
			},
		});

		expect(actions).toEqual([
			{id: "save", name: "save", type: "createModelState"},
		]);
	});

	it("collects createModelState nested in an actionMenu", () => {
		const refs = collectFromToolbarItems([
			{
				type: "action",
				props: {definition: {type: "undo", props: {}}},
			},
			{
				type: "actionMenu",
				props: {
					sections: [
						[
							{
								type: "action",
								label: "Save",
								props: {
									definition: {
										type: "createModelState",
										props: {},
									},
								},
							},
						],
					],
				},
			},
		]);

		expect(refs.map((ref) => ref.definition.type)).toEqual([
			"undo",
			"createModelState",
		]);
		expect(refs[1]?.label).toBe("Save");
	});

	it("skips runtime-only toolbar items and still collects nested menu actions", () => {
		const refs = collectFromToolbarItems([
			{
				id: "accept-reject",
				type: "acceptReject",
				label: "Accept or reject",
				props: {},
			},
			{
				id: "save-menu",
				type: "menu",
				label: "Save",
				props: {
					sections: [
						{
							id: "save-section",
							items: [
								{
									id: "save-action",
									type: "action",
									label: "Save",
									props: {
										definition: {
											type: "createModelState",
											props: {},
										},
									},
								},
							],
						},
					],
				},
			},
			{
				id: "zoom",
				type: "command",
				label: "Zoom",
				props: {execute: () => undefined},
			},
		]);

		expect(refs.map((ref) => ref.definition.type)).toEqual([
			"createModelState",
		]);
	});

	it("lists a mix of embedded action refs and name matches", () => {
		const actions = collectActionControls({
			appBuilder: emptyApp,
			defaultToolbarActions: [undoAction({label: "Undo"})],
			settings: {
				name: "list_action_controls",
				actions: [
					{
						action: {
							id: "save",
							definition: {type: "createModelState", props: {}},
						},
					},
					{name: "Undo"},
				],
			},
		});

		expect(ids(actions)).toEqual(["save", "Undo"]);
	});
});

describe("listActionControlsInputSchema", () => {
	it("accepts empty object", () => {
		expect(listActionControlsInputSchema.parse({})).toEqual({});
	});

	it("rejects extra keys", () => {
		expect(() =>
			listActionControlsInputSchema.parse({filter: "all"}),
		).toThrow();
	});
});

describe("handleListActionControls", () => {
	function createDeps(
		overrides: Partial<AgentToolsDeps> = {},
	): AgentToolsDeps {
		return {
			controllerNamespace: "c",
			getLiveParameters: () => [],
			listSessionNamespaces: () => ["c"],
			getAppBuilder: () => emptyApp,
			batchParameterValueUpdate: jest.fn().mockResolvedValue(undefined),
			getDefaultToolbarActions: () => [undoAction()],
			createModelState: async () => ({success: true}),
			importModelState: async () => ({success: true}),
			undo: async () => ({success: true}),
			redo: async () => ({success: true}),
			resetParameters: async () => ({success: true}),
			getViewportId: () => "vp",
			setCamera: async () => ({success: true}),
			getScreenshot: async () => undefined,
			getOutputByName: () => undefined,
			...overrides,
		};
	}

	it("returns input error named * when extra keys are present", async () => {
		const result = await handleListActionControls(
			{filter: "sound"},
			defaultSettings,
			createDeps(),
		);

		expect(result.actions).toEqual([]);
		expect(result.errors?.[0]?.name).toBe("*");
	});

	it("lists default-toolbar undo from deps", async () => {
		const result = await handleListActionControls(
			{},
			defaultSettings,
			createDeps(),
		);

		expect(result.actions).toEqual([
			{id: "undo", name: "undo", type: "undo"},
		]);
		expect(result.errors).toBeUndefined();
	});
});
