// src/pages/History.js
import React, { useEffect, useState } from "react";
import { getPredictionHistory, getPredictionStats } from "../services/api";

const fmt = (n) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const CONF_COLOR = {High:"#10B981",Medium:"#F59E0B",Low:"#EF4444"};

export default function History() {
  const [predictions,setPredictions] = useState([]);
  const [stats,setStats]             = useState(null);
  const [loading,setLoading]         = useState(true);
  const [error,setError]             = useState(null);
  const [selected,setSelected]       = useState(null);

  useEffect(()=>{
    Promise.all([getPredictionHistory(50,0),getPredictionStats()])
      .then(([p,s])=>{setPredictions(p);setStats(s);})
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  },[]);

  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC",paddingTop:60}}>
      <div style={{background:"#0F172A",padding:"48px 24px 52px"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Prediction Logs</div>
          <h1 style={{fontFamily:"var(--serif)",fontSize:"2.4rem",fontWeight:800,color:"#fff",letterSpacing:"-0.02em",marginBottom:24}}>History</h1>
          {stats && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
              {[["Total",stats.total_predictions,"#fff"],["Average",fmt(stats.average_price),"#93C5FD"],["Highest",fmt(stats.max_price),"#6EE7B7"],["Lowest",fmt(stats.min_price),"#FCA5A5"]].map(([l,v,c])=>(
                <div key={l} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"14px 18px"}}>
                  <div style={{fontSize:11,color:"#475569",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>{l}</div>
                  <div style={{fontFamily:"var(--serif)",fontSize:"1.4rem",fontWeight:700,color:c}}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"32px 24px 80px"}}>
        {loading && <div style={{textAlign:"center",padding:60,color:"#94A3B8",fontSize:14}}>Loading predictions...</div>}
        {error && <div style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",padding:"14px 18px",borderRadius:10,fontSize:13}}>⚠ {error}</div>}
        {!loading && predictions.length===0 && (
          <div style={{textAlign:"center",padding:80}}>
            <div style={{fontSize:48,marginBottom:16}}>🚗</div>
            <h3 style={{fontFamily:"var(--serif)",fontSize:"1.4rem",color:"#0F172A",marginBottom:8}}>No predictions yet</h3>
            <p style={{fontSize:13,color:"#94A3B8"}}>Go predict your first car on the home page!</p>
          </div>
        )}

        {selected && (
          <div style={{background:"#fff",border:"2px solid #2563EB",borderRadius:16,padding:28,marginBottom:20,animation:"fadeIn 0.3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
              <span style={{fontSize:12,fontWeight:700,color:"#2563EB",textTransform:"uppercase",letterSpacing:"0.08em"}}>Prediction Detail</span>
              <button onClick={()=>setSelected(null)} style={{background:"#F1F5F9",border:"none",borderRadius:6,padding:"4px 10px",color:"#64748B",cursor:"pointer",fontSize:12}}>Close ✕</button>
            </div>
            <div style={{fontFamily:"var(--serif)",fontSize:"2.8rem",fontWeight:800,color:"#0F172A",marginBottom:6,letterSpacing:"-0.02em"}}>{fmt(selected.predicted_price)}</div>
            <div style={{fontSize:13,color:"#64748B",marginBottom:18}}>Range: {fmt(selected.price_range_low)} – {fmt(selected.price_range_high)}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {[["ID",`#${selected.prediction_id}`],["Confidence",selected.confidence_label],["Date",new Date(selected.created_at).toLocaleDateString("en-IN")]].map(([k,v])=>(
                <div key={k} style={{background:"#F8FAFC",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{k}</div>
                  <div style={{fontSize:14,fontWeight:600,color:"#0F172A"}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && predictions.length>0 && (
          <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"60px 1fr 130px 160px 160px",gap:0,padding:"12px 24px",borderBottom:"1px solid #F1F5F9",background:"#F8FAFC"}}>
              {["#","Prediction","Confidence","Price","Date"].map(h=><span key={h} style={{fontSize:11,fontWeight:600,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</span>)}
            </div>
            {predictions.map((p,i)=>{
              const color = CONF_COLOR[p.confidence_label]||"#F59E0B";
              const isSel = selected?.prediction_id===p.prediction_id;
              return (
                <div key={p.prediction_id} onClick={()=>setSelected(isSel?null:p)}
                  style={{display:"grid",gridTemplateColumns:"60px 1fr 130px 160px 160px",gap:0,padding:"14px 24px",borderBottom:i<predictions.length-1?"1px solid #F1F5F9":"none",cursor:"pointer",background:isSel?"#EFF6FF":"#fff",transition:"background 0.1s",alignItems:"center"}}>
                  <span style={{fontSize:13,color:"#94A3B8",fontFamily:"var(--serif)"}}>{p.prediction_id}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:"#0F172A"}}>Car Prediction</div>
                    <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>Ensemble ML Model</div>
                  </div>
                  <span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:20,background:`${color}15`,color,border:`1px solid ${color}30`,width:"fit-content"}}>{p.confidence_label}</span>
                  <span style={{fontFamily:"var(--serif)",fontSize:15,fontWeight:700,color:"#0F172A"}}>{fmt(p.predicted_price)}</span>
                  <span style={{fontSize:12,color:"#94A3B8"}}>{new Date(p.created_at).toLocaleDateString("en-IN")}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}
