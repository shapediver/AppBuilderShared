import type {ISessionApi} from "@shapediver/viewer.session";
import {createModelStateCore} from "../createModelStateCore";

function makeSession(overrides: Record<string, unknown> = {}) {
	return {
		parameters: {
			a: {id: "a", name: "Keep", value: 1},
			b: {id: "b", name: "Drop", value: 2},
		},
		modelViewUrl: "https://example.com/",
		createModelState: jest.fn(async () => "ms-1"),
		...overrides,
	} as unknown as ISessionApi;
}

async function create(
	args: Partial<Parameters<typeof createModelStateCore>[0]> & {
		sessionApi?: ISessionApi | undefined;
	} = {},
) {
	const sessionApi =
		"sessionApi" in args ? args.sessionApi : makeSession();
	return createModelStateCore({
		sessionApi,
		sessions: args.sessions ?? (sessionApi ? {s1: sessionApi} : {}),
		sessionId: args.sessionId ?? "s1",
		clearUnsavedChanges: args.clearUnsavedChanges ?? jest.fn(),
		parameterNamesToAlwaysExclude: args.parameterNamesToAlwaysExclude ?? [],
		props: args.props ?? {},
		viewportAccessFunctions: args.viewportAccessFunctions,
		markSaved: args.markSaved,
	});
}

describe("createModelStateCore", () => {
	it("returns {} when sessionApi is undefined", async () => {
		const result = await create({sessionApi: undefined, sessions: {}});
		expect(result).toEqual({});
	});

	it("calls sessionApi.createModelState with filtered params and returns URLs", async () => {
		const clearUnsavedChanges = jest.fn();
		const sessionApi = makeSession();

		const result = await create({
			sessionApi,
			sessions: {s1: sessionApi},
			clearUnsavedChanges,
			props: {
				parameterNamesToInclude: ["Keep"],
				includeGltf: true,
			},
		});

		expect(sessionApi.createModelState).toHaveBeenCalledWith(
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

	it("drops a parameter whose displayname is not in the include list", async () => {
		const sessionApi = makeSession({
			parameters: {
				a: {
					id: "a",
					name: "internal",
					displayname: "Other",
					value: 1,
				},
			},
		});
		await create({
			sessionApi,
			props: {parameterNamesToInclude: ["Keep"]},
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("includes a parameter matched by displayname", async () => {
		const sessionApi = makeSession({
			parameters: {
				a: {
					id: "a",
					name: "internal",
					displayname: "Keep",
					value: 1,
				},
			},
		});
		await create({
			sessionApi,
			props: {parameterNamesToInclude: ["Keep"]},
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{a: 1},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("excludes a parameter by name when it has no displayname", async () => {
		const sessionApi = makeSession();
		await create({
			sessionApi,
			props: {parameterNamesToExclude: ["Drop"]},
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{a: 1},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("keeps a name-excluded parameter when displayname is not excluded", async () => {
		const sessionApi = makeSession({
			parameters: {
				a: {
					id: "a",
					name: "Drop",
					displayname: "Shown",
					value: 1,
				},
			},
		});
		await create({
			sessionApi,
			props: {parameterNamesToExclude: ["Drop"]},
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{a: 1},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("drops a parameter listed in parameterNamesToAlwaysExclude", async () => {
		const sessionApi = makeSession();
		await create({
			sessionApi,
			parameterNamesToAlwaysExclude: ["Drop"],
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{a: 1},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("keeps an always-excluded name when displayname is not always-excluded", async () => {
		const sessionApi = makeSession({
			parameters: {
				a: {
					id: "a",
					name: "Secret",
					displayname: "Shown",
					value: 1,
				},
			},
		});
		await create({
			sessionApi,
			parameterNamesToAlwaysExclude: ["Secret"],
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{a: 1},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("passes screenshotProps to getScreenshot when capturing an image", async () => {
		const getScreenshot = jest
			.fn()
			.mockResolvedValue("data:image/png;base64,test");
		const sessionApi = makeSession({parameters: {}});
		const screenshotProps = {
			contentType: "image/jpeg",
			quality: 0.7,
			resolution: {width: 800, height: 600},
		};

		await create({
			sessionApi,
			viewportAccessFunctions: {getScreenshot},
			props: {includeImage: true, screenshotProps},
		});

		expect(getScreenshot).toHaveBeenCalledWith(screenshotProps);
	});

	it("does not capture a screenshot when includeImage is omitted", async () => {
		const getScreenshot = jest.fn();
		const sessionApi = makeSession({parameters: {}});
		await create({
			sessionApi,
			viewportAccessFunctions: {getScreenshot},
			props: {},
		});
		expect(getScreenshot).not.toHaveBeenCalled();
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("does not treat an empty image ref as an export", async () => {
		const sessionApi = makeSession({parameters: {}});
		await create({
			sessionApi,
			props: {image: {}},
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("uses image.href when includeImage is not false", async () => {
		const sessionApi = makeSession({parameters: {}});
		const result = await create({
			sessionApi,
			props: {image: {href: "https://cdn.example/img.png"}},
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			"https://cdn.example/img.png",
			undefined,
			undefined,
		);
		expect(result.screenshot).toBe("https://cdn.example/img.png");
		expect(result.modelStateImageUrl).toBe(
			"https://example.com/api/v2/model-state/ms-1/image",
		);
	});

	it("uses image.href when includeImage is true", async () => {
		const getScreenshot = jest.fn();
		const sessionApi = makeSession({parameters: {}});
		await create({
			sessionApi,
			viewportAccessFunctions: {getScreenshot},
			props: {
				includeImage: true,
				image: {href: "https://cdn.example/img.png"},
			},
		});
		expect(getScreenshot).not.toHaveBeenCalled();
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			"https://cdn.example/img.png",
			undefined,
			undefined,
		);
	});

	it("ignores image.href when includeImage is false", async () => {
		const getScreenshot = jest.fn();
		const sessionApi = makeSession({parameters: {}});
		await create({
			sessionApi,
			viewportAccessFunctions: {getScreenshot},
			props: {
				includeImage: false,
				image: {href: "https://cdn.example/img.png"},
			},
		});
		expect(getScreenshot).not.toHaveBeenCalled();
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("resolves image.export by id from the named session", async () => {
		const request = jest.fn().mockResolvedValue({
			content: [{href: "https://export.example/img.png"}],
		});
		const exportSession = {
			exports: {
				e1: {id: "e1", name: "Exp", displayname: "Export Display", request},
			},
		};
		const sessionApi = makeSession({parameters: {}});
		await create({
			sessionApi,
			sessions: {s1: sessionApi, other: exportSession as ISessionApi},
			props: {image: {export: {name: "e1", sessionId: "other"}}},
		});
		expect(request).toHaveBeenCalled();
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			"https://export.example/img.png",
			undefined,
			undefined,
		);
	});

	it("resolves image.export by name using the current session", async () => {
		const request = jest.fn().mockResolvedValue({
			content: [{href: "https://export.example/by-name.png"}],
		});
		const sessionApi = makeSession({
			parameters: {},
			exports: {
				x: {id: "x", name: "Exp", displayname: "Other", request},
			},
		});
		await create({
			sessionApi,
			sessions: {s1: sessionApi},
			props: {image: {export: {name: "Exp"}}},
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			"https://export.example/by-name.png",
			undefined,
			undefined,
		);
	});

	it("resolves image.export by displayname", async () => {
		const request = jest.fn().mockResolvedValue({
			content: [{href: "https://export.example/by-display.png"}],
		});
		const sessionApi = makeSession({
			parameters: {},
			exports: {
				x: {id: "x", name: "Exp", displayname: "Export Display", request},
			},
		});
		await create({
			sessionApi,
			sessions: {s1: sessionApi},
			props: {image: {export: {name: "Export Display"}}},
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			"https://export.example/by-display.png",
			undefined,
			undefined,
		);
	});

	it("skips image.export when the export session is missing", async () => {
		const sessionApi = makeSession({parameters: {}});
		await create({
			sessionApi,
			sessions: {s1: sessionApi},
			props: {image: {export: {name: "e1", sessionId: "missing"}}},
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("skips image.export when no export matches", async () => {
		const sessionApi = makeSession({
			parameters: {},
			exports: {
				x: {
					id: "x",
					name: "Exp",
					displayname: "Other",
					request: jest.fn(),
				},
			},
		});
		await create({
			sessionApi,
			sessions: {s1: sessionApi},
			props: {image: {export: {name: "nope"}}},
		});
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("skips image.export when the export result has no content", async () => {
		const request = jest.fn().mockResolvedValue({});
		const sessionApi = makeSession({
			parameters: {},
			exports: {x: {id: "x", name: "Exp", request}},
		});
		await create({
			sessionApi,
			sessions: {s1: sessionApi},
			props: {image: {export: {name: "x"}}},
		});
		expect(request).toHaveBeenCalled();
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("skips image.export when the export result has no href", async () => {
		const request = jest.fn().mockResolvedValue({content: [{}]});
		const sessionApi = makeSession({
			parameters: {},
			exports: {x: {id: "x", name: "Exp", request}},
		});
		await create({
			sessionApi,
			sessions: {s1: sessionApi},
			props: {image: {export: {name: "x"}}},
		});
		expect(request).toHaveBeenCalled();
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			undefined,
			undefined,
			undefined,
		);
	});

	it("does not clear unsaved changes when markSaved is false", async () => {
		const clearUnsavedChanges = jest.fn();
		await create({clearUnsavedChanges, markSaved: false});
		expect(clearUnsavedChanges).not.toHaveBeenCalled();
	});

	it("does not clear unsaved changes when no model state id is returned", async () => {
		const clearUnsavedChanges = jest.fn();
		const sessionApi = makeSession({
			createModelState: jest.fn(async () => undefined),
		});
		const result = await create({
			sessionApi,
			clearUnsavedChanges,
			props: {includeGltf: true},
		});
		expect(clearUnsavedChanges).not.toHaveBeenCalled();
		expect(result.modelStateGltfUrl).toBeUndefined();
		expect(result.modelStateUsdzUrl).toBeUndefined();
		expect(result.modelStateImageUrl).toBeUndefined();
	});

	it("leaves modelViewUrl unchanged when it has no trailing slash", async () => {
		const sessionApi = makeSession({
			modelViewUrl: "https://example.com",
		});
		const result = await create({sessionApi});
		expect(result.modelViewUrl).toBe("https://example.com");
	});

	it("omits gltf urls when includeGltf is not set", async () => {
		const result = await create();
		expect(result.modelStateGltfUrl).toBeUndefined();
		expect(result.modelStateUsdzUrl).toBeUndefined();
	});

	it("passes data through and invokes convertToGlTF when includeGltf is set", async () => {
		const convertToGlTF = jest.fn().mockResolvedValue(undefined);
		const sessionApi = makeSession({parameters: {}});
		const data = {foo: "bar"};
		await create({
			sessionApi,
			viewportAccessFunctions: {convertToGlTF},
			props: {includeGltf: true, data},
		});
		const gltfCb = (sessionApi.createModelState as jest.Mock).mock
			.calls[0][4];
		expect(gltfCb).toEqual(expect.any(Function));
		await gltfCb();
		expect(convertToGlTF).toHaveBeenCalled();
		expect(sessionApi.createModelState).toHaveBeenCalledWith(
			{},
			true,
			undefined,
			data,
			gltfCb,
		);
	});
});
