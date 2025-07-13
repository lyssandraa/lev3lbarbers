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
    background: #000;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px;
    color: white;

  .siteTitle {
    font-size: 2rem;
    font-weight: bold;
    cursor: pointer;
    margin-bottom: 10px;
  }
`;

const NavList = styled.ul`
    list-style: none;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    width: 100%;
    padding: 0;
    margin: 0;

  li {
    flex: 1;
    text-align: center;
    cursor: pointer;
  }
`;