import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { MenuIcon, GridIcon, ScanIcon, GiftIcon, CalendarIcon, LayersIcon, GearIcon, UsersIcon, StoreIcon } from '../common/icons';

import ShopSettings     from '../components/ShopSettings';
import AdminRewards     from '../components/AdminRewards';
import AdminStamps      from '../components/AdminStamps';
import VerifyClaim      from '../components/VerifyClaim';
import AdminServices    from '../components/AdminServices';
import AdminBanners     from '../components/AdminBanners';
import AdminGallery     from '../components/AdminGallery';
import AdminShop        from '../components/AdminShop';
import AdminReferrals   from '../components/AdminReferrals';
import AdminBirthday    from '../components/AdminBirthday';
import AdminExpiry      from '../components/AdminExpiry';
import AdminTerms       from '../components/AdminTerms';
import AdminLegalDocument   from '../components/AdminLegalDocument';
import AdminUsers           from '../components/AdminUsers';
import AdminBarbers         from '../components/AdminBarbers';
import AdminLoyaltySettings  from '../components/AdminLoyaltySettings';
import AdminCreateAccounts   from '../components/AdminCreateAccounts';
import AdminWhatsOn          from '../components/AdminWhatsOn';
import AdminOrders           from '../components/AdminOrders';
import AdminGiftCards        from '../components/AdminGiftCards';
import AdminPromos           from '../components/AdminPromos';
import AdminBookings        from '../components/AdminBookings';
import AdminDashboard       from '../components/AdminDashboard';
import AdminHeroSlideshow   from '../components/AdminHeroSlideshow';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];

// ─── Menu structure ───────────────────────────────────────────────────────────
// minRole: minimum role required to see this group / item
const MENU = [
  {
    group: 'Overview',
    minRole: 'ADMIN',
    Icon: GridIcon,
    items: [
      { id: 'dashboard', label: 'Dashboard', minRole: 'ADMIN' },
    ],
  },
  {
    group: 'Operations',
    minRole: 'STAFF',
    Icon: ScanIcon,
    items: [
      { id: 'stamps',   label: 'Stamp Manager', minRole: 'STAFF' },
      { id: 'verify',   label: 'Verify Claim',  minRole: 'STAFF' },
    ],
  },
  {
    group: 'Rewards',
    minRole: 'ADMIN',
    Icon: GiftIcon,
    items: [
      { id: 'rewardPool', label: 'Reward Pool',      minRole: 'ADMIN' },
      { id: 'referrals',  label: 'Referral System',  minRole: 'ADMIN' },
      { id: 'birthday',   label: 'Birthday Rewards', minRole: 'ADMIN' },
    ],
  },
  {
    group: 'Customers',
    minRole: 'ADMIN',
    Icon: UsersIcon,
    items: [
      { id: 'customers', label: 'Customer Accounts', minRole: 'ADMIN' },
    ],
  },
  {
    group: 'Barbers',
    minRole: 'ADMIN',
    Icon: StoreIcon,
    items: [
      { id: 'barbers', label: 'Barbers', minRole: 'ADMIN' },
    ],
  },
  {
    group: 'Bookings',
    minRole: 'ADMIN',
    Icon: CalendarIcon,
    items: [
      { id: 'bookings', label: 'Booking System', minRole: 'ADMIN' },
    ],
  },
  {
    group: 'Content',
    minRole: 'ADMIN',
    Icon: LayersIcon,
    items: [
      { id: 'services',       label: 'Service Portal',   minRole: 'ADMIN' },
      { id: 'banners',        label: 'Banner Manager',   minRole: 'ADMIN' },
      { id: 'heroSlideshow',  label: 'Hero Slideshow',   minRole: 'ADMIN' },
      { id: 'gallery',        label: 'Gallery',          minRole: 'ADMIN' },
      { id: 'shopProducts', label: 'Shop Products',   minRole: 'ADMIN' },
      { id: 'whatsOn',      label: "What's On",       minRole: 'ADMIN' },
      { id: 'orders',       label: 'Orders',           minRole: 'ADMIN' },
      { id: 'giftCards',    label: 'Gift Cards',       minRole: 'ADMIN' },
      { id: 'promos',       label: 'Promo Codes',      minRole: 'ADMIN' },
    ],
  },
  {
    group: 'Settings',
    minRole: 'ADMIN',
    Icon: GearIcon,
    items: [
      { id: 'shop',          label: 'Shop Settings',    minRole: 'ADMIN' },
      { id: 'loyalty',       label: 'Loyalty Settings', minRole: 'ADMIN' },
      { id: 'expiry',        label: 'Reward Expiry',    minRole: 'ADMIN' },
      { id: 'terms',         label: 'Reward T&C',       minRole: 'ADMIN' },
      { id: 'generalTerms',  label: 'Terms & Conditions', minRole: 'ADMIN' },
      { id: 'privacyNotice', label: 'Privacy Notice',   minRole: 'ADMIN' },
      { id: 'createStaff',   label: 'Create Staff',     minRole: 'ADMIN' },
      { id: 'createAdmin',   label: 'Create Admin',     minRole: 'DEVELOPER' },
    ],
  },
];

// Shared with Header.jsx's mobile nav drawer — only one full-screen nav
// overlay should be open at a time.
const NAV_OPEN_EVENT = 'lev3l:nav-open';

const ROLE_LEVELS = { USER: 1, STAFF: 2, ADMIN: 3, DEVELOPER: 4 };

function canSee(userRole, minRole) {
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[minRole] || 0);
}

function findGroupForTab(id) {
  return MENU.find(g => g.items.some(i => i.id === id))?.group;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AdminPanel = ({ refreshShopStatus }) => {
  const navigate = useNavigate();
  const { isLoggedIn, role, isShopUser, logout } = useAuth();
  const isAdminRole = canSee(role, 'ADMIN');
  const [activeTab, setActiveTab] = useState(isAdminRole ? 'dashboard' : 'stamps');
  const [menuOpen, setMenuOpen]   = useState(false);
  const [openGroups, setOpenGroups] = useState(() => new Set(isAdminRole ? ['Overview'] : ['Operations']));

  useEffect(() => {
    if (!isLoggedIn || !isShopUser) navigate('/login');
  }, [isLoggedIn, isShopUser, navigate]);

  useEffect(() => {
    if (menuOpen) window.dispatchEvent(new CustomEvent(NAV_OPEN_EVENT, { detail: 'admin' }));
  }, [menuOpen]);

  useEffect(() => {
    const onOtherNavOpen = (e) => { if (e.detail !== 'admin') setMenuOpen(false); };
    window.addEventListener(NAV_OPEN_EVENT, onOtherNavOpen);
    return () => window.removeEventListener(NAV_OPEN_EVENT, onOtherNavOpen);
  }, []);

  const selectTab = (id) => {
    setActiveTab(id);
    setMenuOpen(false);
    const g = findGroupForTab(id);
    if (g) setOpenGroups(new Set([g]));
  };

  /* Accordion: opening a group closes whichever one was open before it */
  const toggleGroup = (group) => {
    setOpenGroups(prev => (prev.has(group) ? new Set() : new Set([group])));
  };

  return (
    <PanelWrapper>
      <BurgerButton onClick={() => setMenuOpen(p => !p)} aria-label="Toggle menu">
        {menuOpen ? '✕' : <MenuIcon width={22} height={22} />}
      </BurgerButton>
      <Overlay $open={menuOpen} onClick={() => setMenuOpen(false)} />

      <SideMenu $open={menuOpen}>
        {MENU.map(({ group, minRole, items, Icon }) => {
          if (!canSee(role, minRole)) return null;
          const visible = items.filter(i => canSee(role, i.minRole));
          if (!visible.length) return null;
          const isOpen = openGroups.has(group);
          return (
            <MenuGroup key={group}>
              <GroupHead onClick={() => toggleGroup(group)}>
                <GroupIconWrap><Icon width={14} height={14} /></GroupIconWrap>
                <GroupLabel>{group}</GroupLabel>
                <Chevron $open={isOpen}>›</Chevron>
              </GroupHead>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <GroupItems
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    {visible.map(item => (
                      <MenuItem
                        key={item.id}
                        $active={activeTab === item.id}
                        onClick={() => selectTab(item.id)}
                      >
                        {item.label}
                      </MenuItem>
                    ))}
                  </GroupItems>
                )}
              </AnimatePresence>
            </MenuGroup>
          );
        })}
        <SwitchBarberBtn onClick={logout}>Switch Barber</SwitchBarberBtn>
      </SideMenu>

      <Content>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ width: '100%' }}
          >
            {activeTab === 'dashboard'    && <AdminDashboard onNavigate={selectTab} />}
            {activeTab === 'stamps'       && <AdminStamps />}
            {activeTab === 'verify'       && <VerifyClaim />}
            {activeTab === 'rewardPool'   && <AdminRewards />}
            {activeTab === 'referrals'    && <AdminReferrals />}
            {activeTab === 'birthday'     && <AdminBirthday />}
            {activeTab === 'services'     && <AdminServices />}
            {activeTab === 'banners'       && <AdminBanners />}
            {activeTab === 'heroSlideshow' && <AdminHeroSlideshow />}
            {activeTab === 'gallery'       && <AdminGallery />}
            {activeTab === 'shopProducts' && <AdminShop />}
            {activeTab === 'whatsOn'      && <AdminWhatsOn />}
            {activeTab === 'orders'       && <AdminOrders />}
            {activeTab === 'giftCards'    && <AdminGiftCards />}
            {activeTab === 'promos'       && <AdminPromos />}
            {activeTab === 'bookings'     && <AdminBookings />}
            {activeTab === 'customers'    && <AdminUsers />}
            {activeTab === 'barbers'      && <AdminBarbers />}
            {activeTab === 'shop'         && <ShopSettings refreshShopStatus={refreshShopStatus} />}
            {activeTab === 'loyalty'      && <AdminLoyaltySettings />}
            {activeTab === 'expiry'       && <AdminExpiry />}
            {activeTab === 'terms'        && <AdminTerms />}
            {activeTab === 'generalTerms' && (
              <AdminLegalDocument
                title="Terms & Conditions"
                endpoint="/general-terms"
                dataKey="terms"
                infoText='Shown in the footer as "Terms & Conditions", visible to all visitors.'
                placeholder="e.g. These Terms & Conditions govern your use of the LEV3L Barbers website…"
              />
            )}
            {activeTab === 'privacyNotice' && (
              <AdminLegalDocument
                title="Privacy Notice"
                endpoint="/privacy-notice"
                dataKey="notice"
                infoText='Shown in the footer as "Privacy", visible to all visitors.'
                placeholder="e.g. LEV3L Barbers respects your privacy. This notice explains what personal data we collect…"
              />
            )}
            {(activeTab === 'createStaff' || activeTab === 'createAdmin') && (
              <AdminCreateAccounts view={activeTab} />
            )}
          </motion.div>
        </AnimatePresence>
      </Content>
    </PanelWrapper>
  );
};

export default AdminPanel;

/* ─────────── Styles ─────────── */

const PanelWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  padding: 7rem 2.5rem 3rem;
  background: ${CREAM};
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  position: relative;
`;

const BurgerButton = styled.button`
  position: fixed;
  top: calc(var(--site-header-h, 140px) + 8px);
  left: 0.5rem;
  z-index: 1001;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${CREAM};
  border: 1px solid rgba(26,26,26,0.15);
  border-radius: 50%;
  cursor: pointer;
  color: ${INK};
  font-size: 1rem;
  transition: border-color 0.2s, top 0.3s ease;
  &:hover { border-color: rgba(26,26,26,0.35); }

  /* Sidebar is forced open at this width (see SideMenu) — toggle button has nothing to do */
  @media (min-width: 901px) {
    display: none;
  }
`;

const SideMenu = styled.div`
  position: fixed;
  top: var(--site-header-h, 140px);
  left: 0;
  bottom: 0;
  width: 250px;
  background: ${CREAM};
  border-right: 1px solid rgba(26,26,26,0.1);
  padding: 3rem 0.8rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  overflow-y: auto;
  transform: ${({ $open }) => $open ? 'translateX(0)' : 'translateX(-260px)'};
  transition: transform 0.28s ease, top 0.3s ease;
  z-index: 1000;

  @media (min-width: 901px) {
    transform: translateX(0);
  }
`;

const Overlay = styled.div`
  display: ${({ $open }) => $open ? 'block' : 'none'};
  position: fixed;
  inset: 0;
  background: rgba(10,10,10,0.4);
  z-index: 999;

  @media (min-width: 901px) { display: none; }
`;

const MenuGroup = styled.div`
  margin-bottom: 0.3rem;
`;

const GroupHead = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.55rem 0.6rem;
  text-align: left;
`;

const GroupIconWrap = styled.span`
  display: flex;
  color: ${RED};
  flex-shrink: 0;
`;

const GroupLabel = styled.span`
  flex: 1;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(26,26,26,0.55);
`;

const Chevron = styled.span`
  font-size: 1rem;
  color: rgba(26,26,26,0.35);
  transform: rotate(${({ $open }) => $open ? '90deg' : '0deg'});
  transition: transform 0.2s ease;
`;

const GroupItems = styled(motion.div)`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const SwitchBarberBtn = styled.button`
  margin-top: auto;
  width: 100%;
  padding: 0.7rem 0.6rem;
  background: transparent;
  border: 1px solid rgba(26,26,26,0.15);
  color: rgba(26,26,26,0.6);
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.7rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  &:hover { border-color: ${RED}; color: ${RED}; }
`;

const MenuItem = styled.div`
  padding: 0.6rem 0.9rem 0.6rem 2.2rem;
  cursor: pointer;
  font-size: 0.86rem;
  background: ${({ $active }) => $active ? 'rgba(196,30,58,0.08)' : 'transparent'};
  color: ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.65)'};
  font-weight: ${({ $active }) => $active ? '700' : '400'};
  border-left: 2px solid ${({ $active }) => $active ? RED : 'transparent'};
  transition: background 0.18s, color 0.18s;
  &:hover { background: rgba(26,26,26,0.04); color: ${INK}; }
`;

const Content = styled.div`
  max-width: 800px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (min-width: 901px) {
    margin-left: 250px;
  }
`;
