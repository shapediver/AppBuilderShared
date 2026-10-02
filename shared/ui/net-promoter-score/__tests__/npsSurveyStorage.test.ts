/**
 * @jest-environment jsdom
 */
import {
	NPS_STORAGE_KEY,
	nextNpsScheduleBoundary,
	readNpsStorage,
	shouldHideNpsPrompt,
	writeNpsStorage,
} from "../npsSurveyStorage";

function memoryStorage(initial: Record<string, string> = {}): Storage {
	const data = {...initial};
	return {
		get length() {
			return Object.keys(data).length;
		},
		clear() {
			for (const key of Object.keys(data)) {
				delete data[key];
			}
		},
		getItem(key: string) {
			return Object.prototype.hasOwnProperty.call(data, key)
				? data[key]
				: null;
		},
		key(index: number) {
			return Object.keys(data)[index] ?? null;
		},
		removeItem(key: string) {
			delete data[key];
		},
		setItem(key: string, value: string) {
			data[key] = String(value);
		},
	};
}

describe("npsSurveyStorage", () => {
	it("uses the key nps", () => {
		expect(NPS_STORAGE_KEY).toBe("nps");
	});

	it("treats a missing value as no hide", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage();
		expect(readNpsStorage(key, storage)).toBeNull();
		expect(
			shouldHideNpsPrompt(key, new Date("2026-09-15T12:00:00"), storage),
		).toBe(false);
	});

	it("treats invalid JSON as no hide", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage({[key]: "{not-json"});
		expect(readNpsStorage(key, storage)).toBeNull();
		expect(
			shouldHideNpsPrompt(key, new Date("2026-09-15T12:00:00"), storage),
		).toBe(false);
	});

	it("treats an object without a valid type or date as no hide", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage({
			[key]: JSON.stringify({type: "answered"}),
		});
		expect(readNpsStorage(key, storage)).toBeNull();
		expect(
			shouldHideNpsPrompt(key, new Date("2026-09-15T12:00:00"), storage),
		).toBe(false);
	});

	it("hides when answered in the current local month", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage();
		writeNpsStorage(
			key,
			"answered",
			new Date("2026-09-02T08:00:00"),
			storage,
		);
		expect(
			shouldHideNpsPrompt(key, new Date("2026-09-30T18:00:00"), storage),
		).toBe(true);
	});

	it("does not hide when answered in an earlier local month", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage();
		writeNpsStorage(
			key,
			"answered",
			new Date("2026-08-31T23:00:00"),
			storage,
		);
		expect(
			shouldHideNpsPrompt(key, new Date("2026-09-01T01:00:00"), storage),
		).toBe(false);
	});

	it("hides when dismissed inside 24 hours", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage();
		writeNpsStorage(
			key,
			"dismissed",
			new Date("2026-09-15T12:00:00.000Z"),
			storage,
		);
		expect(
			shouldHideNpsPrompt(
				key,
				new Date("2026-09-16T11:59:00.000Z"),
				storage,
			),
		).toBe(true);
	});

	it("does not hide when dismissed after 24 hours", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage();
		writeNpsStorage(
			key,
			"dismissed",
			new Date("2026-09-15T12:00:00.000Z"),
			storage,
		);
		expect(
			shouldHideNpsPrompt(
				key,
				new Date("2026-09-16T12:00:00.000Z"),
				storage,
			),
		).toBe(false);
	});

	it("adds 24 hours when the schedule has no anchor", () => {
		const stored = new Date(2026, 9, 1, 12, 0);
		expect(
			nextNpsScheduleBoundary(stored, {unit: "hour", step: 24}),
		).toEqual(new Date(2026, 9, 2, 12, 0));
	});

	it("uses the next 1st at 00:00 local", () => {
		const stored = new Date(2026, 9, 15, 12, 0);
		expect(
			nextNpsScheduleBoundary(stored, {
				unit: "month",
				day: 1,
				hour: 0,
				minute: 0,
			}),
		).toEqual(new Date(2026, 10, 1, 0, 0));
	});

	it("skips a boundary equal to the stored time", () => {
		const stored = new Date(2026, 10, 1, 0, 0);
		expect(
			nextNpsScheduleBoundary(stored, {
				unit: "month",
				day: 1,
				hour: 0,
				minute: 0,
			}),
		).toEqual(new Date(2026, 11, 1, 0, 0));
	});

	it("uses the last day of February when day 31 does not exist", () => {
		const stored = new Date(2026, 0, 31, 0, 0);
		expect(
			nextNpsScheduleBoundary(stored, {unit: "month", day: 31}),
		).toEqual(new Date(2026, 1, 28, 0, 0));
	});

	it("writes the submitted string on answer and omits value on dismiss", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage();
		const date = new Date(2026, 9, 15, 12, 0);
		writeNpsStorage(key, "answered", date, storage, "7");
		expect(JSON.parse(storage.getItem(key) ?? "")).toEqual({
			date: date.toISOString(),
			type: "answered",
			value: "7",
		});
		writeNpsStorage(key, "dismissed", date, storage);
		const dismissed = JSON.parse(storage.getItem(key) ?? "") as Record<
			string,
			unknown
		>;
		expect(dismissed).toEqual({
			date: date.toISOString(),
			type: "dismissed",
		});
		expect(Object.prototype.hasOwnProperty.call(dismissed, "value")).toBe(
			false,
		);
	});

	it("hides an older answered record that has no value", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage({
			[key]: JSON.stringify({
				date: new Date(2026, 9, 15, 12, 0).toISOString(),
				type: "answered",
			}),
		});
		expect(readNpsStorage(key, storage)?.type).toBe("answered");
		expect(
			shouldHideNpsPrompt(key, new Date(2026, 9, 31, 23, 59), storage),
		).toBe(true);
	});

	it("does not hide when an answered value is a JSON number", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage({
			[key]: JSON.stringify({
				date: new Date(2026, 9, 15, 12, 0).toISOString(),
				type: "answered",
				value: 7,
			}),
		});
		expect(readNpsStorage(key, storage)).toBeNull();
		expect(
			shouldHideNpsPrompt(key, new Date(2026, 9, 20, 12, 0), storage),
		).toBe(false);
	});
});
