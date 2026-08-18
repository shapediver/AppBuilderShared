import type {ISessionApi} from "@shapediver/viewer.session";
import {createModelStateCore} from "../createModelStateCore";

describe("createModelStateCore", () => {
	it("returns {} when sessionApi is undefined", async () => {
		const result = await createModelStateCore({
			sessionApi: undefined,
			sessions: {},
			sessionId: "s1",
			clearUnsavedChanges: jest.fn(),
			parameterNamesToAlwaysExclude: [],
			props: {},
		});
		expect(result).toEqual({});
	});

	it("calls sessionApi.createModelState with filtered params and returns URLs", async () => {
		const clearUnsavedChanges = jest.fn();
		const createModelState = jest.fn(async () => "ms-1");
		const sessionApi = {
			parameters: {
				a: {id: "a", name: "Keep", value: 1},
				b: {id: "b", name: "Drop", value: 2},
			},
			modelViewUrl: "https://example.com/",
			createModelState,
		} as unknown as ISessionApi;

		const result = await createModelStateCore({
			sessionApi,
			sessions: {s1: sessionApi},
			sessionId: "s1",
			clearUnsavedChanges,
			parameterNamesToAlwaysExclude: [],
			props: {
				parameterNamesToInclude: ["Keep"],
				includeGltf: true,
			},
		});

		expect(createModelState).toHaveBeenCalledWith(
			{a: 1},
			true,
			undefined,
			undefined,
			undefined,
		);
		expect(clearUnsavedChanges).toHaveBeenCalled();
		expect(result).toEqual({
			modelStateId: "ms-1",
			screenshot: undefined,
			modelViewUrl: "https://example.com",
			modelStateImageUrl: undefined,
			modelStateGltfUrl: "https://example.com/api/v2/ar-scene/ms-1/gltf",
			modelStateUsdzUrl: "https://example.com/api/v2/ar-scene/ms-1/usdz",
		});
	});

	it("passes screenshotProps to getScreenshot when capturing an image", async () => {
		const getScreenshot = jest
			.fn()
			.mockResolvedValue("data:image/png;base64,test");
		const createModelState = jest.fn(async () => "ms-1");
		const sessionApi = {
			parameters: {},
			modelViewUrl: "https://example.com",
			createModelState,
		} as unknown as ISessionApi;
		const screenshotProps = {
			contentType: "image/jpeg",
			quality: 0.7,
			resolution: {width: 800, height: 600},
		};

		await createModelStateCore({
			sessionApi,
			sessions: {s1: sessionApi},
			sessionId: "s1",
			clearUnsavedChanges: jest.fn(),
			parameterNamesToAlwaysExclude: [],
			viewportAccessFunctions: {getScreenshot},
			props: {includeImage: true, screenshotProps},
		});

		expect(getScreenshot).toHaveBeenCalledWith(screenshotProps);
	});
});
