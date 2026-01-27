<script lang="ts">
	import { page } from '$app/state';

	import { transformAttemptsToChartData } from '$lib/utils/chartData';
	import {
		formatAttemptDate,
		formatAttemptDateDay,
		formatAttemptDateTime
	} from '$lib/utils/dataConversions';
	import { getExercise } from './exercise.remote';

	import Chart from '$lib/components/Chart.svelte';

	// Use remote function to fetch exercise data
	const exerciseID = $derived(page.params.exerciseID);
	const exerciseQuery = $derived(exerciseID ? getExercise(exerciseID) : null);
	const exercise = $derived(exerciseQuery?.current ?? null);

	// Compute chart data from exercise attempts
	const chartData = $derived(exercise ? transformAttemptsToChartData(exercise.attempts) : []);
</script>

{#if exerciseQuery?.loading}
	<!-- <p>Loading exercise...</p> -->
{:else if exerciseQuery?.error}
	<p>Error loading exercise: {exerciseQuery.error.message}</p>
{:else if exercise}
	<div>
		<div>
			<Chart data={chartData} />
		</div>

		<div class="mt-4">
			<div class="flex flex-col-reverse gap-4 px-8">
				{#each exercise.attempts as attempt, attemptIndex (attemptIndex)}
					{#if attempt.length > 0}
						<div class="flex gap-12 rounded bg-slate-100 p-4">
							<div>
								<div class="mb-1.5 text-lg font-semibold">{formatAttemptDate(attempt[0].date)}</div>
								<div class="text-sm">{formatAttemptDateDay(attempt[0].date)}</div>
								<div class="text-sm">{formatAttemptDateTime(attempt[0].date)}</div>
							</div>
							<div class="flex flex-col gap-1.5">
								{#each attempt as set, setIndex (setIndex)}
									<div>
										<span class="font-semibold">{set.measurement}</span> &times;
										<span class="font-semibold">{set.reps}</span>
										{#if set.notes}
											<span class="ml-2 text-sm text-gray-600 italic">{set.notes}</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
{:else}
	<p>Exercise not found.</p>
{/if}
