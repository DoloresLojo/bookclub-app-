import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import MyBooksPage from "./pages/MyBooksPage";
import SwipePage from "./pages/SwipePage";
import MatchesPage from "./pages/MatchesPage";
import ClubsPage from "./pages/ClubsPage";

export default function App() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("books");
  const [selectedClub, setSelectedClub] = useState(null);

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
