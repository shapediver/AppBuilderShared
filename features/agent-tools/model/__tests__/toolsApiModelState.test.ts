const createModelStateFromStores = jest.fn();
const importModelStateFromStore = jest.fn();

jest.mock(
	"@AppBuilderLib/features/appbuilder/model/runAppBuilderActionCreateModelState",
	() => ({
		createModelStateFromStores: (...args: unknown[]) =>
			createModelStateFromStores(...args),
	}),
);

jest.mock(
	"@AppBuilderLib/features/model-state/lib/importModelStateFromStore",
	() => ({
		importModelStateFromStore: (...args: unknown[]) =>
			importModelStateFromStore(...args),
	}),
);

jest.mock(
	"@AppBuilderLib/entities/viewport/lib/resolveViewportIdFromStore",
	() => ({
		resolveViewportIdFromStore: () => "viewport_1",
	}),
);

import {toolsApiModelStateHandlers} from "../toolsApiModelState";

describe("toolsApiModelStateHandlers", () => {
	beforeEach(() => {
		createModelStateFromStores.mockReset();
		importModelStateFromStore.mockReset();
	});

	it("creates a model state for the live namespace", async () => {
		createModelStateFromStores.mockResolvedValue({modelStateId: "ms-1"});
		const handlers = toolsApiModelStateHandlers(() => "session-a");
		await expect(
			handlers.createModelState({includeImage: false}),
		).resolves.toEqual({modelStateId: "ms-1"});
		expect(createModelStateFromStores).toHaveBeenCalledWith(
			"session-a",
			"viewport_1",
			{includeImage: false},
		);
	});

	it("returns an empty result when no session is open", async () => {
		const handlers = toolsApiModelStateHandlers(() => undefined);
		await expect(handlers.createModelState({})).resolves.toEqual({});
		expect(createModelStateFromStores).not.toHaveBeenCalled();
	});

	it("rejects create payloads the model-state schema does not allow", async () => {
		const handlers = toolsApiModelStateHandlers(() => "session-a");
		await expect(
			handlers.createModelState({
				includeImage: "yes",
			} as never),
		).rejects.toThrow("Invalid data for createModelState");
		expect(createModelStateFromStores).not.toHaveBeenCalled();
	});

	it("imports a model state for the live namespace", async () => {
		importModelStateFromStore.mockResolvedValue({
			success: true,
			data: {id: "ms-1"},
		});
		const handlers = toolsApiModelStateHandlers(() => "session-a");
		await expect(
			handlers.importModelState({modelStateId: "ms-1"}),
		).resolves.toEqual({success: true, data: {id: "ms-1"}});
		expect(importModelStateFromStore).toHaveBeenCalledWith("session-a", {
			modelStateId: "ms-1",
		});
	});

	it("reports a closed session instead of importing", async () => {
		const handlers = toolsApiModelStateHandlers(() => "  ");
		await expect(
			handlers.importModelState({modelStateId: "ms-1"}),
		).resolves.toEqual({success: false, message: "No session is open."});
		expect(importModelStateFromStore).not.toHaveBeenCalled();
	});
});
