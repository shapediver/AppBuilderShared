/**
 * @jest-environment jsdom
 */
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {
	applySelectionAction,
	registerSelectionActionTarget,
	resetSelectionActionTargets,
	setSelectionActionNameFinder,
	shouldEmitSelectionActionSlots,
} from "../selectionActionRegistry";

jest.mock("@AppBuilderLib/shared/lib/logger", () => ({
	Logger: {warn: jest.fn()},
}));

const parameters: {[key: string]: {definition: {id: string}}} = {
	"session:Boxes": {definition: {id: "id-boxes"}},
	"session:Gumball": {definition: {id: "id-gumball"}},
};

jest.mock("../../useShapeDiverStoreParameters", () => ({
	useShapeDiverStoreParameters: {
		getState: () => ({
			getParameter: (namespace: string, name: string) => {
				const parameter = parameters[`${namespace}:${name}`];

				return parameter && {getState: () => parameter};
			},
		}),
	},
}));

const scene = ["Boxes.1", "Boxes.2", "Boxes.3", "Spheres.1", "Other.1"];

const createTarget = (
	parameterName: string,
	names: string[],
	options: {
		selected?: string[];
		maximumSelection?: number;
		minimumSelection?: number;
		namespace?: string;
		ownerKey?: string;
		root?: boolean;
		nameFilter?: string[];
	} = {},
) => {
	let selected = options.selected ?? [];
	const setSelectedNames = jest.fn((next: string[]) => {
		selected = next;
	});
	const target = {
		ownerKey: options.ownerKey ?? `owner-${parameterName}`,
		namespace: options.namespace ?? "session",
		parameter: options.root
			? undefined
			: {
					namespace: options.namespace ?? "session",
					id: `id-${parameterName.toLowerCase()}`,
					name: parameterName,
				},
		getCandidates: () =>
			names.map((name) => ({name, node: {name} as never})),
		getSelectedNames: () => selected,
		getMaximumSelection: () => options.maximumSelection ?? 1,
		getMinimumSelection: () => options.minimumSelection ?? 0,
		getNameFilter: () => options.nameFilter ?? [],
		setSelectedNames,
	};

	return {target, setSelectedNames, getSelected: () => selected};
};

const run = (
	request: Parameters<typeof applySelectionAction>[0],
	context: Partial<Parameters<typeof applySelectionAction>[1]> = {},
) => applySelectionAction(request, {namespace: "session", ...context});

describe("applySelectionAction", () => {
	beforeEach(() => {
		resetSelectionActionTargets();
		setSelectionActionNameFinder((filters) =>
			scene.filter((name) =>
				filters.some((filter) =>
					filter.endsWith("*")
						? name.startsWith(filter.slice(0, -1))
						: name === filter,
				),
			),
		);
		jest.clearAllMocks();
	});

	it("changes every root group whose candidates match, not parameters", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2"], {
			root: true,
			maximumSelection: Infinity,
		});
		const spheres = createTarget("Spheres", ["Spheres.1"], {
			root: true,
			ownerKey: "root-spheres",
		});
		const parameter = createTarget("Boxes", ["Boxes.1", "Boxes.2"], {
			ownerKey: "parameter-boxes",
			maximumSelection: Infinity,
		});
		[boxes, spheres, parameter].forEach(({target}) =>
			registerSelectionActionTarget(target),
		);

		const changed = run({select: ["Boxes.1"]});

		expect(changed).toEqual(["owner-Boxes"]);
		expect(boxes.setSelectedNames).toHaveBeenCalledWith(["Boxes.1"]);
		expect(spheres.setSelectedNames).not.toHaveBeenCalled();
		expect(parameter.setSelectedNames).not.toHaveBeenCalled();
	});

	it("selects a node the name filter finds when the candidate list is stale", () => {
		setSelectionActionNameFinder((filters) => {
			const names = ["Boxes.1", "Boxes.new"];
			return names.filter((name) =>
				filters.some((filter) =>
					filter.endsWith("*")
						? name.startsWith(filter.slice(0, -1))
						: name === filter,
				),
			);
		});
		const boxes = createTarget("Boxes", ["Boxes.1"], {
			root: true,
			maximumSelection: 1,
			nameFilter: ["Boxes.*"],
		});
		registerSelectionActionTarget(boxes.target);

		run({select: ["Boxes.new"]});

		expect(boxes.getSelected()).toEqual(["Boxes.new"]);
	});

	it("does not change a root selection of another App Builder", () => {
		const here = createTarget("Boxes", ["Boxes.1"], {
			root: true,
			ownerKey: "here",
		});
		const there = createTarget("Boxes", ["Boxes.1"], {
			root: true,
			namespace: "other",
			ownerKey: "there",
		});
		registerSelectionActionTarget(here.target);
		registerSelectionActionTarget(there.target);

		expect(run({select: ["Boxes.1"]})).toEqual(["here"]);
		expect(there.setSelectedNames).not.toHaveBeenCalled();
	});

	it("lets a nested selection action change the selection without running slots again", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2"], {
			root: true,
			ownerKey: "boxes",
		});
		const slotRuns: boolean[] = [];
		boxes.setSelectedNames.mockImplementation((names: string[]) => {
			slotRuns.push(shouldEmitSelectionActionSlots());
			if (names[0] === "Boxes.1") {
				applySelectionAction(
					{select: ["Boxes.2"]},
					{namespace: "session"},
				);
			}
		});
		registerSelectionActionTarget(boxes.target);

		run({select: ["Boxes.1"]});

		expect(slotRuns).toEqual([true, false]);
		expect(boxes.setSelectedNames).toHaveBeenLastCalledWith(["Boxes.2"]);
	});

	it("runs slots again for a later selection action", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2"], {
			root: true,
			ownerKey: "boxes",
		});
		const slotRuns: boolean[] = [];
		boxes.setSelectedNames.mockImplementation(() => {
			slotRuns.push(shouldEmitSelectionActionSlots());
		});
		registerSelectionActionTarget(boxes.target);

		run({select: ["Boxes.1"]});
		run({select: ["Boxes.2"]});

		expect(slotRuns).toEqual([true, true]);
		expect(boxes.setSelectedNames).toHaveBeenNthCalledWith(1, ["Boxes.1"]);
		expect(boxes.setSelectedNames).toHaveBeenNthCalledWith(2, ["Boxes.2"]);
	});

	it("limits the action to the requested parameter and leaves the root selection", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2"]);
		const gumball = createTarget("Gumball", ["Boxes.1", "Boxes.3"]);
		const root = createTarget("Scene", ["Boxes.1", "Boxes.2"], {
			root: true,
			ownerKey: "root",
		});
		[boxes, gumball, root].forEach(({target}) =>
			registerSelectionActionTarget(target),
		);

		run({
			select: ["Boxes.1"],
			parameter: {name: "Gumball", sessionId: "session"},
		});

		expect(boxes.setSelectedNames).not.toHaveBeenCalled();
		expect(root.setSelectedNames).not.toHaveBeenCalled();
		expect(gumball.setSelectedNames).toHaveBeenCalledWith(["Boxes.1"]);
	});

	it("uses the namespace of the action if the parameter has no sessionId", () => {
		const boxes = createTarget("Boxes", ["Boxes.1"]);
		registerSelectionActionTarget(boxes.target);

		expect(run({select: ["Boxes.1"], parameter: {name: "Boxes"}})).toEqual([
			"id-boxes",
		]);
		expect(
			run(
				{select: ["Boxes.1"], parameter: {name: "Boxes"}},
				{namespace: "other-session"},
			),
		).toEqual([]);
	});

	it("selects a node targeted by select and deselect, and deselects the others", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2", "Boxes.3"], {
			selected: ["Boxes.2", "Boxes.3"],
			maximumSelection: 3,
		});
		registerSelectionActionTarget(boxes.target);

		run({
			select: ["Boxes.1"],
			deselect: ["Boxes.*"],
			parameter: {name: "Boxes"},
		});

		expect(boxes.getSelected()).toEqual(["Boxes.1"]);
	});

	it("selects the first matches in scene order and warns if the maximum is exceeded", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2", "Boxes.3"], {
			maximumSelection: 2,
		});
		registerSelectionActionTarget(boxes.target);

		expect(() =>
			run({select: ["Boxes.*"], parameter: {name: "Boxes"}}),
		).not.toThrow();

		expect(boxes.getSelected()).toEqual(["Boxes.1", "Boxes.2"]);
		expect(Logger.warn).toHaveBeenCalledWith(
			expect.stringContaining('parameter "Boxes"'),
		);
	});

	it("warns about the root selection when that maximum is exceeded", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2", "Boxes.3"], {
			root: true,
			maximumSelection: 1,
		});
		registerSelectionActionTarget(boxes.target);

		run({select: ["Boxes.*"]});

		expect(boxes.getSelected()).toEqual(["Boxes.1"]);
		expect(Logger.warn).toHaveBeenCalledWith(
			expect.stringContaining("the root selection"),
		);
	});

	it("does not change a selection which stays the same", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2"], {
			root: true,
			selected: ["Boxes.1"],
		});
		registerSelectionActionTarget(boxes.target);

		expect(run({select: ["Boxes.1"], deselect: ["Boxes.2"]})).toEqual([]);
		expect(boxes.setSelectedNames).not.toHaveBeenCalled();
	});

	it("ignores a deselect that would drop below the minimum a click keeps", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2"], {
			selected: ["Boxes.1"],
			minimumSelection: 1,
		});
		registerSelectionActionTarget(boxes.target);

		expect(
			run({deselect: ["Boxes.*"], parameter: {name: "Boxes"}}),
		).toEqual([]);
		expect(boxes.getSelected()).toEqual(["Boxes.1"]);
		expect(boxes.setSelectedNames).not.toHaveBeenCalled();
		expect(Logger.warn).not.toHaveBeenCalled();
	});

	it("does not drop a selected node to make room for another", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2", "Boxes.3"], {
			selected: ["Boxes.1", "Boxes.2"],
			maximumSelection: 2,
		});
		registerSelectionActionTarget(boxes.target);

		expect(run({select: ["Boxes.3"], parameter: {name: "Boxes"}})).toEqual(
			[],
		);
		expect(boxes.getSelected()).toEqual(["Boxes.1", "Boxes.2"]);
		expect(Logger.warn).toHaveBeenCalledWith(
			expect.stringContaining('parameter "Boxes"'),
		);
	});

	it("still replaces a selection", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2"], {
			selected: ["Boxes.1"],
		});
		registerSelectionActionTarget(boxes.target);

		expect(
			run({
				select: ["Boxes.2"],
				deselect: ["Boxes.1"],
				parameter: {name: "Boxes"},
			}),
		).toEqual(["id-boxes"]);
		expect(boxes.getSelected()).toEqual(["Boxes.2"]);
	});

	it("selects into an empty selection", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2"], {
			maximumSelection: 3,
		});
		registerSelectionActionTarget(boxes.target);

		run({select: ["Boxes.1"], parameter: {name: "Boxes"}});

		expect(boxes.getSelected()).toEqual(["Boxes.1"]);
	});

	it("deselects to empty without a kept minimum", () => {
		const boxes = createTarget("Boxes", ["Boxes.1"], {
			selected: ["Boxes.1"],
		});
		registerSelectionActionTarget(boxes.target);

		run({deselect: ["Boxes.1"], parameter: {name: "Boxes"}});

		expect(boxes.getSelected()).toEqual([]);
	});

	it("ignores scene nodes which are not candidates of the target", () => {
		const boxes = createTarget("Boxes", ["Boxes.1"], {root: true});
		registerSelectionActionTarget(boxes.target);

		expect(run({select: ["Other.1"]})).toEqual([]);
		expect(boxes.setSelectedNames).not.toHaveBeenCalled();
	});

	it("does nothing without names", () => {
		const boxes = createTarget("Boxes", ["Boxes.1"], {root: true});
		registerSelectionActionTarget(boxes.target);

		expect(run({})).toEqual([]);
		expect(run({select: [], deselect: []})).toEqual([]);
		expect(boxes.setSelectedNames).not.toHaveBeenCalled();
	});

	it("warns about an unknown parameter and throws in strict mode", () => {
		const boxes = createTarget("Boxes", ["Boxes.1"]);
		registerSelectionActionTarget(boxes.target);

		expect(run({select: ["Boxes.1"], parameter: {name: "Nope"}})).toEqual(
			[],
		);
		expect(Logger.warn).toHaveBeenCalledTimes(1);
		expect(() =>
			run(
				{select: ["Boxes.1"], parameter: {name: "Nope"}},
				{strict: true},
			),
		).toThrow('Parameter "Nope" not found.');
		expect(boxes.setSelectedNames).not.toHaveBeenCalled();
	});

	it("warns if the requested parameter has no mounted selection", () => {
		expect(run({select: ["Boxes.1"], parameter: {name: "Boxes"}})).toEqual(
			[],
		);
		expect(Logger.warn).toHaveBeenCalledTimes(1);
	});

	it("stops changing a parameter once its target is unregistered", () => {
		const boxes = createTarget("Boxes", ["Boxes.1"]);
		const unregister = registerSelectionActionTarget(boxes.target);

		unregister();

		expect(run({select: ["Boxes.1"], parameter: {name: "Boxes"}})).toEqual(
			[],
		);
	});

	it("keeps a replacing registration when the replaced one unregisters", () => {
		const first = createTarget("Boxes", ["Boxes.1"], {root: true});
		const second = createTarget("Boxes", ["Boxes.1"], {root: true});
		const unregisterFirst = registerSelectionActionTarget(first.target);
		registerSelectionActionTarget(second.target);

		unregisterFirst();
		run({select: ["Boxes.1"]});

		expect(first.setSelectedNames).not.toHaveBeenCalled();
		expect(second.setSelectedNames).toHaveBeenCalledWith(["Boxes.1"]);
	});
});
