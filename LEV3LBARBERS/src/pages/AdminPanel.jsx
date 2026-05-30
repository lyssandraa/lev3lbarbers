import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiMenu } from 'react-icons/fi';
import background from '../assets/adminImg.png';

import ShopSettings from '../components/ShopSettings';
import AdminRewards from '../components/AdminRewards';
import AdminStamps from '../components/AdminStamps';
import VerifyClaim from '../components/VerifyClaim';
import AdminServices from '../components/AdminServices';
import AdminBanners from '../components/AdminBanners';

const AdminPanel = ({ refreshShopStatus }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('shop');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role  = localStorage.getItem('role');
    if (!token || role !== 'ADMIN') navigate('/login');
  }, [navigate]);

  return (
    <PanelWrapper>
      {/* Burger Menu */}
      <BurgerButton onClick={() => setMenuOpen(prev => !prev)}>
        <FiMenu />
      </BurgerButton>

      <Overlay $open={menuOpen} onClick={() => setMenuOpen(false)} />

      <SideMenuOverlay $open={menuOpen}>
        <MenuItem $active={activeTab==='shop'} onClick={() => { setActiveTab('shop'); setMenuOpen(false); }}>Shop Settings</MenuItem>
        <MenuItem $active={activeTab==='rewardPool'} onClick={() => { setActiveTab('rewardPool'); setMenuOpen(false); }}>Reward Pool</MenuItem>
        <MenuItem $active={activeTab==='stamps'} onClick={() => { setActiveTab('stamps'); setMenuOpen(false); }}>Stamp Manager</MenuItem>
        <MenuItem $active={activeTab==='verify'} onClick={() => { setActiveTab('verify'); setMenuOpen(false); }}>Verify Claim</MenuItem>
        <MenuItem $active={activeTab==='services'} onClick={() => { setActiveTab('services'); setMenuOpen(false); }}>Service Portal</MenuItem>
        <MenuItem $active={activeTab==='banners'} onClick={() => { setActiveTab('banners'); setMenuOpen(false); }}>Banner Manager</MenuItem>
      </SideMenuOverlay>

      <Content>
        {activeTab==='shop' && <ShopSettings refreshShopStatus={refreshShopStatus} />}
        {activeTab==='rewardPool' && <AdminRewards />}
        {activeTab==='stamps' && <AdminStamps />}
        {activeTab==='verify' && <VerifyClaim />}
        {activeTab==='services' && <AdminServices />}
        {activeTab==='banners' && <AdminBanners />}
      </Content>
    </PanelWrapper>
  );
};

export default AdminPanel;

/** Styled Components **/
const PanelWrapper = styled.div`
  display:flex;
  justify-content:center;
  align-items:center;
  min-height:100vh;
  padding: 0 2.5rem 2rem 2.5rem;
  background-image:url(${background});
  background-size:cover;
  background-position:center;
  color:#f2f2f2;
  font-family:"Segoe UI",sans-serif;
  position:relative;
`;

const BurgerButton = styled.div`
  position:fixed;
  top:7rem;
  left:1rem;
  z-index:1001;
  font-size:2rem;
  cursor:pointer;
  color:#fff;
`;

const SideMenuOverlay = styled.div`
  position:fixed;
  top: 7rem;
  left:0;
  height:100vh;
  width:250px;
  background: rgba(0,0,0,0.9);
  padding:2rem 1rem;
  display:flex;
  flex-direction:column;
  transform:${({ $open }) => $open ? 'translateX(0)' : 'translateX(-260px)'};
  transition:transform 0.3s ease;
  z-index:1000;
`;

const Overlay = styled.div`
  display:${({ $open }) => $open ? 'block' : 'none'};
  position:fixed;
  top:7rem;
  left:0;
  width:100vw;
  height:100vh;
  background: rgba(0,0,0,0.4);
  z-index:999;
`;

const MenuItem = styled.div`
  padding:1rem;
  cursor:pointer;
  background:${({ $active }) => $active ? '#c8b88a' : 'rgba(255,255,255,0.08)'};
  color:${({ $active }) => $active ? '#000' : '#f5f2ed'};
  font-weight:${({ $active }) => $active ? '700' : '400'};
  margin-bottom:0.5rem;
  border-radius:8px;
  transition: background 0.2s;

  &:hover {
    background:${({ $active }) => $active ? '#b2a072' : 'rgba(255,255,255,0.14)'};
  }
`;

const Content = styled.div`
  max-width:800px;
  width:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
`;
