import {csvEngine} from "../csvEngine";
import {jsonEngine} from "../jsonEngine";
import {resolveFilterableDatabaseEngine} from "../resolveEngine";

type FilterableDatabaseSettings = Parameters<
	typeof resolveFilterableDatabaseEngine
>[0];

const baseSettings = (
	dataSource: FilterableDatabaseSettings["dataSource"],
): FilterableDatabaseSettings => ({
	dataSource,
	itemDataDefinition: {value: 0},
	filters: [{column: 1}],
});

describe("resolveFilterableDatabaseEngine", () => {
	it("uses jsonEngine when format is json", () => {
		const engine = resolveFilterableDatabaseEngine(
			baseSettings({
				href: "https://example.com/data.csv",
				format: "json",
			}),
		);
		expect(engine).toBe(jsonEngine);
	});

	it("uses csvEngine when format is csv", () => {
		const engine = resolveFilterableDatabaseEngine(
			baseSettings({
				href: "https://example.com/data.json",
				format: "csv",
			}),
		);
		expect(engine).toBe(csvEngine);
	});

	it("infers jsonEngine from .json href suffix", () => {
		const engine = resolveFilterableDatabaseEngine(
			baseSettings({href: "https://example.com/data.json"}),
		);
		expect(engine).toBe(jsonEngine);
	});

	it("infers csvEngine from .csv href suffix", () => {
		const engine = resolveFilterableDatabaseEngine(
			baseSettings({href: "https://example.com/data.csv"}),
		);
		expect(engine).toBe(csvEngine);
	});

	it("defaults to csvEngine when format and suffix are ambiguous", () => {
		const engine = resolveFilterableDatabaseEngine(
			baseSettings({href: "https://example.com/data"}),
		);
		expect(engine).toBe(csvEngine);
	});
});
