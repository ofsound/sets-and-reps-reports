import { query } from '$app/server';
import { adminDb } from '$lib/server/firebase-admin';
import type { ExerciseObject } from '$lib/types/interfaces';
import { transformFirestoreDocToExercise } from '$lib/server/exercise-helpers';

export const getExercises = query(async () => {
	try {
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
	} catch (err) {
		console.error('Error fetching exercises:', err);
		// Return empty array instead of throwing to allow graceful handling
		return [];
	}
});
