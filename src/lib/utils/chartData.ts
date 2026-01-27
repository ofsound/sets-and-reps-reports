import type { SetObject } from '$lib/types/interfaces';

export interface ChartDataPoint {
	date: Date;
	value: number;
	attempt: SetObject[];
}

/**
 * Transforms exercise attempts data into chart data points.
 * For each attempt, calculates the sum of (reps × measurement) for all sets,
 * and uses the first set's date as the X-axis value.
 *
 * @param attempts - Array of attempts, where each attempt is an array of SetObject
 * @returns Array of chart data points sorted chronologically by date
 */
export function transformAttemptsToChartData(
	attempts: SetObject[][]
): ChartDataPoint[] {
	const chartData: ChartDataPoint[] = [];

	for (const attempt of attempts) {
		// Skip attempts with no sets
		if (attempt.length === 0) {
			continue;
		}

		// Calculate sum of composite values (reps × measurement) for this attempt
		let sum = 0;
		for (const set of attempt) {
			const measurement = parseInt(set.measurement);
			// Handle cases where parseInt might fail (NaN)
			if (!isNaN(measurement)) {
				sum += set.reps * measurement;
			}
		}

		// Use the first set's date as the X-axis value
		const date = new Date(attempt[0].date);

		// Validate date
		if (!isNaN(date.getTime())) {
			chartData.push({
				date,
				value: sum,
				attempt
			});
		}
	}

	// Sort by date chronologically
	chartData.sort((a, b) => a.date.getTime() - b.date.getTime());

	return chartData;
}
