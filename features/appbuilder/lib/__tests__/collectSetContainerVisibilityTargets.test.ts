import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {collectSetContainerVisibilityTargets} from "../collectSetContainerVisibilityTargets";

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
});
