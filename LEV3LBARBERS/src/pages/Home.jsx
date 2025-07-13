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
          <span>Take Your Style</span>
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
  }
`;

const LogoStyled = styled.img`
  width: 500px;
  height: auto;
  border-radius: 20px;

  @media (max-width: 768px) {
    width: 80%;
  }
`;

const SloganContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

// const Slogan = styled.h2`
// font-family: 'Dancing Script', 'Brush Script MT', cursive;
//   font-size: 3.5rem;
//   font-weight: bold;
//   letter-spacing: 2px;
//   line-height: 1.1;
//   text-align: center;
//   color: #1a1a1a;
// 
//   animation: fadeInUp 1.2s ease-out ;
// 
//   span {
    // display: block;
//   }
// 
//   @keyframes fadeInUp {
    // from {
    //   opacity: 0;
    //   transform: translateY(50px);
    // }
    // to {
    //   opacity: 1;
    //   transform: translateY(0);
    // }
//   }
// `;

const Slogan = styled.h2`
  font-family: 'Dancing Script', cursive;
  font-size: 3.5rem;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1.1;
  text-align: center;
  color: #1a1a1a;

  opacity: 0;
  animation: slideIn 1.5s ease-out forwards;
  animation-delay: 0.3s;

  span {
    display: block;
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
`;

const Lev3l = styled.span`
  font-size: 4rem;
  letter-spacing: 2px;
  font-weight: bold;
  font-family: 'Bebas Neue', sans-serif;
`;
