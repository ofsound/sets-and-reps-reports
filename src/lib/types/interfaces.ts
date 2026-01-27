export interface ExerciseObject {
	id: string;
	name: string;
	attempts: SetObject[][];
	order: number;
	isCurrent: boolean;
}

export interface SetObject {
	reps: number;
	measurement: string; // Consider: number | string for more flexibility
	notes: string;
	date: number; // Timestamp
}

export interface Dictionary {
	[key: string]: SetObject;
}
