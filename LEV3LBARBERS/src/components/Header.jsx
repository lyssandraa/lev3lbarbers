import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { T } from '../common/theme';
import styled, { keyframes, css } from 'styled-components';
import '@fontsource/montserrat';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiMenu, FiShoppingBag } from 'react-icons/fi';
import { FaUser } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import CartDrawer from '../common/CartDrawer';
import Banner from '../common/Banner';
import api from '../utils/api';
import logoColor from '../assets/logo.png';
import logoWhite from '../assets/logoWhite.png';

const drawerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.2, staggerChildren: 0.05, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
};

const BASE_NAV = [
  { label: 'HOME',        path: '/',                action: 'home' },
  { label: 'AVAILABILITY',path: '/#availability',   action: 'availability' },
  { label: 'SERVICES',    path: '/services',         action: 'nav' },
  { label: 'GALLERY',     path: '/gallery',          action: 'nav' },
  { label: 'SHOP',        path: '/shop',             action: 'nav' },
  { label: "WHAT'S ON",  path: '/whats-on',         action: 'nav' },
  { label: 'LOCATION',    path: '/contact#location', action: 'contact', id: 'location' },
  { label: 'CONTACT',     path: '/contact#info',     action: 'contact', id: 'info' },
  { label: 'HOURS',       path: '/contact#hours',    action: 'contact', id: 'hours' },
];

const Header = ({ isOpen }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const navRef    = useRef();
  const headerRef = useRef();
  const isHome    = location.pathname === '/';

  const { isLoggedIn, isShopUser } = useAuth();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [headerH,    setHeaderH]    = useState(140);

  /* ── Measure the header's real height so the mobile drawer can clear it
       exactly — a hardcoded value drifts between pages (banner/layout differ) ── */
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHeaderH(entry.target.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const lightMode = isHome && !scrolled;
  const [showBookmark, setShowBookmark] = useState(false);
  const [bookingsActive, setBookingsActive] = useState(false);

  useEffect(() => {
    api.get('/booking-settings').then(r => setBookingsActive(r.data?.isActive)).catch(() => {});
  }, []);

  const NAV = bookingsActive
    ? [...BASE_NAV, { label: 'BOOK', path: '/bookings', action: 'nav' }]
    : BASE_NAV;

  const { count: cartCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartBump, setCartBump] = useState(false);

  /* ── Cart icon bounces when Shop's "fly to cart" animation lands ── */
  useEffect(() => {
    const onBump = () => {
      setCartBump(true);
      setTimeout(() => setCartBump(false), 450);
    };
    window.addEventListener('cart-bump', onBump);
    return () => window.removeEventListener('cart-bump', onBump);
  }, []);

  /* ── Scroll-aware compact header ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Bookmark: unfolds after the intro animation finishes (~3.9s) ── */
  useEffect(() => {
    const t1 = setTimeout(() => setShowBookmark(true),  4200);
    const t2 = setTimeout(() => setShowBookmark(false), 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* ── Close mobile nav on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);


  /* ── Nav handlers ── */
  const handleNav = (item) => {
    setMenuOpen(false);
    if (item.action === 'home') { navigate('/'); return; }
    if (item.action === 'availability') {
      if (location.pathname === '/') {
        document.getElementById('availability')?.scrollIntoView({ behavior: 'smooth' });
      } else { navigate('/#availability'); }
      return;
    }
    if (item.action === 'contact') {
      if (location.pathname === '/contact') {
        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
      } else { navigate(`/contact#${item.id}`); }
      return;
    }
    navigate(item.path);
  };

  const activeRoute = (item) => {
    if (item.action === 'home') return location.pathname === '/';
    if (item.action === 'nav')  return location.pathname === item.path;
    return false;
  };

  return (
    <StyledHeader ref={headerRef} $scrolled={scrolled} $isHome={isHome} $lightMode={lightMode} $menuOpen={menuOpen}>
      {/* ── Banner sits at the very top — above the nav ── */}
      <BannerRow>
        <Banner lightMode={lightMode} />
      </BannerRow>

      {/* ── Bookmark hangs from the bottom of the full header ── */}
      <AnimatePresence>
        {showBookmark && (
          <BookmarkOuter
            key="bm"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <BookmarkInner>EST<br />2023</BookmarkInner>
          </BookmarkOuter>
        )}
      </AnimatePresence>

      <TopRow $scrolled={scrolled}>
        <ShopStatus
          onClick={() => { setMenuOpen(false); navigate('/contact#hours'); }}
          title="View opening hours"
        >
          <BarberPole $isOpen={isOpen} />
          <StatusLabel $isOpen={isOpen}>{isOpen ? 'OPEN' : 'CLOSED'}</StatusLabel>
        </ShopStatus>

        {/* Logo: shown when brand name is hidden (home, not scrolled) */}
        <LogoBrand $lightMode={lightMode} onClick={() => { navigate('/'); setMenuOpen(false); }}>
          <img src={lightMode || menuOpen ? logoColor : logoWhite} alt="LEV3L Barbers" />
        </LogoBrand>

        {/* Text brand: shown when scrolled or on other pages */}
        <Brand $lightMode={lightMode} onClick={() => { navigate('/'); setMenuOpen(false); }}>
          LEV3L BARBERS
        </Brand>

        <RightIcons>
          <CartIconBtn id="cart-icon" onClick={() => setCartOpen(true)} aria-label="Cart">
            <motion.span
              style={{ display: 'inline-flex' }}
              animate={cartBump ? { scale: [1, 1.4, 0.9, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <FiShoppingBag size={18} />
              {cartCount > 0 && <CartBadge>{cartCount > 9 ? '9+' : cartCount}</CartBadge>}
            </motion.span>
          </CartIconBtn>
          <IconBtn onClick={() => navigate(isLoggedIn ? '/profile' : '/login')} aria-label="Account">
            <FaUser size={17} />
          </IconBtn>
          <Hamburger onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <FiX size={25} /> : <FiMenu size={25} />}
          </Hamburger>
        </RightIcons>
      </TopRow>

      <DesktopNav>
        {NAV.map((item) => (
          <NavItem key={item.label} $active={activeRoute(item)} onClick={() => handleNav(item)}>
            {item.label}
          </NavItem>
        ))}
        {isLoggedIn && isShopUser && (
          <NavItem onClick={() => { navigate('/admin'); setMenuOpen(false); }}>ADMIN</NavItem>
        )}
      </DesktopNav>

      {/* ── Mobile drawer — full-screen cream overlay ──
          Portalled to document.body: the header can get `backdrop-filter`
          applied to it on scroll, which creates a new containing block for
          `position: fixed` descendants and would otherwise trap this drawer
          inside the header's own (short) box instead of the full viewport. */}
      {createPortal(
        <AnimatePresence>
          {menuOpen && (
            <MobileDrawer
              ref={navRef}
              key="drawer"
              $headerH={headerH}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              variants={drawerVariants}
            >
              {NAV.map((item) => (
                <DrawerItem
                  key={item.label}
                  $active={activeRoute(item)}
                  variants={itemVariants}
                  onClick={() => handleNav(item)}
                >
                  {item.label}
                </DrawerItem>
              ))}
              {isLoggedIn && isShopUser && (
                <DrawerItem
                  variants={itemVariants}
                  onClick={() => { navigate('/admin'); setMenuOpen(false); }}
                >
                  Admin Panel
                </DrawerItem>
              )}
            </MobileDrawer>
          )}
        </AnimatePresence>,
        document.body
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </StyledHeader>
  );
};

export default Header;

/* ─────────── Keyframes ─────────── */

const stripeScroll = keyframes`
  from { background-position: 0 0; }
  to   { background-position: 0 60px; }
`;

const sway = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25%       { transform: rotate(3deg); }
  50%       { transform: rotate(-3deg); }
  75%       { transform: rotate(2deg); }
`;

const fadeDown = keyframes`
  from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
`;

/* ─────────── Styled components ─────────── */

const StyledHeader = styled.header`
  font-family: ${T.fontHead};

  /* When menu is open: always use dark ink so icons are visible on the cream drawer */
  --h-text:     ${({ $lightMode, $menuOpen }) => ($menuOpen || $lightMode) ? '#1a1a1a'            : T.text};
  --h-text-dim: ${({ $lightMode, $menuOpen }) => ($menuOpen || $lightMode) ? 'rgba(26,26,26,0.5)' : T.textDim};
  --h-accent:   ${({ $lightMode, $menuOpen }) => ($menuOpen || $lightMode) ? '#C41E3A'            : T.gold};

  background: ${({ $scrolled, $lightMode, $menuOpen }) =>
    $menuOpen    ? 'transparent' :
    $lightMode   ? 'transparent' :
    $scrolled    ? 'rgba(12,15,22,0.96)' :
                   T.surface};
  backdrop-filter: ${({ $scrolled, $lightMode }) =>
    (!$lightMode && $scrolled) ? 'blur(14px)' : 'none'};
  color: var(--h-text);
  position: ${({ $isHome }) => $isHome ? 'fixed' : 'sticky'};
  top: 0;
  width: 100%;
  z-index: 1000;
  border-bottom: ${({ $lightMode, $scrolled }) =>
    $lightMode ? 'none' : `1px solid ${T.border}`};
  box-shadow: ${({ $scrolled, $lightMode }) =>
    $lightMode   ? 'none' :
    $scrolled    ? '0 2px 22px rgba(0,0,0,0.75)' :
                   '0 4px 24px rgba(0,0,0,0.45)'};
  transition: background 0.4s ease, box-shadow 0.4s ease, color 0.4s ease;
  overflow: visible;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ $scrolled }) => $scrolled ? '8px 5%' : '12px 5%'};
  position: relative;
  z-index: 2;            /* paints above MobileDrawer (z-index 1) within header context */
  transition: padding 0.3s ease;
`;

const ShopStatus = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: inherit;
`;

const BarberPole = styled.div`
  width: 14px;
  height: 44px;
  border-radius: 7px;
  background: repeating-linear-gradient(
    45deg,
    #ff003c 0,   #ff003c 5px,
    #ffffff 5px, #ffffff 10px,
    #00ccff 10px,#00ccff 15px
  );
  background-size: 14px 60px;
  box-shadow: 0 0 4px rgba(255,0,60,0.5), 0 0 6px rgba(0,204,255,0.3);

  ${({ $isOpen }) => $isOpen && css`
    animation: ${stripeScroll} 2s linear infinite, ${sway} 3s ease-in-out infinite;
    transform-origin: center bottom;
  `}
`;

const StatusLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: ${({ $isOpen }) => $isOpen ? '#4caf50' : '#882222'};
`;

const Brand = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: clamp(2rem, 3vw, 2rem);
  letter-spacing: 3px;
  cursor: pointer;
  color: var(--h-text);
  white-space: nowrap;
  opacity: ${({ $lightMode }) => $lightMode ? 0 : 1};
  pointer-events: ${({ $lightMode }) => $lightMode ? 'none' : 'auto'};
  transition: opacity 0.35s ease, color 0.4s ease;
  &:hover { opacity: 0.6; }
`;

/* Logo mark: visible only when text brand is hidden */
const LogoBrand = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  opacity: ${({ $lightMode }) => $lightMode ? 1 : 0};
  pointer-events: ${({ $lightMode }) => $lightMode ? 'auto' : 'none'};
  transition: opacity 0.35s ease;

  img {
    height: 100px;
    width: 100px;
    display: block;
    margin-top: 5px;
  }

  &:hover { opacity: 0.7; }
`;

const RightIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    gap: 4px;
  }
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--h-text);
  padding: 4px;
  transition: opacity 0.2s, transform 0.2s, color 0.4s;
  &:hover { opacity: 0.6; transform: scale(1.1); }

  @media (max-width: 768px) {
    padding: 2px;
  }
`;

const CartIconBtn = styled(IconBtn)`
  position: relative;
`;

const CartBadge = styled.span`
  position: absolute;
  top: -3px; right: -4px;
  min-width: 16px; height: 16px;
  background: ${T.red}; color: #fff;
  border-radius: 8px;
  font-family: ${T.fontBody}; font-size: 0.6rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
  line-height: 1;
  pointer-events: none;
`;

const Hamburger = styled(IconBtn)`
  @media (min-width: 769px) { display: none; }
`;

const DesktopNav = styled.nav`
  display: flex;
  justify-content: center;
  padding: 0 5% 10px;
  gap: 0;

  @media (max-width: 768px) { display: none; }
`;

const NavItem = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-family: ${T.fontHead};
  font-size: 1rem;
  letter-spacing: 2px;
  color: ${({ $active }) => $active ? 'var(--h-text)' : 'var(--h-text-dim)'};
  padding: 4px 12px;
  position: relative;
  transition: color 0.2s;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 12px;
    right: 12px;
    height: 1.5px;
    background: var(--h-accent);
    transform: scaleX(${({ $active }) => $active ? 1 : 0});
    transform-origin: left;
    transition: transform 0.25s ease;
  }
  &:hover { color: var(--h-text); }
  &:hover::after { transform: scaleX(1); }
`;

const BannerRow = styled.div`
  position: relative;
  z-index: 2;
`;

const BookmarkOuter = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 2.8rem;
  z-index: 999;
  width: 46px;
  transform-origin: top center;

  @media (max-width: 768px) {
    width: 38px;
    right: 1.2rem;
  }
`;

/* Inner: the actual bookmark shape + styling. Height matches the outer's final animated height. */
const BookmarkInner = styled.div`
  width: 100%;
  height: 64px;
  background: #7a1515;
  color: ${T.text};
  font-family: ${T.fontHead};
  font-size: 12px;
  letter-spacing: 1.5px;
  text-align: center;
  padding-top: 10px;
  line-height: 1.3;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 87%, 0 100%);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6);

  @media (max-width: 768px) {
    height: 52px;
    font-size: 10px;
    padding-top: 8px;
  }
`;

const MobileDrawer = styled(motion.nav)`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: fixed;
    inset: 0;
    background: #f4f0e8;
    z-index: 999;          /* portalled to body — just below the header (1000) so its
                               (now-transparent-background) TopRow still paints on top */
    padding: ${({ $headerH }) => $headerH}px 8% 60px;
    overflow-y: auto;
  }
`;

const DrawerItem = styled(motion.button)`
  background: none;
  border: none;
  border-bottom: 1px solid rgba(26, 26, 26, 0.07);
  cursor: pointer;
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(2rem, 7vw, 2.8rem);
  letter-spacing: 5px;
  color: ${({ $active }) => $active ? '#1a1a1a' : 'rgba(26, 26, 26, 0.38)'};
  padding: 14px 0;
  text-align: left;
  width: 100%;
  transition: color 0.18s;

  &:active { color: #C41E3A; }
  &:last-child { border-bottom: none; }
`;
