import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import shopOpen from "../common/shopOpen";
import styled, { keyframes, css } from "styled-components";
import { FiMenu, FiX } from "react-icons/fi";
import 'iconify-icon';

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isOpen = shopOpen();

  return (
    <StyledHeader>
      <TopRow>
        <ShopStatus>
          <ScissorsIcon icon="mdi:scissors-cutting" $isOpen={isOpen} />
          <StatusText $isOpen={isOpen}>{isOpen ? "OPEN" : "CLOSED"}</StatusText>
        </ShopStatus>

        <div className="siteTitle" onClick={() => navigate("/")}>
          LEV3<span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>L</span> BARBERS
        </div>

        <MenuToggle onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
        </MenuToggle>
      </TopRow>

      <NavList $open={menuOpen}>
        <li onClick={() => navigate("/")}>HOME</li>
        <li onClick={() => navigate("/availability")}>Availability</li>
        <li>SERVICES</li>
        <li>SHOP</li>
        <li>LOCATION</li>
        <li>CONTACT</li>
      </NavList>
    </StyledHeader>
  );
};

export default Header;

const wiggle = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(15deg); }
  50% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
`;

const StyledHeader = styled.header`
  font-family: 'Bebas Neue', sans-serif;
  background: #000;
  width: 100%;
  color: #FFFF;
  letter-spacing: 3px;
  position: sticky;
  top: 0;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 5%;
  text-align: center;

  .siteTitle {
    font-size: 2.5rem;
    cursor: pointer;
    flex: 1;
    text-align: center;
  }

  @media (max-width: 768px) {
    padding: 20px 10px;
    .siteTitle {
      font-size: 2rem;
    }
  }
`;

const ShopStatus = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    gap: 6px;
    color: white;
  }
`;

const ScissorsIcon = styled("iconify-icon")`
  font-size: 1.5rem;
  color: ${({ $isOpen }) => ($isOpen ? "#0f0" : "#f00")};

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      animation: ${wiggle} 1.2s ease-in-out infinite;
    `}
`;

const StatusText = styled.span`
  font-size: 1rem;
  color: ${({ $isOpen }) => ($isOpen ? "#0f0" : "#f00")};
`;

const MenuToggle = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    cursor: pointer;
    transition: transform 0.3s ease, color 0.3s ease;

    &:hover {
      transform: scale(1.1) rotate(5deg);
      color: #ccc;
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
  font-size: 22px;

  li {
    position: relative;
    flex: 1;
    text-align: center;
    cursor: pointer;

    &:not(:last-child)::after {
      content: "";
      position: absolute;
      right: -10px;
      top: 50%;
      transform: translateY(-50%) scaleY(0);
      height: 70%;
      width: 2px;
      background-color: white;
      opacity: 0;
      animation: fadeInDivider 0.6s ease forwards;
      animation-delay: 0.3s;
    }
  }

  @keyframes fadeInDivider {
    to {
      transform: translateY(-50%) scaleY(1);
      opacity: 0.6;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    width: 100%;
    background-color: #000;
    padding: 0;
    margin-top: 0;
    font-size: 1.2rem;
    gap: 10px;

    position: fixed;
    top: 60px;
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
      border-bottom: 1px solid #333;

      &:last-child {
        border-bottom: none;
      }
    }

    li::after {
      display: none;
    }
  }
`;
