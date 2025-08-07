import React from "react";
import styled, { keyframes } from "styled-components";

const Banner = ({ text = "Sign Up to Receive a Mystery Box Now!" }) => {
  return (
    <BannerWrapper>
      <TextWrapper>
        <SlidingText>{text}</SlidingText>
      </TextWrapper>
    </BannerWrapper>
  );
};

export default Banner;

const slideAndPause = keyframes`
  0% {
    transform: translateX(-100%);
  }
  40% {
    transform: translateX(50%);
  }
  60% {
    transform: translateX(50%);
  }
  100% {
    transform: translateX(100%);
  }
`;

const BannerWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 20px;
  width: 100%;
  background: black;
  z-index: 9999;
  overflow: hidden;
`;

const TextWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const SlidingText = styled.div`
  white-space: nowrap;
  position: absolute;
  top: 0;
  left: 0;
  color: #fffaf6;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  padding-left: 10px;
  animation: ${slideAndPause} 10s linear infinite;
`;
