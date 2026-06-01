import type { ExerciseObject, SetObject } from '$lib/types/interfaces';

export interface ExerciseExportSet {
	setIndex: number;
	reps: number;
	measurement: string;
	notes: string | null;
	dateMs: number;
	dateIso: string;
}

export interface ExerciseExportSession {
	attemptIndex: number;
	sessionDateMs: number | null;
	sessionDateIso: string | null;
	sets: ExerciseExportSet[];
}

export interface ExerciseExportEntry {
	id: string;
	name: string;
	order: number;
	isCurrent: boolean;
	workoutSessions: ExerciseExportSession[];
}

export interface ExerciseExportFile {
	schemaVersion: 1;
	exportedAt: string;
	description: string;
	exerciseCount: number;
	exercises: ExerciseExportEntry[];
}

function mapSet(set: SetObject, setIndex: number): ExerciseExportSet {
	return {
		setIndex,
		reps: set.reps,
		measurement: set.measurement,
		notes: set.notes || null,
		dateMs: set.date,
		dateIso: new Date(set.date).toISOString()
	};
}

function mapSession(attemptSets: SetObject[], attemptIndex: number): ExerciseExportSession {
	const sessionDateMs = attemptSets[0]?.date ?? null;

	return {
		attemptIndex,
		sessionDateMs,
		sessionDateIso: sessionDateMs !== null ? new Date(sessionDateMs).toISOString() : null,
		sets: attemptSets.map(mapSet)
	};
}

export function buildExerciseExportFile(exercises: ExerciseObject[]): ExerciseExportFile {
	return {
		schemaVersion: 1,
		exportedAt: new Date().toISOString(),
		description:
			'Complete workout log export from Firestore exercises collection. Each exercise contains ordered workout sessions; each session has sets with weight/measurement, reps, notes, and timestamps.',
		exerciseCount: exercises.length,
		exercises: exercises.map((exercise) => ({
			id: exercise.id,
			name: exercise.name,
			order: exercise.order,
			isCurrent: exercise.isCurrent,
			workoutSessions: exercise.attempts.map(mapSession)
		}))
	};
}
