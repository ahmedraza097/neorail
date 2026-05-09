import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllTrains } from "../services/api";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

/* ─── helpers ───────────────────────────────────────────── */
function timeToMinutes(t = "") {
  const [h, m] = t.split(":").map(Number);
  return isNaN(h) ? null : h * 60 + (m || 0);
}

function trainStatus(dep, arr) {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const d = timeToMinutes(dep);
  const a = timeToMinutes(arr);
  if (d === null) return { label: "Unknown", pct: 0, color: "#a0a0a0" };

  let total, elapsed;
  if (a >= d) {
    total = a - d;
    elapsed = cur - d;
  } else {
    total = 1440 - d + a;
    elapsed = cur >= d ? cur - d : 1440 - d + cur;
  }
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  if (elapsed < 0 || pct === 0) return { label: "Scheduled", pct: 0, color: "#a0a0a0" };
  if (pct >= 100) return { label: "Arrived", pct: 100, color: "#0a0a0a" };
  return { label: "En Route", pct, color: "#0a0a0a" };
}

/* ─── component ─────────────────────────────────────────── */
export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trains, setTrains] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tab, setTab] = useState("overview");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [editTrain, setEditTrain] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionMsg, setActionMsg] = useState("");
  const [now, setNow] = useState(new Date());

  const [addForm, setAddForm] = useState({
    train_name: "", train_number: "", from_station: "",
    to_station: "", departure_time: "", arrival_time: "", total_seats: ""
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/"); return; }
    fetchData();
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, [user]);

  const fetchData = useCallback(async () => {
    try {
      const [tr, tk] = await Promise.all([getAllTrains(), api.get("/tickets/all")]);
      setTrains(tr.data);
      setTickets(tk.data);
    } catch {}
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true); setAddMsg("");
    try {
      await api.post("/trains/add", { ...addForm, total_seats: Number(addForm.total_seats) });
      setAddMsg("ok");
      setAddForm({ train_name: "", train_number: "", from_station: "", to_station: "", departure_time: "", arrival_time: "", total_seats: "" });
      fetchData();
    } catch (err) { setAddMsg("err:" + (err.response?.data?.error || "Failed")); }
    finally { setAddLoading(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/trains/${editTrain._id}`, editTrain);
      setEditTrain(null); setActionMsg("Train updated.");
      fetchData(); setTimeout(() => setActionMsg(""), 3000);
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/trains/${id}`);
      setDeleteConfirm(null); setActionMsg("Train deleted.");
      fetchData(); setTimeout(() => setActionMsg(""), 3000);
    } catch {}
  };

  if (!user || user.role !== "admin") return null;

  const totalStats = {
    trains: trains.length,
    seats: trains.reduce((a, t) => a + (t.total_seats || 0), 0),
    occupied: trains.reduce((a, t) => a + (t.seats?.filter(s => s.status === "booked").length || 0), 0),
    vacant: trains.reduce((a, t) => a + (t.seats?.filter(s => s.status === "available" || s.status === "open").length || 0), 0),
    waiting: tickets.filter(t => t.status === "waiting").length,
    confirmed: tickets.filter(t => t.status === "confirmed").length,
  };

  const filteredTickets = ticketFilter === "all" ? tickets : tickets.filter(t => t.status === ticketFilter);

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "trains", label: "Manage Trains" },
    { key: "add", label: "+ Add Train" },
    { key: "bookings", label: "All Bookings" },
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 57px)", background: "#fafafa" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 16px" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p className="section-label" style={{ marginBottom: 5 }}>Control Panel</p>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.85rem", color: "#0a0a0a", lineHeight: 1.1 }}>
              Admin Dashboard
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#a0a0a0", marginTop: 4 }}>
              Last refreshed: {now.toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={fetchData} className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "0.45rem 1rem" }}>↻ Refresh</button>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 20, background: "#0a0a0a", color: "#fff" }}>ADMIN</span>
          </div>
        </div>

        {/* ── Summary stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 28 }}>
          {[
            { label: "Total Trains", value: totalStats.trains, invert: true },
            { label: "Total Seats", value: totalStats.seats },
            { label: "Occupied", value: totalStats.occupied },
            { label: "Vacant", value: totalStats.vacant },
            { label: "Waiting List", value: totalStats.waiting },
            { label: "Confirmed Tickets", value: totalStats.confirmed },
          ].map((s, i) => (
            <div key={s.label} style={{
              background: s.invert ? "#0a0a0a" : "#fff",
              border: `1px solid ${s.invert ? "#0a0a0a" : "#e2e2e2"}`,
              borderRadius: 10, padding: "18px 14px", textAlign: "center"
            }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.9rem", color: s.invert ? "#fff" : "#0a0a0a", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: s.invert ? "rgba(255,255,255,0.5)" : "#a0a0a0", marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #e2e2e2", marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.8rem",
              padding: "9px 18px", border: "1px solid", borderBottom: tab === t.key ? "1px solid #fff" : "1px solid #e2e2e2",
              borderColor: "#e2e2e2", background: tab === t.key ? "#fff" : "#f4f4f4",
              color: tab === t.key ? "#0a0a0a" : "#6b6b6b", cursor: "pointer",
              borderRadius: "6px 6px 0 0", marginBottom: -1, transition: "all 0.12s"
            }}>{t.label}</button>
          ))}
        </div>

        {actionMsg && (
          <div style={{ padding: "10px 16px", background: "#f4f4f4", border: "1px solid #e2e2e2", borderRadius: 8, fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#0a0a0a", marginBottom: 16 }}>
            {actionMsg}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: OVERVIEW — per-train cards with position
        ═══════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {trains.map(train => {
              const vacant = train.seats?.filter(s => s.status === "available" || s.status === "open").length || 0;
              const occupied = train.seats?.filter(s => s.status === "booked").length || 0;
              const notBoarded = train.seats?.filter(s => s.status === "not_boarded").length || 0;
              const wait = tickets.filter(t => t.train_id === train._id && t.status === "waiting").length;
              const { label: statusLabel, pct, color } = trainStatus(train.departure_time, train.arrival_time);

              return (
                <div key={train._id} style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, overflow: "hidden" }}>
                  {/* Header bar */}
                  <div style={{ background: "#0a0a0a", padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>#{train.train_number}</p>
                        <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#fff" }}>{train.train_name}</h3>
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                          {train.from_station} → {train.to_station}
                        </p>
                      </div>
                      <span style={{
                        fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", fontWeight: 700,
                        letterSpacing: "0.06em", padding: "3px 10px", borderRadius: 20,
                        background: statusLabel === "En Route" ? "#fff" : statusLabel === "Arrived" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                        color: statusLabel === "En Route" ? "#0a0a0a" : "rgba(255,255,255,0.7)",
                        border: statusLabel === "En Route" ? "none" : "1px solid rgba(255,255,255,0.2)"
                      }}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Position tracker */}
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>{train.departure_time}</span>
                        <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)" }}>
                          {pct > 0 && pct < 100 ? `${pct}% complete` : ""}
                        </span>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>{train.arrival_time}</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 4, position: "relative" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#fff", borderRadius: 4, transition: "width 0.4s ease" }} />
                        {pct > 0 && pct < 100 && (
                          <div style={{
                            position: "absolute", top: "50%", left: `${pct}%`,
                            transform: "translate(-50%, -50%)",
                            width: 10, height: 10, borderRadius: "50%",
                            background: "#fff", border: "2px solid #0a0a0a"
                          }} />
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>{train.from_station}</span>
                        <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>{train.to_station}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
                    {[
                      { label: "Vacant", value: vacant },
                      { label: "Occupied", value: occupied },
                      { label: "Not Boarded", value: notBoarded },
                      { label: "Waiting", value: wait },
                    ].map((s, i) => (
                      <div key={s.label} style={{
                        padding: "14px 8px", textAlign: "center",
                        borderRight: i < 3 ? "1px solid #f0f0f0" : "none",
                        borderTop: "1px solid #f0f0f0"
                      }}>
                        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "#0a0a0a" }}>{s.value}</div>
                        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#a0a0a0", marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Schedule */}
                  <div style={{ padding: "12px 20px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 20 }}>
                      <div>
                        <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#a0a0a0", marginBottom: 1 }}>Departs</p>
                        <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "#0a0a0a" }}>{train.departure_time || "—"}</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#a0a0a0", marginBottom: 1 }}>Arrives</p>
                        <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "#0a0a0a" }}>{train.arrival_time || "—"}</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#a0a0a0", marginBottom: 1 }}>Total Seats</p>
                        <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "#0a0a0a" }}>{train.total_seats}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setEditTrain({ ...train }); setTab("trains"); }}
                      className="btn btn-ghost"
                      style={{ fontSize: "0.7rem", padding: "4px 12px" }}
                    >Edit</button>
                  </div>
                </div>
              );
            })}
            {trains.length === 0 && (
              <div style={{ gridColumn: "1/-1", padding: "60px 24px", textAlign: "center", background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14 }}>
                <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.85rem", color: "#a0a0a0", marginBottom: 16 }}>No trains yet</p>
                <button onClick={() => setTab("add")} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>+ Add first train</button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: MANAGE TRAINS — table + inline edit
        ═══════════════════════════════════════════════ */}
        {tab === "trains" && (
          <div>
            {editTrain && (
              <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "28px", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0a0a0a" }}>Edit Train</h3>
                  <button onClick={() => setEditTrain(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a0a0a0", fontSize: "1.2rem" }}>×</button>
                </div>
                <form onSubmit={handleUpdate} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                  {[
                    { label: "Train Name", key: "train_name" },
                    { label: "Train Number", key: "train_number" },
                    { label: "From Station", key: "from_station" },
                    { label: "To Station", key: "to_station" },
                    { label: "Departure Time", key: "departure_time" },
                    { label: "Arrival Time", key: "arrival_time" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      <input className="input" value={editTrain[f.key] || ""} onChange={e => setEditTrain(t => ({ ...t, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                  <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                    <button type="button" onClick={() => setEditTrain(null)} className="btn btn-ghost" style={{ fontSize: "0.8rem" }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ fontSize: "0.8rem" }}>Save Changes</button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: "#f4f4f4", borderBottom: "1px solid #e2e2e2" }}>
                      {["#", "Train", "Route", "Schedule", "Seats", "Occupied", "Vacant", "Waiting", "Status", "Actions"].map(h => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b6b6b", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trains.map((train, i) => {
                      const vacant = train.seats?.filter(s => s.status === "available" || s.status === "open").length || 0;
                      const occupied = train.seats?.filter(s => s.status === "booked").length || 0;
                      const wait = tickets.filter(t => t.train_id === train._id && t.status === "waiting").length;
                      const { label: statusLabel, pct } = trainStatus(train.departure_time, train.arrival_time);
                      return (
                        <tr key={train._id} style={{ borderBottom: "1px solid #f4f4f4", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "12px 14px", fontFamily: "Space Grotesk, sans-serif", fontSize: "0.75rem", color: "#a0a0a0", whiteSpace: "nowrap" }}>#{train.train_number}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "Inter, sans-serif", fontWeight: 500, color: "#0a0a0a", whiteSpace: "nowrap" }}>{train.train_name}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6b6b6b", whiteSpace: "nowrap" }}>{train.from_station} → {train.to_station}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6b6b6b", whiteSpace: "nowrap" }}>{train.departure_time} – {train.arrival_time}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, color: "#0a0a0a" }}>{train.total_seats}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, color: "#0a0a0a" }}>{occupied}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, color: "#0a0a0a" }}>{vacant}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, color: "#0a0a0a" }}>{wait}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 100 }}>
                              <div style={{ flex: 1, height: 4, background: "#f0f0f0", borderRadius: 4 }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: "#0a0a0a", borderRadius: 4 }} />
                              </div>
                              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.62rem", fontWeight: 600, color: "#6b6b6b", whiteSpace: "nowrap" }}>{statusLabel}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => setEditTrain({ ...train })} className="btn btn-ghost" style={{ fontSize: "0.68rem", padding: "3px 10px" }}>Edit</button>
                              <button onClick={() => setDeleteConfirm(train._id)} className="btn btn-outline" style={{ fontSize: "0.68rem", padding: "3px 10px", color: "#6b6b6b" }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {trains.length === 0 && (
                      <tr><td colSpan={10} style={{ textAlign: "center", padding: "40px", fontFamily: "Inter, sans-serif", color: "#a0a0a0" }}>No trains found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delete confirm */}
            {deleteConfirm && (
              <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}>
                <div style={{ background: "#fff", borderRadius: 14, padding: "32px 28px", maxWidth: 360, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #e2e2e2" }}>
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0a0a0a", marginBottom: 10 }}>Delete Train?</h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6b6b6b", marginBottom: 24 }}>This will permanently remove the train and cannot be undone.</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setDeleteConfirm(null)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                    <button onClick={() => handleDelete(deleteConfirm)} className="btn btn-primary" style={{ flex: 1 }}>Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: ADD TRAIN
        ═══════════════════════════════════════════════ */}
        {tab === "add" && (
          <div style={{ maxWidth: 620 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "32px" }}>
              <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#0a0a0a", marginBottom: 24 }}>Add New Train</h2>
              <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <FormField label="Train Name" name="train_name" form={addForm} set={setAddForm} placeholder="Rajdhani Express" required />
                  <FormField label="Train Number" name="train_number" form={addForm} set={setAddForm} placeholder="12301" required />
                  <FormField label="From Station" name="from_station" form={addForm} set={setAddForm} placeholder="Mumbai Central" required />
                  <FormField label="To Station" name="to_station" form={addForm} set={setAddForm} placeholder="New Delhi" required />
                  <FormField label="Departure Time" name="departure_time" form={addForm} set={setAddForm} placeholder="16:35" />
                  <FormField label="Arrival Time" name="arrival_time" form={addForm} set={setAddForm} placeholder="08:35" />
                </div>
                <FormField label="Total Seats" name="total_seats" form={addForm} set={setAddForm} placeholder="20" type="number" required />

                {addMsg === "ok" && (
                  <div style={{ marginTop: 16, padding: "12px 16px", background: "#f4f4f4", border: "1px solid #e2e2e2", borderRadius: 8, fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#0a0a0a" }}>
                    ✓ Train added successfully
                  </div>
                )}
                {addMsg.startsWith?.("err") && (
                  <div style={{ marginTop: 16, padding: "12px 16px", background: "#fafafa", border: "1px solid #e2e2e2", borderRadius: 8, fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#4a4a4a" }}>
                    {addMsg.replace("err:", "")}
                  </div>
                )}

                <button type="submit" disabled={addLoading} className="btn btn-primary" style={{ marginTop: 20, padding: "0.75rem", fontSize: "0.875rem" }}>
                  {addLoading ? "Adding..." : "Add Train →"}
                </button>
              </form>
            </div>

            {/* Hint card */}
            <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "20px 24px", marginTop: 16 }}>
              <p className="section-label" style={{ marginBottom: 8 }}>Schedule Format</p>
              <ul style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#6b6b6b", lineHeight: 2, paddingLeft: 20 }}>
                <li>Time format: <code style={{ background: "#f4f4f4", padding: "1px 6px", borderRadius: 3 }}>HH:MM</code> (24-hour, e.g. <code style={{ background: "#f4f4f4", padding: "1px 6px", borderRadius: 3 }}>16:35</code>)</li>
                <li>If arrival time is next day (e.g. overnight), that's fine — the system handles it.</li>
                <li>Total seats determines the seat map passengers see.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TAB: ALL BOOKINGS
        ═══════════════════════════════════════════════ */}
        {tab === "bookings" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {["all", "confirmed", "waiting", "notified"].map(f => (
                <button key={f} onClick={() => setTicketFilter(f)} style={{
                  fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.75rem",
                  padding: "5px 14px", borderRadius: 20,
                  border: `1px solid ${ticketFilter === f ? "#0a0a0a" : "#e2e2e2"}`,
                  background: ticketFilter === f ? "#0a0a0a" : "#fff",
                  color: ticketFilter === f ? "#fff" : "#6b6b6b",
                  cursor: "pointer", transition: "all 0.12s"
                }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({f === "all" ? tickets.length : tickets.filter(t => t.status === f).length})
                </button>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: "#f4f4f4", borderBottom: "1px solid #e2e2e2" }}>
                      {["Passenger", "Email", "Train", "Route", "Seat #", "Status"].map(h => (
                        <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b6b6b" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px", fontFamily: "Inter, sans-serif", color: "#a0a0a0", fontSize: "0.85rem" }}>No tickets found</td></tr>
                    )}
                    {filteredTickets.map((t, i) => (
                      <tr key={t._id} style={{ borderBottom: "1px solid #f4f4f4", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "12px 16px", fontFamily: "Inter, sans-serif", fontWeight: 500, color: "#0a0a0a" }}>{t.user?.name || "—"}</td>
                        <td style={{ padding: "12px 16px", fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6b6b6b" }}>{t.user?.email || "—"}</td>
                        <td style={{ padding: "12px 16px", fontFamily: "Inter, sans-serif", color: "#0a0a0a" }}>{t.train?.train_name || "—"}</td>
                        <td style={{ padding: "12px 16px", fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6b6b6b", whiteSpace: "nowrap" }}>{t.train ? `${t.train.from_station} → ${t.train.to_station}` : "—"}</td>
                        <td style={{ padding: "12px 16px", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.8rem", color: "#0a0a0a" }}>{t.seat_number ? `#${t.seat_number}` : "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            fontFamily: "Space Grotesk, sans-serif", fontSize: "0.68rem", fontWeight: 700,
                            letterSpacing: "0.05em", textTransform: "uppercase",
                            padding: "3px 10px", borderRadius: 20,
                            background: t.status === "confirmed" ? "#0a0a0a" : t.status === "notified" ? "#e8e8e8" : "#f4f4f4",
                            color: t.status === "confirmed" ? "#fff" : "#4a4a4a",
                            border: t.status !== "confirmed" ? "1px solid #e2e2e2" : "none"
                          }}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, name, form, set, placeholder, type = "text", required }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type={type}
        placeholder={placeholder}
        value={form[name]}
        onChange={e => set(f => ({ ...f, [name]: e.target.value }))}
        required={required}
      />
    </div>
  );
}
