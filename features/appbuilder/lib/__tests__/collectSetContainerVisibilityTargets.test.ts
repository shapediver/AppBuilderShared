import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	collectAnchor2dTriggerIds,
	collectOpeningAnchorIds,
	collectSetContainerVisibilityTargets,
	targetsAnchorContainer,
} from "../collectSetContainerVisibilityTargets";

const visibility = (
	name: string,
	id: string | undefined,
	mode: "open" | "close" | "toggle",
) => ({
	type: "setContainerVisibility",
	props: {
		container: {name, props: id ? {id} : undefined},
		mode,
	},
});

describe("collectSetContainerVisibilityTargets", () => {
	it("walks nested executeActions and keeps mode", () => {
		const targets = collectSetContainerVisibilityTargets([
			visibility(AppBuilderContainerNameType.Left, undefined, "close"),
			{
				type: "executeActions",
				props: {
					actions: [
						visibility(
							AppBuilderContainerNameType.Anchor2d,
							"panel-a",
							"toggle",
						),
						{
							type: "undo",
							props: {},
						},
						{
							type: "executeActions",
							props: {
								actions: [
									visibility(
										AppBuilderContainerNameType.Anchor3d,
										"panel-b",
										"open",
									),
								],
							},
						},
					],
				},
			},
		]);

		expect(targets).toEqual([
			{
				name: AppBuilderContainerNameType.Left,
				id: undefined,
				mode: "close",
			},
			{
				name: AppBuilderContainerNameType.Anchor2d,
				id: "panel-a",
				mode: "toggle",
			},
			{
				name: AppBuilderContainerNameType.Anchor3d,
				id: "panel-b",
				mode: "open",
			},
		]);
	});

	it("treats open and a closed toggle as opening, and skips close", () => {
		const actions = [
			visibility(AppBuilderContainerNameType.Anchor2d, "open-me", "open"),
			visibility(
				AppBuilderContainerNameType.Anchor2d,
				"toggle-closed",
				"toggle",
			),
			visibility(
				AppBuilderContainerNameType.Anchor3d,
				"toggle-open",
				"toggle",
			),
			visibility(AppBuilderContainerNameType.Anchor2d, "stay", "close"),
			visibility(AppBuilderContainerNameType.Left, "left", "open"),
		];

		expect(
			collectOpeningAnchorIds(actions, (id) => id === "toggle-open"),
		).toEqual(["open-me", "toggle-closed"]);
		expect(collectAnchor2dTriggerIds(actions)).toEqual([
			"open-me",
			"toggle-closed",
			"stay",
		]);
		expect(targetsAnchorContainer(actions)).toBe(true);
		expect(
			targetsAnchorContainer([
				visibility(AppBuilderContainerNameType.Left, "left", "open"),
				{type: "undo", props: {}},
			]),
		).toBe(false);
	});
});
