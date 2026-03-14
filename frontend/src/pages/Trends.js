// src/pages/Trends.js
import React, { useEffect, useRef } from "react";

const fmt = (n) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);

const BRAND_DATA = [
  {brand:"Toyota",   retention:78, avg:850000, trend:"+2.1%",  color:"#10B981"},
  {brand:"Honda",    retention:72, avg:700000, trend:"+1.8%",  color:"#10B981"},
  {brand:"Hyundai",  retention:68, avg:600000, trend:"+0.9%",  color:"#10B981"},
  {brand:"Maruti",   retention:65, avg:450000, trend:"+1.2%",  color:"#10B981"},
  {brand:"Tata",     retention:61, avg:500000, trend:"+3.4%",  color:"#3B82F6"},
  {brand:"Mahindra", retention:59, avg:650000, trend:"+0.5%",  color:"#10B981"},
  {brand:"Ford",     retention:52, avg:480000, trend:"-1.2%",  color:"#EF4444"},
  {brand:"Volkswagen",retention:55,avg:750000, trend:"+0.3%",  color:"#10B981"},
];

const FUEL_DATA = [
  {fuel:"Electric", retention:85, insight:"Future-proof, values rising fast"},
  {fuel:"Diesel",   retention:70, insight:"Best for high-mileage use cases"},
  {fuel:"Petrol",   retention:65, insight:"Most liquid market, easy to sell"},
  {fuel:"CNG",      retention:58, insight:"Good for city driving, niche buyers"},
  {fuel:"Hybrid",   retention:75, insight:"Growing demand, strong retention"},
];

export default function Trends() {
  const chartRef  = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    const load = () => {
      if (!window.Chart) { setTimeout(load, 100); return; }
      if (chartInst.current) chartInst.current.destroy();
      chartInst.current = new window.Chart(chartRef.current, {
        type:"bar",
        data:{
          labels: BRAND_DATA.map(b=>b.brand),
          datasets:[{
            label:"Value Retention (%)",
            data: BRAND_DATA.map(b=>b.retention),
            backgroundColor: BRAND_DATA.map(b=> b.retention>70?"#BFDBFE":b.retention>60?"#BBF7D0":"#FED7AA"),
            borderColor:     BRAND_DATA.map(b=> b.retention>70?"#2563EB":b.retention>60?"#10B981":"#F59E0B"),
            borderWidth:1.5, borderRadius:6,
          }]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{legend:{display:false}, tooltip:{callbacks:{label:(c)=>` ${c.raw}% value retained`}}},
          scales:{
            y:{grid:{color:"#F1F5F9"},ticks:{callback:(v)=>`${v}%`,color:"#94A3B8",font:{size:11}},min:40,max:90},
            x:{grid:{display:false},ticks:{color:"#64748B",font:{size:12}}}
          }
        }
      });
    };
    load();
    return () => { if(chartInst.current) chartInst.current.destroy(); };
  }, []);

  return (
    <div style={{minHeight:"100vh", background:"#F8FAFC", paddingTop:60}}>
      <div style={{background:"#0F172A", padding:"48px 24px"}}>
        <div style={{maxWidth:1000, margin:"0 auto"}}>
          <div style={{fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Market Intelligence</div>
          <h1 style={{fontFamily:"var(--serif)",fontSize:"2.4rem",fontWeight:800,color:"#fff",letterSpacing:"-0.02em",marginBottom:8}}>Market Trends</h1>
          <p style={{fontSize:14,color:"#94A3B8"}}>Which cars hold their value best in India</p>
        </div>
      </div>

      <div style={{maxWidth:1000, margin:"0 auto", padding:"40px 24px 80px"}}>

        {/* Value retention chart */}
        <div style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, padding:28, marginBottom:24}}>
          <h2 style={{fontSize:15, fontWeight:600, color:"#0F172A", marginBottom:4}}>Brand Value Retention (5-year average)</h2>
          <p style={{fontSize:12, color:"#94A3B8", marginBottom:20}}>Higher = better resale value after 5 years</p>
          <div style={{position:"relative", height:260}}>
            <canvas ref={chartRef}/>
          </div>
        </div>

        {/* Brand table */}
        <div style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, overflow:"hidden", marginBottom:24}}>
          <div style={{padding:"16px 24px", borderBottom:"1px solid #E2E8F0", background:"#F8FAFC"}}>
            <h2 style={{fontSize:14, fontWeight:600, color:"#0F172A"}}>Brand Resale Rankings</h2>
          </div>
          {BRAND_DATA.sort((a,b)=>b.retention-a.retention).map((row, i) => (
            <div key={row.brand} style={{display:"grid", gridTemplateColumns:"40px 1fr 100px 120px 80px", gap:16, padding:"14px 24px", borderBottom:i<BRAND_DATA.length-1?"1px solid #F1F5F9":"none", alignItems:"center"}}>
              <div style={{fontFamily:"var(--serif)", fontSize:15, fontWeight:700, color:"#94A3B8"}}>#{i+1}</div>
              <div style={{fontSize:14, fontWeight:600, color:"#0F172A"}}>{row.brand}</div>
              <div>
                <div style={{fontSize:13, fontWeight:600, color:row.color}}>{row.retention}%</div>
                <div style={{fontSize:11, color:"#94A3B8"}}>retention</div>
              </div>
              <div style={{fontSize:13, color:"#64748B"}}>{fmt(row.avg)} avg</div>
              <div style={{fontSize:13, fontWeight:600, color: row.trend.startsWith("+")?("#10B981"):("#EF4444")}}>{row.trend}</div>
            </div>
          ))}
        </div>

        {/* Fuel type cards */}
        <h2 style={{fontSize:15, fontWeight:600, color:"#0F172A", marginBottom:16}}>Best Fuel Types for Resale</h2>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14}}>
          {FUEL_DATA.sort((a,b)=>b.retention-a.retention).map((row,i) => (
            <div key={row.fuel} style={{background:"#fff", border:`1px solid ${i===0?"#BFDBFE":"#E2E8F0"}`, borderRadius:14, padding:20, borderTop:i===0?"3px solid #2563EB":undefined}}>
              {i===0 && <div style={{fontSize:11,fontWeight:700,color:"#2563EB",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.07em"}}>Best Resale</div>}
              <div style={{fontFamily:"var(--serif)",fontSize:"1.6rem",fontWeight:800,color:"#0F172A",marginBottom:4}}>{row.fuel}</div>
              <div style={{fontSize:22, fontWeight:700, color: row.retention>70?"#10B981":row.retention>60?"#F59E0B":"#64748B", marginBottom:8}}>{row.retention}%</div>
              <div style={{fontSize:12, color:"#64748B", lineHeight:1.5}}>{row.insight}</div>
            </div>
          ))}
        </div>

        <div style={{marginTop:24, padding:"14px 18px", background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:10, fontSize:12, color:"#92400E"}}>
          ℹ️ Trends data is derived from the Car Dekho training dataset patterns (2014–2020). Real-time market data may vary.
        </div>
      </div>
    </div>
  );
}
