// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { to: "/",        label: "Predict"  },
    { to: "/compare", label: "Compare"  },
    { to: "/trends",  label: "Trends"   },
    { to: "/history", label: "History"  },
    { to: "/about",   label: "About"    },
  ];

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      height: 60, background: "#fff",
      borderBottom: `1px solid ${scrolled ? "#E2E8F0" : "#F1F5F9"}`,
      boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,0.06)" : "none",
      transition: "all 0.2s",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", height: "100%", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, background: "#0F172A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚗</div>
          <span style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>
            CarPrice<span style={{ color: "#2563EB" }}>AI</span>
          </span>
        </Link>

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {links.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link key={to} to={to} style={{
                fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 7,
                color: active ? "#2563EB" : "#64748B",
                background: active ? "#EFF6FF" : "transparent",
                transition: "all 0.15s",
              }}>{label}</Link>
            );
          })}
        </div>

        {/* Status pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10B981", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>
          <div style={{ width: 6, height: 6, background: "#10B981", borderRadius: "50%", animation: "pulse 2s infinite" }} />
          Model Live · R² 0.87
        </div>
      </div>
    </nav>
  );
}
