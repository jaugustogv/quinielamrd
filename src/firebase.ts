/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

export const isFirebaseConfigured = !!(
  firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.trim() !== "" && 
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim() !== ""
);

let app;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    // Initialize Firestore with Database ID if provided, otherwise default
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
    auth = getAuth(app);
    console.log("Firebase Firestore initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
} else {
  console.log("Operating in LocalStorage fallback mode (Firebase credentials are not set).");
}

export { db, auth };
export { collection, addDoc, getDocs, doc, getDoc, query, orderBy, deleteDoc, setDoc, where, getDocFromServer } from "firebase/firestore";
export { OperationType } from "./types_helper";

// Error wrapper as requested by the Firebase integration skill
import { OperationType as LocalOperationType } from "./types_helper";
import { getDocFromServer, doc } from "firebase/firestore";

export let lastFirebaseError: string | null = null;
export let isFirebaseConnectionHealthy: boolean | null = null;

export async function checkFirebaseHealth(): Promise<{ healthy: boolean; error: string | null }> {
  if (!isFirebaseConfigured || !db) {
    return { healthy: false, error: "Firebase credentials not configured" };
  }
  try {
    // Attempt standard read to verify connection
    await getDocFromServer(doc(db, "test", "connection"));
    isFirebaseConnectionHealthy = true;
    return { healthy: true, error: null };
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.name + ": " + error.message : String(error);
    lastFirebaseError = errMsg;
    isFirebaseConnectionHealthy = false;
    return { healthy: false, error: errMsg };
  }
}

export function handleFirestoreError(error: unknown, operationType: LocalOperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  lastFirebaseError = errMsg;
  isFirebaseConnectionHealthy = false;
  
  const errInfo = {
    error: errMsg,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
