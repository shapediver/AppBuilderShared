/**
 * @jest-environment jsdom
 */

jest.mock("@shapediver/viewer.session", () => ({
	SystemInfo: {instance: {isMobile: false}},
}));

import {act, renderHook} from "@testing-library/react";
import {runtimeToolbarContributionRegistry} from "../runtimeToolbarContributionRegistry";
import {CUSTOM_SESSION_ID_POSTFIX} from "../useAppBuilderCustomParameters";
import {useAppBuilderToolbars} from "../useAppBuilderToolbars";

const command = (id: string) => ({
	type: "command" as const,
	id,
	label: id,
	props: {execute: jest.fn()},
});

const contribution = (id: string, namespace: string, order?: number) => ({
	id,
	namespace,
	viewportId: "viewport",
	sectionId: id,
	order,
	menu: {id: `${id}-menu`, label: id, icon: "tabler:menu"},
	items: [],
	commands: [command(`${id}-command`)],
});

const commandIds = (
	toolbars: ReturnType<typeof useAppBuilderToolbars>["toolbars"],
) =>
	toolbars.flatMap((toolbar) =>
		toolbar.groups.flatMap((group) =>
			group
				.filter((item) => item.type === "command")
				.map((item) => item.id),
		),
	);

describe("useAppBuilderToolbars runtime contributions", () => {
	beforeEach(() => runtimeToolbarContributionRegistry.reset());
	afterEach(() => runtimeToolbarContributionRegistry.reset());

	it("shows the controls of session parameters", () => {
		runtimeToolbarContributionRegistry.register(
			contribution("selection", "default"),
		);
		const {result} = renderHook(() =>
			useAppBuilderToolbars({
				viewportId: "viewport",
				namespace: "default",
			}),
		);
		expect(commandIds(result.current.toolbars)).toEqual([
			"selection-command",
		]);
	});

	it("shows the controls of custom parameters of the model's App Builder output", () => {
		runtimeToolbarContributionRegistry.register(
			contribution("rectangle", `default${CUSTOM_SESSION_ID_POSTFIX}`),
		);
		const {result} = renderHook(() =>
			useAppBuilderToolbars({
				viewportId: "viewport",
				namespace: "default",
			}),
		);
		expect(commandIds(result.current.toolbars)).toEqual([
			"rectangle-command",
		]);
	});

	it("orders session and custom contributions together", () => {
		runtimeToolbarContributionRegistry.register(
			contribution("custom", `default${CUSTOM_SESSION_ID_POSTFIX}`, 1),
		);
		runtimeToolbarContributionRegistry.register(
			contribution("session", "default", 2),
		);
		const {result} = renderHook(() =>
			useAppBuilderToolbars({
				viewportId: "viewport",
				namespace: "default",
			}),
		);
		expect(commandIds(result.current.toolbars)).toEqual([
			"custom-command",
			"session-command",
		]);
	});

	it("ignores contributions of other sessions and viewports", () => {
		runtimeToolbarContributionRegistry.register(
			contribution("other-session", `other${CUSTOM_SESSION_ID_POSTFIX}`),
		);
		runtimeToolbarContributionRegistry.register({
			...contribution("other-viewport", "default"),
			viewportId: "other",
		});
		const {result} = renderHook(() =>
			useAppBuilderToolbars({
				viewportId: "viewport",
				namespace: "default",
			}),
		);
		expect(commandIds(result.current.toolbars)).toEqual([]);
	});

	it("follows contributions registered later", () => {
		const {result} = renderHook(() =>
			useAppBuilderToolbars({
				viewportId: "viewport",
				namespace: "default",
			}),
		);
		expect(commandIds(result.current.toolbars)).toEqual([]);
		act(() => {
			runtimeToolbarContributionRegistry.register(
				contribution(
					"rectangle",
					`default${CUSTOM_SESSION_ID_POSTFIX}`,
				),
			);
		});
		expect(commandIds(result.current.toolbars)).toEqual([
			"rectangle-command",
		]);
	});
});
