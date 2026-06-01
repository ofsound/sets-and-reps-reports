import { adminDb } from '$lib/server/firebase-admin';
import { transformFirestoreDocToExercise } from '$lib/server/exercise-helpers';
import type { ExerciseObject } from '$lib/types/interfaces';

export async function fetchAllExercises(): Promise<ExerciseObject[]> {
	const exercisesSnapshot = await adminDb
		.collection('exercises')
		.orderBy('order', 'asc')
		.get();

	const exercises: ExerciseObject[] = [];

	exercisesSnapshot.forEach((doc) => {
		const exerciseData = doc.data();
		if (exerciseData) {
			exercises.push(transformFirestoreDocToExercise(doc, exerciseData));
		}
	});

	return exercises;
}
