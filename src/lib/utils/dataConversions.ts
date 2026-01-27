import type { DocumentData } from "firebase/firestore";
import type { SetObject, Dictionary } from "$lib/types/interfaces";

export const firestoreMapAttemptsToArrayAttempts = (
    attempts: DocumentData[string],
): SetObject[][] => {
    const arrayAttempts: SetObject[][] = [];
    attempts.forEach(
        (attempt: { [s: string]: unknown } | ArrayLike<unknown>) => {
            const sets = Object.values(attempt) as SetObject[];
            arrayAttempts.push(sets);
        },
    );
    return arrayAttempts;
};

export const arrayAttemptsToFirestoreMapAttempts = (attempts: SetObject[][]): DocumentData[string] => {
    const firestoreMapAttempts: Dictionary[] = [];

    attempts.forEach((attempt: SetObject[]) => {
        const myObject: Dictionary = {};

        attempt.forEach((value, index) => {
            const indexString = index.toString();
            myObject[indexString] = value;
        });
        firestoreMapAttempts.push(myObject);
    });
    return firestoreMapAttempts;
};

export const unitFromMeasurement = (measurement: string): string => {
    return measurement.replace(/[0-9]/g, "");
}

export const numberFromMeasurement = (measurement: string): number => {
    return parseInt(measurement.replace(/\D/g, ""));
}

export const isMeasurementAnInteger = (measurement: string): boolean => {
    const num = +measurement;
    return measurement.length > 0 && Number.isFinite(num) && Number.isInteger(num);
}

export const formatAttemptDate = (date: number): string => {
    return new Date(date).toLocaleDateString(undefined, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
}

export const formatAttemptDateDay = (date: number): string => {
    return new Date(date).toLocaleString(undefined, { weekday: 'long' });
}

export const formatAttemptDateTime = (date: number): string => {
    return new Date(date)
        .toLocaleString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
        .replace(
            /(\d{1,2}:\d{2})\s([AP]M)/,
            (_, t, ap) => t.toLowerCase() + ap.toLowerCase()
        );
}