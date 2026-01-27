import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase-admin';

export const load: PageServerLoad = async () => {
	try {
		// Fetch exercises ordered by 'order' field, limit to 1 for efficiency
		const exercisesSnapshot = await adminDb
			.collection('exercises')
			.orderBy('order', 'asc')
			.limit(1)
			.get();

		// Get the first exercise ID if available
		if (!exercisesSnapshot.empty) {
			const firstDoc = exercisesSnapshot.docs[0];
			const exerciseId = firstDoc.id;
			
			if (exerciseId) {
				throw redirect(302, `/exercises/${exerciseId}`);
			}
		}

		// If no exercises found, redirect to a fallback
		// The exercise page will handle the "not found" case gracefully
		throw redirect(302, '/exercises/not-found');
	} catch (err) {
		// Re-throw redirects (they're expected in SvelteKit)
		if (err && typeof err === 'object' && 'status' in err && err.status === 302) {
			throw err;
		}
		
		// Log other errors and redirect to a safe fallback
		console.error('Error fetching first exercise for redirect:', err);
		throw redirect(302, '/exercises/not-found');
	}
};
