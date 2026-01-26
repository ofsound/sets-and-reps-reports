<script lang="ts">
	import { doc, updateDoc } from 'firebase/firestore';

	import { db } from '$lib/firebase-config';

	import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

	import type { ExerciseObject, SetObject } from '$lib/types/interfaces';

	import { arrayAttemptsToFirestoreMapAttempts } from '$lib/utils/dataConversions';

	import { firestoreMapAttemptsToArrayAttempts } from '$lib/utils/dataConversions';
	import { onMount } from 'svelte';

	let exercises = $state<ExerciseObject[]>([]);

	onMount(() => {
		const q = query(collection(db, 'exercises'), orderBy('order', 'asc'));

		const unsubscribe = onSnapshot(q, (querySnapshot) => {
			const dataFromFirestore: ExerciseObject[] = [];

			querySnapshot.forEach((doc) => {
				const exercise = doc.data();

				const exerciseAttempts = firestoreMapAttemptsToArrayAttempts(exercise.attempts);

				const rowFromFirestore: ExerciseObject = {
					id: exercise.id,
					name: exercise.name,
					attempts: exerciseAttempts,
					order: exercise.order,
					isCurrent: exercise.isCurrent
				};

				dataFromFirestore.push(rowFromFirestore);
			});

			exercises = dataFromFirestore;
		});
		return () => unsubscribe();
	});
</script>

<h1 class="mb-2 text-3xl font-bold underline">Sets and Reps Reports</h1>

<div>
	{#each exercises as exercise}
		<div>
			<a href="/exercises/{exercise.id}" class="cursor-pointer hover:underline">
				{exercise.name}
			</a>
		</div>
	{/each}
</div>
