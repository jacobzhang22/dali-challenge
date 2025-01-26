require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const { google } = require("googleapis");
const { db } = require("../config/firebaseAdminConfig");

const TOKEN_PATH = path.join(process.cwd(), "token.json");
const userPreferencesDoc = db.collection("user_preferences").doc("default");

async function loadOAuth2Client() {
  try {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI;

    const oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Load the token from disk (or environment) as you do now
    const token = await fs.readFile(TOKEN_PATH, "utf8");
    oAuth2Client.setCredentials(JSON.parse(token));

    return oAuth2Client;
  } catch (err) {
    console.error("❌ Error loading OAuth2 client:", err.message);
    return null;
  }
}

/**
 * Fetch blocked clubs from Firestore.
 */
async function getBlockedClubs() {
  try {
    const doc = await userPreferencesDoc.get();
    if (!doc.exists) {
      console.log("📭 No blocked clubs found in Firestore.");
      return [];
    }
    const data = doc.data();
    console.log(
      `🔴 Blocked clubs: ${JSON.stringify(data.blocked_clubs, null, 2)}`
    );
    return data.blocked_clubs || [];
  } catch (error) {
    console.error("❌ Error fetching blocked clubs:", error.message);
    return [];
  }
}

/**
 * Fetch Listserv emails (emails sent to CAMPUS-EVENTS@listserv.dartmouth.edu).
 */
async function fetchListservEmails(auth) {
  const gmail = google.gmail({ version: "v1", auth });

  try {
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 50, // Adjust as needed
      q: "to:CAMPUS-EVENTS@listserv.dartmouth.edu in:inbox", // Only fetch Listserv emails
    });

    if (!res.data.messages) {
      console.log("📭 No Listserv emails found.");
      return [];
    }

    let listservEmails = [];

    for (const message of res.data.messages) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });

      const headers = msg.data.payload.headers;
      const fromHeader = headers.find((header) => header.name === "From");
      const subjectHeader = headers.find((header) => header.name === "Subject");

      const from = fromHeader ? fromHeader.value : "Unknown Sender";
      const subject = subjectHeader ? subjectHeader.value : "No Subject";

      console.log(`📧 Listserv Email | From: ${from} | Subject: ${subject}`);
      listservEmails.push({ id: message.id, from, subject });
    }

    console.log(`📨 Found ${listservEmails.length} Listserv emails.`);
    return listservEmails;
  } catch (error) {
    console.error("❌ Error fetching Listserv emails:", error.message);
    return [];
  }
}

/**
 * Identify emails from blocked senders.
 */
async function fetchBannedEmails(auth, blockedClubs, listservEmails) {
  if (blockedClubs.length === 0) {
    console.log("✅ No blocked clubs to check.");
    return [];
  }

  let emailIdsToArchive = [];

  for (const email of listservEmails) {
    if (blockedClubs.some((blocked) => email.from.includes(blocked))) {
      emailIdsToArchive.push(email.id);
      console.log(`🚫 Email from ${email.from} will be archived.`);
    }
  }

  console.log(`📦 Found ${emailIdsToArchive.length} emails to archive.`);
  return emailIdsToArchive;
}

/**
 * Move emails to archive (removes "INBOX" label).
 */
async function archiveEmails(auth, emailIds) {
  if (emailIds.length === 0) {
    console.log("✅ No emails to archive.");
    return;
  }

  const gmail = google.gmail({ version: "v1", auth });

  try {
    for (const emailId of emailIds) {
      await gmail.users.messages.modify({
        userId: "me",
        id: emailId,
        requestBody: {
          removeLabelIds: ["INBOX"], // ✅ "INBOX" label removed to archive
        },
      });
    }

    console.log(`✅ Archived ${emailIds.length} emails.`);
  } catch (error) {
    console.error("❌ Error archiving emails:", error.message);
  }
}

/**
 * Main function to authenticate and archive emails.
 */
async function runScript() {
  console.log("\n🔄 Running archive script...");

  const auth = await loadOAuth2Client();
  if (!auth) {
    console.error(
      "❌ No valid authentication found. Run `node Auth.js` first."
    );
    return;
  }

  // 📩 Fetch only Listserv emails
  const listservEmails = await fetchListservEmails(auth);

  // 🔴 Get blocked senders
  const blockedClubs = await getBlockedClubs();
  if (blockedClubs.length === 0) {
    console.log("✅ No blocked clubs found. Exiting.");
    return;
  }

  // 🔎 Find emails from blocked senders
  const emailIdsToArchive = await fetchBannedEmails(
    auth,
    blockedClubs,
    listservEmails
  );

  // 📦 Archive emails
  await archiveEmails(auth, emailIdsToArchive);
}

// Export runScript for modular use
module.exports = {
  runScript,
};
