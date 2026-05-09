import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTrainById, bookTicket } from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ─── Payment Modal ─────────────────────────────────────── */
function PaymentModal({ train, onClose, onSuccess }) {
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("form"); // "form" | "processing" | "done"

  const price = train?.price_per_seat || 500;
  const convenience = Math.round(price * 0.02);
  const total = price + convenience;

  const fmt = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "number") v = value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    if (name === "expiry") v = value.replace(/\D/g, "").slice(0, 4).replace(/^(.{2})(.+)/, "$1/$2");
    if (name === "cvv") v = value.replace(/\D/g, "").slice(0, 3);
    setCard(c => ({ ...c, [name]: v }));
    setErrors(er => ({ ...er, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (card.number.replace(/\s/g, "").length < 16) e.number = "Enter a valid 16-digit card number";
    if (!card.name.trim()) e.name = "Enter cardholder name";
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = "Enter expiry as MM/YY";
    if (card.cvv.length < 3) e.cvv = "Enter 3-digit CVV";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    setStep("processing");
    await new Promise(r => setTimeout(r, 2000));
    setStep("done");
    await new Promise(r => setTimeout(r, 1000));
    onSuccess();
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 16, width: "100%", maxWidth: 460, boxShadow: "0 12px 48px rgba(0,0,0,0.15)", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ background: "#0a0a0a", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>Secure Payment</p>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#fff" }}>{train?.train_name}</h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{train?.from_station} → {train?.to_station}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Processing / Done states */}
          {step === "processing" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ display: "inline-block", width: 44, height: 44, border: "3px solid #0a0a0a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", marginBottom: 16 }} />
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#0a0a0a" }}>Processing Payment…</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6b6b6b", marginTop: 6 }}>Please do not close this window</p>
            </div>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 56, height: 56, background: "#0a0a0a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "1.5rem", color: "#fff" }}>✓</div>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0a0a0a" }}>Payment Confirmed!</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6b6b6b", marginTop: 6 }}>Booking your seat now…</p>
            </div>
          )}

          {step === "form" && (
            <>
              {/* Price breakdown */}
              <div style={{ background: "#f9f9f9", border: "1px solid #e8e8e8", borderRadius: 10, padding: "14px 16px", marginBottom: 22 }}>
                <p className="section-label" style={{ marginBottom: 10 }}>Order Summary</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#4a4a4a", marginBottom: 6 }}>
                  <span>Seat fare (1 seat)</span>
                  <span>₹{price.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6b6b6b", marginBottom: 10 }}>
                  <span>Convenience fee (2%)</span>
                  <span>₹{convenience}</span>
                </div>
                <div style={{ borderTop: "1px solid #e2e2e2", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#0a0a0a" }}>Total</span>
                  <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0a0a0a" }}>₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Card form */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="label">Card Number</label>
                  <input className="input" name="number" placeholder="1234 5678 9012 3456" value={card.number} onChange={fmt} style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.08em" }} />
                  {errors.number && <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#c0392b", marginTop: 4 }}>{errors.number}</p>}
                </div>
                <div>
                  <label className="label">Cardholder Name</label>
                  <input className="input" name="name" placeholder="John Doe" value={card.name} onChange={fmt} />
                  {errors.name && <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#c0392b", marginTop: 4 }}>{errors.name}</p>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="label">Expiry Date</label>
                    <input className="input" name="expiry" placeholder="MM/YY" value={card.expiry} onChange={fmt} />
                    {errors.expiry && <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#c0392b", marginTop: 4 }}>{errors.expiry}</p>}
                  </div>
                  <div>
                    <label className="label">CVV</label>
                    <input className="input" name="cvv" placeholder="•••" type="password" value={card.cvv} onChange={fmt} />
                    {errors.cvv && <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#c0392b", marginTop: 4 }}>{errors.cvv}</p>}
                  </div>
                </div>
              </div>

              <button onClick={handlePay} className="btn btn-primary" style={{ width: "100%", marginTop: 20, padding: "0.8rem", fontSize: "0.9rem" }}>
                Pay ₹{total.toLocaleString()} →
              </button>

              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#a0a0a0", textAlign: "center", marginTop: 12 }}>
                🔒 Simulated payment — no real charges made
              </p>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── SeatMap Page ───────────────────────────────────────── */
export default function SeatMap() {
  const { id } = useParams();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [train, setTrain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const fetchTrain = async () => {
    try {
      const res = await getTrainById(id);
      setTrain(res.data);
    } catch {
      setError("Failed to load train data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) openAuthModal("login");
    fetchTrain();
  }, [id]);

  const handleBookClick = () => {
    if (!user) { openAuthModal("login"); return; }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setBooking(true);
    setError("");
    try {
      const res = await bookTicket(user._id, train._id);
      setResult(res.data);
      fetchTrain();
    } catch (err) {
      setError(err.response?.data?.error || "Booking failed.");
    } finally {
      setBooking(false);
    }
  };

  const availableCount = train?.seats?.filter(s => s.status === "available" || s.status === "open").length ?? 0;

  if (loading) return (
    <div style={{ minHeight: "calc(100vh - 57px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "inline-block", width: 36, height: 36, border: "2px solid #0a0a0a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.8rem", color: "#a0a0a0", letterSpacing: "0.1em", marginTop: 14 }}>Loading seat map…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error && !train) return (
    <div style={{ minHeight: "calc(100vh - 57px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 12, padding: 40, textAlign: "center", maxWidth: 340 }}>
        <p style={{ fontFamily: "Inter, sans-serif", color: "#0a0a0a", marginBottom: 20 }}>{error}</p>
        <button onClick={() => navigate("/trains")} className="btn btn-primary">Back to Trains</button>
      </div>
    </div>
  );

  const price = train?.price_per_seat || 500;

  return (
    <div style={{ minHeight: "calc(100vh - 57px)", background: "#fafafa" }}>
      {showPayment && (
        <PaymentModal
          train={train}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 16px" }}>
        {/* Back */}
        <button
          onClick={() => navigate("/trains")}
          style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6b6b6b", background: "none", border: "none", cursor: "pointer", marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = "#0a0a0a"}
          onMouseLeave={e => e.currentTarget.style.color = "#6b6b6b"}
        >← Back to trains</button>

        {/* Train info card */}
        <div style={{ background: "#0a0a0a", borderRadius: 14, padding: "28px", marginBottom: 20, color: "#fff" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Train #{train?.train_number}</p>
              <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "#fff", marginBottom: 12 }}>{train?.train_name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>{train?.from_station}</span>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>→</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>{train?.to_station}</span>
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>Dep: {train?.departure_time}</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>Arr: {train?.arrival_time}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ textAlign: "center", background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "2rem", color: availableCount > 0 ? "#fff" : "rgba(255,255,255,0.35)", lineHeight: 1 }}>{availableCount}</div>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: 5 }}>seats free</div>
              </div>
              <div style={{ textAlign: "center", background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "16px 20px" }}>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "2rem", color: "#fff", lineHeight: 1 }}>₹{price.toLocaleString()}</div>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: 5 }}>per seat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking result */}
        {result && (
          <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1rem", color: "#fff" }}>
              {result.ticket?.status === "confirmed" ? "✓" : "⏳"}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#0a0a0a", marginBottom: 2 }}>
                {result.ticket?.status === "confirmed" ? `Payment successful — Seat #${result.ticket.seat_number} confirmed!` : "Payment received — added to waiting list"}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6b6b6b" }}>
                {result.ticket?.status === "confirmed" ? "Your seat is confirmed. Check your dashboard." : "You'll be notified when a seat becomes available."}
              </p>
            </div>
            <button onClick={() => navigate("/dashboard")} className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "0.45rem 1rem", flexShrink: 0 }}>View Tickets</button>
          </div>
        )}

        {/* Error */}
        {error && train && (
          <div style={{ background: "#fafafa", border: "1px solid #e2e2e2", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#0a0a0a" }}>{error}</p>
          </div>
        )}

        {/* Seat map */}
        <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "28px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <p className="section-label">Seat Map — Coach Layout</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { cls: "seat-available", label: "Available" },
                { cls: "seat-open",      label: "Open" },
                { cls: "seat-booked",    label: "Booked" },
                { cls: "seat-not_boarded", label: "Not Boarded" }
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className={`${l.cls} rounded`} style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#6b6b6b" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(54px, 1fr))", gap: 8 }}>
            {train?.seats?.map(seat => (
              <div
                key={seat.seat_number}
                className={`seat-${seat.status} rounded`}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 4px", fontSize: "0.75rem", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600 }}
              >
                <span>{seat.seat_number}</span>
                <span style={{ fontSize: "0.65rem", opacity: 0.55, marginTop: 2 }}>
                  {seat.status === "available" ? "●" : seat.status === "booked" ? "✗" : seat.status === "open" ? "◉" : "◌"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Book action */}
        <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "24px 28px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#0a0a0a", marginBottom: 4 }}>
                {availableCount > 0 ? "Ready to book your seat?" : "No seats available — join the waitlist"}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6b6b6b" }}>
                {availableCount > 0
                  ? `1 seat · ₹${price.toLocaleString()} + ₹${Math.round(price * 0.02)} convenience fee`
                  : "You'll be notified when a seat opens. Waitlist is free."}
              </p>
            </div>
            <button
              onClick={handleBookClick}
              disabled={booking}
              className="btn btn-primary"
              style={{ padding: "0.75rem 2rem", fontSize: "0.875rem", minWidth: 180 }}
            >
              {booking
                ? <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                : availableCount > 0 ? `Pay ₹${(price + Math.round(price * 0.02)).toLocaleString()} & Book` : "Join Waitlist (Free)"
              }
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
