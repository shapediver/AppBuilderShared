/**
 * @jest-environment jsdom
 */
import {renderHook} from "@testing-library/react";
import {parseSelectionNames} from "../parseSelectionNames";
import {useCommittedSelectionAdoption} from "../useCommittedSelectionAdoption";

const serialize = (names: string[]) => JSON.stringify({names});

describe("parseSelectionNames", () => {
	it("extracts names from a serialized selection value", () => {
		expect(parseSelectionNames(serialize(["a", "b"]))).toEqual(["a", "b"]);
	});

	it("returns an empty selection for empty or invalid values", () => {
		expect(parseSelectionNames(undefined)).toEqual([]);
		expect(parseSelectionNames("")).toEqual([]);
		expect(parseSelectionNames("not json")).toEqual([]);
		expect(parseSelectionNames(JSON.stringify({foo: 1}))).toEqual([]);
	});
});

describe("useCommittedSelectionAdoption", () => {
	const setup = (committedValue: string, selectedNodeNames: string[]) => {
		const setSelectedNodeNames = jest.fn();
		const onAdopt = jest.fn();
		const hook = renderHook(
			(props: {committedValue: string; selectedNodeNames: string[]}) =>
				useCommittedSelectionAdoption({
					...props,
					setSelectedNodeNames,
					onAdopt,
				}),
			{initialProps: {committedValue, selectedNodeNames}},
		);

		return {...hook, setSelectedNodeNames, onAdopt};
	};

	it("does nothing on mount", () => {
		const {setSelectedNodeNames, onAdopt} = setup(serialize(["a"]), ["a"]);
		expect(setSelectedNodeNames).not.toHaveBeenCalled();
		expect(onAdopt).not.toHaveBeenCalled();
	});

	it("retains a draft while the committed value is unchanged", () => {
		const committedValue = serialize(["a"]);
		const {rerender, setSelectedNodeNames, onAdopt} = setup(
			committedValue,
			["a"],
		);

		// user changes the draft, e.g. another parameter triggers a computation
		rerender({committedValue, selectedNodeNames: ["b", "c"]});
		rerender({committedValue, selectedNodeNames: []});

		expect(setSelectedNodeNames).not.toHaveBeenCalled();
		expect(onAdopt).not.toHaveBeenCalled();
	});

	it("ignores committed changes that match the selection", () => {
		const {rerender, setSelectedNodeNames, onAdopt} = setup(
			serialize(["a"]),
			["b"],
		);

		// the component confirmed the selection ["b"] itself
		rerender({committedValue: serialize(["b"]), selectedNodeNames: ["b"]});

		expect(setSelectedNodeNames).not.toHaveBeenCalled();
		expect(onAdopt).not.toHaveBeenCalled();
	});

	it("replaces the draft when the committed value is changed externally", () => {
		const {rerender, setSelectedNodeNames, onAdopt} = setup(
			serialize(["a"]),
			["a"],
		);

		// the model (dynamic parameter) changed the value to ["b"]
		rerender({committedValue: serialize(["b"]), selectedNodeNames: ["a"]});

		expect(onAdopt).toHaveBeenCalledTimes(1);
		expect(setSelectedNodeNames).toHaveBeenCalledTimes(1);
		expect(setSelectedNodeNames).toHaveBeenCalledWith(["b"]);
	});

	it("adopts an externally cleared value", () => {
		const {rerender, setSelectedNodeNames} = setup(serialize(["a"]), ["a"]);

		rerender({committedValue: serialize([]), selectedNodeNames: ["a"]});

		expect(setSelectedNodeNames).toHaveBeenCalledWith([]);
	});

	it("adopts the committed value when the commit revision changes", () => {
		const setSelectedNodeNames = jest.fn();
		const onAdopt = jest.fn();
		const {rerender} = renderHook(
			(props: {
				committedValue: string | undefined;
				commitRevision: number;
				selectedNodeNames: string[];
			}) =>
				useCommittedSelectionAdoption({
					...props,
					setSelectedNodeNames,
					onAdopt,
				}),
			{
				initialProps: {
					committedValue: serialize([]),
					commitRevision: 0,
					selectedNodeNames: [] as string[],
				},
			},
		);

		// draft, no commit: retained
		rerender({
			committedValue: serialize([]),
			commitRevision: 0,
			selectedNodeNames: ["a"],
		});
		expect(setSelectedNodeNames).not.toHaveBeenCalled();

		// commit to the same value (e.g. reset after executing ["a"]): adopted
		rerender({
			committedValue: serialize([]),
			commitRevision: 1,
			selectedNodeNames: ["a"],
		});
		expect(onAdopt).toHaveBeenCalledTimes(1);
		expect(setSelectedNodeNames).toHaveBeenCalledWith([]);

		// disabled adoption ignores commits
		rerender({
			committedValue: undefined,
			commitRevision: 2,
			selectedNodeNames: ["b"],
		});
		expect(setSelectedNodeNames).toHaveBeenCalledTimes(1);
	});

	it("adopts a differently serialized committed value only once", () => {
		const {rerender, setSelectedNodeNames} = setup(serialize(["a"]), ["a"]);

		const committedValue = JSON.stringify({names: ["b"]}, null, 2);
		rerender({committedValue, selectedNodeNames: ["a"]});
		// selection state caught up, further re-renders must not adopt again
		rerender({committedValue, selectedNodeNames: ["b"]});
		rerender({committedValue, selectedNodeNames: ["c"]});

		expect(setSelectedNodeNames).toHaveBeenCalledTimes(1);
		expect(setSelectedNodeNames).toHaveBeenCalledWith(["b"]);
	});
});
