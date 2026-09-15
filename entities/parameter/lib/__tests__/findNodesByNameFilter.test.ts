/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreInstances} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreInstances";
import {ISessionApi, ITreeNode} from "@shapediver/viewer.session";
import {
	collectNodesForPatternRoot,
	findNodesByNameFilter,
} from "../findNodesByNameFilter";

jest.mock("@shapediver/viewer.features.interaction", () => ({
	convertUserDefinedNameFilters: (
		nameFilter: string[],
		mapping: {[outputId: string]: string},
	) => {
		const pattern: {[outputId: string]: string[][]} = {};
		for (const [outputId, name] of Object.entries(mapping)) {
			if (nameFilter.includes(name) || nameFilter.includes(outputId)) {
				pattern[outputId] = [[]];
			}
		}
		return pattern;
	},
	convertUserDefinedNameFiltersForInstances: (
		nameFilter: string[],
		instanceIds: string[],
	) => {
		const pattern: {[instanceId: string]: string[][]} = {};
		for (const instanceId of instanceIds) {
			if (nameFilter.includes(instanceId)) {
				pattern[instanceId] = [[]];
			}
		}
		return pattern;
	},
	gatherNodesForPattern: jest.fn(),
}));

const treeNode = (id: string, name: string): ITreeNode =>
	({
		id,
		name,
		children: [],
		boundingBox: {min: [0, 0, 0], max: [1, 1, 1]},
	}) as unknown as ITreeNode;

describe("findNodesByNameFilter", () => {
	const originalSessionGetState = useShapeDiverStoreSession.getState;
	const originalInstancesGetState = useShapeDiverStoreInstances.getState;

	afterEach(() => {
		useShapeDiverStoreSession.getState = originalSessionGetState;
		useShapeDiverStoreInstances.getState = originalInstancesGetState;
	});

	it("returns no nodes when the filter is empty", () => {
		expect(findNodesByNameFilter()).toEqual([]);
		expect(findNodesByNameFilter([])).toEqual([]);
	});

	it("collects the output root when the pattern is empty", () => {
		const node = treeNode("out-node", "Display");
		useShapeDiverStoreSession.getState = () =>
			({
				sessions: {
					session: {
						outputs: {
							out1: {name: "Display", node},
						},
					} as unknown as ISessionApi,
				},
			}) as ReturnType<typeof originalSessionGetState>;
		useShapeDiverStoreInstances.getState = () =>
			({
				instances: {},
			}) as ReturnType<typeof originalInstancesGetState>;

		expect(findNodesByNameFilter(["Display"])).toEqual([node]);
	});

	it("collects a matching instance root", () => {
		const instance = treeNode("inst-1", "inst-1");
		useShapeDiverStoreSession.getState = () =>
			({
				sessions: {},
			}) as ReturnType<typeof originalSessionGetState>;
		useShapeDiverStoreInstances.getState = () =>
			({
				instances: {"inst-1": instance},
			}) as ReturnType<typeof originalInstancesGetState>;

		expect(findNodesByNameFilter(["inst-1"])).toEqual([instance]);
	});
});

describe("collectNodesForPatternRoot", () => {
	it("selects the root for an empty pattern", () => {
		const root = treeNode("root", "Root");
		expect(collectNodesForPatternRoot(root, "Root", [[]])).toEqual([root]);
	});

	it("returns no nodes when there are no patterns", () => {
		const root = treeNode("root", "Root");
		expect(collectNodesForPatternRoot(root, "Root", [])).toEqual([]);
	});
});
