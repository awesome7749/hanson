import React, { lazy, Suspense, useEffect, useRef } from "react";
import { LIVE } from "./revamp/deployment";
import Receipt from "./revamp/Receipt";
import ThankYou from "./revamp/ThankYou";
import { captureUtm } from "./revamp/pixel";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
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
// The Meta Pixel base code fires PageView on the initial load only; a SPA
// route change must re-fire it manually. Also captures ad UTM parameters
// from the landing URL so /start can attach them to the lead.
function PageTracking() {
  const location = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      captureUtm(window.location.search);
      return;
    }
    try {
      window.fbq?.("track", "PageView");
    } catch {}
  }, [location.pathname]);
  return null;
}
export default function App() {
  return (
    <PreviewProvider>
      <BrowserRouter>
        <PageTracking />
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
            <Route path="/start/thank-you" element={<ThankYou />} />
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
