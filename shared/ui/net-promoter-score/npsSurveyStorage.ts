export const NPS_STORAGE_KEY = "nps";

type NpsStorageType = "answered" | "dismissed";

type NpsStorageRecord = {
	date: string;
	type: NpsStorageType;
	value?: string;
};

function isValidRecord(value: unknown): value is NpsStorageRecord {
	if (!value || typeof value !== "object") {
		return false;
	}
	const record = value as Record<string, unknown>;
	if (record.type !== "answered" && record.type !== "dismissed") {
		return false;
	}
	if (typeof record.date !== "string") {
		return false;
	}
	const timestamp = Date.parse(record.date);
	if (Number.isNaN(timestamp)) {
		return false;
	}
	if (
		record.type === "answered" &&
		"value" in record &&
		record.value !== undefined &&
		typeof record.value !== "string"
	) {
		return false;
	}
	return true;
}

export function readNpsStorage(
	key: string,
	storage: Pick<Storage, "getItem"> = localStorage,
): NpsStorageRecord | null {
	const raw = storage.getItem(key);
	if (raw == null) {
		return null;
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		return isValidRecord(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function writeNpsStorage(
	key: string,
	type: NpsStorageType,
	date: Date = new Date(),
	storage: Pick<Storage, "setItem"> = localStorage,
	submitted?: string,
): void {
	const record: NpsStorageRecord = {
		date: date.toISOString(),
		type,
	};
	if (submitted !== undefined) {
		record.value = submitted;
	}
	storage.setItem(key, JSON.stringify(record));
}

/**
 * Whether a stored NPS record should keep the prompt closed.
 * Missing or invalid storage does not hide the prompt.
 * The prompt stays closed while now is strictly before the stored local
 * timestamp plus the day count, at the same clock time.
 * Omitted counts use 30 days for an answer and 1 day for a dismiss.
 */
export function shouldHideNpsPrompt(
	key: string,
	now: Date = new Date(),
	storage: Pick<Storage, "getItem"> = localStorage,
	dayCounts?: {
		answeredScheduleDays?: number;
		dismissedScheduleDays?: number;
	},
): boolean {
	const record = readNpsStorage(key, storage);
	if (!record) {
		return false;
	}
	const days =
		record.type === "answered"
			? (dayCounts?.answeredScheduleDays ?? 30)
			: (dayCounts?.dismissedScheduleDays ?? 1);
	const end = new Date(record.date);
	end.setDate(end.getDate() + days);
	return now.getTime() < end.getTime();
}
