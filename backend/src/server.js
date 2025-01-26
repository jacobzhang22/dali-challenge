const express = require("express");
const cors = require("cors");
require("dotenv").config();

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
const INTERVAL_MS = 60 * 1000; // 1 minutes

// Function to start the email processing
function startEmailProcessing() {
  // Run the script once immediately
  runScript()
    .then(() => {
      console.log("✅ Initial email processing completed.");
    })
    .catch((error) => {
      console.error("❌ Error during initial email processing:", error.message);
    });

  // Schedule the email processing to run at defined intervals
  setInterval(() => {
    runScript()
      .then(() => {
        console.log("✅ Scheduled email processing completed.");
      })
      .catch((error) => {
        console.error(
          "❌ Error during scheduled email processing:",
          error.message
        );
      });
  }, INTERVAL_MS);
}

// Start the email processing
startEmailProcessing();

// Start the Express server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
