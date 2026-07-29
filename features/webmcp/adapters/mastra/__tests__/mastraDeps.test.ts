jest.mock(
	"@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters",
	() => ({
		useShapeDiverStoreParameters: {
			getState: () => ({
				parameterStores: {
					main: {
						width: {getState: () => ({definition: {id: "width"}})},
					},
				},
				batchParameterValueUpdate: jest.fn(),
			}),
		},
	}),
);

jest.mock("../createModelStateFromStores", () => ({
	createModelStateFromStores: jest.fn(async () => ({modelStateId: "ms"})),
}));
jest.mock("../importModelStateFromStores", () => ({
	importModelStateFromStores: jest.fn(async () => ({
		success: true,
		data: {},
	})),
}));

import {createModelStateFromStores} from "../createModelStateFromStores";
import {importModelStateFromStores} from "../importModelStateFromStores";
import {buildMastraDeps} from "../mastraDeps";

describe("buildMastraDeps", () => {
	it("reads parameter namespaces from Zustand getState", () => {
		const deps = buildMastraDeps("main");
		expect(deps.listParameterNamespaces()).toEqual(["main"]);
		expect(deps.getLiveParameters("main")).toHaveLength(1);
	});

	it("returns empty array for missing namespace in getLiveParameters", () => {
		const deps = buildMastraDeps("main");
		expect(deps.getLiveParameters("nonexistent")).toEqual([]);
	});

	it("exposes batchParameterValueUpdate as a function", () => {
		const deps = buildMastraDeps("main");
		expect(typeof deps.batchParameterValueUpdate).toBe("function");
	});

	it("delegates createModelState to store helper", async () => {
		const deps = buildMastraDeps("main", {viewportId: "viewport_1"});
		await deps.createModelState({includeImage: false});
		expect(createModelStateFromStores).toHaveBeenCalledWith(
			"main",
			{includeImage: false},
			"viewport_1",
			[],
		);
	});

	it("passes parameterNamesToAlwaysExclude to createModelStateFromStores", async () => {
		const deps = buildMastraDeps("main", {
			viewportId: "viewport_1",
			parameterNamesToAlwaysExclude: ["context"],
		});
		await deps.createModelState({includeImage: false});
		expect(createModelStateFromStores).toHaveBeenCalledWith(
			"main",
			{includeImage: false},
			"viewport_1",
			["context"],
		);
	});

	it("delegates importModelState to store helper", async () => {
		const deps = buildMastraDeps("main");
		const props = {modelStateId: "ms-123"};
		await deps.importModelState(props);
		expect(importModelStateFromStores).toHaveBeenCalledWith("main", props);
	});
});
