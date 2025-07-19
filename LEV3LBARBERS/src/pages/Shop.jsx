import React from "react";
import styled, { keyframes } from "styled-components";
import "@fontsource/dancing-script";

const Shop = () => {
  return (
    <ShopWrapper>
      <Title>Exciting Things Coming Soon!</Title>
    </ShopWrapper>
  );
};

export default Shop;

const fadeSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ShopWrapper = styled.div`
  height: 90vh;
  background: linear-gradient(160deg, #0a0a0a, #1a0000, #000);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const Title = styled.h1`
  font-family: "Dancing Script", cursive;
  font-size: 4rem;
  text-align: center;
  color: #fff;
  animation: ${fadeSlideUp} 1.2s ease-out forwards;
  text-shadow:
    0 0 8px rgba(255, 0, 0, 0.8),
    0 0 16px rgba(255, 0, 0, 0.5),
    0 0 32px rgba(255, 0, 0, 0.4);

  @media (max-width: 768px) {
    font-size: 3.5rem;
  }
`;
