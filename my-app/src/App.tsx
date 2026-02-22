import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Products from './pages/Products';
import About from './pages/About';
import GetQuote from './pages/GetQuote';
import SubmitPhotos from './pages/SubmitPhotos';
import Admin from './pages/Admin';
import './styles/global.css';
import './App.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <ScrollToTop />
    <Navbar />
    <main>{children}</main>
    <Footer />
  </>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/get-quote" element={<GetQuote />} />
          <Route path="/submit-photos/:leadId" element={<SubmitPhotos />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
