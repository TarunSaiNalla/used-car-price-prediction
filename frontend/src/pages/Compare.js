// src/pages/Compare.js
import React, { useState } from "react";
import { predictCarPrice } from "../services/api";

const fmt = (n) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const FUEL  = ["Petrol","Diesel","CNG","LPG","Electric"];
const TRANS = ["Manual","Automatic"];
const OWNER = ["First Owner","Second Owner","Third Owner","Fourth & Above Owner"];

const BLANK = { name:"",year:"",km_driven:"",fuel:"Petrol",transmission:"Manual",seller_type:"Individual",owner:"First Owner" };

const Label = ({children}) => <label style={{fontSize:11,fontWeight:600,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5,display:"block"}}>{children}</label>;
const sel = { backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%2364748B' d='M5 6L0 0h10z'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", appearance:"none" };

function CarForm({label, color, onResult, loading, setLoading}) {
  const [form, setForm] = useState(BLANK);
  const [err,  setErr]  = useState(null);
  const onChange = e => setForm(p=>({...p,[e.target.name]:e.target.value}));
  const onSubmit = async e => {
    e.preventDefault(); setLoading(true); setErr(null);
    try {
      onResult(await predictCarPrice({...form, year:+form.year, km_driven:+form.km_driven, name:form.name||"Car"}));
    } catch(ex){ setErr(ex.message); } finally { setLoading(false); }
  };
  return (
    <div style={{background:"#fff", border:`2px solid ${color}`, borderRadius:16, overflow:"hidden"}}>
      <div style={{background:color, padding:"14px 20px"}}>
        <span style={{fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.05em"}}>{label}</span>
      </div>
      <form onSubmit={onSubmit} style={{padding:20}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12}}>
          {[["Car Name","name","text","Maruti Swift"],["Year","year","number","2019"],["KM Driven","km_driven","number","45000"]].map(([lb,nm,tp,ph])=>(
            <div key={nm} style={{gridColumn: nm==="name"?"span 2":"span 1"}}>
              <Label>{lb} *</Label>
              <input name={nm} type={tp} value={form[nm]} onChange={onChange} placeholder={ph} required style={{width:"100%"}}/>
            </div>
          ))}
          <div><Label>Fuel *</Label><select name="fuel" value={form.fuel} onChange={onChange} style={{...sel,width:"100%"}}>{FUEL.map(f=><option key={f}>{f}</option>)}</select></div>
          <div><Label>Transmission *</Label><select name="transmission" value={form.transmission} onChange={onChange} style={{...sel,width:"100%"}}>{TRANS.map(t=><option key={t}>{t}</option>)}</select></div>
          <div style={{gridColumn:"span 2"}}><Label>Owner *</Label><select name="owner" value={form.owner} onChange={onChange} style={{...sel,width:"100%"}}>{OWNER.map(o=><option key={o}>{o}</option>)}</select></div>
        </div>
        {err && <div style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontSize:12,padding:"9px 12px",borderRadius:7,marginBottom:10}}>⚠ {err}</div>}
        <button type="submit" disabled={loading} style={{width:"100%",background:color,color:"#fff",border:"none",borderRadius:8,padding:"12px",fontSize:13,fontWeight:600}}>
          {loading ? "Predicting..." : "Predict →"}
        </button>
      </form>
    </div>
  );
}

export default function Compare() {
  const [car1, setCar1] = useState(null);
  const [car2, setCar2] = useState(null);
  const [l1,   setL1]  = useState(false);
  const [l2,   setL2]  = useState(false);

  const winner = car1 && car2 ? (car1.predicted_price > car2.predicted_price ? 1 : 2) : null;

  return (
    <div style={{minHeight:"100vh", background:"#F8FAFC", paddingTop:60}}>
      <div style={{background:"#0F172A", padding:"48px 24px"}}>
        <div style={{maxWidth:900, margin:"0 auto"}}>
          <div style={{fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Side by Side</div>
          <h1 style={{fontFamily:"var(--serif)",fontSize:"2.4rem",fontWeight:800,color:"#fff",letterSpacing:"-0.02em",marginBottom:8}}>Compare Two Cars</h1>
          <p style={{fontSize:14,color:"#94A3B8"}}>See which car gives you better resale value</p>
        </div>
      </div>

      <div style={{maxWidth:900, margin:"0 auto", padding:"40px 24px"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:32}}>
          <CarForm label="Car A" color="#2563EB" onResult={setCar1} loading={l1} setLoading={setL1}/>
          <CarForm label="Car B" color="#0F172A" onResult={setCar2} loading={l2} setLoading={setL2}/>
        </div>

        {car1 && car2 && (
          <div style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, overflow:"hidden", animation:"fadeIn 0.4s ease"}}>
            <div style={{padding:"20px 28px", borderBottom:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <h2 style={{fontSize:15, fontWeight:600, color:"#0F172A"}}>Comparison Results</h2>
              <span style={{fontSize:13, fontWeight:600, color:"#10B981", background:"#ECFDF5", border:"1px solid #A7F3D0", padding:"4px 12px", borderRadius:20}}>
                Car {winner} wins 🏆
              </span>
            </div>
            <div style={{padding:28}}>
              {/* Price comparison */}
              <div style={{display:"grid", gridTemplateColumns:"1fr 80px 1fr", gap:16, alignItems:"center", marginBottom:24}}>
                <div style={{textAlign:"center", padding:20, background: winner===1?"#EFF6FF":"#F8FAFC", border:`1px solid ${winner===1?"#BFDBFE":"#E2E8F0"}`, borderRadius:12}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#64748B",marginBottom:6}}>Car A</div>
                  <div style={{fontFamily:"var(--serif)",fontSize:"1.8rem",fontWeight:800,color:"#2563EB"}}>{fmt(car1.predicted_price)}</div>
                  {winner===1 && <div style={{fontSize:12,color:"#10B981",fontWeight:600,marginTop:6}}>Higher Value ↑</div>}
                </div>
                <div style={{textAlign:"center", fontSize:13, fontWeight:600, color:"#94A3B8"}}>VS</div>
                <div style={{textAlign:"center", padding:20, background: winner===2?"#F8FAFC":"#F8FAFC", border:`1px solid ${winner===2?"#0F172A":"#E2E8F0"}`, borderRadius:12}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#64748B",marginBottom:6}}>Car B</div>
                  <div style={{fontFamily:"var(--serif)",fontSize:"1.8rem",fontWeight:800,color:"#0F172A"}}>{fmt(car2.predicted_price)}</div>
                  {winner===2 && <div style={{fontSize:12,color:"#10B981",fontWeight:600,marginTop:6}}>Higher Value ↑</div>}
                </div>
              </div>
              {/* Metrics */}
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12}}>
                {[["Difference",fmt(Math.abs(car1.predicted_price-car2.predicted_price)),"#64748B"],["% Difference",`${(Math.abs(car1.predicted_price-car2.predicted_price)/Math.min(car1.predicted_price,car2.predicted_price)*100).toFixed(1)}%`,"#F59E0B"],["Better Choice",`Car ${winner}`,"#10B981"]].map(([k,v,c])=>(
                  <div key={k} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{k}</div>
                    <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
