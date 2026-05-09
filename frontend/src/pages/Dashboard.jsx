import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserTickets } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TicketCard from "../components/TicketCard";

export default function Dashboard() {
  const { user, openAuthModal } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) { openAuthModal("login"); return; }
    const fetch = async () => {
      try {
        const res = await getUserTickets(user._id);
        setTickets(res.data);
      } catch { setTickets([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);
  const counts = {
    all: tickets.length,
    confirmed: tickets.filter(t => t.status === "confirmed").length,
    waiting: tickets.filter(t => t.status === "waiting").length,
    notified: tickets.filter(t => t.status === "notified").length
  };

  if (!user) return (
    <div style={{ minHeight: "calc(100vh - 57px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "48px 36px", textAlign: "center", maxWidth: 360 }}>
        <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "1rem", color: "#0a0a0a", marginBottom: 8 }}>Access Restricted</p>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.875rem", color: "#6b6b6b", marginBottom: 24 }}>Please log in to view your dashboard.</p>
        <button onClick={() => openAuthModal("login")} className="btn btn-primary" style={{ width: "100%" }}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "calc(100vh - 57px)", background: "#fafafa" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 32 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 6 }}>Passenger Profile</p>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.75rem", color: "#0a0a0a", marginBottom: 4 }}>{user.name}</h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.875rem", color: "#6b6b6b" }}>{user.email}</p>
          </div>
          <Link to="/trains" className="btn btn-primary" style={{ fontSize: "0.8rem" }}>+ Book New Ticket</Link>
        </div>

        {/* Stats filter */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { key: "all", label: "Total" },
            { key: "confirmed", label: "Confirmed" },
            { key: "waiting", label: "Waiting" },
            { key: "notified", label: "Notified" }
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              style={{
                background: filter === s.key ? "#0a0a0a" : "#ffffff",
                border: `1px solid ${filter === s.key ? "#0a0a0a" : "#e2e2e2"}`,
                borderRadius: 10,
                padding: "16px 12px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.75rem", color: filter === s.key ? "#ffffff" : "#0a0a0a", lineHeight: 1 }}>
                {counts[s.key]}
              </div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: filter === s.key ? "rgba(255,255,255,0.6)" : "#a0a0a0", marginTop: 6 }}>
                {s.label}
              </div>
            </button>
          ))}
        </div>

        <p className="section-label" style={{ marginBottom: 16 }}>My Journeys</p>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ display: "inline-block", width: 32, height: 32, border: "2px solid #0a0a0a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.85rem", color: "#a0a0a0", marginBottom: 20 }}>No tickets found</p>
            <Link to="/trains" className="btn btn-primary" style={{ fontSize: "0.8rem" }}>Book your first ticket →</Link>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filtered.map(ticket => <TicketCard key={ticket._id} ticket={ticket} />)}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
