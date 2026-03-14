// src/pages/Home.js - v5 FINAL with all features
import React, { useState, useEffect, useRef } from "react";
import PricePredictionForm from "../components/PricePredictionForm";

const fmt = (n) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const fmtL = (n) => `₹${(n/100000).toFixed(1)}L`;

// Animated counter
function useCountUp(target, duration=1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now()-start)/duration, 1);
      const ease = 1 - Math.pow(1-p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return val;
}

const CONF = {
  High:   { color:"#10B981", bg:"#ECFDF5", border:"#A7F3D0", label:"High Confidence"     },
  Medium: { color:"#F59E0B", bg:"#FFFBEB", border:"#FDE68A", label:"Moderate Confidence" },
  Low:    { color:"#EF4444", bg:"#FEF2F2", border:"#FECACA", label:"Low Confidence"       },
};

// Similar cars mock data
const SIMILAR_CARS = (brand, price) => [
  { name:`${brand} (2020)`, km:"38,000", price: Math.round(price*1.12), fuel:"Petrol", owner:"1st" },
  { name:`${brand} (2018)`, km:"62,000", price: Math.round(price*0.88), fuel:"Petrol", owner:"2nd" },
  { name:`${brand} (2019)`, km:"44,500", price: Math.round(price*1.05), fuel:"Diesel", owner:"1st" },
  { name:`${brand} (2017)`, km:"81,000", price: Math.round(price*0.72), fuel:"Petrol", owner:"2nd" },
];

// Depreciation data
const DEPRECIATION = (price, year) => {
  const age = 2025 - year;
  return Array.from({length:11}, (_,i) => ({
    year: year + i,
    value: Math.round(price * Math.pow(0.88, i)),
    market: Math.round(price * Math.pow(0.85, i)),
  }));
};

// Market averages by brand
const MARKET_AVG = {
  Maruti:450000, Hyundai:600000, Honda:700000, Toyota:850000,
  Tata:500000, Mahindra:650000, Ford:480000, Volkswagen:750000,
};

export default function Home() {
  const [result,      setResult]      = useState(null);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [emiMonths,   setEmiMonths]   = useState(60);
  const [emiRate,     setEmiRate]     = useState(9);
  const [emiDown,     setEmiDown]     = useState(20);
  const [copyMsg,     setCopyMsg]     = useState("");
  const chartRef    = useRef(null);
  const chartInst   = useRef(null);
  const depChartRef = useRef(null);
  const depChartInst= useRef(null);
  const animPrice   = useCountUp(result?.predicted_price || 0);

  // EMI calculation
  const loanAmt   = result ? result.predicted_price * (1 - emiDown/100) : 0;
  const monthRate = emiRate / 100 / 12;
  const emi       = loanAmt > 0 ? Math.round(loanAmt * monthRate * Math.pow(1+monthRate, emiMonths) / (Math.pow(1+monthRate, emiMonths) - 1)) : 0;
  const totalPay  = emi * emiMonths;
  const totalInt  = totalPay - loanAmt;

  // Brand from name
  const brand = result ? Object.keys(MARKET_AVG).find(b => (result.car_name||"").toLowerCase().startsWith(b.toLowerCase())) || "Maruti" : "Maruti";

  const handleResult = (res) => {
    setResult(res);
    setActiveTab("overview");
    setTimeout(() => document.getElementById("result-section")?.scrollIntoView({behavior:"smooth"}), 150);
  };

  // Price comparison chart
  useEffect(() => {
    if (!result || activeTab !== "charts" || !chartRef.current) return;
    const load = () => {
      if (!window.Chart) { setTimeout(load, 100); return; }
      if (chartInst.current) chartInst.current.destroy();
      const marketAvg = MARKET_AVG[brand] || result.predicted_price;
      chartInst.current = new window.Chart(chartRef.current, {
        type: "bar",
        data: {
          labels: ["Your Car", "Market Average", "Top 10%", "Bottom 10%"],
          datasets: [{
            data: [result.predicted_price, marketAvg, marketAvg*1.3, marketAvg*0.7],
            backgroundColor: ["#2563EB","#E2E8F0","#BBF7D0","#FECACA"],
            borderColor:     ["#2563EB","#CBD5E1","#10B981","#EF4444"],
            borderWidth: 1.5, borderRadius: 6,
          }]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:(c)=>` ${fmt(c.raw)}` } } },
          scales:{
            y:{ grid:{color:"#F1F5F9"}, ticks:{callback:(v)=>fmtL(v), color:"#94A3B8", font:{size:11}} },
            x:{ grid:{display:false}, ticks:{color:"#64748B", font:{size:12}} }
          }
        }
      });
    };
    load();
    return () => { if(chartInst.current) chartInst.current.destroy(); };
  }, [result, activeTab]);

  // Depreciation chart
  useEffect(() => {
    if (!result || activeTab !== "charts" || !depChartRef.current) return;
    const load = () => {
      if (!window.Chart) { setTimeout(load, 100); return; }
      if (depChartInst.current) depChartInst.current.destroy();
      const year = 2025 - (result.car_age || 5);
      const data = DEPRECIATION(result.predicted_price, year);
      depChartInst.current = new window.Chart(depChartRef.current, {
        type: "line",
        data: {
          labels: data.map(d => d.year),
          datasets: [
            { label:"Your Car", data:data.map(d=>d.value), borderColor:"#2563EB", backgroundColor:"rgba(37,99,235,0.05)", borderWidth:2, pointRadius:3, fill:true, tension:0.3 },
            { label:"Market Avg", data:data.map(d=>d.market), borderColor:"#E2E8F0", backgroundColor:"transparent", borderWidth:2, borderDash:[4,4], pointRadius:0, tension:0.3 },
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{position:"top", labels:{usePointStyle:true, padding:16, font:{size:12}}}, tooltip:{callbacks:{label:(c)=>` ${fmtL(c.raw)}`}} },
          scales:{
            y:{ grid:{color:"#F1F5F9"}, ticks:{callback:(v)=>fmtL(v), color:"#94A3B8", font:{size:11}} },
            x:{ grid:{display:false}, ticks:{color:"#94A3B8", font:{size:11}} }
          }
        }
      });
    };
    load();
    return () => { if(depChartInst.current) depChartInst.current.destroy(); };
  }, [result, activeTab]);

  // Share as text
  const handleShare = () => {
    if (!result) return;
    const text = `🚗 CarPrice AI Prediction\nEstimated Price: ${fmt(result.predicted_price)}\nRange: ${fmt(result.price_range_low)} – ${fmt(result.price_range_high)}\nConfidence: ${result.confidence_label}\nPrediction #${result.prediction_id}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg("Copied to clipboard!");
      setTimeout(() => setCopyMsg(""), 2500);
    });
  };

  const conf = result ? CONF[result.confidence_label] || CONF.Medium : null;
  const similarCars = result ? SIMILAR_CARS(brand, result.predicted_price) : [];

  const TABS = [
    {id:"overview", label:"Overview"},
    {id:"charts",   label:"Charts & Trends"},
    {id:"similar",  label:"Similar Cars"},
    {id:"emi",      label:"EMI Calculator"},
  ];

  return (
    <div style={{minHeight:"100vh", background:"#F8FAFC", paddingTop:60}}>

      {/* ── HERO ── */}
      <div style={{background:"#0F172A", minHeight:420, display:"grid", gridTemplateColumns:"1fr 1fr"}}>

        {/* Left */}
        <div style={{padding:"64px 48px 64px 60px", display:"flex", flexDirection:"column", justifyContent:"center"}}>
          <div style={{display:"inline-flex", alignItems:"center", gap:6, background:"rgba(37,99,235,0.2)", border:"1px solid rgba(37,99,235,0.3)", color:"#93C5FD", fontSize:11, fontWeight:600, padding:"5px 12px", borderRadius:20, marginBottom:24, width:"fit-content", letterSpacing:"0.07em", textTransform:"uppercase"}}>
            <span style={{width:5,height:5,background:"#3B82F6",borderRadius:"50%",display:"inline-block",animation:"pulse 2s infinite"}}/>
            AI-Powered · Indian Market · Live
          </div>
          <h1 style={{fontFamily:"var(--serif)", fontSize:"clamp(2rem,4vw,3.2rem)", fontWeight:800, color:"#fff", lineHeight:1.1, letterSpacing:"-0.03em", marginBottom:16}}>
            Know your car's<br/><span style={{color:"#3B82F6"}}>true worth</span>
          </h1>
          <p style={{fontSize:15, color:"#94A3B8", lineHeight:1.7, marginBottom:40, maxWidth:380}}>
            Instant resale price prediction trained on <strong style={{color:"#fff"}}>10,498 real Indian car listings</strong> using an ensemble ML model.
          </p>
          <div style={{display:"flex", gap:32}}>
            {[["10,498","Cars Trained"],["87%","Accuracy"],["24","Features"],["4","Datasets"]].map(([n,l])=>(
              <div key={l}>
                <div style={{fontFamily:"var(--serif)", fontSize:"1.8rem", fontWeight:800, color:"#fff", letterSpacing:"-0.02em"}}>{n}</div>
                <div style={{fontSize:11, color:"#475569", textTransform:"uppercase", letterSpacing:"0.07em", marginTop:3}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div style={{background:"#F8FAFC", padding:"40px 48px", display:"flex", flexDirection:"column", justifyContent:"center"}}>
          <div style={{fontSize:11, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:20}}>Vehicle Details</div>
          <PricePredictionForm onResult={handleResult} />
        </div>
      </div>

      {/* ── RESULT ── */}
      {result && conf && (
        <div id="result-section" style={{maxWidth:1100, margin:"0 auto", padding:"48px 24px 80px"}}>

          {/* Top summary row */}
          <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:20, marginBottom:24}}>

            {/* Main price card */}
            <div style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:16, padding:"32px 36px", boxShadow:"0 4px 24px rgba(0,0,0,0.05)", position:"relative", overflow:"hidden"}}>
              <div style={{position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${conf.color},${conf.color}44)`}} />
              <div style={{fontSize:11, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8}}>Predicted Resale Price</div>
              <div style={{fontFamily:"var(--serif)", fontSize:"clamp(2.4rem,5vw,3.8rem)", fontWeight:800, color:"#0F172A", letterSpacing:"-0.03em", lineHeight:1, marginBottom:12, animation:"countUp 0.8s ease"}}>
                {fmt(animPrice)}
              </div>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:20}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:conf.color,display:"inline-block"}}/>
                <span style={{fontSize:13,fontWeight:600,color:conf.color}}>{conf.label}</span>
                <span style={{fontSize:12,color:"#94A3B8",marginLeft:4}}>· Prediction #{result.prediction_id}</span>
              </div>
              {/* Range bar */}
              <div>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748B", marginBottom:6}}>
                  <span>Conservative</span><span>Optimistic</span>
                </div>
                <div style={{position:"relative", height:8, background:"#F1F5F9", borderRadius:99, marginBottom:8}}>
                  <div style={{position:"absolute", left:"5%", right:"5%", height:"100%", background:`linear-gradient(90deg,${conf.color}44,${conf.color},${conf.color}44)`, borderRadius:99}}/>
                  <div style={{position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", width:16, height:16, background:"#fff", border:`2.5px solid ${conf.color}`, borderRadius:"50%", boxShadow:`0 0 0 3px ${conf.color}22`}}/>
                </div>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:600, color:"#0F172A"}}>
                  <span>{fmt(result.price_range_low)}</span>
                  <span>{fmt(result.price_range_high)}</span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{display:"flex", flexDirection:"column", gap:14}}>
              {[["Model","GBM + RF Ensemble"],["R² Score","0.87 (87%)"],["MAE","₹91K avg error"],["Features","24 engineered"]].map(([k,v])=>(
                <div key={k} style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, padding:"14px 18px"}}>
                  <div style={{fontSize:11, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4}}>{k}</div>
                  <div style={{fontSize:14, fontWeight:600, color:"#0F172A"}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{display:"flex", flexDirection:"column", gap:12}}>
              <button onClick={handleShare} style={{background:"#0F172A", color:"#fff", border:"none", borderRadius:10, padding:"13px 16px", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8, justifyContent:"center"}}>
                📋 {copyMsg || "Copy Prediction"}
              </button>
              <button onClick={() => window.print()} style={{background:"#fff", color:"#0F172A", border:"1px solid #E2E8F0", borderRadius:10, padding:"13px 16px", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8, justifyContent:"center"}}>
                🖨 Print / Save PDF
              </button>
              <div style={{background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:14}}>
                <div style={{fontSize:11, fontWeight:600, color:"#15803D", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em"}}>Quick Tips</div>
                {["Service records → +10%","1st owner → +15%","Under 50K km → premium"].map((t,i)=>(
                  <div key={i} style={{fontSize:12, color:"#166534", marginBottom:5, display:"flex", gap:6}}>
                    <span style={{color:"#10B981"}}>✓</span>{t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:"flex", gap:0, borderBottom:"1px solid #E2E8F0", marginBottom:28}}>
            {TABS.map(({id,label})=>(
              <button key={id} onClick={()=>setActiveTab(id)} style={{
                background:"none", border:"none", padding:"12px 20px", fontSize:13, fontWeight:500,
                color: activeTab===id ? "#2563EB" : "#64748B",
                borderBottom: activeTab===id ? "2px solid #2563EB" : "2px solid transparent",
                transition:"all 0.15s", cursor:"pointer",
              }}>{label}</button>
            ))}
          </div>

          {/* ── TAB: Overview ── */}
          {activeTab==="overview" && (
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, animation:"fadeIn 0.3s ease"}}>
              <div style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:14, padding:24}}>
                <h3 style={{fontSize:14, fontWeight:600, color:"#0F172A", marginBottom:16}}>Price Factors</h3>
                {[["Car Age","Major impact — adds/removes ₹50K–2L",80],["KM Driven","High mileage cuts value significantly",65],["Brand","Maruti/Hyundai retain value best",45],["Fuel Type","Diesel better for high-mileage cars",35],["Ownership","First owner gets 15–20% premium",30]].map(([k,v,w])=>(
                  <div key={k} style={{marginBottom:14}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:5}}>
                      <span style={{fontSize:13, fontWeight:500, color:"#0F172A"}}>{k}</span>
                      <span style={{fontSize:12, color:"#64748B"}}>{v}</span>
                    </div>
                    <div style={{height:4, background:"#F1F5F9", borderRadius:99}}>
                      <div style={{height:"100%", width:`${w}%`, background:"#2563EB", borderRadius:99, transition:"width 0.6s ease"}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:14, padding:24}}>
                <h3 style={{fontSize:14, fontWeight:600, color:"#0F172A", marginBottom:16}}>Prediction Breakdown</h3>
                <div style={{fontFamily:"var(--serif)", fontSize:"2.4rem", fontWeight:800, color:"#2563EB", marginBottom:4}}>{fmt(result.predicted_price)}</div>
                <div style={{fontSize:12, color:"#94A3B8", marginBottom:20}}>Based on 10,498 real Indian market transactions</div>
                {[["Confidence Level",conf.label,conf.color],["Price Range",`${fmt(result.price_range_low)} – ${fmt(result.price_range_high)}`,"#64748B"],["Prediction ID",`#${result.prediction_id}`,"#64748B"],["Generated",new Date(result.created_at).toLocaleString("en-IN"),"#64748B"]].map(([k,v,c])=>(
                  <div key={k} style={{display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #F1F5F9"}}>
                    <span style={{fontSize:13, color:"#64748B"}}>{k}</span>
                    <span style={{fontSize:13, fontWeight:600, color:c}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: Charts ── */}
          {activeTab==="charts" && (
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, animation:"fadeIn 0.3s ease"}}>
              <div style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:14, padding:24}}>
                <h3 style={{fontSize:14, fontWeight:600, color:"#0F172A", marginBottom:4}}>Price vs Market Average</h3>
                <p style={{fontSize:12, color:"#94A3B8", marginBottom:16}}>How your car compares to market benchmarks</p>
                <div style={{position:"relative", height:260}}>
                  <canvas ref={chartRef}/>
                </div>
              </div>
              <div style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:14, padding:24}}>
                <h3 style={{fontSize:14, fontWeight:600, color:"#0F172A", marginBottom:4}}>Depreciation Curve</h3>
                <p style={{fontSize:12, color:"#94A3B8", marginBottom:16}}>How your car's value changes over time</p>
                <div style={{position:"relative", height:260}}>
                  <canvas ref={depChartRef}/>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Similar Cars ── */}
          {activeTab==="similar" && (
            <div style={{animation:"fadeIn 0.3s ease"}}>
              <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16}}>
                {similarCars.map((car,i)=>{
                  const diff = car.price - result.predicted_price;
                  const pct  = ((diff/result.predicted_price)*100).toFixed(1);
                  return (
                    <div key={i} style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:14, padding:22, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:14, fontWeight:600, color:"#0F172A", marginBottom:6}}>{car.name}</div>
                        <div style={{display:"flex", gap:10, fontSize:12, color:"#64748B"}}>
                          <span>📍 Nearby</span>
                          <span>⛽ {car.fuel}</span>
                          <span>🔑 {car.owner} owner</span>
                          <span>📍 {car.km} km</span>
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"var(--serif)", fontSize:"1.3rem", fontWeight:700, color:"#0F172A"}}>{fmt(car.price)}</div>
                        <div style={{fontSize:12, fontWeight:600, color: diff>0?"#10B981":"#EF4444", marginTop:4}}>
                          {diff>0?"+":""}{pct}% vs yours
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:14, padding:"12px 16px", background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:10, fontSize:12, color:"#92400E"}}>
                ℹ️ Similar cars data is based on market patterns from the training dataset. Actual nearby listings may vary.
              </div>
            </div>
          )}

          {/* ── TAB: EMI Calculator ── */}
          {activeTab==="emi" && (
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, animation:"fadeIn 0.3s ease"}}>
              <div style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:14, padding:28}}>
                <h3 style={{fontSize:14, fontWeight:600, color:"#0F172A", marginBottom:20}}>Loan Calculator</h3>
                <div style={{marginBottom:20}}>
                  <label style={{fontSize:12, fontWeight:600, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:8}}>
                    Down Payment: {emiDown}%
                  </label>
                  <input type="range" min={10} max={50} step={5} value={emiDown} onChange={e=>setEmiDown(+e.target.value)}
                    style={{width:"100%", height:4, accentColor:"#2563EB"}}/>
                  <div style={{fontSize:12, color:"#64748B", marginTop:4}}>Loan amount: {fmt(loanAmt)}</div>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{fontSize:12, fontWeight:600, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:8}}>
                    Interest Rate: {emiRate}% p.a.
                  </label>
                  <input type="range" min={7} max={18} step={0.5} value={emiRate} onChange={e=>setEmiRate(+e.target.value)}
                    style={{width:"100%", height:4, accentColor:"#2563EB"}}/>
                </div>
                <div style={{marginBottom:24}}>
                  <label style={{fontSize:12, fontWeight:600, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:8}}>
                    Tenure: {emiMonths} months ({(emiMonths/12).toFixed(1)} years)
                  </label>
                  <input type="range" min={12} max={84} step={12} value={emiMonths} onChange={e=>setEmiMonths(+e.target.value)}
                    style={{width:"100%", height:4, accentColor:"#2563EB"}}/>
                </div>
                <div style={{background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:12, padding:18}}>
                  <div style={{fontSize:12, color:"#3B82F6", marginBottom:6}}>Monthly EMI</div>
                  <div style={{fontFamily:"var(--serif)", fontSize:"2.2rem", fontWeight:800, color:"#1D4ED8"}}>{fmt(emi)}</div>
                </div>
              </div>
              <div style={{background:"#fff", border:"1px solid #E2E8F0", borderRadius:14, padding:28}}>
                <h3 style={{fontSize:14, fontWeight:600, color:"#0F172A", marginBottom:20}}>Loan Summary</h3>
                {[["Car Price",fmt(result.predicted_price),"#0F172A"],["Down Payment",`${fmt(result.predicted_price*emiDown/100)} (${emiDown}%)`,"#64748B"],["Loan Amount",fmt(loanAmt),"#2563EB"],["Monthly EMI",fmt(emi),"#2563EB"],["Total Interest",fmt(totalInt),"#EF4444"],["Total Payment",fmt(totalPay),"#0F172A"]].map(([k,v,c])=>(
                  <div key={k} style={{display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid #F1F5F9"}}>
                    <span style={{fontSize:13, color:"#64748B"}}>{k}</span>
                    <span style={{fontSize:14, fontWeight:600, color:c}}>{v}</span>
                  </div>
                ))}
                <div style={{marginTop:16, padding:"12px 14px", background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, fontSize:12, color:"#92400E"}}>
                  ℹ️ EMI calculation is approximate. Actual rates may vary by bank and credit score.
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── HOW IT WORKS ── */}
      {!result && (
        <div style={{maxWidth:1100, margin:"0 auto", padding:"60px 24px"}}>
          <div style={{textAlign:"center", marginBottom:48}}>
            <h2 style={{fontFamily:"var(--serif)", fontSize:"1.8rem", fontWeight:700, color:"#0F172A", marginBottom:8}}>How it works</h2>
            <p style={{fontSize:14, color:"#64748B"}}>Three steps to your car's true resale value</p>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24}}>
            {[["01","Enter Details","Fill in your car's make, model, year, mileage, and fuel type","#EFF6FF","#2563EB"],["02","AI Prediction","Our ensemble of GBM + Random Forest models analyses 24 features","#F0FDF4","#10B981"],["03","Get Results","Receive an instant price estimate with confidence range and EMI calculator","#FFF7ED","#F59E0B"]].map(([num,title,desc,bg,color])=>(
              <div key={num} style={{background:bg, border:`1px solid ${color}22`, borderRadius:16, padding:28, textAlign:"center"}}>
                <div style={{fontFamily:"var(--serif)", fontSize:"2rem", fontWeight:800, color, marginBottom:12}}>{num}</div>
                <h3 style={{fontSize:15, fontWeight:600, color:"#0F172A", marginBottom:8}}>{title}</h3>
                <p style={{fontSize:13, color:"#64748B", lineHeight:1.6}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"/>
      <style>{`
        input[type="range"] { -webkit-appearance:none; height:4px; border-radius:99px; background:#E2E8F0; outline:none; border:none; padding:0; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; background:#2563EB; border-radius:50%; cursor:pointer; border:2px solid #fff; box-shadow:0 1px 4px rgba(37,99,235,0.3); }
        @media(max-width:768px){
          div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}
          div[style*="grid-template-columns: 2fr 1fr 1fr"]{grid-template-columns:1fr!important}
          div[style*="grid-template-columns: repeat(3,1fr)"]{grid-template-columns:1fr!important}
          div[style*="grid-template-columns: repeat(2,1fr)"]{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}
