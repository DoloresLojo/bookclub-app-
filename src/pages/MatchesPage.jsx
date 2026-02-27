import { useState, useEffect } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function MatchesPage({ club }) {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!club) { setLoading(false); return; }

    const q = query(collection(db, "matches"), where("clubId", "==", club.id));
    const unsub = onSnapshot(q, snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [club?.id]);

  if (!club) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div className="emoji">👆</div>
          <h3>Primero seleccioná un club</h3>
          <p>Andá a la pestaña "Mis clubs" y hacé clic en uno para activarlo.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div className="emoji">⏳</div>
          <h3>Cargando...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="matches-header">
        <h2>🎯 Matches del club</h2>
        <p>Libros que todas eligieron leer en {club.name}</p>
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">💭</div>
          <h3>Todavía no hay matches</h3>
          <p>Cuando todas las integrantes voten ♥ al mismo libro, ¡aparecerá acá!</p>
        </div>
      ) : (
        <div>
          {matches.map(match => (
            <div key={match.id} className="match-card">
              {match.book?.cover
                ? <img src={match.book.cover} alt={match.book.title} />
                : <div className="match-cover-placeholder">📖</div>
              }
              <div className="match-info">
                <h3>{match.book?.title}</h3>
                <p className="author">{match.book?.author}</p>
                <p>{match.book?.description?.slice(0, 200)}{match.book?.description?.length > 200 ? "..." : ""}</p>
                <span className="match-badge">✓ Todas lo eligieron</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
