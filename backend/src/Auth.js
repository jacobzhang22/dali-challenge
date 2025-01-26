require("dotenv").config();
const fs = require("fs").promises;
const path = require("path");
const { google } = require("googleapis");

// Load environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = ["https://mail.google.com/"];

// Define token storage paths
const TOKEN_PATH = path.join(process.cwd(), "token.json");

// ⚡️ Production Setup: Load token from Heroku ENV variable
async function loadToken() {
  if (process.env.TOKEN_JSON_BASE64) {
    try {
      const decodedToken = Buffer.from(
        process.env.TOKEN_JSON_BASE64,
        "base64"
      ).toString("utf8");

      // Save token locally for debugging purposes
      await fs.writeFile(TOKEN_PATH, decodedToken);
      console.log("✅ Decoded token.json from Heroku environment variable");

      return JSON.parse(decodedToken);
    } catch (err) {
      console.error("❌ Error decoding token:", err);
      throw err;
    }
  } else {
    throw new Error("❌ No token found in Heroku environment!");
  }
}

/**
 * Loads existing OAuth token from Heroku ENV or local file.
 */
async function authorize() {
  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  try {
    const token = await loadToken();
    oAuth2Client.setCredentials(token);
    console.log("✅ Existing token loaded from Heroku.");
    return oAuth2Client;
  } catch (err) {
    console.error("❌ Failed to load authentication token:", err);
    process.exit(1); // Exit if token cannot be loaded
  }
}

// Export the function so it can be used in other files
module.exports = { authorize };
