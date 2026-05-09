import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser, registerUser } from "../services/api";

export default function AuthModal() {
  const { authModal, closeAuthModal, login, openAuthModal } = useAuth();
  const [mode, setMode] = useState(authModal || "login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!authModal) return null;

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const res = await loginUser({ email: form.email, password: form.password });
        login(res.data.user);
        closeAuthModal();
        if (res.data.user?.role === "admin") navigate("/admin");
        else if (res.data.user?.role === "tte") navigate("/tte");
      } else {
        await registerUser({ name: form.name, email: form.email, password: form.password });
        const res = await loginUser({ email: form.email, password: form.password });
        login(res.data.user);
        closeAuthModal();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    openAuthModal(m);
    setError("");
    setForm({ name: "", email: "", password: "" });
  };

  return (
    <div
      onClick={closeAuthModal}
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#ffffff", border: "1px solid #e2e2e2", borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.12)", overflow: "hidden" }}
      >
        {/* Top bar */}
        <div style={{ background: "#0a0a0a", padding: "20px 28px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#fff", marginBottom: 3 }}>
                {mode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                {mode === "login" ? "Sign in to continue" : "Register your NeoRail account"}
              </p>
            </div>
            <button onClick={closeAuthModal} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        </div>

        <div style={{ padding: "24px 28px 28px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <div>
                <label className="label">Full Name</label>
                <input className="input" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
              </div>
            )}
            <div>
              <label className="label">{mode === "login" ? "Email or Username" : "Email"}</label>
              <input
                className="input"
                name="email"
                type="text"
                placeholder={mode === "login" ? "admin / tte / your@email.com" : "you@example.com"}
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "#fafafa", border: "1px solid #e2e2e2", borderRadius: 8, fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#0a0a0a" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: "0.75rem", fontSize: "0.875rem", marginTop: 2, opacity: loading ? 0.6 : 1 }}>
              {loading
                ? <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                : mode === "login" ? "Sign In" : "Create Account"
              }
            </button>
          </form>

          {/* Quick login hints */}
          {mode === "login" && (
            <div style={{ marginTop: 16, padding: "12px 14px", background: "#f9f9f9", border: "1px solid #efefef", borderRadius: 8 }}>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a0a0a0", marginBottom: 8 }}>Quick Logins</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { role: "ADMIN", user: "admin", pass: "1234" },
                  { role: "TTE",   user: "tte",   pass: "tte123" }
                ].map(h => (
                  <div key={h.role} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 10, background: "#0a0a0a", color: "#fff" }}>{h.role}</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6b6b6b" }}>
                      <code style={{ background: "#e8e8e8", padding: "1px 5px", borderRadius: 3 }}>{h.user}</code>
                      {" / "}
                      <code style={{ background: "#e8e8e8", padding: "1px 5px", borderRadius: 3 }}>{h.pass}</code>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 18, textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: "0.875rem", color: "#6b6b6b" }}>
            {mode === "login" ? "No account? " : "Already registered? "}
            <button
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600, color: "#0a0a0a", textDecoration: "underline", fontSize: "0.875rem" }}
            >
              {mode === "login" ? "Register" : "Login"}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
