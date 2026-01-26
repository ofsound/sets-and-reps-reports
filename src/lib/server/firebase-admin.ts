import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
	FIREBASE_PROJECT_ID,
	FIREBASE_CLIENT_EMAIL,
	FIREBASE_PRIVATE_KEY
} from '$env/static/private';

// Initialize Firebase Admin SDK
if (!getApps().length) {
	try {
		initializeApp({
			credential: cert({
				projectId: FIREBASE_PROJECT_ID,
				clientEmail: FIREBASE_CLIENT_EMAIL,
				privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
			})
		});
	} catch (error) {
		console.error('Firebase Admin initialization error:', error);
		throw error;
	}
}

export const adminDb = getFirestore();
