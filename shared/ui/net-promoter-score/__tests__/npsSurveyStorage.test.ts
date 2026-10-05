/**
 * @jest-environment jsdom
 */
import {
	NPS_STORAGE_KEY,
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

	it("hides an answer still inside 30 local days", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage();
		writeNpsStorage(key, "answered", new Date(2026, 9, 15, 12, 0), storage);
		expect(
			shouldHideNpsPrompt(key, new Date(2026, 10, 14, 11, 59), storage),
		).toBe(true);
	});

	it("does not hide an answer at the 30-day mark", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage();
		writeNpsStorage(key, "answered", new Date(2026, 9, 15, 12, 0), storage);
		expect(
			shouldHideNpsPrompt(key, new Date(2026, 10, 14, 12, 0), storage),
		).toBe(false);
	});

	it("hides a dismiss still inside 1 local day", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage();
		writeNpsStorage(key, "dismissed", new Date(2026, 9, 1, 12, 0), storage);
		expect(
			shouldHideNpsPrompt(key, new Date(2026, 9, 2, 11, 59), storage),
		).toBe(true);
	});

	it("does not hide a dismiss at the 1-day mark", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage();
		writeNpsStorage(key, "dismissed", new Date(2026, 9, 1, 12, 0), storage);
		expect(
			shouldHideNpsPrompt(key, new Date(2026, 9, 2, 12, 0), storage),
		).toBe(false);
	});

	it("does not hide a custom 7-day answer at the 7-day mark", () => {
		const key = NPS_STORAGE_KEY;
		const storage = memoryStorage();
		writeNpsStorage(key, "answered", new Date(2026, 9, 15, 12, 0), storage);
		expect(
			shouldHideNpsPrompt(key, new Date(2026, 9, 22, 12, 0), storage, {
				answeredScheduleDays: 7,
			}),
		).toBe(false);
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
