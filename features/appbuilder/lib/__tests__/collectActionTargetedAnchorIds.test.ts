import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	collectActionTargetedAnchorIdsFromContainers,
	collectActionTargetedAnchorIdsFromGroups,
} from "../collectActionTargetedAnchorIds";

const visibilityAction = (name: string, id: string) => ({
	type: "action",
	props: {
		definition: {
			type: "setContainerVisibility",
			props: {
				container: {name, props: {id}},
				mode: "toggle",
			},
		},
	},
});

describe("collectActionTargetedAnchorIds", () => {
	it("collects 2d and 3d targets and ignores other containers", () => {
		const result = collectActionTargetedAnchorIdsFromGroups([
			[
				visibilityAction(
					AppBuilderContainerNameType.Anchor2d,
					"panel-2d",
				),
				visibilityAction(
					AppBuilderContainerNameType.Anchor3d,
					"panel-3d",
				),
				visibilityAction(AppBuilderContainerNameType.Left, "left"),
				{type: "action", props: {definition: {type: "ar", props: {}}}},
			],
		]);

		expect(result).toEqual({
			all: ["panel-2d", "panel-3d"],
			anchor2d: ["panel-2d"],
			anchor3d: ["panel-3d"],
		});
	});

	it("walks actionMenu sections and resolved menu items", () => {
		const result = collectActionTargetedAnchorIdsFromGroups([
			[
				{
					type: "actionMenu",
					props: {
						sections: [
							[
								visibilityAction(
									AppBuilderContainerNameType.Anchor2d,
									"from-menu",
								),
							],
						],
					},
				},
				{
					type: "menu",
					props: {
						sections: [
							{
								id: "runtime",
								items: [
									visibilityAction(
										AppBuilderContainerNameType.Anchor3d,
										"from-runtime-menu",
									),
								],
							},
						],
					},
				},
			],
		]);

		expect(result.anchor2d).toEqual(["from-menu"]);
		expect(result.anchor3d).toEqual(["from-runtime-menu"]);
	});

	it("collects from toolbar containers only", () => {
		const result = collectActionTargetedAnchorIdsFromContainers([
			{
				name: AppBuilderContainerNameType.Anchor2d,
				props: {id: "not-from-toolbar"},
			},
			{
				name: AppBuilderContainerNameType.Toolbar,
				props: {id: "tb", side: "bottom"},
				groups: [
					[
						visibilityAction(
							AppBuilderContainerNameType.Anchor2d,
							"from-toolbar",
						),
					],
				],
			},
		]);

		expect(result.anchor2d).toEqual(["from-toolbar"]);
	});
});
