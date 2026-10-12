/**
 * @jest-environment jsdom
 */
const mockRunCamera = jest.fn(async () => {});
const mockRunAr = jest.fn(async () => {});
const mockRunFullscreen = jest.fn(async () => {});

jest.mock("../runAppBuilderActionCamera", () => ({
	runAppBuilderActionCamera: (...args: unknown[]) => mockRunCamera(...args),
}));

jest.mock("../runAppBuilderActionAr", () => ({
	runAppBuilderActionAr: (...args: unknown[]) => mockRunAr(...args),
}));

jest.mock("../runAppBuilderActionFullscreen", () => ({
	runAppBuilderActionFullscreen: (...args: unknown[]) =>
		mockRunFullscreen(...args),
}));

jest.mock("../../ui/AppBuilderActionCameraComponent", () => ({
	__esModule: true,
	default: function AppBuilderActionCameraComponent() {
		return null;
	},
}));

jest.mock("../../ui/AppBuilderActionArComponent", () => ({
	__esModule: true,
	default: function AppBuilderActionArComponent() {
		return null;
	},
}));

jest.mock("../../ui/AppBuilderActionFullscreenComponent", () => ({
	__esModule: true,
	default: function AppBuilderActionFullscreenComponent() {
		return null;
	},
}));

import {AppBuilderActionType} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionType";
import type {IAppBuilderActionDefinition} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import AppBuilderActionArComponent from "../../ui/AppBuilderActionArComponent";
import AppBuilderActionCameraComponent from "../../ui/AppBuilderActionCameraComponent";
import AppBuilderActionFullscreenComponent from "../../ui/AppBuilderActionFullscreenComponent";
import {runAppBuilderActionAr} from "../runAppBuilderActionAr";
import {runAppBuilderActionCamera} from "../runAppBuilderActionCamera";
import {runAppBuilderActionFullscreen} from "../runAppBuilderActionFullscreen";
import {resolveHostViewerActionRun} from "../resolveHostViewerActionRun";

const camera = {
	type: AppBuilderActionType.Camera,
	props: {type: "zoomTo", props: {}},
} as IAppBuilderActionDefinition;

const ar = {
	type: AppBuilderActionType.Ar,
	props: {},
} as IAppBuilderActionDefinition;

const fullscreen = {
	type: AppBuilderActionType.Fullscreen,
	props: {},
} as IAppBuilderActionDefinition;

describe("resolveHostViewerActionRun", () => {
	it("returns undefined when the host omitted viewer actions", async () => {
		await expect(
			resolveHostViewerActionRun(camera, undefined),
		).resolves.toBeUndefined();
		await expect(
			resolveHostViewerActionRun(ar, {}),
		).resolves.toBeUndefined();
		await expect(
			resolveHostViewerActionRun(fullscreen, {}),
		).resolves.toBeUndefined();
	});

	it("returns undefined when the host registers isAction only", async () => {
		const host = {
			camera: {
				isAction: (definition: IAppBuilderActionDefinition) =>
					definition.type === "camera",
			},
			ar: {
				isAction: (definition: IAppBuilderActionDefinition) =>
					definition.type === "ar",
			},
			fullscreen: {
				isAction: (definition: IAppBuilderActionDefinition) =>
					definition.type === "fullscreen",
			},
		};
		await expect(
			resolveHostViewerActionRun(camera, host),
		).resolves.toBeUndefined();
		await expect(
			resolveHostViewerActionRun(ar, host),
		).resolves.toBeUndefined();
		await expect(
			resolveHostViewerActionRun(fullscreen, host),
		).resolves.toBeUndefined();
	});

	it("keeps a host-supplied run", async () => {
		const run = jest.fn(async () => {});
		const resolved = await resolveHostViewerActionRun(camera, {
			camera: {
				isAction: (definition) => definition.type === "camera",
				component: AppBuilderActionCameraComponent,
				run,
			},
		});
		expect(resolved).toBe(run);
	});

	it("does not fill a foreign component", async () => {
		const resolved = await resolveHostViewerActionRun(camera, {
			camera: {
				isAction: (definition) => definition.type === "camera",
				component: () => null,
			},
		});
		expect(resolved).toBeUndefined();
	});

	it("fills camera, AR, and fullscreen when the host renders the control without run", async () => {
		const host = {
			camera: {
				isAction: (definition: IAppBuilderActionDefinition) =>
					definition.type === "camera",
				component: AppBuilderActionCameraComponent,
			},
			ar: {
				isAction: (definition: IAppBuilderActionDefinition) =>
					definition.type === "ar",
				component: AppBuilderActionArComponent,
			},
			fullscreen: {
				isAction: (definition: IAppBuilderActionDefinition) =>
					definition.type === "fullscreen",
				component: AppBuilderActionFullscreenComponent,
			},
		};
		await expect(resolveHostViewerActionRun(camera, host)).resolves.toBe(
			runAppBuilderActionCamera,
		);
		await expect(resolveHostViewerActionRun(ar, host)).resolves.toBe(
			runAppBuilderActionAr,
		);
		await expect(
			resolveHostViewerActionRun(fullscreen, host),
		).resolves.toBe(runAppBuilderActionFullscreen);
	});
});
