import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

async function run() {
  try {
    const app = initializeApp({
      projectId: "argon-elf-98gvj"
    });
    
    // Use the custom database ID
    const db = getFirestore(app, "ai-studio-68a49ed1-a7f0-408c-98d9-66ab01839a40");
    
    const docSnap = await db.collection("config").doc("teams").get();
    if (docSnap.exists) {
      console.log("TEAMS_ADMIN_DATA_START");
      console.log(JSON.stringify(docSnap.data()));
      console.log("TEAMS_ADMIN_DATA_END");
    } else {
      console.log("Document config/teams does not exist");
    }

    const adminSnap = await db.collection("config").doc("admin").get();
    if (adminSnap.exists) {
      console.log("ADMIN_ADMIN_DATA_START");
      console.log(JSON.stringify(adminSnap.data()));
      console.log("ADMIN_ADMIN_DATA_END");
    } else {
      console.log("Document config/admin does not exist");
    }
  } catch (err) {
    console.error("Error reading with admin SDK:", err);
  }
  process.exit(0);
}

run();
