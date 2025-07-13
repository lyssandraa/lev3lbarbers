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

  .siteTitle {
    font-size: 2.5rem;
    cursor: pointer;
    padding: 20px 0 10px 0;
    border-bottom: 1px solid white;
    width: 100%;
  }
`;

const NavList = styled.ul`
    list-style: none;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    width: 90%;
    padding: 10px 100px 10px 100px;
    margin: 0;
    font-size: 22px;

  li {
    flex: 1;
    text-align: center;
    cursor: pointer;
  }
`;