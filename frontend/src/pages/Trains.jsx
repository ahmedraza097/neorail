import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getAllTrains, searchTrains } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Trains() {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const { openAuthModal, user } = useAuth();
  const navigate = useNavigate();

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  useEffect(() => {
    const fetchTrains = async () => {
      setLoading(true);
      try {
        const res = from || to ? await searchTrains(from, to) : await getAllTrains();
        setTrains(res.data);
      } catch {
        setError("Failed to load trains. Backend may be unavailable.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrains();
  }, [from, to]);

  const handleSelect = (train) => {
    if (!user) { openAuthModal("login"); return; }
    navigate(`/seats/${train._id}`);
  };

  const availableCount = (train) =>
    train.seats?.filter(s => s.status === "available" || s.status === "open").length || 0;

  return (
    <div style={{ minHeight: "calc(100vh - 57px)", background: "#fafafa" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.6rem", color: "#0a0a0a" }}>
              Available Trains
            </h1>
            {(from || to) && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.875rem", color: "#6b6b6b", marginTop: 4 }}>
                {from && `From: ${from}`}{from && to && " → "}{to && `To: ${to}`}
              </p>
            )}
          </div>
          <Link to="/" className="btn btn-outline">← New Search</Link>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ display: "inline-block", width: 36, height: 36, border: "2px solid #0a0a0a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#a0a0a0", marginTop: 16 }}>Loading trains...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10, padding: 24, textAlign: "center" }}>
            <p style={{ color: "#0a0a0a" }}>{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && trains.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "#a0a0a0", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>No trains found</p>
            <Link to="/" className="btn btn-primary" style={{ fontSize: "0.8rem" }}>Search again</Link>
          </div>
        )}

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {trains.map(train => {
            const avail = availableCount(train);
            const full = avail === 0;
            return (
              <div
                key={train._id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e2e2",
                  borderRadius: 12,
                  padding: "24px",
                  cursor: "pointer",
                  transition: "box-shadow 0.15s, transform 0.15s",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
              >
                {/* Top bar accent */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: full ? "#d0d0d0" : "#0a0a0a", borderRadius: "12px 12px 0 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, marginTop: 8 }}>
                  <div>
                    <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a0a0a0", marginBottom: 4 }}>
                      #{train.train_number}
                    </p>
                    <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0a0a0a" }}>
                      {train.train_name}
                    </h3>
                  </div>
                  <span style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: full ? "#f4f4f4" : "#0a0a0a",
                    color: full ? "#6b6b6b" : "#ffffff",
                    border: full ? "1px solid #e2e2e2" : "none"
                  }}>
                    {full ? "Full" : `${avail} left`}
                  </span>
                </div>

                {/* Route */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>From</p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#0a0a0a" }}>{train.from_station}</p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6b6b6b", marginTop: 1 }}>{train.departure_time}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0a0a0a" }} />
                    <div style={{ width: 1, height: 24, background: "#d0d0d0" }} />
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0a0a0a" }} />
                  </div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>To</p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#0a0a0a" }}>{train.to_station}</p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6b6b6b", marginTop: 1 }}>{train.arrival_time}</p>
                  </div>
                </div>

                <SeatBar seats={train.seats} />

                <button
                  onClick={() => handleSelect(train)}
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: 16, padding: "0.65rem", fontSize: "0.8rem", opacity: full ? 0.7 : 1 }}
                >
                  {full ? "Join Waitlist" : "Select Seats →"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SeatBar({ seats }) {
  if (!seats?.length) return null;
  const avail = seats.filter(s => s.status === "available" || s.status === "open").length;
  const pct = Math.round((avail / seats.length) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#a0a0a0" }}>Capacity</span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6b6b6b" }}>{avail}/{seats.length}</span>
      </div>
      <div style={{ width: "100%", height: 4, background: "#f0f0f0", borderRadius: 4 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct > 50 ? "#0a0a0a" : pct > 20 ? "#6b6b6b" : "#d0d0d0", borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}
