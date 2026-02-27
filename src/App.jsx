import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import MyBooksPage from "./pages/MyBooksPage";
import SwipePage from "./pages/SwipePage";
import MatchesPage from "./pages/MatchesPage";
import ClubsPage from "./pages/ClubsPage";
import { db } from "./firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

export default function App() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("books");
  const [selectedClub, setSelectedClub] = useState(null);
  const [joinMsg, setJoinMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const clubId = params.get("join");
    if (!clubId) return;

    async function autoJoin() {
      try {
        const clubDoc = await getDoc(doc(db, "clubs", clubId));
        if (!clubDoc.exists()) return;
        const data = clubDoc.data();
        if (data.memberIds.includes(user.uid)) {
          setSelectedClub({ id: clubId, ...data });
          setTab("swipe");
          setJoinMsg(`¡Ya eras parte de "${data.name}"!`);
        } else {
          await updateDoc(doc(db, "clubs", clubId), {
            memberIds: arrayUnion(user.uid),
            members: arrayUnion({ uid: user.uid, name: user.displayName })
          });
          const updated = { id: clubId, ...data, memberIds: [...data.memberIds, user.uid] };
          setSelectedClub(updated);
          setTab("swipe");
          setJoinMsg(`¡Te uniste a "${data.name}"! 🎉`);
        }
        window.history.replaceState({}, "", window.location.pathname);
        setTimeout(() => setJoinMsg(""), 4000);
      } catch (e) {
        console.error("Error joining club:", e);
      }
    }
    autoJoin();
  }, [user]);

  if (!user) return <AuthPage />;

  function handleSelectClub(club) {
    setSelectedClub(club);
    setTab("swipe");
  }

  return (
    <div className="app-layout">
      <nav className="navbar">
        <span className="navbar-brand">📚 Booklubbing</span>
        <div className="navbar-user">
          <span>Hola, {user.displayName || user.email}</span>
          <button className="btn-logout" onClick={logout}>Salir</button>
        </div>
      </nav>

      {joinMsg && (
        <div style={{
          background: "#E8F5E9",
          color: "#2E7D32",
          padding: "12px 24px",
          fontWeight: 700,
          textAlign: "center",
          fontSize: "0.95rem"
        }}>
          {joinMsg}
        </div>
      )}

      <div className="nav-tabs">
        <button className={`nav-tab ${tab === "books" ? "active" : ""}`} onClick={() => setTab("books")}>
          Mis libros
        </button>
        <button className={`nav-tab ${tab === "clubs" ? "active" : ""}`} onClick={() => setTab("clubs")}>
          Mis clubs {selectedClub ? `· ${selectedClub.name}` : ""}
        </button>
        <button className={`nav-tab ${tab === "swipe" ? "active" : ""}`} onClick={() => setTab("swipe")}>
          Swipear
        </button>
        <button className={`nav-tab ${tab === "matches" ? "active" : ""}`} onClick={() => setTab("matches")}>
          Matches
        </button>
      </div>

      {tab === "books" && <MyBooksPage />}
      {tab === "clubs" && <ClubsPage onSelectClub={handleSelectClub} selectedClub={selectedClub} />}
      {tab === "swipe" && <SwipePage club={selectedClub} />}
      {tab === "matches" && <MatchesPage club={selectedClub} />}
    </div>
  );
}
