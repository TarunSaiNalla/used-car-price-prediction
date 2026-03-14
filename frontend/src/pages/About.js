// src/pages/About.js
import React, { useEffect, useState, useRef } from "react";
import { getModelInfo, getFeatureImportance } from "../services/api";

export default function About() {
  const [meta, setMeta]             = useState(null);
  const [importance, setImportance] = useState(null);
  const chartRef    = useRef(null);
  const chartInst   = useRef(null);

  useEffect(() => {
    getModelInfo().then(setMeta).catch(()=>{});
    getFeatureImportance().then(setImportance).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!importance || !chartRef.current) return;
    const load = () => {
      if (!window.Chart) { setTimeout(load, 100); return; }
      if (chartInst.current) chartInst.current.destroy();
      const labels = importance.features.slice(0,12).map(f => f.replace(/^(cat__|num__)/,"").replace(/_/g," ").substring(0,18));
      const data   = importance.importances.slice(0,12).map(v => (v*100).toFixed(2));
      chartInst.current = new window.Chart(chartRef.current, {
        type:"bar",
        data:{ labels, datasets:[{ label:"Importance (%)", data, backgroundColor: data.map((_,i)=>i<3?"#2563EB":i<6?"#93C5FD":"#DBEAFE"), borderRadius:5, borderColor:"transparent" }] },
        options:{ indexAxis:"y", responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{callbacks:{label:(c)=>` ${c.raw}% importance`}}}, scales:{ x:{grid:{color:"#F1F5F9"},ticks:{color:"#94A3B8",font:{size:11}}}, y:{grid:{display:false},ticks:{color:"#0F172A",font:{size:12}}} } }
      });
    };
    load();
    return () => { if(chartInst.current) chartInst.current.destroy(); };
  }, [importance]);

  const Tag = ({c, color="#2563EB"}) => <span style={{display:"inline-block",background:`${color}12`,border:`1px solid ${color}25`,color,fontSize:12,fontWeight:500,padding:"3px 10px",borderRadius:20,margin:"3px 3px 3px 0"}}>{c}</span>;

  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC",paddingTop:60}}>
      <div style={{background:"#0F172A",padding:"48px 24px 52px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <div style={{fontSize:11,fontWeight:600,color:"#475569",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Documentation</div>
          <h1 style={{fontFamily:"var(--serif)",fontSize:"2.4rem",fontWeight:800,color:"#fff",letterSpacing:"-0.02em",marginBottom:8}}>About This Project</h1>
          <p style={{fontSize:14,color:"#94A3B8",maxWidth:540}}>A production-grade full-stack ML application for predicting used car resale prices in the Indian market.</p>
        </div>
      </div>

      <div style={{maxWidth:860,margin:"0 auto",padding:"40px 24px 80px"}}>

        {meta && (
          <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:28,marginBottom:24}}>
            <h2 style={{fontSize:15,fontWeight:600,color:"#0F172A",marginBottom:20}}>Live Model Performance</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:16}}>
              {[["R² Score",meta.r2,"#2563EB"],["MAPE",`${meta.mape}%`,"#10B981"],["MAE",`₹${(meta.mae/1000).toFixed(0)}K`,"#F59E0B"],["Training",`${(meta.n_train/1000).toFixed(1)}K cars`,"#8B5CF6"]].map(([l,v,c])=>(
                <div key={l} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:12,padding:"18px 16px",textAlign:"center"}}>
                  <div style={{fontFamily:"var(--serif)",fontSize:"1.8rem",fontWeight:800,color:c,marginBottom:5}}>{v}</div>
                  <div style={{fontSize:11,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.07em"}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:12,color:"#64748B",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 14px",display:"flex",gap:20,flexWrap:"wrap"}}>
              <span>Model: <strong style={{color:"#0F172A"}}>{meta.model_type}</strong></span>
              <span>CV R²: <strong style={{color:"#0F172A"}}>{meta.cv_r2_mean} ± {meta.cv_r2_std}</strong></span>
              <span>Trained: <strong style={{color:"#0F172A"}}>{new Date(meta.trained_at).toLocaleDateString("en-IN")}</strong></span>
            </div>
          </div>
        )}

        {importance && (
          <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:28,marginBottom:24}}>
            <h2 style={{fontSize:15,fontWeight:600,color:"#0F172A",marginBottom:4}}>Feature Importance</h2>
            <p style={{fontSize:12,color:"#94A3B8",marginBottom:20}}>What the model actually uses to predict price</p>
            <div style={{position:"relative",height:360}}><canvas ref={chartRef}/></div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
          {[["🎨 Frontend",["React.js 18","React Router v6","Axios","Chart.js","Google Fonts"],"#2563EB"],["⚡ Backend",["FastAPI","Uvicorn","Pydantic v2","SQLAlchemy","REST API"],"#10B981"],["🤖 ML Model",["Gradient Boosting","Random Forest","scikit-learn","24 features","Log-transform"],"#F59E0B"],["🗄 Data",["4× Car Dekho CSVs","10,498 records","Feature engineering","SQLite / PostgreSQL","Docker ready"],"#8B5CF6"]].map(([title,tags,color])=>(
            <div key={title} style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:14,padding:22}}>
              <div style={{fontSize:14,fontWeight:600,color:"#0F172A",marginBottom:12}}>{title}</div>
              <div>{tags.map(t=><Tag key={t} c={t} color={color}/>)}</div>
            </div>
          ))}
        </div>

        <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:28}}>
          <h2 style={{fontSize:15,fontWeight:600,color:"#0F172A",marginBottom:20}}>System Architecture</h2>
          {[["1","React Form","User enters car details with validation","#2563EB"],["2","Axios POST","Sends JSON to FastAPI /api/v1/predict","#3B82F6"],["3","Pydantic","Validates types, ranges, enums","#10B981"],["4","Feature Engineering","24 derived features including brand, age², log(km)","#10B981"],["5","Ensemble Model","GBM (70%) + Random Forest (30%) weighted vote","#F59E0B"],["6","expm1()","Inverse log-transform → real INR price","#F59E0B"],["7","SQLite Log","Prediction saved to prediction_logs table","#8B5CF6"],["8","JSON Response","Price + range + confidence returned in &lt;1s","#8B5CF6"]].map(([step,title,desc,color])=>(
            <div key={step} style={{display:"flex",gap:16,marginBottom:16,alignItems:"flex-start"}}>
              <div style={{width:28,height:28,minWidth:28,background:`${color}15`,border:`1px solid ${color}30`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color,marginTop:1}}>{step}</div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:"#0F172A",marginBottom:2}}>{title}</div>
                <div style={{fontSize:13,color:"#64748B"}} dangerouslySetInnerHTML={{__html:desc}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
