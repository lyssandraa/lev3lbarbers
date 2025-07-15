import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

const Header = () => {
    const navigate = useNavigate();

    return (
        <StyledHeader>
            <div className="siteTitle" onClick={() => navigate("/")}>LEV3<span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>L</span> BARBERS</div>
        <NavList>
            <li>HOME</li>
            <li>SHOP</li>
            <li>SERVICES</li>
            <li>LOCATION</li>
            <li>CONTACT</li>
        </NavList>
        </StyledHeader>
    )
}

export default Header;

const StyledHeader = styled.header`
font-family: 'Bebas Neue', sans-serif;
    background: #000;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #FFFF;
    letter-spacing: 3px;  
    position: sticky;
    top: 0;

  .siteTitle {
    font-size: 2.5rem;
    cursor: pointer;
    padding: 20px 0 10px 0;
    border-bottom: 1px solid #f2f2f2;
    width: 100%;
  }
`;

const NavList = styled.ul`
    list-style: none;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    gap: 20px;
    width: 90%;
    padding: 15px 100px 10px 100px;
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

    @media (max-width: 768px) {
      &:not(:last-child)::after {
        display: none;
      }
  }
      @keyframes fadeInDivider {
    to {
      transform: translateY(-50%) scaleY(1);
      opacity: 0.6;
    }
`;