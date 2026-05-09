import React from "react";

export default function TicketCard({ ticket }) {
  const { train, seat_number, status } = ticket;

  const statusConfig = {
    confirmed: { label: "Confirmed", bg: "#0a0a0a", color: "#ffffff" },
    waiting:   { label: "Waiting List", bg: "#f4f4f4", color: "#6b6b6b", border: "1px solid #e2e2e2" },
    notified:  { label: "Seat Notified", bg: "#e8e8e8", color: "#0a0a0a", border: "1px solid #d0d0d0" }
  }[status] || { label: status, bg: "#f4f4f4", color: "#6b6b6b" };

  const accentColor = status === "confirmed" ? "#0a0a0a" : status === "notified" ? "#4a4a4a" : "#d0d0d0";

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e2e2",
      borderRadius: 12,
      overflow: "hidden",
      position: "relative",
      transition: "box-shadow 0.15s"
    }}>
      {/* Left accent stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: accentColor }} />

      <div style={{ padding: "20px 20px 20px 24px" }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0a0a0a", marginBottom: 2 }}>
              {train?.train_name || "Unknown Train"}
            </h3>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#a0a0a0" }}>
              #{train?.train_number || "—"}
            </p>
          </div>
          <span className="tag" style={{ background: statusConfig.bg, color: statusConfig.color, border: statusConfig.border || "none" }}>
            {statusConfig.label}
          </span>
        </div>

        {/* Route & info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
          <InfoItem label="From" value={train?.from_station || "—"} />
          <InfoItem label="To" value={train?.to_station || "—"} />
          <InfoItem label="Departs" value={train?.departure_time || "—"} />
          <InfoItem label="Arrives" value={train?.arrival_time || "—"} />
          {seat_number && (
            <div style={{ display: "flex", gap: 12 }}>
              <InfoItem label="Seat No." value={`#${seat_number}`} bold />
              {ticket.berth_type && <InfoItem label="Berth" value={ticket.berth_type} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, bold }) {
  return (
    <div>
      <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#a0a0a0", marginBottom: 2 }}>
        {label}
      </p>
      <p style={{ fontFamily: "Inter, sans-serif", fontWeight: bold ? 700 : 500, fontSize: "0.875rem", color: "#0a0a0a" }}>
        {value}
      </p>
    </div>
  );
}
