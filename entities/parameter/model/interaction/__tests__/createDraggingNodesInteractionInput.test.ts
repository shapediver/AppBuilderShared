import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {vec3} from "gl-matrix";
import {createDraggingNodesInteractionInput} from "../createDraggingNodesInteractionInput";
import type {ConvertedDragObject} from "../useConvertDraggingData";

jest.mock("@AppBuilderLib/shared/lib/logger", () => ({
	Logger: {warn: jest.fn()},
}));

const removeAvailableEffectsRef = {current: undefined};

const create = (objects: ConvertedDragObject[]) =>
	createDraggingNodesInteractionInput(
		objects,
		"component",
		true,
		removeAvailableEffectsRef,
		true,
	);

describe("createDraggingNodesInteractionInput", () => {
	beforeEach(() => jest.clearAllMocks());

	it("keys instance entries by the instance ID", () => {
		const input = create([
			{
				patterns: {
					outputPatterns: {},
					instancePatterns: {vase_A: [["transformations[0]"]]},
				},
				restrictions: ["zPlane"],
			},
		]);

		expect(Object.keys(input)).toEqual(["vase_A"]);
		expect(input.vase_A).toMatchObject({
			componentId: "component",
			patterns: [["transformations[0]"]],
			interactionSettings: {select: false, hover: true, drag: true},
			strictNaming: true,
		});
		expect(input.vase_A.sessionId).toBeUndefined();
		expect(input.vase_A.outputId).toBeUndefined();
	});

	it("keys output entries per object, session and output", () => {
		const input = create([
			{
				patterns: {
					outputPatterns: {session: {output: [["a"]]}},
					instancePatterns: {},
				},
				restrictions: [],
			},
			{
				patterns: {
					outputPatterns: {session: {output: [["b"]]}},
					instancePatterns: {},
				},
				restrictions: [],
			},
		]);

		expect(input.object0_session_output).toMatchObject({
			sessionId: "session",
			outputId: "output",
			patterns: [["a"]],
			removeAvailableEffectsRef,
		});
		expect(input.object1_session_output.patterns).toEqual([["b"]]);
	});

	it("merges the patterns of objects on the same instance", () => {
		const input = create([
			{
				patterns: {
					instancePatterns: {vase_A: [["transformations[0]"]]},
				},
				restrictions: ["zPlane"],
			},
			{
				patterns: {instancePatterns: {vase_A: [["lid"]]}},
				restrictions: ["line"],
			},
			{
				patterns: {
					instancePatterns: {vase_B: [["transformations[0]"]]},
				},
				restrictions: [],
			},
		]);

		expect(input.vase_A.patterns).toEqual([
			["transformations[0]"],
			["lid"],
		]);
		expect(input.vase_B.patterns).toEqual([["transformations[0]"]]);
		expect(Logger.warn).not.toHaveBeenCalled();
	});

	it("keeps the first drag origin on a shared instance and warns", () => {
		const first = vec3.fromValues(0, 0, 0);
		const input = create([
			{
				patterns: {instancePatterns: {vase_A: [["a"]]}},
				restrictions: [],
				dragOrigin: first,
			},
			{
				patterns: {instancePatterns: {vase_A: [["b"]]}},
				restrictions: [],
				dragOrigin: vec3.fromValues(0, 0, 1),
			},
		]);

		expect(input.vase_A.interactionSettings.dragOrigin).toBe(first);
		expect(Logger.warn).toHaveBeenCalledTimes(1);
	});
});
