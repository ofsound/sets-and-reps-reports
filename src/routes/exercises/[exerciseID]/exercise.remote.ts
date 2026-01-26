import * as v from 'valibot';
import { query } from '$app/server';
import { adminDb } from '$lib/server/firebase-admin';
import { transformFirestoreDocToExercise } from '$lib/server/exercise-helpers';

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

		return transformFirestoreDocToExercise(exerciseDoc, exerciseData);
	} catch (err) {
		console.error('Error fetching exercise:', err);
		// Return null instead of throwing to allow graceful handling
		return null;
	}
});
