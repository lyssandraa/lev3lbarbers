import './App.css'
import {BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from 'react';

import ScrollToTop from './common/scrollToTop';
import IntroReveal from './common/IntroReveal';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Availability from './components/Availability';
import RequireAdmin from './common/RequireAdmin';
import CookieBanner from './common/CookieBanner';
import shopOpen from './common/shopOpen';

const Shop = lazy(() => import('./pages/Shop'));
const Services = lazy(() => import('./pages/Services'));
const Contact = lazy(() => import('./pages/Contact'));

const Register = lazy(() => import('./pages/Signup'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Profile = lazy(() => import('./pages/Profile'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Gallery = lazy(() => import('./pages/Gallery'));
const WhatsOn = lazy(() => import('./pages/WhatsOn'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const GiftCardVerify = lazy(() => import('./pages/GiftCardVerify'));
const MemberPay = lazy(() => import('./pages/MemberPay'));
const Bookings = lazy(() => import('./pages/Bookings'));
const LegalPage = lazy(() => import('./pages/LegalPage'));

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
    <Header isOpen={shopStatus.isOpen} refreshShopStatus={shopStatus.refresh}/>
    <ScrollToTop/>
    <Suspense fallback={null}>
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
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/admin" element={<RequireAdmin><AdminPanel refreshShopStatus={shopStatus.refresh} /></RequireAdmin>} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/whats-on" element={<WhatsOn />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/gc/:code" element={<GiftCardVerify />} />
        <Route path="/pay/:qrCode" element={<MemberPay />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/privacy-notice" element={<LegalPage endpoint="/privacy-notice" dataKey="notice" title="Privacy Notice" emptyText="No privacy notice published yet." />} />
        <Route path="/general-terms" element={<LegalPage endpoint="/general-terms" dataKey="terms" title="Terms & Conditions" emptyText="No terms published yet." />} />
      </Routes>
    </Suspense>

    {isHome && <Availability {...shopStatus} />}
    {isHome && <div style={{ height: footerH, background: '#f4f0e8' }} />}

    {!isAdmin && <Footer fixed={isHome}/>}
    <CookieBanner />
    </>
  )
}

export default App
