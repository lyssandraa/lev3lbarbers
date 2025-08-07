import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import shopOpen from "../common/shopOpen";
import styled, { keyframes, css } from "styled-components";
import { FiX, FiMenu } from "react-icons/fi";
import { FaUser } from "react-icons/fa";


const Header = () => {
  const navigate = useNavigate();
  
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const {isOpen} = shopOpen();
  const navRef = useRef();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAvailabilityClick = () => {
    setMenuOpen(false);
    if (location.pathname === "/") {
      const el = document.getElementById("availability");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/#availability");
    }
  };

  const handleScrollToContactSection = (sectionId) => {
    setMenuOpen(false);
    if (location.pathname === "/contact") {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(`/contact#${sectionId}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
  
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
  
    setIsLoggedIn(Boolean(token));
    setIsAdmin(role === 'ADMIN');
  }, [location.pathname]);  

  

  return (
    <StyledHeader>
      
      <TopRow>
        <ShopStatus>
        <div 
        onClick={() => { 
          setMenuOpen(false); 
          navigate("/contact#hours");
        }}
        style={{ cursor: "pointer" }}>
          <BarberPole $isOpen={isOpen} />
          </div>
        <StatusText $isOpen={isOpen}>{isOpen ? "OPEN" : "CLOSED"}</StatusText>
        </ShopStatus>

        <AnimatedTitle onClick={() => { navigate("/"); setMenuOpen(false); }}>
          LEV<span style={{ color: 'black' }}>3</span>
          <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>L</span> BARBERS
        </AnimatedTitle>


        <RightIcons>
          <UserIconContainer onClick={() => navigate(isLoggedIn ? 'profile' : '/login')}>
            <FaUser size={22} />
          </UserIconContainer>

          <MenuToggle onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
          </MenuToggle>
        </RightIcons>
      </TopRow>

      <NavList $open={menuOpen} ref={navRef}>
        <li onClick={() => { navigate("/"); setMenuOpen(false); }}>HOME</li>
        <li onClick={handleAvailabilityClick}>AVAILABILITY</li>
        <li onClick={() => { navigate("/services"); setMenuOpen(false); }}>SERVICES</li>
        <li onClick={() => { navigate("/shop"); setMenuOpen(false); }}>SHOP</li>
        <li onClick={() => handleScrollToContactSection("location")}>LOCATION</li>
        <li onClick={() => handleScrollToContactSection("info")}>CONTACT INFO</li>
        <li onClick={() => handleScrollToContactSection("hours")}>OPENING HOURS</li>
        {isLoggedIn && isAdmin && (<li onClick={() => { navigate("/admin"); setMenuOpen(false); }}>ADMIN PANEL</li>)}
      </NavList>
    </StyledHeader>
  );
};

export default Header;



const stripesMove = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: 0 60px; }
`;

const sway = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(3deg); }
  50% { transform: rotate(-3deg); }
  75% { transform: rotate(2deg); }
`;

const fadeSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, 15px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
`;

const StyledHeader = styled.header`
  font-family: 'Bebas Neue', sans-serif;
  background: linear-gradient(to bottom, #1f1f1f 70%, #151515 100%);
  color: #d6d6d6;
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 5%;
  position: relative;
`;

const AnimatedTitle = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2rem;
  letter-spacing: 2px;
  cursor: pointer;
  color: #990000;
  animation: ${fadeSlideUp} 0.8s ease-out forwards;
  opacity: 0;
  text-shadow:
    -1px -1px 0 #E6E6ED,
     1px -1px 0 #E6E6ED,
    -1px  1px 0 #E6E6ED,
     1px  1px 0 #E6E6ED;
  transition: color 0.3s ease;

  &:hover {
    color: #1d2b53;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;


const ShopStatus = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fffaf6;
  gap: 6px;
`;

const BarberPole = styled.div`
  width: 16px;
  height: 48px;
  border-radius: 8px;
  background: repeating-linear-gradient(
    45deg,
    #ff003c 0,
    #ff003c 5px,
    #ffffff 5px,
    #ffffff 10px,
    #00ccff 10px,
    #00ccff 15px
  );
  background-size: 16px 60px;

  box-shadow:
    0 0 4px #ff003c,
    0 0 6px #00ccff;

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      animation: ${stripesMove} 2s linear infinite, ${sway} 3s ease-in-out infinite;
      transform-origin: center bottom;
    `}
`;

const StatusText = styled.span`
  font-size: 1.1rem;
  font-weight: bold;
  text-align: center;
  color: ${({ $isOpen }) => ($isOpen ? "#4caf50" : "#990000")};
`;

const MenuToggle = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    cursor: pointer;
    color: #fffaf6;
    transition: transform 0.3s ease, color 0.3s ease;

    &:hover {
      transform: scale(1.1);
      color: #1d2b53;
    }
  }
`;

const NavList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: 20px;
  width: 90%;
  padding: 15px 5% 10px 5%;
  margin: 0;
  font-size: 1rem;
  color: #fffaf6;

  li {
    position: relative;
    flex: 1;
    text-align: center;
    cursor: pointer;
    transition: color 0.3s ease;

    &:hover {
      color: #1d2b53;
    }

    &::after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: -5px;
      width: 0%;
      height: 2px;
      background-color: #3b5998;
      transition: width 0.3s ease, left 0.3s ease;
    }

    &:hover::after {
      width: 50%;
      left: 25%;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    width: 100%;
    background-color: #1a1a1a;
    font-size: 1.2rem;
    gap: 10px;

    position: fixed;
    top: 90px;
    left: 0;
    right: 0;
    max-height: ${({ $open }) => ($open ? "100vh" : "0")};
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    overflow: hidden;
    pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
    z-index: 10000;
    transition: max-height 0.3s ease, opacity 0.3s ease;

    li {
      flex: none;
      width: 100%;
      padding: 12px 0;
      border-bottom: 1px solid #fffaf6;
      color: #fffaf6;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        color: #1d2b53;
      }

      &::after {
        display: none;
      }
    }
  }
`;

const UserIconContainer = styled.div`
  cursor: pointer;
  margin-right: 12px;
  color: #fffaf6;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
    color: #1d2b53;
  }

  @media (max-width: 768px) {
    margin-right: 0;
  }
`;

const RightIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

