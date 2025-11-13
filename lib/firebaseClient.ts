import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export function getFirebaseApp() {
  if (!getApps().length) {
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      throw new Error("Missing Firebase client configuration environment variables.");
    }
    initializeApp(firebaseConfig);
  }

  return getApps()[0];
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return getAuth(app);
}
