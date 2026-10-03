import React, { lazy, Suspense, useEffect } from "react";
import { LIVE, OPS } from "./revamp/deployment";
import Receipt from "./revamp/Receipt";
import ThankYou from "./revamp/ThankYou";
import TrackingConsent from "./revamp/TrackingConsent";
import ChatWidget from "./revamp/ChatWidget";
import { captureUtm, initializePixel, fbqTrack, loadTrackingPolicy } from "./revamp/pixel";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Shell } from "./revamp/Shared";
import { PreviewProvider } from "./revamp/Store";
import Programs from "./revamp/Programs";
import Home from "./revamp/Home";
import Intake from "./revamp/Intake";
import Project from "./revamp/Project";
import Staff from "./revamp/Staff";
import Info from "./revamp/Info";
import Education from "./revamp/Education";
import Pricing from "./revamp/Pricing";
import HeatPumpCostCalculator from "./revamp/HeatPumpCostCalculator";
import Town from "./revamp/Town";
import Blog from "./revamp/Blog";
import BlogArticle from "./revamp/BlogArticle";
import SeoHead from "./revamp/SeoHead";
import { towns } from "./revamp/towns";
import "./revamp/theme.css";
const Admin = lazy(() => import("./pages/Admin"));
function HeatPumpGuideRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={`/blog/heat-pumps-massachusetts-winter-guide${search}${hash}`} replace />;
}
function PageTracking() {
  const location = useLocation();
  useEffect(() => {
    let active = true;
    void loadTrackingPolicy().then(() => {
      if (!active) return;
      initializePixel();
      captureUtm(window.location.search);
      fbqTrack("track", "PageView");
    });
    return () => { active = false; };
  }, [location.pathname]);
  return null;
}
export default function App() {
  return (
    <PreviewProvider>
      <BrowserRouter>
        <SeoHead />
        {OPS ? (
          <main id="main"><Suspense fallback={<p className="wrap section">Loading staff sign-in…</p>}><Admin /></Suspense></main>
        ) : <>
          <PageTracking />
          <TrackingConsent />
          <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trade-in" element={<Programs key="trade-in" program="trade-in" />} />
            <Route path="/veterans-discount" element={<Programs key="community" program="community" />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="/heat-pump-cost-calculator" element={<HeatPumpCostCalculator />} />
            {["/heat-pumps", "/heatpump", "/products"].map((path) => <Route key={path} path={path} element={<HeatPumpGuideRedirect />} />)}
            {["/assessment", "/how-it-works", "/warranty"].map(
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
            <Route path="/staff" element={LIVE ? <Info /> : <Staff />} />
            {!LIVE && <Route path="/admin" element={<Navigate to="/staff" replace />} />}
            {towns.map((t) => (
              <Route key={t.slug} path={"/" + t.slug} element={<Town slug={t.slug} />} />
            ))}
            <Route path="*" element={<Info />} />
          </Routes>
          <ChatWidget />
        </Shell>
        </>}
      </BrowserRouter>
    </PreviewProvider>
  );
}
