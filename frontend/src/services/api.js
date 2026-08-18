// src/services/api.js
import axios from "axios";
const BASE = process.env.REACT_APP_API_URL || "https://used-car-price-prediction-2g2t.onrender.com/api/v1";
const api  = axios.create({ baseURL:BASE, timeout:20000, headers:{"Content-Type":"application/json"} });
api.interceptors.response.use(r=>r.data, e=>Promise.reject(new Error(e.response?.data?.detail||e.message||"Error")));
export const predictCarPrice      = (d)           => api.post("/predict",d);
export const getPredictionHistory = (l=20,o=0)    => api.get("/predictions",{params:{limit:l,offset:o}});
export const getModelInfo         = ()            => api.get("/model/info");
export const getFeatureImportance = ()            => api.get("/model/features");
export const getPredictionStats   = ()            => api.get("/stats");
export default api;
