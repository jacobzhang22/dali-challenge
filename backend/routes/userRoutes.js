const express = require("express");
const router = express.Router();
const { db } = require("../config/firebaseAdminConfig");

const userPreferencesCollection = db.collection("user_preferences");
const clubsCollection = db.collection("clubs");

// ✅ Route to get user preferences (for now, single user "default")
router.get("/", async (req, res) => {
  try {
    const doc = await userPreferencesCollection.doc("default").get();
    if (!doc.exists) {
      return res.status(404).json({ message: "No preferences found" });
    }
    res.json(doc.data());
  } catch (error) {
    console.error("❌ Error fetching preferences:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Route to update user preferences
router.post("/update", async (req, res) => {
  console.log("📥 Received body:", req.body);

  const { blocked_clubs } = req.body;

  if (!Array.isArray(blocked_clubs)) {
    console.error("❌ Invalid blocked_clubs format:", req.body);
    return res
      .status(400)
      .json({ error: "Blocked clubs list must be an array" });
  }

  try {
    await userPreferencesCollection.doc("default").set({ blocked_clubs });
    console.log("✅ Preferences updated in Firestore:", blocked_clubs);
    res.json({ message: "Preferences updated successfully!", blocked_clubs });
  } catch (error) {
    console.error("❌ Error updating preferences:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ NEW Route to fetch all clubs from Firestore
router.get("/all-clubs", async (req, res) => {
  try {
    const clubsSnapshot = await clubsCollection.get();
    const clubs = clubsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`📊 Retrieved ${clubs.length} clubs from Firestore.`);
    res.json(clubs);
  } catch (error) {
    console.error("❌ Error fetching clubs:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
