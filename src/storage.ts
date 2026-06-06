/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured, collection, addDoc, getDocs, query, orderBy, handleFirestoreError, OperationType, doc, deleteDoc, setDoc, where, getDoc } from "./firebase";
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
      // To prevent duplicate entries, we match strictly by lowercase trimmed email
      const merged = [...fbList];
      localList.forEach((local) => {
        const localEmail = local.participant.email.toLowerCase().trim();
        const existsInFirebase = fbList.some(
          (fb) => fb.participant.email.toLowerCase().trim() === localEmail
        );
        if (!existsInFirebase) {
          merged.push(local);
        } else {
          // If the local ID does not match the cloud ID, synchronize local storage to avoid confusion
          const fbMatch = fbList.find(
            (fb) => fb.participant.email.toLowerCase().trim() === localEmail
          );
          if (fbMatch && local.id !== fbMatch.id) {
            try {
              const latestLocals = getLocalSubmissions();
              const idx = latestLocals.findIndex(
                (item) => item.participant.email.toLowerCase().trim() === localEmail
              );
              if (idx !== -1) {
                latestLocals[idx].id = fbMatch.id;
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(latestLocals));
              }
            } catch (err) {
              console.error("Failed to sync ID in local storage", err);
            }
          }
        }
      });
      return merged.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
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

/**
 * Automatically syncs local submissions to Cloud Firestore if Firebase is connected.
 * This heals cases where users registered on their device while offline or in LocalStorage fallback mode,
 * and then visit the page again once Firebase configurations are active.
 */
export async function syncLocalSubmissions(): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const locals = getLocalSubmissions();
    if (locals.length === 0) return;

    const colPath = "submissions";
    const q = query(collection(db, colPath));
    const snapshot = await getDocs(q);
    
    // Map email (lowercase) to the current Firestore document
    const fbSubmissions = new Map<string, QuinielaSubmission>();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data && data.participant && data.participant.email) {
        const emailKey = data.participant.email.toLowerCase().trim();
        fbSubmissions.set(emailKey, {
          id: doc.id,
          ...data
        } as QuinielaSubmission);
      }
    });

    for (const local of locals) {
      const email = local.participant.email.toLowerCase().trim();
      const fbSub = fbSubmissions.get(email);
      
      const localCount = local.totalMatchesPredicted || 0;
      const fbCount = fbSub ? (fbSub.totalMatchesPredicted || 0) : 0;
      
      // Determine if local is newer
      const isNewer = fbSub && new Date(local.submittedAt).getTime() > new Date(fbSub.submittedAt).getTime();
      
      // Overwrite if:
      // 1. Not present in Firestore
      // 2. OR local has predicted more matches than Firestore (e.g. 72 matches on phone vs 6 on CPU)
      // 3. OR they have the same match count but local is newer/newer timestamp
      if (!fbSub || localCount > fbCount || (localCount === fbCount && isNewer)) {
        const updatedLocal = {
          ...local,
          id: fbSub ? fbSub.id : (local.id && !local.id.startsWith("local_") ? local.id : undefined)
        };
        const finalId = await saveSubmission(updatedLocal);
        console.log(`Auto-synced local submission for ${email} to Cloud Firestore. Document ID: ${finalId}`);
      }
    }
  } catch (err) {
    console.warn("Could not auto-sync local submissions to Firebase:", err);
  }
}

/**
 * Gets the administrator PIN.
 * If Firebase is configured, it first tries to retrieve it from Firestore ("config/admin").
 * Falls back to localStorage and finally to "1234".
 */
export async function getAdminPin(): Promise<string> {
  const localDefault = localStorage.getItem("admin_pin_key") || "1234";
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "config", "admin");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.pin) {
          // Sync to localStorage as well
          localStorage.setItem("admin_pin_key", data.pin);
          return data.pin;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch admin PIN from Firestore, using local fallback:", e);
    }
  }
  return localDefault;
}

/**
 * Saves the administrator PIN.
 * If Firebase is configured, it writes to Firestore config/admin to sync with other browsers.
 * Also persists in localStorage.
 */
export async function saveAdminPin(newPin: string): Promise<void> {
  const pin = newPin.trim();
  localStorage.setItem("admin_pin_key", pin);
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "config", "admin");
      await setDoc(docRef, { pin }, { merge: true });
      console.log("Admin PIN saved successfully to Firestore.");
    } catch (e) {
      console.error("Failed to save admin PIN to Firestore:", e);
    }
  }
}





