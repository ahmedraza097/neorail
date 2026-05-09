import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const roleLabel = user?.role === "admin" ? "Admin" : user?.role === "tte" ? "TTE" : null;

  return (
    <nav style={{ background: "#ffffff", borderBottom: "1px solid #e2e2e2" }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div style={{ width: 32, height: 32, background: "#0a0a0a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth="2.5">
              <path d="M4 15l4-8 4 8 4-8 4 8" />
              <line x1="2" y1="19" x2="22" y2="19" />
            </svg>
          </div>
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#0a0a0a", letterSpacing: "0.05em" }}>
            NEORAIL
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { to: "/", label: "Home" },
            { to: "/trains", label: "Trains" },
            ...(user?.role === "user" ? [{ to: "/dashboard", label: "Dashboard" }] : []),
            ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin Panel" }] : []),
            ...(user?.role === "tte" ? [{ to: "/tte", label: "TTE Panel" }] : [])
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: "0.85rem",
                padding: "0.4rem 0.75rem",
                borderRadius: 6,
                color: isActive(link.to) ? "#0a0a0a" : "#6b6b6b",
                background: isActive(link.to) ? "#f4f4f4" : "transparent",
                transition: "all 0.15s"
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2">
                {roleLabel && (
                  <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 20, background: "#0a0a0a", color: "#ffffff" }}>
                    {roleLabel.toUpperCase()}
                  </span>
                )}
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "#4a4a4a" }}>{user.name}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: "0.45rem 1rem" }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => openAuthModal("login")} className="btn btn-ghost" style={{ padding: "0.45rem 1rem" }}>
                Login
              </button>
              <button onClick={() => openAuthModal("register")} className="btn btn-primary" style={{ padding: "0.45rem 1rem" }}>
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
