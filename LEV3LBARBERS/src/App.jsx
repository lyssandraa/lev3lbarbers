import './App.css'
import {BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from 'react';

import ScrollToTop from './common/scrollToTop';
import IntroReveal from './common/IntroReveal';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Availability from './components/Availability';
import Shop from './pages/Shop';
import Services from "./pages/Services";
import Contact from './pages/Contact';

import Register from './pages/Signup';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';

import AdminPanel from './pages/AdminPanel';
import RequireAdmin from './common/RequireAdmin';
import Gallery from './pages/Gallery';
import WhatsOn from './pages/WhatsOn';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import GiftCardVerify from './pages/GiftCardVerify';
import MemberPay from './pages/MemberPay';
import Bookings from './pages/Bookings';
import CookieBanner from './common/CookieBanner';
import shopOpen from './common/shopOpen';

function App() {
  const location = useLocation();
  const shopStatus = shopOpen();
  const isHome  = location.pathname === "/";
  const isAdmin = location.pathname === "/admin";

  const [footerH, setFooterH] = useState(0);
  useEffect(() => {
    if (!isHome) return;
    const el = document.querySelector('footer');
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setFooterH(entry.target.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isHome]);

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <>
    <IntroReveal />
    <Header isOpen={shopStatus.isOpen}/>
    <ScrollToTop/>
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/shop" element={<Shop />}/>
      <Route path="/services" element={<Services />}/>
      <Route path="/contact" element={<Contact/>}/>
      <Route path='/register' element={<Register/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/profile' element={<Profile/>}/>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/admin" element={<RequireAdmin><AdminPanel refreshShopStatus={shopStatus.refresh} /></RequireAdmin>} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/whats-on" element={<WhatsOn />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/gc/:code" element={<GiftCardVerify />} />
      <Route path="/pay/:qrCode" element={<MemberPay />} />
      <Route path="/bookings" element={<Bookings />} />

    </Routes>

    {isHome && <Availability {...shopStatus} />}
    {isHome && <div style={{ height: footerH, background: '#f4f0e8' }} />}

    {!isAdmin && <Footer fixed={isHome}/>}
    <CookieBanner />
    </>
  )
}

export default App
