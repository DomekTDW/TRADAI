import admin from "firebase-admin";

admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID || "mentor-ai-dashboard",
});

const db = admin.firestore();

// Uwaga: seedujemy dane dla przykładowego UID
const uid = "sampleUser";

async function run() {
  const userRef = db.doc(`users/${uid}`);
  await userRef.set({
    displayName: "Dominik",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await userRef.collection("goals").doc("goal1").set({
    title: "Learn Firebase",
    status: "active",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await userRef.collection("challenges").doc("challenge1").set({
    title: "Complete Firebase tutorial",
    status: "todo",
    goalId: "goal1",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await userRef.collection("activity").doc("activity1").set({
    type: "note",
    text: "Completed first lesson",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await userRef.collection("ai_suggestions").doc("suggestion1").set({
    suggestionText: "Try exploring advanced Firebase features",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Seed complete:", `users/${uid}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
