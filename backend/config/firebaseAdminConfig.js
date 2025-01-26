require("dotenv").config();
const admin = require("firebase-admin");

// local
//const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// prod
try {
  // Decode the base64 FIREBASE_SERVICE_ACCOUNT
  const serviceAccountJSON = Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    "base64"
  ).toString("utf8");
  const serviceAccount = JSON.parse(serviceAccountJSON);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  console.log("✅ Firebase Admin initialized successfully.");
} catch (error) {
  console.error("❌ Error decoding FIREBASE_SERVICE_ACCOUNT_BASE64:", error);
}

const db = admin.firestore();

module.exports = { db };
