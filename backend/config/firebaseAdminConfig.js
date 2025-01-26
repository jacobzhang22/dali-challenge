require("dotenv").config();
const admin = require("firebase-admin");

// local
//const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// prod
// heroku sucks and needs to convert environment variable to base64 because its too long
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString(
    "utf8"
  )
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = { db };
