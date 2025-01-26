require("dotenv").config();

const fs = require("fs").promises;
const path = require("path");
const { google } = require("googleapis");
const admin = require("firebase-admin");

const { db } = require("../config/firebaseAdminConfig");

const clubsCollection = db.collection("clubs");

const TOKEN_PATH = path.resolve(__dirname, "../token.json");

/**
 * Load saved OAuth2 credentials from token.json.
 * Returns an authorized OAuth2 client if successful, otherwise null.
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH, "utf8");
    const tokens = JSON.parse(content);

    // Initialize OAuth2 client using environment variables
    const auth = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    // Set the credentials from token.json
    auth.setCredentials(tokens);

    console.log("✅ OAuth2 client authorized with existing token.");
    return auth;
  } catch (err) {
    console.warn(
      "⚠️  No existing token found. Please authenticate using Auth.js."
    );
    return null;
  }
}

/**
 * Get Unix timestamp (seconds) for n days ago.
 * @param {number} days - Number of days to subtract from the current date.
 * @returns {number} Unix timestamp in seconds.
 */
function getDateNDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return Math.floor(date.getTime() / 1000); // Convert to Unix timestamp (seconds)
}

/**
 * Fetch recent Listserv emails from Gmail using the provided OAuth2 client.
 * @param {google.auth.OAuth2} auth - Authorized OAuth2 client.
 * @returns {Promise<string[]>} Array of unique sender emails.
 */
async function fetchRecentListservEmails(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  const uniqueEmails = new Set();

  try {
    const query = `to:CAMPUS-EVENTS@listserv.dartmouth.edu after:${getDateNDaysAgo(
      30
    )}`;
    console.log(`🔍 Searching emails with query: "${query}"`);

    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 500, // Fetch up to 500 recent emails
      q: query,
    });

    if (!res.data.messages) {
      console.log("📭 No recent Listserv emails found.");
      return [];
    }

    for (const message of res.data.messages) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });

      const headers = msg.data.payload.headers;
      const fromHeader = headers.find((header) => header.name === "From");
      if (fromHeader) {
        uniqueEmails.add(fromHeader.value);
      }
    }

    console.log(`📊 Total Unique Listserv Senders Found: ${uniqueEmails.size}`);
    return [...uniqueEmails]; // Convert Set to Array
  } catch (error) {
    console.error("❌ Error fetching emails:", error.message);
    return [];
  }
}

/**
 * Store unique club emails in Firestore.
 * @param {string[]} clubEmails - Array of club sender emails to store.
 */
async function storeUniqueClubs(clubEmails) {
  try {
    const existingClubsSnapshot = await clubsCollection.get();
    const existingClubs = new Set(
      existingClubsSnapshot.docs.map((doc) => doc.data().email)
    );

    let addedCount = 0;

    for (const email of clubEmails) {
      if (!existingClubs.has(email)) {
        await clubsCollection.add({
          email: email,
          name: formatClubName(email),
          added_at: admin.firestore.Timestamp.now(),
        });
        addedCount++;
      }
    }

    console.log(`✅ Stored ${addedCount} new unique clubs in Firestore.`);
  } catch (error) {
    console.error("❌ Error storing clubs in Firestore:", error.message);
  }
}

/**
 * Format an email address into a readable club name.
 * @param {string} email - The club's email address.
 * @returns {string} Formatted club name.
 */
function formatClubName(email) {
  return email
    .replace(/<.*?>/, "") // Remove angle brackets
    .replace(/[@.]/g, " ") // Replace @ and . with spaces
    .replace(/\s+/g, " ") // Normalize multiple spaces
    .trim();
}

/**
 * Main function to authorize and fetch/store unique clubs.
 */
async function main() {
  const auth = await loadSavedCredentialsIfExist();
  if (!auth) {
    console.error(
      "❌ No valid authentication found. Run `node Auth.js` first."
    );
    return;
  }

  const clubEmails = await fetchRecentListservEmails(auth);
  if (clubEmails.length > 0) {
    await storeUniqueClubs(clubEmails);
  } else {
    console.log("📭 No new unique clubs to store.");
  }
}

main();
