import type { DocumentSnapshot } from 'firebase-admin/firestore';
import type { ExerciseObject } from '$lib/types/interfaces';
import { firestoreMapAttemptsToArrayAttempts } from '$lib/utils/dataConversions';

/**
 * Transforms a Firestore document snapshot into an ExerciseObject.
 * Used by both getExercises and getExercise remote functions to avoid code duplication.
 */
export function transformFirestoreDocToExercise(
	doc: DocumentSnapshot,
	exerciseData: FirebaseFirestore.DocumentData
): ExerciseObject {
	const exerciseAttempts = firestoreMapAttemptsToArrayAttempts(exerciseData.attempts);

	return {
		id: exerciseData.id || doc.id,
		name: exerciseData.name,
		attempts: exerciseAttempts,
		order: exerciseData.order,
		isCurrent: exerciseData.isCurrent
	};
}
