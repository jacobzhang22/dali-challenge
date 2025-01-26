import { useState, useEffect } from "react";
import { getUserPreferences, updateUserPreferences, getAllClubs } from "./api";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
  const [blockedClubs, setBlockedClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchData() {
      // ✅ Fetch user preferences
      const userData = await getUserPreferences();
      console.log("✅ Loaded blocked clubs:", userData.blocked_clubs);
      setBlockedClubs(userData.blocked_clubs || []);

      // ✅ Fetch all clubs from Firestore and sort them alphabetically
      const clubsData = await getAllClubs();
      console.log("✅ Loaded all clubs:", clubsData);
      setAllClubs(clubsData.map((club) => club.name).sort()); // ✅ Sort alphabetically
    }
    fetchData();
  }, []);

  const toggleBlock = (club) => {
    setBlockedClubs((prev) =>
      prev.includes(club) ? prev.filter((c) => c !== club) : [...prev, club]
    );
  };

  const savePreferences = async () => {
    toast.loading("Saving preferences...", { id: "saving" }); // Show loading toast

    const result = await updateUserPreferences(blockedClubs);

    if (result) {
      toast.dismiss("saving"); // Remove loading toast
      toast.success("✅ Preferences saved successfully!");
      const updatedData = await getUserPreferences();
      setBlockedClubs(updatedData.blocked_clubs);
    } else {
      toast.dismiss("saving");
      toast.error("❌ Failed to save preferences. Check console logs.");
    }
  };

  // ✅ Filter clubs based on search input
  const filteredClubs = allClubs.filter((club) =>
    club.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <Toaster position="top-center" /> {/* ✅ Ensure toaster is present */}
      <h1 className="title">Dartmouth Email Filter</h1>
      <p className="subtitle">
        Select clubs from the list below to block their emails.
      </p>
      {/* ✅ Search Bar */}
      <input
        type="text"
        className="search-bar"
        placeholder="Search for a club..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {/* ✅ Clubs List */}
      <div className="club-grid">
        {filteredClubs.length > 0 ? (
          filteredClubs.map((club) => (
            <label key={club} className="club-item">
              <input
                type="checkbox"
                checked={blockedClubs.includes(club)}
                onChange={() => toggleBlock(club)}
              />
              {club}
            </label>
          ))
        ) : (
          <p className="no-results">No clubs found.</p>
        )}
      </div>
      {/* ✅ Save Preferences Button */}
      <button className="save-button" onClick={savePreferences}>
        Save Preferences
      </button>
    </div>
  );
}

export default App;
