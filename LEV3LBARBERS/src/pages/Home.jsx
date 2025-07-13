import React from "react";
import styled from "styled-components";

import logo from "../assets/logo.jpg";

const Home =() => {
    return (
        <>
        <LogoStyled>
        <img src ={logo} alt="Logo"/>
        </LogoStyled>
        </>
    );
};

export default Home;

const LogoStyled = styled.image`
    display: flex;
    justify-content: center;
`;