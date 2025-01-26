require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { google } = require("googleapis");
const express = require("express");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Gmail API scope for full mailbox access
const SCOPES = ["https://mail.google.com/"];

// Where we store the token locally
const TOKEN_PATH = path.join(process.cwd(), "token.json");

/**
 * Prompts user for a new token if none exists.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
async function getNewToken(oAuth2Client) {
  const app = express();

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("👉 Authorize this app by visiting this url:", authUrl);

  // Dynamically import 'open' to handle ESM usage
  try {
    const open = (await import("open")).default;
    await open(authUrl);
  } catch (err) {
    console.error(
      "❌ Failed to open the browser automatically. Please copy and paste the URL into your browser."
    );
  }

  return new Promise((resolve, reject) => {
    // Define the OAuth callback endpoint
    app.get("/oauth2callback", async (req, res) => {
      const code = req.query.code;
      if (!code) {
        res.send("❌ No code found in query parameters.");
        return reject("No code found");
      }
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Save token to disk for subsequent script runs
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
        res.send("✅ Authentication successful! You can close this window.");
        console.log("🔐 Token stored to", TOKEN_PATH);

        resolve(oAuth2Client);
      } catch (err) {
        console.error("❌ Error retrieving access token:", err);
        res.send("❌ Error retrieving access token.");
        reject(err);
      } finally {
        // Gracefully shut down the server after a second
        setTimeout(() => {
          process.exit(0);
        }, 1000);
      }
    });

    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(
        `🖥️  Server started on port ${PORT}. Waiting for OAuth callback...`
      );
    });
  });
}

/**
 * Attempts to load existing token. If none found, triggers the OAuth flow.
 * @returns {Promise<google.auth.OAuth2>} An authorized OAuth2 client.
 */
async function authorize() {
  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  // Try loading an existing token from disk
  try {
    const token = JSON.parse(await fs.readFile(TOKEN_PATH, "utf8"));
    oAuth2Client.setCredentials(token);
    console.log("✅ Existing token loaded.");
    return oAuth2Client;
  } catch (err) {
    // No token found → run the getNewToken flow
    console.log("⚠️  No existing token found. Initiating new token request...");
    return await getNewToken(oAuth2Client);
  }
}

/**
 * Example function: lists labels in the user's Gmail account.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listLabels(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.labels.list({
    userId: "me",
  });
  const labels = res.data.labels;
  if (!labels || labels.length === 0) {
    console.log("📭 No labels found.");
    return;
  }
  console.log("📋 Labels:");
  labels.forEach((label) => {
    console.log(`- ${label.name}`);
  });
}

// Export functions so other modules can import them
module.exports = {
  authorize,
  listLabels,
};

// If the script is invoked directly (e.g., `node src/auth.js`),
// automatically run `authorize()`.
if (require.main === module) {
  authorize()
    .then((auth) => {
      // Optional: call listLabels(auth) here, or leave it commented out
      // listLabels(auth);
    })
    .catch((error) => {
      console.error("❌ Authorization failed:", error);
    });
}
