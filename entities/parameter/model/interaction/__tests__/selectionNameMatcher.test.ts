/**
 * @jest-environment jsdom
 */
import {matchNodesWithPatterns} from "@shapediver/viewer.features.interaction";
import type {ITreeNode} from "@shapediver/viewer.session";
import {matchSelectionNames} from "../selectionNameMatcher";
import {getPatterns} from "../useCreateNameFilterPattern";

jest.mock(
	"@AppBuilderLib/entities/session/model/useShapeDiverStoreSession",
	() => ({
		useShapeDiverStoreSession: {
			getState: () => ({sessions: {session: {}}}),
		},
	}),
);
jest.mock(
	"@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreInstances",
	() => ({
		useShapeDiverStoreInstances: {
			getState: () => ({instances: {instance: {}}}),
		},
	}),
);
jest.mock("@shapediver/viewer.features.interaction", () => ({
	matchNodesWithPatterns: jest.fn(),
}));
jest.mock("../useCreateNameFilterPattern", () => ({getPatterns: jest.fn()}));

const nodes = [{id: "a"}, {id: "b"}] as unknown as ITreeNode[];

describe("matchSelectionNames", () => {
	beforeEach(() => jest.clearAllMocks());

	it("matches the nodes with the patterns of the sessions and instances", () => {
		const outputPatterns = {session: {out: [["Box"]]}};
		const instancePatterns = {instance: [["Box"]]};
		(getPatterns as jest.Mock).mockReturnValue({
			outputPatterns,
			instancePatterns,
		});
		(matchNodesWithPatterns as jest.Mock).mockImplementation((patterns) =>
			patterns === instancePatterns ? ["i.1"] : ["out.1"],
		);

		const names = matchSelectionNames(["out.Box*", "instance.Box"], nodes);

		expect(Array.from(names).sort()).toEqual(["i.1", "out.1"]);
		expect(getPatterns).toHaveBeenCalledWith(
			{session: {}},
			{instance: {}},
			["out.Box*", "instance.Box"],
		);
		expect(matchNodesWithPatterns).toHaveBeenCalledWith(
			outputPatterns.session,
			nodes,
			true,
		);
	});

	it("matches nothing without filters or nodes", () => {
		expect(matchSelectionNames([], nodes).size).toBe(0);
		expect(matchSelectionNames(["out.*"], []).size).toBe(0);
		expect(getPatterns).not.toHaveBeenCalled();
	});
});
