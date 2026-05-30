import './App.css'
import {BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect } from 'react';

import ScrollToTop from './common/scrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Availability from './components/Availability';
import Shop from './pages/Shop';
import Services from "./pages/Services";
import Contact from './pages/Contact';

import Register from './pages/Signup';
import Login from './pages/Login.Jsx';
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';

import AdminPanel from './pages/AdminPanel';
import shopOpen from './common/shopOpen';

function App() {
  const location = useLocation();
  const shopStatus = shopOpen();

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
      <Route path="/admin" element={<AdminPanel refreshShopStatus={shopStatus.refresh} />} />

    </Routes>

    {location.pathname === "/" && <Availability {...shopStatus} />}

    <Footer/>
    </>
  )
}

export default App
