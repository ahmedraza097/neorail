import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTrainById, bookTicket } from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ─── Payment Modal ─────────────────────────────────────── */
/* ─── Payment Modal ─────────────────────────────────────── */
/* ─── Payment Modal ─────────────────────────────────────── */
function PaymentModal({ train, selectedSeats, onClose, onSuccess }) {
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("form");

  const seatCount = selectedSeats.length;
  const unitPrice = train?.price_per_seat || 500;
  const subtotal = unitPrice * seatCount;
  const convenience = Math.round(subtotal * 0.02);
  const total = subtotal + convenience;

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
        <div style={{ background: "#0a0a0a", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>Secure Payment</p>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#fff" }}>{train?.train_name}</h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Confirming Seats: {selectedSeats.join(", ")}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ padding: "24px" }}>
          {step === "processing" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ display: "inline-block", width: 44, height: 44, border: "3px solid #0a0a0a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", marginBottom: 16 }} />
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#0a0a0a" }}>Processing Payment…</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6b6b6b", marginTop: 6 }}>Finalizing booking for {seatCount} seats</p>
            </div>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 56, height: 56, background: "#0a0a0a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "1.5rem", color: "#fff" }}>✓</div>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0a0a0a" }}>Payment Confirmed!</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6b6b6b", marginTop: 6 }}>Your seats are being locked…</p>
            </div>
          )}

          {step === "form" && (
            <>
              <div style={{ background: "#f9f9f9", border: "1px solid #e8e8e8", borderRadius: 10, padding: "14px 16px", marginBottom: 22 }}>
                <p className="section-label" style={{ marginBottom: 10 }}>Order Summary</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#4a4a4a", marginBottom: 6 }}>
                  <span>Fare ({seatCount} seat{seatCount > 1 ? 's' : ''})</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6b6b6b", marginBottom: 10 }}>
                  <span>Convenience fee (2%)</span>
                  <span>₹{convenience}</span>
                </div>
                <div style={{ borderTop: "1px solid #e2e2e2", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#0a0a0a" }}>Total Payable</span>
                  <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#0a0a0a" }}>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="label">Card Number</label>
                  <input className="input" name="number" placeholder="1234 5678 9012 3456" value={card.number} onChange={fmt} style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.08em" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="label">Expiry</label>
                    <input className="input" name="expiry" placeholder="MM/YY" value={card.expiry} onChange={fmt} />
                  </div>
                  <div>
                    <label className="label">CVV</label>
                    <input className="input" name="cvv" placeholder="•••" type="password" value={card.cvv} onChange={fmt} />
                  </div>
                </div>
              </div>

              <button onClick={handlePay} className="btn btn-primary" style={{ width: "100%", marginTop: 20, padding: "0.85rem", fontSize: "0.95rem" }}>
                Pay ₹{total.toLocaleString()} Now →
              </button>
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
  const [selectedSeats, setSelectedSeats] = useState([]);

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

  const toggleSeat = (seat) => {
    if (seat.status !== "available" && seat.status !== "open") return;
    setSelectedSeats(prev => 
      prev.includes(seat.seat_number) 
        ? prev.filter(s => s !== seat.seat_number)
        : [...prev, seat.seat_number]
    );
  };

  const handleBookClick = () => {
    if (!user) { openAuthModal("login"); return; }
    if (selectedSeats.length === 0) { setError("Please select at least one seat."); return; }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setBooking(true);
    setError("");
    setResult(null);
    try {
      const res = await bookTicket(user._id, train._id, selectedSeats);
      setResult(res.data);
      setSelectedSeats([]);
      fetchTrain();
    } catch (err) {
      setError(err.response?.data?.error || "Booking failed.");
    } finally {
      setBooking(false);
    }
  };

  const availableCount = train?.seats?.filter(s => s.status === "available" || s.status === "open").length ?? 0;
  const unitPrice = train?.price_per_seat || 500;
  const subtotal = unitPrice * selectedSeats.length;
  const totalPrice = subtotal + Math.round(subtotal * 0.02);

  if (loading) return (
    <div style={{ minHeight: "calc(100vh - 57px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div className="spinner" />
        <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.8rem", color: "#a0a0a0", letterSpacing: "0.1em", marginTop: 14 }}>Loading seat map…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "calc(100vh - 57px)", background: "#fafafa" }}>
      {showPayment && (
        <PaymentModal
          train={train}
          selectedSeats={selectedSeats}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 16px" }}>
        <button onClick={() => navigate("/trains")} className="btn-text">← Back to trains</button>

        <div style={{ background: "#0a0a0a", borderRadius: 14, padding: "28px", marginBottom: 20, color: "#fff" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>Train #{train?.train_number}</p>
              <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "#fff", marginBottom: 12 }}>{train?.train_name}</h1>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>{train?.from_station} → {train?.to_station}</p>
            </div>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "2rem", color: "#fff", lineHeight: 1 }}>{availableCount}</div>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: 5 }}>Available</div>
            </div>
          </div>
        </div>

        {result && (
          <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <div className="success-icon">✓</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#0a0a0a", marginBottom: 2 }}>{result.tickets.length} seats booked successfully!</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6b6b6b" }}>Check your dashboard for details.</p>
            </div>
            <button onClick={() => navigate("/dashboard")} className="btn btn-outline" style={{ fontSize: "0.75rem" }}>Dashboard</button>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "28px", marginBottom: 16 }}>
          <p className="section-label" style={{ marginBottom: 20 }}>Select your seats</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(62px, 1fr))", gap: 12 }}>
            {train?.seats?.map(seat => {
              const isSelected = selectedSeats.includes(seat.seat_number);
              const isAvailable = seat.status === "available" || seat.status === "open";
              const b = seat.berth_type || "Lower";
              const label = b === "Lower" ? "LB" : b === "Middle" ? "MB" : "UB";
              
              return (
                <div
                  key={seat.seat_number}
                  onClick={() => toggleSeat(seat)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    padding: "12px 4px", fontSize: "0.75rem", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700,
                    borderRadius: 8, cursor: isAvailable ? "pointer" : "not-allowed",
                    background: isSelected ? "#0a0a0a" : isAvailable ? "#f9f9f9" : "#f0f0f0",
                    color: isSelected ? "#fff" : isAvailable ? "#0a0a0a" : "#a0a0a0",
                    border: isSelected ? "1px solid #0a0a0a" : "1px solid #e2e2e2",
                    transition: "all 0.1s"
                  }}
                >
                  <span style={{ fontSize: "0.55rem", opacity: isSelected ? 0.6 : 0.4, marginBottom: 2 }}>{label}</span>
                  <span>{seat.seat_number}</span>
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: 24, display: "flex", gap: 20 }}>
            <LegendItem color="#f9f9f9" label="Free" />
            <LegendItem color="#0a0a0a" label="Selected" />
            <LegendItem color="#f0f0f0" label="Booked" />
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 14, padding: "24px 28px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
            <div>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0a0a0a", marginBottom: 4 }}>
                {selectedSeats.length > 0 ? `${selectedSeats.length} Seats Selected` : "Select your seats"}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#6b6b6b" }}>
                {selectedSeats.length > 0 ? `Total Price: ₹${totalPrice.toLocaleString()}` : "Click on available seats to add them"}
              </p>
            </div>
            <button
              onClick={handleBookClick}
              disabled={booking || selectedSeats.length === 0}
              className="btn btn-primary"
              style={{ padding: "0.85rem 3rem", minWidth: 200 }}
            >
              {booking ? <div className="spinner-small" /> : "Book Selected →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 12, height: 12, background: color, borderRadius: 3, border: "1px solid #e2e2e2" }} />
      <span style={{ fontSize: "0.75rem", color: "#6b6b6b", fontFamily: "Inter, sans-serif" }}>{label}</span>
    </div>
  );
}
