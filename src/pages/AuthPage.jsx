import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        if (!name.trim()) { setError("Por favor ingresá tu nombre."); setLoading(false); return; }
        await register(email, password, name.trim());
      }
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "No existe una cuenta con ese email.",
        "auth/wrong-password": "Contraseña incorrecta.",
        "auth/email-already-in-use": "Ya existe una cuenta con ese email.",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
        "auth/invalid-email": "El email no es válido.",
        "auth/invalid-credential": "Email o contraseña incorrectos.",
      };
      setError(msgs[err.code] || "Ocurrió un error. Intentá de nuevo.");
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Booklubbing</h1>
          <p>Booklubeando tipo Tinder</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>
            Iniciar sesión
          </button>
          <button className={`auth-tab ${tab === "register" ? "active" : ""}`} onClick={() => { setTab("register"); setError(""); }}>
            Registrarse
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          {tab === "register" && (
            <div className="form-group">
              <label>Tu nombre</label>
              <input type="text" placeholder="Ej: Dolores" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Cargando..." : tab === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
