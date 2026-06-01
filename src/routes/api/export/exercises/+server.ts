import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchAllExercises } from '$lib/server/fetch-all-exercises';
import { buildExerciseExportFile } from '$lib/server/build-exercise-export';

export const GET: RequestHandler = async () => {
	try {
		const exercises = await fetchAllExercises();
		const payload = buildExerciseExportFile(exercises);
		const filename = `exercises-export-${payload.exportedAt.slice(0, 10)}.json`;
		const body = JSON.stringify(payload, null, 2);

		return new Response(body, {
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	} catch (err) {
		console.error('Error exporting exercises:', err);
		return json({ error: 'Failed to export exercise data' }, { status: 500 });
	}
};
