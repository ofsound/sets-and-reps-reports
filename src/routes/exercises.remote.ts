import { query } from '$app/server';
import { fetchAllExercises } from '$lib/server/fetch-all-exercises';

export const getExercises = query(async () => {
	try {
		return await fetchAllExercises();
	} catch (err) {
		console.error('Error fetching exercises:', err);
		// Return empty array instead of throwing to allow graceful handling
		return [];
	}
});
