import * as v from 'valibot';
import { query } from '$app/server';
import { adminDb } from '$lib/server/firebase-admin';
import type { ExerciseObject } from '$lib/types/interfaces';
import { firestoreMapAttemptsToArrayAttempts } from '$lib/utils/dataConversions';

export const getExercise = query(v.string(), async (exerciseID) => {
	if (!exerciseID) {
		return null;
	}

	try {
		const exerciseDoc = await adminDb.collection('exercises').doc(exerciseID).get();

		if (!exerciseDoc.exists) {
			return null;
		}

		const exerciseData = exerciseDoc.data();
		if (!exerciseData) {
			return null;
		}

		const exerciseAttempts = firestoreMapAttemptsToArrayAttempts(exerciseData.attempts);

		const exercise: ExerciseObject = {
			id: exerciseData.id || exerciseDoc.id,
			name: exerciseData.name,
			attempts: exerciseAttempts,
			order: exerciseData.order,
			isCurrent: exerciseData.isCurrent
		};

		return exercise;
	} catch (err) {
		console.error('Error fetching exercise:', err);
		// Return null instead of throwing to allow graceful handling
		return null;
	}
});
