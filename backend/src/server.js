const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { authorize } = require("../src/auth"); // Import authorize function

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Placeholder route
app.get("/", (req, res) => {
  res.send("✅ Dartmouth Email Filter Backend is Running 🚀");
});

// Import and use routes
const userRoutes = require("../routes/userRoutes");
app.use("/api/user-preferences", userRoutes);

// Import email processing function
const { runScript } = require("../src/archiveBannedEmails");

// Define the interval for running the email processing script
const INTERVAL_MS = 60 * 1000; // 1 minute

// Function to start the email processing
async function startEmailProcessing() {
  try {
    const auth = await authorize(); // Ensure OAuth authorization before processing emails
    console.log("🔑 OAuth authorization successful.");

    // Run the script once immediately
    await runScript(auth);
    console.log("✅ Initial email processing completed.");

    // Schedule the email processing to run at defined intervals
    setInterval(async () => {
      try {
        await runScript(auth);
        console.log("✅ Scheduled email processing completed.");
      } catch (error) {
        console.error(
          "❌ Error during scheduled email processing:",
          error.message
        );
      }
    }, INTERVAL_MS);
  } catch (error) {
    console.error("❌ OAuth authorization failed:", error);
    process.exit(1); // Exit the app if authorization fails
  }
}

// Start OAuth authorization and email processing, then start the Express server
startEmailProcessing().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
});
