import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import Home from "./pages/Home";
import Trains from "./pages/Trains";
import SeatMap from "./pages/SeatMap";
import Dashboard from "./pages/Dashboard";
import AdminPage from "./pages/AdminPage";
import TTEDashboard from "./pages/TTEDashboard";

export default function App() {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <AuthModal />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trains" element={<Trains />} />
          <Route path="/seats/:id" element={<SeatMap />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/tte" element={<TTEDashboard />} />
        </Routes>
      </main>
    </div>
  );
}
