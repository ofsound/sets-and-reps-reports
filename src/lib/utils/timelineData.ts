import type { ExerciseObject } from '$lib/types/interfaces';

export const STREAK_GAP_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export type TimelineRange = 'all' | '1y' | '6m';

export interface TimelineStreak {
	start: Date;
	end: Date;
	count: number;
}

export interface TimelineRow {
	id: string;
	name: string;
	isCurrent: boolean;
	hitDates: Date[];
	streaks: TimelineStreak[];
	longestStreak: number;
}

export interface TimelineTick {
	date: Date;
	label: string;
	major: boolean;
}

function startOfDay(value: Date): Date {
	return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addMonths(value: Date, months: number): Date {
	return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

function dayKey(value: Date): string {
	return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

export function uniqueExerciseHitDates(exercise: ExerciseObject): Date[] {
	const dates = new Map<string, Date>();

	for (const attempt of exercise.attempts) {
		const timestamp = attempt[0]?.date;
		if (typeof timestamp !== 'number') continue;

		const date = new Date(timestamp);
		if (Number.isNaN(date.getTime())) continue;

		const normalized = startOfDay(date);
		dates.set(dayKey(normalized), normalized);
	}

	return [...dates.values()].sort((a, b) => a.getTime() - b.getTime());
}

export function groupHitDatesIntoStreaks(
	dates: Date[],
	maxGapDays = STREAK_GAP_DAYS
): TimelineStreak[] {
	if (dates.length === 0) return [];

	const streaks: TimelineStreak[] = [];
	let current: TimelineStreak = { start: dates[0], end: dates[0], count: 1 };

	for (const date of dates.slice(1)) {
		const gapDays = (date.getTime() - current.end.getTime()) / DAY_MS;

		if (gapDays <= maxGapDays) {
			current = { ...current, end: date, count: current.count + 1 };
		} else {
			streaks.push(current);
			current = { start: date, end: date, count: 1 };
		}
	}

	streaks.push(current);
	return streaks;
}

export function rangeStart(range: TimelineRange, allDates: Date[], end: Date): Date {
	if (range === '6m') return addMonths(end, -6);
	if (range === '1y') return addMonths(end, -12);

	const earliest = allDates[0];
	if (!earliest) return addMonths(end, -6);

	return new Date(earliest.getFullYear(), earliest.getMonth(), 1);
}

export function buildTimelineRows(
	exercises: ExerciseObject[],
	start: Date,
	end: Date
): TimelineRow[] {
	return exercises.map((exercise) => {
		const hitDates = uniqueExerciseHitDates(exercise).filter(
			(date) => date >= start && date <= end
		);
		const streaks = groupHitDatesIntoStreaks(hitDates);

		return {
			id: exercise.id,
			name: exercise.name,
			isCurrent: exercise.isCurrent,
			hitDates,
			streaks,
			longestStreak: Math.max(0, ...streaks.map((streak) => streak.count))
		};
	});
}

export function timelinePosition(date: Date, start: Date, end: Date): number {
	const duration = Math.max(1, end.getTime() - start.getTime());
	return Math.max(0, Math.min(100, ((date.getTime() - start.getTime()) / duration) * 100));
}

export function createTimelineTicks(start: Date, end: Date): TimelineTick[] {
	const formatter = new Intl.DateTimeFormat(undefined, {
		month: 'short'
	});
	const ticks: TimelineTick[] = [];
	let cursor = new Date(start.getFullYear(), start.getMonth(), 1);

	while (cursor <= end) {
		const isYearStart = cursor.getMonth() === 0;
		const shortYear = String(cursor.getFullYear()).slice(-2);

		ticks.push({
			date: cursor,
			label: `${formatter.format(cursor)}${isYearStart ? ` '${shortYear}` : ''}`,
			major: isYearStart
		});
		cursor = addMonths(cursor, 1);
	}

	return ticks;
}

export function timelinePlotWidth(start: Date, end: Date): number {
	const months = Math.max(
		1,
		(end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth()
	);

	return Math.max(760, Math.min(2800, months * 24));
}
