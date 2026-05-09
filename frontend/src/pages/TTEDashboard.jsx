import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllTrains, getTrainById } from "../services/api";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function TTEDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trains, setTrains] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [trainDetail, setTrainDetail] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [view, setView] = useState("grid"); // "grid" | "list"
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!user || user.role !== "tte") { navigate("/"); return; }
    getAllTrains().then(r => setTrains(r.data)).catch(() => {});
  }, [user]);

  const selectTrain = async (train) => {
    setSelectedTrain(train);
    setActionMsg(null);
    setLoading(true);
    try {
      const [detailRes, passRes] = await Promise.all([
        getTrainById(train._id),
        api.get(`/tickets/train/${train._id}`)
      ]);
      setTrainDetail(detailRes.data);
      setPassengers(passRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  const refresh = useCallback(async () => {
    if (!selectedTrain) return;
    const [detailRes, passRes] = await Promise.all([
      getTrainById(selectedTrain._id),
      api.get(`/tickets/train/${selectedTrain._id}`)
    ]);
    setTrainDetail(detailRes.data);
    setPassengers(passRes.data);
  }, [selectedTrain]);

  const doAction = async (endpoint, seat_number, label) => {
    const key = `${label}-${seat_number}`;
    setActionLoading(key);
    setActionMsg(null);
    try {
      const res = await api.post(`/tickets/${endpoint}`, { train_id: trainDetail._id, seat_number });
      setActionMsg({ type: "ok", text: res.data.message });
      await refresh();
    } catch (err) {
      setActionMsg({ type: "err", text: err.response?.data?.error || "Action failed" });
    } finally { setActionLoading(null); }
  };

  if (!user || user.role !== "tte") return null;

  /* Seat stats */
  const stats = trainDetail ? {
    vacant:     trainDetail.seats.filter(s => s.status === "available" || s.status === "open").length,
    occupied:   trainDetail.seats.filter(s => s.status === "booked").length,
    notBoarded: trainDetail.seats.filter(s => s.status === "not_boarded").length,
    total:      trainDetail.seats.length
  } : null;

  /* Merge seat + passenger info */
  const enrichedSeats = trainDetail?.seats.map(seat => {
    const ticket = passengers.find(p => p.seat_number === seat.seat_number);
    return { ...seat, passenger: ticket?.user || null, ticketStatus: ticket?.status || null };
  }) || [];

  const filteredSeats = filterStatus === "all"
    ? enrichedSeats
    : enrichedSeats.filter(s => s.status === filterStatus);

  return (
    <div style={{ minHeight: "calc(100vh - 57px)", background: "#fafafa" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 5 }}>Travelling Ticket Examiner</p>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.85rem", color: "#0a0a0a" }}>TTE Dashboard</h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#a0a0a0", marginTop: 4 }}>
              Verify seats · Mark vacant or occupied · Manage passenger status
            </p>
          </div>
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 20, background: "#0a0a0a", color: "#fff" }}>TTE</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,280px) 1fr", gap: 20, alignItems: "start" }}>

          {/* ── Train list ── */}
          <div>
            <p className="section-label" style={{ marginBottom: 10 }}>Select Train</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {trains.map(train => {
                const avail = train.seats?.filter(s => s.status === "available" || s.status === "open").length || 0;
                const booked = (train.total_seats || 0) - avail;
                const isSel = selectedTrain?._id === train._id;
                return (
                  <button key={train._id} onClick={() => selectTrain(train)} style={{
                    background: isSel ? "#0a0a0a" : "#fff",
                    border: `1px solid ${isSel ? "#0a0a0a" : "#e2e2e2"}`,
                    borderRadius: 10, padding: "14px 16px", textAlign: "left",
                    cursor: "pointer", transition: "all 0.12s", color: isSel ? "#fff" : "#0a0a0a"
                  }}>
                    <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: isSel ? "rgba(255,255,255,0.45)" : "#a0a0a0", marginBottom: 3 }}>#{train.train_number}</p>
                    <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.875rem", marginBottom: 3 }}>{train.train_name}</p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: isSel ? "rgba(255,255,255,0.55)" : "#6b6b6b", marginBottom: 8 }}>
                      {train.from_station} → {train.to_station}
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", fontWeight: 700, color: isSel ? "rgba(255,255,255,0.6)" : "#0a0a0a" }}>{avail} vacant</span>
                      <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", color: isSel ? "rgba(255,255,255,0.35)" : "#a0a0a0" }}>·</span>
                      <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", fontWeight: 700, color: isSel ? "rgba(255,255,255,0.6)" : "#6b6b6b" }}>{booked} occupied</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Seat panel ── */}
          <div>
            {!selectedTrain && (
              <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "80px 24px", textAlign: "center" }}>
                <p className="section-label">Select a train to verify seats</p>
              </div>
            )}

            {selectedTrain && loading && (
              <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "60px 24px", textAlign: "center" }}>
                <div style={{ display: "inline-block", width: 32, height: 32, border: "2px solid #0a0a0a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              </div>
            )}

            {selectedTrain && !loading && trainDetail && (
              <>
                {/* Stats bar */}
                <div style={{ background: "#0a0a0a", borderRadius: 14, padding: "20px 24px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 0, justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#fff", marginBottom: 3 }}>{trainDetail.train_name}</h2>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{trainDetail.from_station} → {trainDetail.to_station} · {trainDetail.departure_time}–{trainDetail.arrival_time}</p>
                  </div>
                  <button onClick={refresh} className="btn btn-ghost" style={{ fontSize: "0.72rem", padding: "5px 12px", color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.2)" }}>↻ Refresh</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Total", value: stats.total },
                    { label: "Vacant",   value: stats.vacant,     onClick: () => setFilterStatus(filterStatus === "available" ? "all" : "available") },
                    { label: "Occupied", value: stats.occupied,   onClick: () => setFilterStatus(filterStatus === "booked" ? "all" : "booked") },
                    { label: "Not Boarded", value: stats.notBoarded, onClick: () => setFilterStatus(filterStatus === "not_boarded" ? "all" : "not_boarded") }
                  ].map((s, i) => (
                    <div key={s.label} onClick={s.onClick} style={{
                      background: "#fff", border: `1px solid ${s.onClick && filterStatus === (["","available","booked","not_boarded"][i]) ? "#0a0a0a" : "#e2e2e2"}`,
                      borderRadius: 10, padding: "14px 10px", textAlign: "center",
                      cursor: s.onClick ? "pointer" : "default", transition: "all 0.12s"
                    }}>
                      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#0a0a0a", lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#a0a0a0", marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Action message */}
                {actionMsg && (
                  <div style={{ padding: "10px 16px", background: "#f4f4f4", border: "1px solid #e2e2e2", borderRadius: 8, fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#0a0a0a", marginBottom: 12 }}>
                    {actionMsg.text}
                  </div>
                )}

                {/* Toolbar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["all","available","booked","not_boarded","open"].map(f => (
                      <button key={f} onClick={() => setFilterStatus(f)} style={{
                        fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.68rem",
                        padding: "4px 10px", borderRadius: 20,
                        border: `1px solid ${filterStatus === f ? "#0a0a0a" : "#e2e2e2"}`,
                        background: filterStatus === f ? "#0a0a0a" : "#fff",
                        color: filterStatus === f ? "#fff" : "#6b6b6b",
                        cursor: "pointer", transition: "all 0.1s", textTransform: "capitalize"
                      }}>{f === "not_boarded" ? "Not Boarded" : f.charAt(0).toUpperCase() + f.slice(1)}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["grid","list"].map(v => (
                      <button key={v} onClick={() => setView(v)} style={{
                        width: 30, height: 30, borderRadius: 6, border: `1px solid ${view === v ? "#0a0a0a" : "#e2e2e2"}`,
                        background: view === v ? "#0a0a0a" : "#fff", color: view === v ? "#fff" : "#6b6b6b",
                        cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center"
                      }}>{v === "grid" ? "⊞" : "☰"}</button>
                    ))}
                  </div>
                </div>

                {/* Grid view */}
                {view === "grid" && (
                  <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 10 }}>
                      {filteredSeats.map(seat => (
                        <SeatGridCard
                          key={seat.seat_number}
                          seat={seat}
                          loading={actionLoading}
                          onMarkVacant={() => doAction("mark-vacant", seat.seat_number, "vacant")}
                          onMarkOccupied={() => doAction("mark-occupied", seat.seat_number, "occupied")}
                          onNotBoarded={() => doAction("not-boarded", seat.seat_number, "nb")}
                          onOpenSeat={() => doAction("open-seat", seat.seat_number, "open")}
                        />
                      ))}
                    </div>
                    {filteredSeats.length === 0 && (
                      <p style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#a0a0a0", padding: "30px 0" }}>No seats match this filter</p>
                    )}
                  </div>
                )}

                {/* List view */}
                {view === "list" && (
                  <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                        <thead>
                          <tr style={{ background: "#f4f4f4", borderBottom: "1px solid #e2e2e2" }}>
                            {["Seat #", "Status", "Passenger", "Email", "Actions"].map(h => (
                              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b6b6b" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSeats.map((seat, i) => (
                            <tr key={seat.seat_number} style={{ borderBottom: "1px solid #f4f4f4", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                              <td style={{ padding: "10px 14px", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, color: "#0a0a0a" }}>#{seat.seat_number}</td>
                              <td style={{ padding: "10px 14px" }}>
                                <StatusBadge status={seat.status} />
                              </td>
                              <td style={{ padding: "10px 14px", fontFamily: "Inter, sans-serif", fontWeight: 500, color: "#0a0a0a" }}>
                                {seat.passenger?.name || <span style={{ color: "#a0a0a0" }}>—</span>}
                              </td>
                              <td style={{ padding: "10px 14px", fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6b6b6b" }}>
                                {seat.passenger?.email || <span style={{ color: "#a0a0a0" }}>—</span>}
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <ActionButtons
                                  seat={seat}
                                  loading={actionLoading}
                                  onMarkVacant={() => doAction("mark-vacant", seat.seat_number, "vacant")}
                                  onMarkOccupied={() => doAction("mark-occupied", seat.seat_number, "occupied")}
                                  onNotBoarded={() => doAction("not-boarded", seat.seat_number, "nb")}
                                  onOpenSeat={() => doAction("open-seat", seat.seat_number, "open")}
                                />
                              </td>
                            </tr>
                          ))}
                          {filteredSeats.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: "center", padding: "36px", fontFamily: "Inter, sans-serif", color: "#a0a0a0" }}>No seats match this filter</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div style={{ marginTop: 12, padding: "12px 16px", background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10 }}>
                  <p className="section-label" style={{ marginBottom: 8 }}>TTE Actions Guide</p>
                  <ul style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "#6b6b6b", lineHeight: 2, paddingLeft: 18 }}>
                    <li><strong style={{ color: "#0a0a0a" }}>Mark Vacant</strong> — frees a booked seat, notifies next passenger in waiting list</li>
                    <li><strong style={{ color: "#0a0a0a" }}>Mark Occupied</strong> — manually marks an available seat as booked</li>
                    <li><strong style={{ color: "#0a0a0a" }}>Not Boarded</strong> — passenger didn't board; notifies first person in waitlist</li>
                    <li><strong style={{ color: "#0a0a0a" }}>Open Seat</strong> — makes a not-boarded seat available to everyone</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    available:   { label: "Vacant",       bg: "#f4f4f4", color: "#0a0a0a", border: "#e2e2e2" },
    open:        { label: "Open",         bg: "#f4f4f4", color: "#0a0a0a", border: "#d0d0d0" },
    booked:      { label: "Occupied",     bg: "#0a0a0a", color: "#ffffff", border: "#0a0a0a" },
    not_boarded: { label: "Not Boarded",  bg: "#e8e8e8", color: "#4a4a4a", border: "#d0d0d0" },
  }[status] || { label: status, bg: "#f4f4f4", color: "#6b6b6b", border: "#e2e2e2" };

  return (
    <span style={{
      fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", fontWeight: 700,
      letterSpacing: "0.05em", textTransform: "uppercase",
      padding: "3px 9px", borderRadius: 20,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`
    }}>{cfg.label}</span>
  );
}

function ActionButtons({ seat, loading, onMarkVacant, onMarkOccupied, onNotBoarded, onOpenSeat }) {
  const busy = (lbl) => loading === `${lbl}-${seat.seat_number}`;
  const Btn = ({ label, fn, variant = "ghost" }) => (
    <button onClick={fn} disabled={!!loading} className={`btn btn-${variant}`}
      style={{ fontSize: "0.68rem", padding: "3px 10px", opacity: loading ? 0.5 : 1, whiteSpace: "nowrap" }}>
      {busy(label.toLowerCase().replace(" ", "")) ? "…" : label}
    </button>
  );
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {seat.status === "booked"       && <><Btn label="Mark Vacant"   fn={onMarkVacant}   /><Btn label="Not Boarded" fn={onNotBoarded} /></>}
      {seat.status === "not_boarded"  && <><Btn label="Open Seat"     fn={onOpenSeat}     /><Btn label="Mark Occupied" fn={onMarkOccupied} variant="primary" /></>}
      {(seat.status === "available" || seat.status === "open") && <Btn label="Mark Occupied" fn={onMarkOccupied} variant="primary" />}
    </div>
  );
}

function SeatGridCard({ seat, loading, onMarkVacant, onMarkOccupied, onNotBoarded, onOpenSeat }) {
  const [hover, setHover] = useState(false);
  const statusColor = { available: "#f4f4f4", open: "#e8e8e8", booked: "#0a0a0a", not_boarded: "#d0d0d0" }[seat.status];
  const textColor = seat.status === "booked" ? "#fff" : "#0a0a0a";

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative" }}
    >
      <div style={{
        background: statusColor, border: `1.5px solid ${seat.status === "booked" ? "#0a0a0a" : "#d0d0d0"}`,
        borderRadius: 8, padding: "10px 6px", textAlign: "center",
        transition: "all 0.12s"
      }}>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "0.85rem", color: textColor }}>
          #{seat.seat_number}
        </div>
        {seat.passenger && (
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", color: "rgba(255,255,255,0.6)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
            {seat.passenger.name}
          </div>
        )}
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.55rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: seat.status === "booked" ? "rgba(255,255,255,0.45)" : "#a0a0a0", marginTop: 2 }}>
          {seat.status === "not_boarded" ? "N/B" : seat.status === "available" ? "free" : seat.status}
        </div>
      </div>

      {/* Hover overlay with actions */}
      {hover && (
        <div style={{
          position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
          background: "#fff", border: "1px solid #e2e2e2", borderRadius: 8,
          padding: "8px", zIndex: 50, minWidth: 130,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
        }}>
          {seat.passenger && (
            <div style={{ marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid #f0f0f0" }}>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#a0a0a0", marginBottom: 2 }}>Passenger</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", fontWeight: 500, color: "#0a0a0a" }}>{seat.passenger.name}</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: "#6b6b6b" }}>{seat.passenger.email}</p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {seat.status === "booked" && (
              <>
                <HoverBtn label="Mark Vacant" onClick={onMarkVacant} />
                <HoverBtn label="Not Boarded" onClick={onNotBoarded} />
              </>
            )}
            {seat.status === "not_boarded" && (
              <>
                <HoverBtn label="Open Seat" onClick={onOpenSeat} />
                <HoverBtn label="Mark Occupied" onClick={onMarkOccupied} primary />
              </>
            )}
            {(seat.status === "available" || seat.status === "open") && (
              <HoverBtn label="Mark Occupied" onClick={onMarkOccupied} primary />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HoverBtn({ label, onClick, primary }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.68rem",
      padding: "5px 8px", borderRadius: 5, width: "100%", textAlign: "left",
      border: `1px solid ${primary ? "#0a0a0a" : "#e2e2e2"}`,
      background: primary ? "#0a0a0a" : "#fafafa",
      color: primary ? "#fff" : "#0a0a0a",
      cursor: "pointer"
    }}>{label}</button>
  );
}
