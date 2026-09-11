/**
 * @jest-environment node
 */
import {parseStringListIndex, toStringListStoreValue} from "../stringListValue";

describe("parseStringListIndex", () => {
	it("returns integer numbers and integer strings", () => {
		expect(parseStringListIndex(0)).toBe(0);
		expect(parseStringListIndex(2)).toBe(2);
		expect(parseStringListIndex("3")).toBe(3);
	});

	it("returns undefined for non-integer numbers", () => {
		expect(parseStringListIndex(1.5)).toBeUndefined();
		expect(parseStringListIndex(NaN)).toBeUndefined();
	});
});

describe("toStringListStoreValue", () => {
	it("stringifies integer indexes", () => {
		expect(toStringListStoreValue(2)).toBe("2");
		expect(toStringListStoreValue("2")).toBe("2");
	});

	it("returns undefined for a non-integer number", () => {
		expect(toStringListStoreValue(1.5)).toBeUndefined();
	});
});
