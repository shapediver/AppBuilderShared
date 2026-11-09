/**
 * @jest-environment jsdom
 */
import {mergeTransformationEvent} from "@AppBuilderLib/entities/parameter/lib/transformedNodes";
import {adoptExclusivePreview} from "../adoptExclusivePreview";

const matrix = (value: number) => [value];

describe("adoptExclusivePreview", () => {
	it("does not replace the previous object's transformation with the promoted matrix", () => {
		const nodeNamesRef = {
			current: new Map([["node-a", "Boxes.box_a"]]),
		};
		const stillSelected = ["Boxes.box_a"];
		let stored = [
			{
				name: "Boxes.box_a",
				transformation: matrix(5),
				localTransformations: matrix(4),
			},
		];
		const promote = jest.fn(() => {
			// promote reports its matrix before returning, while the
			// selection state is still the previous object
			stored = mergeTransformationEvent(
				stored,
				{
					nodes: [{id: "node-b"}],
					transformations: [matrix(0)],
					localTransformations: [matrix(0)],
				},
				nodeNamesRef.current,
				stillSelected,
			);
		});

		adoptExclusivePreview({
			nodeNamesRef,
			selectionGizmo: {close: jest.fn()},
			preview: {
				promote,
				candidate: {
					name: "Boxes.box_b",
					node: {id: "node-b"},
				},
			},
			componentId: "rectangle",
			setSelected: jest.fn(),
			clearSelectionGizmo: jest.fn(),
		});

		expect(promote).toHaveBeenCalledWith("rectangle");
		expect(stored).toEqual([
			{
				name: "Boxes.box_a",
				transformation: matrix(5),
				localTransformations: matrix(4),
			},
		]);
	});
});
