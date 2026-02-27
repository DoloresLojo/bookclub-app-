import { useState, useEffect } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection, addDoc, onSnapshot, doc, updateDoc, arrayUnion, getDoc, query, where, or
} from "firebase/firestore";

export default function ClubsPage({ onSelectClub, selectedClub }) {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [clubName, setClubName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "clubs"),
      where("memberIds", "array-contains", user.uid)
    );
    const unsub = onSnapshot(q, snap => {
      setClubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user.uid]);

  async function handleCreate() {
    if (!clubName.trim()) return;
    setLoading(true);
    const ref = await addDoc(collection(db, "clubs"), {
      name: clubName.trim(),
      createdBy: user.uid,
      memberIds: [user.uid],
      members: [{ uid: user.uid, name: user.displayName }],
      createdAt: new Date()
    });
    setClubName("");
    setShowCreate(false);
    setLoading(false);
  }

  async function handleJoin() {
    setError("");
    if (!joinCode.trim()) return;
    setLoading(true);
    try {
      const clubDoc = await getDoc(doc(db, "clubs", joinCode.trim()));
      if (!clubDoc.exists()) {
        setError("No se encontró ningún club con ese código.");
        setLoading(false);
        return;
      }
      const data = clubDoc.data();
      if (data.memberIds.includes(user.uid)) {
        setError("Ya sos miembro de este club.");
        setLoading(false);
        return;
      }
      await updateDoc(doc(db, "clubs", joinCode.trim()), {
        memberIds: arrayUnion(user.uid),
        members: arrayUnion({ uid: user.uid, name: user.displayName })
      });
      setJoinCode("");
      setShowJoin(false);
      setSuccess(`¡Te uniste a "${data.name}"!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError("Ocurrió un error. Verificá el código.");
    }
    setLoading(false);
  }

  function copyInviteLink(club) {
    const link = `${window.location.origin}?join=${club.id}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(club.id);
    setTimeout(() => setCopySuccess(""), 2000);
  }

  return (
    <div className="main-content">
      <div className="section-header">
        <div>
          <h2>Mis clubs</h2>
          <p>Creá un club o unite a uno existente</p>
        </div>
      </div>

      {success && <div className="success-msg">{success}</div>}

      <div className="clubs-grid">
        {clubs.map(club => (
          <div
            key={club.id}
            className={`club-card ${selectedClub?.id === club.id ? "active" : ""}`}
            onClick={() => onSelectClub(club)}
          >
            <h3>📖 {club.name}</h3>
            <p>{club.members?.length || 1} miembro{club.members?.length !== 1 ? "s" : ""}</p>
            <div className="club-members">
              {(club.members || []).map((m, i) => (
                <span key={i} className="member-chip">{m.name}</span>
              ))}
            </div>
            <button
              style={{ marginTop: 12, fontSize: "0.8rem", background: "transparent", border: "1px solid #C4714A", color: "#C4714A", padding: "5px 12px", borderRadius: 8, cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); copyInviteLink(club); }}
            >
              {copySuccess === club.id ? "✓ Código copiado" : "📋 Copiar código de invitación"}
            </button>
          </div>
        ))}

        <div className="create-club-card" onClick={() => { setShowCreate(true); setShowJoin(false); }}>
          <span>➕</span>
          <span>Crear nuevo club</span>
        </div>

        <div className="create-club-card" onClick={() => { setShowJoin(true); setShowCreate(false); }}>
          <span>🔗</span>
          <span>Unirme a un club</span>
        </div>
      </div>

      {selectedClub && (
        <div style={{ background: "#F0F7F1", border: "2px solid #7A9E7E", borderRadius: 12, padding: "16px 20px", marginTop: 8 }}>
          <p style={{ color: "#3D6B42", fontWeight: 700 }}>
            ✓ Club seleccionado: <strong>{selectedClub.name}</strong>
          </p>
          <p style={{ fontSize: "0.88rem", color: "#666", marginTop: 4 }}>
            Las votaciones en "Swipear" y "Matches" corresponden a este club.
          </p>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Crear club de lectura</h3>
            <div className="form-group">
              <label>Nombre del club</label>
              <input
                type="text"
                placeholder="Ej: Las Chicas Leen"
                value={clubName}
                onChange={e => setClubName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={loading}>
                {loading ? "Creando..." : "Crear club"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOIN MODAL */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Unirme a un club</h3>
            <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: 16 }}>
              Pedile a quien creó el club que te comparta el código de invitación.
            </p>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label>Código de invitación</label>
              <input
                type="text"
                placeholder="Pegá el código acá"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => { setShowJoin(false); setError(""); }}>Cancelar</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleJoin} disabled={loading}>
                {loading ? "Uniéndome..." : "Unirme"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
