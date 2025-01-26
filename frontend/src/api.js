const API_URL = import.meta.env.VITE_API_URL;

// ✅ Fetch user preferences (blocked clubs)
export const getUserPreferences = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch preferences");
    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching preferences:", error);
    return { blocked_clubs: [] }; // Default empty list
  }
};

// ✅ Fetch all clubs from Firestore
export const getAllClubs = async () => {
  try {
    const response = await fetch(`${API_URL}/all-clubs`);
    if (!response.ok) throw new Error("Failed to fetch clubs");
    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching clubs:", error);
    return []; // Default empty list
  }
};

// ✅ Update user preferences (blocked clubs)
export const updateUserPreferences = async (blockedClubs) => {
  try {
    console.log("📤 Sending blocked clubs:", blockedClubs);

    const response = await fetch(`${API_URL}/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ blocked_clubs: blockedClubs }), // Ensure correct property is sent
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Server error response:", data);
      throw new Error(data.error || "Failed to update preferences");
    }

    console.log("✅ Preferences updated successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Error updating preferences:", error.message);
    return null;
  }
};
