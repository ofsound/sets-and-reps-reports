import { doc, getDoc } from 'firebase/firestore';
import { db } from '$lib/firebase-config';
import type { ExerciseObject } from '$lib/types/interfaces';
import { firestoreMapAttemptsToArrayAttempts } from '$lib/utils/dataConversions';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const exerciseID = params.exerciseID;

	if (!exerciseID) {
		return { exercise: null };
	}

	const exerciseRef = doc(db, 'exercises', exerciseID);
	const docSnapshot = await getDoc(exerciseRef);

	if (!docSnapshot.exists()) {
		return { exercise: null };
	}

	const exerciseData = docSnapshot.data();
	const exerciseAttempts = firestoreMapAttemptsToArrayAttempts(exerciseData.attempts);

	const exercise: ExerciseObject = {
		id: exerciseData.id || docSnapshot.id,
		name: exerciseData.name,
		attempts: exerciseAttempts,
		order: exerciseData.order,
		isCurrent: exerciseData.isCurrent
	};

	return { exercise };
};
