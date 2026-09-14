import React, { lazy, Suspense } from "react";
import { LIVE } from "./revamp/deployment";
import Receipt from "./revamp/Receipt";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { Shell } from "./revamp/Shared";
import { PreviewProvider } from "./revamp/Store";
import Home from "./revamp/Home";
import Intake from "./revamp/Intake";
import Project from "./revamp/Project";
import Staff from "./revamp/Staff";
import Info from "./revamp/Info";
import Education from "./revamp/Education";
import Pricing from "./revamp/Pricing";
import "./revamp/theme.css";
const Admin = lazy(() => import("./pages/Admin"));
export default function App() {
  return (
    <PreviewProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            {["/heat-pumps", "/assessment", "/how-it-works", "/warranty"].map(
              (path) => (
                <Route key={path} path={path} element={<Education />} />
              ),
            )}
            <Route path="/start" element={<Intake />} />
            <Route
              path="/get-quote"
              element={<Navigate to="/start" replace />}
            />
            <Route path="/project" element={LIVE ? <Receipt /> : <Project />} />
            <Route path="/project/:id" element={LIVE ? <Receipt /> : <Project />} />
            <Route path="/staff" element={LIVE ? <Navigate to="/admin" replace /> : <Staff />} />
            <Route path="/admin" element={LIVE ? <Suspense fallback={<p className="wrap section">Loading staff sign-in…</p>}><Admin /></Suspense> : <Navigate to="/staff" replace />} />
            <Route
              path="/products"
              element={<Navigate to="/heat-pumps" replace />}
            />
            <Route path="*" element={<Info />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </PreviewProvider>
  );
}
