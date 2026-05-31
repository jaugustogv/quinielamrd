/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured, collection, addDoc, getDocs, query, orderBy, handleFirestoreError, OperationType, doc, deleteDoc, setDoc, where } from "./firebase";
import { QuinielaSubmission } from "./types";

const LOCAL_STORAGE_KEY = "quiniela_submissions_v1";

export function getLocalSubmissions(): QuinielaSubmission[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read from local storage", e);
    return [];
  }
}

export async function saveSubmission(submission: QuinielaSubmission): Promise<string> {
  // Normalize email to lowercase to prevent mixed-case duplicate accounts
  submission.participant.email = submission.participant.email.toLowerCase().trim();
  const emailLower = submission.participant.email;
  
  // 1. Overwrite/update LocalStorage if exact email matches (instead of duplicates)
  const localData = getLocalSubmissions();
  const existingLocalIndex = localData.findIndex(
    (sub) => sub.participant.email.toLowerCase().trim() === emailLower
  );

  let finalId = submission.id || "";

  if (existingLocalIndex !== -1) {
    const prevSub = localData[existingLocalIndex];
    if (!finalId && prevSub.id) {
      finalId = prevSub.id;
    }
    // Update local record
    localData[existingLocalIndex] = {
      ...submission,
      id: finalId || "local_" + Date.now(),
      submittedAt: submission.submittedAt || prevSub.submittedAt
    };
  } else {
    if (!finalId) {
      finalId = "local_" + Date.now();
    }
    const newSub = {
      ...submission,
      id: finalId
    };
    localData.push(newSub);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));

  // 2. If Firebase is configured, write to Cloud Firestore
  if (isFirebaseConfigured && db) {
    const colPath = "submissions";
    try {
      // Check if we already have an ID or if we can query by email to avoid duplicates
      let existingDocId = submission.id && !submission.id.startsWith("local_") ? submission.id : null;

      if (!existingDocId) {
        // Query to find duplicate email in Firestore (using case-insensitive lowercase email normalization)
        const q = query(
          collection(db, colPath),
          where("participant.email", "==", emailLower)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          existingDocId = snapshot.docs[0].id;
        }
      }

      if (existingDocId) {
        // Update / Merge existing document
        const docRef = doc(db, colPath, existingDocId);
        const { id, ...dataToWrite } = { ...submission };
        await setDoc(docRef, dataToWrite, { merge: true });
        return existingDocId;
      } else {
        // Add new document
        const { id, ...dataToWrite } = { ...submission };
        const docRef = await addDoc(collection(db, colPath), dataToWrite);
        return docRef.id;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, colPath);
    }
  }

  return finalId || "local_" + Date.now();
}

export async function getAllSubmissions(): Promise<QuinielaSubmission[]> {
  const localList = getLocalSubmissions();

  if (isFirebaseConfigured && db) {
    const colPath = "submissions";
    try {
      const q = query(collection(db, colPath), orderBy("submittedAt", "desc"));
      const snapshot = await getDocs(q);
      const fbList: QuinielaSubmission[] = [];
      snapshot.forEach((doc) => {
        fbList.push({
          id: doc.id,
          ...doc.data()
        } as QuinielaSubmission);
      });
      
      // If Firestore database contains submissions, we merge them with local ones.
      // To prevent duplicate entries, we can match by name + email + timestamp
      if (fbList.length > 0) {
        const merged = [...fbList];
        localList.forEach((local) => {
          const existsInFirebase = fbList.some(
            (fb) => 
              fb.participant.email === local.participant.email && 
              fb.submittedAt === local.submittedAt
          );
          if (!existsInFirebase) {
            merged.push(local);
          }
        });
        return merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      }
    } catch (error) {
      console.warn("Firestore fetch error, utilizing local fallback:", error);
    }
  }

  return localList.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function deleteSubmission(id: string | undefined, email: string, submittedAt: string): Promise<void> {
  // 1. Delete from client localStorage
  try {
    const localData = getLocalSubmissions();
    const updated = localData.filter(
      (sub) => !(sub.participant.email === email && sub.submittedAt === submittedAt)
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete from local storage", e);
  }

  // 2. Delete from Cloud Firestore
  if (isFirebaseConfigured && db && id && !id.startsWith("local_")) {
    const colPath = "submissions";
    try {
      const docRef = doc(db, colPath, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${colPath}/${id}`);
    }
  }
}

