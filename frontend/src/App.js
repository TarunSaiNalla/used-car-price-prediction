// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar   from "./components/Navbar";
import Home     from "./pages/Home";
import Compare  from "./pages/Compare";
import Trends   from "./pages/Trends";
import History  from "./pages/History";
import About    from "./pages/About";
import NotFound from "./pages/NotFound";

export default function App() {
  useEffect(() => {
    if (window.Chart) return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"        element={<Home />}    />
        <Route path="/compare" element={<Compare />} />
        <Route path="/trends"  element={<Trends />}  />
        <Route path="/history" element={<History />} />
        <Route path="/about"   element={<About />}   />
        <Route path="*"        element={<NotFound />}/>
      </Routes>
    </BrowserRouter>
  );
}
