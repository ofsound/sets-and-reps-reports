<script lang="ts">
	import { doc, onSnapshot } from 'firebase/firestore';
	import { db } from '$lib/firebase-config';
	import type { ExerciseObject } from '$lib/types/interfaces';
	import { firestoreMapAttemptsToArrayAttempts } from '$lib/utils/dataConversions';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	const { exercise: initialExercise } = data;
	let exercise = $state<ExerciseObject | null>(initialExercise);
	let loading = $state(initialExercise === null);

	onMount(() => {
		const exerciseID = page.params.exerciseID;
		
		if (!exerciseID) {
			loading = false;
			return;
		}

		// Set up real-time updates from Firestore
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
				<div class="mb-4 rounded border p-4">
					<h3 class="font-semibold">Attempt {attemptIndex + 1}</h3>
					{#each attempt as set}
						<div class="ml-4">
							<p>Reps: {set.reps}, Measurement: {set.measurement}</p>
							{#if set.notes}
								<p class="text-sm text-gray-600">Notes: {set.notes}</p>
							{/if}
							<p class="text-sm text-gray-500">Date: {new Date(set.date).toLocaleDateString()}</p>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
{:else}
	<p>Exercise not found.</p>
{/if}
