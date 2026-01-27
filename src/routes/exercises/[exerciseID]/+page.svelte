<script lang="ts">
	import { page } from '$app/state';

	import { transformAttemptsToChartData } from '$lib/utils/chartData';
	import { formatAttemptDate } from '$lib/utils/dataConversions';
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
	<p>Loading exercise...</p>
{:else if exerciseQuery?.error}
	<p>Error loading exercise: {exerciseQuery.error.message}</p>
{:else if exercise}
	<div>
		<h1 class="mb-2 text-3xl font-bold">{exercise.name}</h1>
		<!-- <p>Total attempts: {exercise.attempts.length}</p>
		<p>Order: {exercise.order}</p>
		<p>Current: {exercise.isCurrent ? 'Yes' : 'No'}</p> -->

		<div class="mt-6">
			<Chart data={chartData} />
		</div>

		<div class="mt-4">
			<h2 class="mb-2 text-2xl font-semibold">Attempts</h2>
			{#each exercise.attempts as attempt, attemptIndex (attemptIndex)}
				{#if attempt.length > 0}
					<div class="mb-4 rounded border p-4">
						<h3 class="font-semibold">Attempt {attemptIndex + 1}</h3>
						<p class="ml-4 text-sm text-gray-500">
							{formatAttemptDate(attempt[0].date)}
						</p>

						{#each attempt as set, setIndex (setIndex)}
							<div class="">
								<p>
									{set.reps} x {set.measurement}
									{#if set.notes}
										<span class="text-sm text-gray-600">Notes: {set.notes}</span>
									{/if}
								</p>
								<div class="composite">
									{set.reps * parseInt(set.measurement)}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{:else}
	<p>Exercise not found.</p>
{/if}
