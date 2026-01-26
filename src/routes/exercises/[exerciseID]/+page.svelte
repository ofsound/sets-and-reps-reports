<script lang="ts">
	import { doc, onSnapshot } from 'firebase/firestore';
	import { db } from '$lib/firebase-config';
	import type { ExerciseObject } from '$lib/types/interfaces';
	import { firestoreMapAttemptsToArrayAttempts } from '$lib/utils/dataConversions';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let { data } = $props();

	// Use initial data from load function (for SSR/SEO)
	const initialExercise = data.exercise;
	let exercise = $state<ExerciseObject | null>(initialExercise);
	let loading = $state(!initialExercise);

	onMount(() => {
		const exerciseID = page.params.exerciseID;

		if (!exerciseID) {
			loading = false;
			return;
		}

		// Only set up real-time listener - initial data already loaded from +page.ts
		// This will update the exercise when Firestore data changes
		const exerciseRef = doc(db, 'exercises', exerciseID);

		const unsubscribe = onSnapshot(exerciseRef, (docSnapshot) => {
			if (docSnapshot.exists()) {
				const exerciseData = docSnapshot.data();
				const exerciseAttempts = firestoreMapAttemptsToArrayAttempts(exerciseData.attempts);

				exercise = {
					id: exerciseData.id || docSnapshot.id,
					name: exerciseData.name,
					attempts: exerciseAttempts,
					order: exerciseData.order,
					isCurrent: exerciseData.isCurrent
				};
			} else {
				exercise = null;
			}
			loading = false;
		});

		return () => unsubscribe();
	});
</script>

{#if loading}
	<p>Loading exercise...</p>
{:else if exercise}
	<div>
		<h1 class="mb-2 text-3xl font-bold">{exercise.name}</h1>
		<p>Total attempts: {exercise.attempts.length}</p>
		<p>Order: {exercise.order}</p>
		<p>Current: {exercise.isCurrent ? 'Yes' : 'No'}</p>

		<div class="mt-4">
			<h2 class="mb-2 text-2xl font-semibold">Attempts</h2>
			{#each exercise.attempts as attempt, attemptIndex}
				{#if attempt.length > 0}
					<div class="mb-4 rounded border p-4">
						<h3 class="font-semibold">Attempt {attemptIndex + 1}</h3>
						<p class="ml-4 text-sm text-gray-500">
							Date: {new Date(attempt[0].date)
								.toLocaleString(undefined, {
									month: '2-digit',
									day: '2-digit',
									year: 'numeric',
									hour: 'numeric',
									minute: '2-digit',
									hour12: true
								})
								.replace(',', '')
								.replace(
									/(\d{1,2}:\d{2})\s([AP]M)/,
									(_, t, ap) => t.toLowerCase() + ap.toLowerCase()
								)}
						</p>

						{#each attempt as set}
							<div class="ml-4">
								<p>
									{set.reps} x {set.measurement}
									{#if set.notes}
										<span class="text-sm text-gray-600">Notes: {set.notes}</span>
									{/if}
								</p>
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
