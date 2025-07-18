import React from "react";
import styled from "styled-components";
import logo from "../assets/logo.png";
import "@fontsource/dancing-script";

const Home = () => {
  return (
    <HomeStyled>
      <LogoStyled src={logo} alt="Logo" />
      <SloganContainer>
        <Slogan>
          <span>Take Your Style </span>
          <EmphasizedLine>
            to the Next <Lev3l>LEV3<span style={{ display: 'inline-block', transform: 'scaleX(-1)'}}>L</span></Lev3l>
          </EmphasizedLine>
        </Slogan>
      </SloganContainer>
    </HomeStyled>
  );
};

export default Home;

const HomeStyled = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  gap: 2rem;
  background-color: #f2f2f2;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    text-align: center;
    gap: 0rem;
  }
`;

const LogoStyled = styled.img`
  width: 300px;
  height: auto;
  border-radius: 20px;

  @media (max-width: 768px) {
    width: 60%;
  }
`;

const SloganContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 0;
  pointer-events: none;
`;


const Slogan = styled.h2`
  font-family: 'Dancing Script', cursive;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1.1;
  text-align: center;
  color: #1a1a1a;

  opacity: 0;
  animation: slideIn 1.5s ease-out forwards;
  animation-delay: 0.3s;

  pointer-events: none;

  span {
    display: block;
  }

  @media (max-width: 768px) {
  margin: 0;
  padding-bottom: 15px;
    span {
      display: inline;
    }
  }

  @keyframes slideIn {
    0% {
      opacity: 0;
      transform: translateX(-100px) scale(0.95);
    }
    60% {
      opacity: 1;
      transform: translateX(10px) scale(1.05);
    }
    100% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }
`;


const EmphasizedLine = styled.span`
  margin-top: 0.3rem;
  @media (max-width: 768px) {
    margin-top: 0.1rem; 
  }
`;

const Lev3l = styled.span`
  font-size: 3rem;
  letter-spacing: 2px;
  font-weight: bold;
  font-family: 'Bebas Neue', sans-serif;
`;
