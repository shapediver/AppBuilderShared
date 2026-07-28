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
import {buildMastraDeps} from "../mastraDeps";

describe("buildMastraDeps", () => {
	it("reads parameter namespaces from Zustand getState", () => {
		const deps = buildMastraDeps("main");
		expect(deps.listParameterNamespaces()).toEqual(["main"]);
		expect(deps.getLiveParameters("main")).toHaveLength(1);
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
});
