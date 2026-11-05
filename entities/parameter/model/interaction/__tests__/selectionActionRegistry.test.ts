/**
 * @jest-environment jsdom
 */
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {
	applySelectionAction,
	registerSelectionActionTarget,
	resetSelectionActionTargets,
	type SelectionActionTarget,
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

// names are matched by the wildcard "*" at the end only (enough for the tests)
const matchNames = (names: string[]) => (filters: string[]) =>
	new Set(
		names.filter((name) =>
			filters.some((filter) =>
				filter.endsWith("*")
					? name.startsWith(filter.slice(0, -1))
					: name === filter,
			),
		),
	);

const createTarget = (
	parameterName: string,
	names: string[],
	options: {
		selected?: string[];
		maximumSelection?: number;
		namespace?: string;
	} = {},
) => {
	let selected = options.selected ?? [];
	const setSelectedNames = jest.fn((names: string[]) => {
		selected = names;
	});
	const target: SelectionActionTarget = {
		ownerKey: `owner-${parameterName}`,
		namespace: options.namespace ?? "session",
		parameterId: `id-${parameterName.toLowerCase()}`,
		parameterName,
		getCandidateNames: () => names,
		matchNames: matchNames(names),
		getSelectedNames: () => selected,
		getMaximumSelection: () => options.maximumSelection ?? 1,
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
		jest.clearAllMocks();
	});

	it("changes every parameter whose candidates match", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2"]);
		const gumball = createTarget("Gumball", ["Boxes.1", "Boxes.3"], {
			maximumSelection: Infinity,
		});
		const other = createTarget("Other", ["Spheres.1"]);
		[boxes, gumball, other].forEach(({target}) =>
			registerSelectionActionTarget(target),
		);

		const changed = run({select: ["Boxes.1"]});

		expect(changed).toEqual(["id-boxes", "id-gumball"]);
		expect(boxes.setSelectedNames).toHaveBeenCalledWith(["Boxes.1"]);
		expect(gumball.setSelectedNames).toHaveBeenCalledWith(["Boxes.1"]);
		expect(other.setSelectedNames).not.toHaveBeenCalled();
	});

	it("limits the action to the requested parameter", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2"]);
		const gumball = createTarget("Gumball", ["Boxes.1", "Boxes.3"]);
		[boxes, gumball].forEach(({target}) =>
			registerSelectionActionTarget(target),
		);

		run({
			select: ["Boxes.1"],
			parameter: {name: "Gumball", sessionId: "session"},
		});

		expect(boxes.setSelectedNames).not.toHaveBeenCalled();
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

		run({select: ["Boxes.1"], deselect: ["Boxes.*"]});

		expect(boxes.getSelected()).toEqual(["Boxes.1"]);
	});

	it("selects the first matches in scene order and warns if the maximum is exceeded", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2", "Boxes.3"], {
			maximumSelection: 2,
		});
		registerSelectionActionTarget(boxes.target);

		expect(() => run({select: ["Boxes.*"]})).not.toThrow();

		expect(boxes.getSelected()).toEqual(["Boxes.1", "Boxes.2"]);
		expect(Logger.warn).toHaveBeenCalledTimes(1);
	});

	it("does not change a parameter whose selection stays the same", () => {
		const boxes = createTarget("Boxes", ["Boxes.1", "Boxes.2"], {
			selected: ["Boxes.1"],
		});
		registerSelectionActionTarget(boxes.target);

		expect(run({select: ["Boxes.1"], deselect: ["Boxes.2"]})).toEqual([]);
		expect(boxes.setSelectedNames).not.toHaveBeenCalled();
	});

	it("does nothing without names", () => {
		const boxes = createTarget("Boxes", ["Boxes.1"]);
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

		expect(run({select: ["Boxes.1"]})).toEqual([]);
	});

	it("keeps a replacing registration when the replaced one unregisters", () => {
		const first = createTarget("Boxes", ["Boxes.1"]);
		const second = createTarget("Boxes", ["Boxes.1"]);
		const unregisterFirst = registerSelectionActionTarget(first.target);
		registerSelectionActionTarget(second.target);

		unregisterFirst();
		run({select: ["Boxes.1"]});

		expect(first.setSelectedNames).not.toHaveBeenCalled();
		expect(second.setSelectedNames).toHaveBeenCalledWith(["Boxes.1"]);
	});
});
