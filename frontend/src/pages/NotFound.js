// src/pages/NotFound.js
import React from "react";
import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC",paddingTop:60,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:24}}>
      <div style={{fontSize:64,marginBottom:20}}>🚗</div>
      <h1 style={{fontFamily:"var(--serif)",fontSize:"4rem",fontWeight:800,color:"#0F172A",margin:"0 0 8px",letterSpacing:"-0.03em"}}>404</h1>
      <p style={{color:"#64748B",fontSize:15,marginBottom:32}}>This route took a wrong turn.</p>
      <Link to="/" style={{background:"#2563EB",color:"#fff",padding:"12px 28px",borderRadius:10,fontSize:14,fontWeight:600,boxShadow:"0 4px 14px rgba(37,99,235,0.3)"}}>Back to Home →</Link>
    </div>
  );
}
