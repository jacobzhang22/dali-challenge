require("dotenv").config();
const admin = require("firebase-admin");

// local
//const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// prod
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString(
      "utf8"
    )
  );
} catch (error) {
  console.error("❌ Error decoding FIREBASE_SERVICE_ACCOUNT_BASE64:", error);
  process.exit(1); // Stop execution if parsing fails
}

// prod end

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = { db };
