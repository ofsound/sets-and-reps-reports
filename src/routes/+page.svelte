<script lang="ts">
	import { doc, updateDoc } from 'firebase/firestore';

	import { db } from '$lib/firebase-config';

	import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

	import type { ExerciseObject, SetObject } from '$lib/types/interfaces';

	import { arrayAttemptsToFirestoreMapAttempts } from '$lib/utils/dataConversions';

	import { firestoreMapAttemptsToArrayAttempts } from '$lib/utils/dataConversions';

	$effect(() => {
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

			console.log(dataFromFirestore);
		});
		return () => unsubscribe(); // Cleanup
	});
</script>

<h1 class="mb-2 text-3xl font-bold underline">Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
