import {resolveSelectionActionChange} from "@AppBuilderLib/entities/parameter/lib/selectionAction";

const candidateNames = ["Box.1", "Box.2", "Box.3", "Box.4"];

const resolve = (
	options: Partial<Parameters<typeof resolveSelectionActionChange>[0]>,
) =>
	resolveSelectionActionChange({
		candidateNames,
		selectedNames: [],
		selectMatches: new Set(),
		deselectMatches: new Set(),
		maximumSelection: Infinity,
		...options,
	});

describe("resolveSelectionActionChange", () => {
	it("selects the targeted nodes and keeps the current selection", () => {
		const result = resolve({
			selectedNames: ["Box.1"],
			selectMatches: new Set(["Box.3"]),
		});

		expect(result.names).toEqual(["Box.1", "Box.3"]);
		expect(result.changed).toBe(true);
		expect(result.exceededBy).toBe(0);
	});

	it("deselects the nodes only targeted by deselect", () => {
		const result = resolve({
			selectedNames: ["Box.1", "Box.2", "Box.3"],
			deselectMatches: new Set(["Box.2"]),
		});

		expect(result.names).toEqual(["Box.1", "Box.3"]);
		expect(result.changed).toBe(true);
	});

	it("selects a node which is targeted by select and deselect", () => {
		const result = resolve({
			selectedNames: ["Box.1", "Box.2"],
			selectMatches: new Set(["Box.2"]),
			deselectMatches: new Set(["Box.1", "Box.2", "Box.3", "Box.4"]),
		});

		expect(result.names).toEqual(["Box.2"]);
		expect(result.changed).toBe(true);

		const fresh = resolve({
			selectMatches: new Set(["Box.4"]),
			deselectMatches: new Set(["Box.4"]),
		});

		expect(fresh.names).toEqual(["Box.4"]);
	});

	it("reports no change when the selection stays the same", () => {
		const result = resolve({
			selectedNames: ["Box.2", "Box.1"],
			selectMatches: new Set(["Box.1"]),
			deselectMatches: new Set(["Box.4"]),
		});

		expect(result.changed).toBe(false);
		expect(result.names).toEqual(["Box.2", "Box.1"]);
	});

	it("keeps the order of the current selection when nothing changes", () => {
		const result = resolve({
			selectedNames: ["Box.3", "Box.1"],
			selectMatches: new Set(["Box.1", "Box.3"]),
		});

		expect(result.changed).toBe(false);
		expect(result.names).toEqual(["Box.3", "Box.1"]);
	});

	it("selects the first matches in scene order if the maximum is exceeded", () => {
		const result = resolve({
			selectMatches: new Set(["Box.4", "Box.2", "Box.3"]),
			maximumSelection: 2,
		});

		expect(result.names).toEqual(["Box.2", "Box.3"]);
		expect(result.exceededBy).toBe(1);
		expect(result.changed).toBe(true);
	});

	it("replaces the selection of a single selection", () => {
		const result = resolve({
			selectedNames: ["Box.1"],
			selectMatches: new Set(["Box.3", "Box.4"]),
			maximumSelection: 1,
		});

		expect(result.names).toEqual(["Box.3"]);
		expect(result.exceededBy).toBe(1);
	});

	it("drops selected nodes which do not fit next to the new ones", () => {
		const result = resolve({
			selectedNames: ["Box.1", "Box.2"],
			selectMatches: new Set(["Box.4"]),
			maximumSelection: 2,
		});

		expect(result.names).toEqual(["Box.1", "Box.4"]);
		expect(result.exceededBy).toBe(0);
	});

	it("ignores matches which are not candidates", () => {
		const result = resolve({
			selectMatches: new Set(["Other.1"]),
		});

		expect(result.names).toEqual([]);
		expect(result.changed).toBe(false);
	});

	it("deselects everything with a wildcard and selects one node", () => {
		const result = resolve({
			selectedNames: ["Box.1", "Box.2", "Box.3"],
			selectMatches: new Set(["Box.1"]),
			deselectMatches: new Set(candidateNames),
		});

		expect(result.names).toEqual(["Box.1"]);
		expect(result.changed).toBe(true);
	});

	it("selects nothing with a maximum of 0", () => {
		const result = resolve({
			selectMatches: new Set(["Box.1"]),
			maximumSelection: 0,
		});

		expect(result.names).toEqual([]);
		expect(result.exceededBy).toBe(1);
		expect(result.changed).toBe(false);
	});
});
