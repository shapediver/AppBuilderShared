export const NPS_STORAGE_KEY = "nps";

export type NpsStorageType = "answered" | "dismissed";

export type NpsStorageRecord = {
	date: string;
	type: NpsStorageType;
	value?: string;
};

export type NpsScheduleUnit =
	| "minute"
	| "hour"
	| "day"
	| "week"
	| "month"
	| "year";

export type NpsSchedule = {
	unit: NpsScheduleUnit;
	step?: number;
	day?: number;
	weekday?: number;
	hour?: number;
	minute?: number;
};

export const NPS_DEFAULT_ANSWERED_SCHEDULE: NpsSchedule = {
	unit: "month",
	day: 1,
	hour: 0,
	minute: 0,
};

export const NPS_DEFAULT_DISMISSED_SCHEDULE: NpsSchedule = {
	unit: "hour",
	step: 24,
};

const MAX_SCHEDULE_STEPS = 10000;

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

function hasScheduleAnchor(schedule: NpsSchedule): boolean {
	return (
		schedule.day !== undefined ||
		schedule.weekday !== undefined ||
		schedule.hour !== undefined ||
		schedule.minute !== undefined
	);
}

function daysInMonth(year: number, monthIndex: number): number {
	return new Date(year, monthIndex + 1, 0).getDate();
}

function localBoundary(
	year: number,
	monthIndex: number,
	day: number,
	hour: number,
	minute: number,
): Date {
	const clampedDay = Math.min(day, daysInMonth(year, monthIndex));
	return new Date(year, monthIndex, clampedDay, hour, minute, 0, 0);
}

function addDays(stored: Date, days: number): Date {
	const result = new Date(stored.getTime());
	result.setDate(result.getDate() + days);
	return result;
}

function addMonthsFromDayOne(stored: Date, months: number): Date {
	const total = stored.getFullYear() * 12 + stored.getMonth() + months;
	const year = Math.floor(total / 12);
	const monthIndex = total - year * 12;
	const day = Math.min(stored.getDate(), daysInMonth(year, monthIndex));
	return new Date(
		year,
		monthIndex,
		day,
		stored.getHours(),
		stored.getMinutes(),
		stored.getSeconds(),
		stored.getMilliseconds(),
	);
}

function addDuration(stored: Date, unit: NpsScheduleUnit, step: number): Date {
	switch (unit) {
		case "minute":
			return new Date(stored.getTime() + step * 60 * 1000);
		case "hour":
			return new Date(stored.getTime() + step * 60 * 60 * 1000);
		case "day":
			return addDays(stored, step);
		case "week":
			return addDays(stored, step * 7);
		case "month":
			return addMonthsFromDayOne(stored, step);
		case "year":
			return addMonthsFromDayOne(stored, step * 12);
	}
}

function firstStrictlyAfter(
	storedMs: number,
	at: (index: number) => Date,
): Date {
	for (let index = 0; index < MAX_SCHEDULE_STEPS; index++) {
		const candidate = at(index);
		if (candidate.getTime() > storedMs) {
			return candidate;
		}
	}
	return at(MAX_SCHEDULE_STEPS);
}

function nextAnchoredBoundary(
	stored: Date,
	schedule: NpsSchedule,
	step: number,
): Date {
	const hour = schedule.hour ?? 0;
	const minute = schedule.minute ?? 0;
	const storedMs = stored.getTime();

	switch (schedule.unit) {
		case "day":
			return firstStrictlyAfter(storedMs, (index) => {
				const day = new Date(
					stored.getFullYear(),
					stored.getMonth(),
					stored.getDate(),
				);
				day.setDate(day.getDate() + index * step);
				return new Date(
					day.getFullYear(),
					day.getMonth(),
					day.getDate(),
					hour,
					minute,
					0,
					0,
				);
			});
		case "week": {
			const weekday = schedule.weekday ?? 1;
			const start = new Date(
				stored.getFullYear(),
				stored.getMonth(),
				stored.getDate(),
			);
			const currentWeekday = start.getDay() === 0 ? 7 : start.getDay();
			start.setDate(start.getDate() + (weekday - currentWeekday));
			return firstStrictlyAfter(storedMs, (index) => {
				const day = new Date(start.getTime());
				day.setDate(start.getDate() + index * step * 7);
				return new Date(
					day.getFullYear(),
					day.getMonth(),
					day.getDate(),
					hour,
					minute,
					0,
					0,
				);
			});
		}
		case "month":
			return firstStrictlyAfter(storedMs, (index) => {
				const total =
					stored.getFullYear() * 12 +
					stored.getMonth() +
					index * step;
				const year = Math.floor(total / 12);
				const monthIndex = total - year * 12;
				return localBoundary(
					year,
					monthIndex,
					schedule.day ?? 1,
					hour,
					minute,
				);
			});
		case "year":
			return firstStrictlyAfter(storedMs, (index) =>
				localBoundary(
					stored.getFullYear() + index * step,
					0,
					schedule.day ?? 1,
					hour,
					minute,
				),
			);
		default:
			return addDuration(stored, schedule.unit, step);
	}
}

/** Next local boundary for an NPS hide schedule. */
export function nextNpsScheduleBoundary(
	stored: Date,
	schedule: NpsSchedule,
): Date {
	const step = schedule.step ?? 1;
	if (!hasScheduleAnchor(schedule)) {
		return addDuration(stored, schedule.unit, step);
	}
	return nextAnchoredBoundary(stored, schedule, step);
}

/**
 * Whether a stored NPS record should keep the prompt closed.
 * Missing or invalid storage does not hide the prompt.
 * The prompt stays closed while now is strictly before the next schedule boundary.
 */
export function shouldHideNpsPrompt(
	key: string,
	now: Date = new Date(),
	storage: Pick<Storage, "getItem"> = localStorage,
	schedules?: {
		answeredSchedule?: NpsSchedule;
		dismissedSchedule?: NpsSchedule;
	},
): boolean {
	const record = readNpsStorage(key, storage);
	if (!record) {
		return false;
	}
	const schedule =
		record.type === "answered"
			? (schedules?.answeredSchedule ?? NPS_DEFAULT_ANSWERED_SCHEDULE)
			: (schedules?.dismissedSchedule ?? NPS_DEFAULT_DISMISSED_SCHEDULE);
	const boundary = nextNpsScheduleBoundary(new Date(record.date), schedule);
	return now.getTime() < boundary.getTime();
}
