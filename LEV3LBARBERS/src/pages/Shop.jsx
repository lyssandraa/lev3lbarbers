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
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.07) 0px,
      rgba(255,255,255,0.07) 1px,
      transparent 1px,
      transparent 18px
    ),
    linear-gradient(160deg, #0a0a0a 0%, #141414 50%, #0d0d0d 100%);
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
    0 0 8px rgba(212, 169, 104, 0.8),
    0 0 16px rgba(212, 169, 104, 0.5),
    0 0 32px rgba(212, 169, 104, 0.4);

  @media (max-width: 768px) {
    font-size: 3.5rem;
  }
`;
