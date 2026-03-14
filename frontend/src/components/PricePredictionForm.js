// src/components/PricePredictionForm.js
import React, { useState } from "react";
import { predictCarPrice } from "../services/api";

const FUEL   = ["Petrol","Diesel","CNG","LPG","Electric","Hybrid"];
const TRANS  = ["Manual","Automatic"];
const SELLER = ["Individual","Dealer","Trustmark Dealer"];
const OWNER  = ["First Owner","Second Owner","Third Owner","Fourth & Above Owner","Test Drive Car"];

// Brand logos (emoji fallback — clean enough)
const BRAND_LOGOS = {
  Maruti:"🔵", Hyundai:"🔷", Honda:"⭕", Toyota:"⚙️", Tata:"🦁",
  Mahindra:"🟠", Ford:"🔵", Volkswagen:"🔵", BMW:"🔵", Mercedes:"⭐",
  Audi:"⭕", Kia:"🟡", Renault:"🔷", Nissan:"⭕", Skoda:"🟢",
  Jeep:"🟢", MG:"🔴", Volvo:"⭕", Jaguar:"🐆", Land:"🟢",
};

const INITIAL = {
  name:"", year:"", km_driven:"", fuel:"Petrol",
  seller_type:"Individual", transmission:"Manual", owner:"First Owner",
  mileage:"", engine:"", max_power:"", seats:"",
};

const Label = ({children}) => (
  <label style={{ fontSize:11, fontWeight:600, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6, display:"block" }}>
    {children}
  </label>
);

export default function PricePredictionForm({ onResult }) {
  const [form,    setForm]    = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [showOpt, setShowOpt] = useState(false);

  // Detect brand from name
  const detectedBrand = Object.keys(BRAND_LOGOS).find(b =>
    form.name.toLowerCase().startsWith(b.toLowerCase())
  );

  const onChange = (e) => { setForm(p => ({...p, [e.target.name]: e.target.value})); setError(null); };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const payload = {
      name: form.name.trim(), year: parseInt(form.year, 10),
      km_driven: parseInt(form.km_driven, 10), fuel: form.fuel,
      seller_type: form.seller_type, transmission: form.transmission, owner: form.owner,
      ...(form.mileage   && { mileage:   parseFloat(form.mileage) }),
      ...(form.engine    && { engine:    parseFloat(form.engine) }),
      ...(form.max_power && { max_power: parseFloat(form.max_power) }),
      ...(form.seats     && { seats:     parseInt(form.seats, 10) }),
    };
    try { onResult(await predictCarPrice(payload)); }
    catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fieldStyle = { marginBottom: 0 };
  const selStyle = {
    background:"#fff", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%2364748B' d='M5 6L0 0h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center",
  };

  return (
    <form onSubmit={onSubmit}>
      {/* Brand detection banner */}
      {detectedBrand && (
        <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"10px 16px", marginBottom:18, display:"flex", alignItems:"center", gap:10, animation:"fadeIn 0.3s ease" }}>
          <span style={{ fontSize:20 }}>{BRAND_LOGOS[detectedBrand]}</span>
          <div>
            <span style={{ fontSize:13, fontWeight:600, color:"#1D4ED8" }}>{detectedBrand}</span>
            <span style={{ fontSize:12, color:"#3B82F6", marginLeft:6 }}>detected — good resale brand</span>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <div style={fieldStyle}>
          <Label>Car Name *</Label>
          <input name="name" value={form.name} onChange={onChange} placeholder="e.g. Maruti Swift VXI" required />
        </div>
        <div style={fieldStyle}>
          <Label>Year *</Label>
          <input name="year" type="number" value={form.year} onChange={onChange} placeholder="2019" min={1990} max={2024} required />
        </div>
        <div style={fieldStyle}>
          <Label>KM Driven *</Label>
          <input name="km_driven" type="number" value={form.km_driven} onChange={onChange} placeholder="45000" min={0} required />
        </div>
        <div style={fieldStyle}>
          <Label>Fuel Type *</Label>
          <select name="fuel" value={form.fuel} onChange={onChange} style={selStyle}>
            {FUEL.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div style={fieldStyle}>
          <Label>Transmission *</Label>
          <select name="transmission" value={form.transmission} onChange={onChange} style={selStyle}>
            {TRANS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={fieldStyle}>
          <Label>Seller Type *</Label>
          <select name="seller_type" value={form.seller_type} onChange={onChange} style={selStyle}>
            {SELLER.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ ...fieldStyle, gridColumn:"span 2" }}>
          <Label>Ownership *</Label>
          <select name="owner" value={form.owner} onChange={onChange} style={selStyle}>
            {OWNER.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Optional specs toggle */}
      <div style={{ border:"1px solid #E2E8F0", borderRadius:10, overflow:"hidden", marginBottom:18 }}>
        <button type="button" onClick={() => setShowOpt(!showOpt)}
          style={{ width:"100%", background:"#F8FAFC", border:"none", padding:"11px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, fontWeight:500, color:"#2563EB" }}>
          <span>+ Add vehicle specs (improves accuracy)</span>
          <span style={{ transform:showOpt?"rotate(180deg)":"none", transition:"0.2s", fontSize:10, color:"#94A3B8" }}>▼</span>
        </button>
        {showOpt && (
          <div style={{ padding:16, borderTop:"1px solid #E2E8F0", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[["Mileage (km/l)","mileage","21.4"],["Engine (CC)","engine","1197"],["Max Power (bhp)","max_power","81.8"],["Seats","seats","5"]].map(([lb,nm,ph])=>(
              <div key={nm}>
                <Label>{lb}</Label>
                <input name={nm} type="number" value={form[nm]} onChange={onChange} placeholder={ph} step="any" />
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", fontSize:13, padding:"11px 14px", borderRadius:8, marginBottom:14, display:"flex", gap:8 }}>
          <span>⚠</span> {error}
        </div>
      )}

      <button type="submit" disabled={loading} style={{
        width:"100%", padding:"14px", borderRadius:10, border:"none",
        background: loading ? "#93C5FD" : "#2563EB",
        color:"#fff", fontSize:14, fontWeight:600,
        boxShadow: loading ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
        transition:"all 0.2s",
      }}>
        {loading ? (
          <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }} />
            Analysing your vehicle...
          </span>
        ) : "Predict Resale Price →"}
      </button>
    </form>
  );
}
