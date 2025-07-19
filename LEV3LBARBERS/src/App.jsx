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

function App() {
  const location = useLocation();

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
    <Header/>
    <ScrollToTop/>
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/shop" element={<Shop />}/>
      <Route path="/services" element={<Services />}/>
      <Route path="/contact" element={<Contact/>}/>
    </Routes>

    {location.pathname === "/" && <Availability />}

    <Footer/>
    </>
  )
}

export default App
