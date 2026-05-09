import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const STATIONS = [
  "Mumbai Central", "New Delhi", "Kolkata", "Chennai Central",
  "Bengaluru", "Hyderabad", "Bhopal", "Ahmedabad", "Pune", "Jaipur"
];

export default function Home() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    navigate(`/trains?${params.toString()}`);
  };

  return (
    <div style={{ minHeight: "calc(100vh - 57px)", background: "#ffffff" }}>

      {/* Hero */}
      <div style={{ borderBottom: "1px solid #e2e2e2", padding: "80px 16px 64px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "inline-block",
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#6b6b6b",
            background: "#f4f4f4",
            border: "1px solid #e2e2e2",
            borderRadius: 20,
            padding: "4px 14px",
            marginBottom: 24
          }}>
            Train Ticket Booking System
          </div>

          <h1 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
            lineHeight: 1.08,
            color: "#0a0a0a",
            marginBottom: 20,
            letterSpacing: "-0.02em"
          }}>
            Book Your<br />Journey
          </h1>

          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "1.05rem", color: "#6b6b6b", maxWidth: 480, margin: "0 auto 48px", lineHeight: 1.6 }}>
            Real-time seat availability, instant booking, and smart waitlisting — all in one place.
          </p>

          {/* Search card */}
          <form onSubmit={handleSearch} style={{ background: "#ffffff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", maxWidth: 580, margin: "0 auto" }}>
            <p className="section-label" style={{ textAlign: "left", marginBottom: 20 }}>Search Trains</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label className="label">Origin Station</label>
                <select className="input" value={from} onChange={e => setFrom(e.target.value)}>
                  <option value="">Select station</option>
                  {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Destination</label>
                <select className="input" value={to} onChange={e => setTo(e.target.value)}>
                  <option value="">Select station</option>
                  {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.75rem", fontSize: "0.85rem" }}>
              Search Trains →
            </button>
          </form>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {[
            { icon: "⚡", title: "Instant Booking", desc: "Seats confirmed in seconds with real-time availability checks." },
            { icon: "🎯", title: "Smart Waitlist", desc: "Auto-notified when seats open. Never miss your chance to board." },
            { icon: "🔐", title: "Secure Sessions", desc: "Your journey data is private and protected at every step." }
          ].map(f => (
            <div key={f.title} style={{ padding: "28px 24px", border: "1px solid #e2e2e2", borderRadius: 12, background: "#fafafa" }}>
              <div style={{ fontSize: "1.75rem", marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#0a0a0a", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.875rem", color: "#6b6b6b", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
