import React from "react";
import styled, { keyframes, css } from "styled-components";
import defaultIcon from "../assets/loading.png";

const MessagePopup = ({
  show,
  message = "WELCOME BACK!",
  icon = defaultIcon,
  type = "login", 
}) => {
  if (!show) return null;

  return (
    <Overlay>
      <Popup $type={type}>
        <Heading>{message}</Heading>
        <AnimatedIcon src={icon} alt="Popup Icon" $type={type} />
      </Popup>
    </Overlay>
  );
};

export default MessagePopup;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const popupIn = keyframes`
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const popupOut = keyframes`
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.6); opacity: 0; }
`;

const shake = keyframes`
  0% { transform: rotate(0deg); }
  20% { transform: rotate(-5deg); }
  40% { transform: rotate(5deg); }
  60% { transform: rotate(-5deg); }
  80% { transform: rotate(5deg); }
  100% { transform: rotate(0deg); }
`;

const slideDownFade = keyframes`
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(40px); }
`;

const Popup = styled.div`
  background: transparent;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  animation: ${popupIn} 0.5s ease-out;

  ${({ $type }) =>
    $type === "logout" &&
    css`
      animation: ${popupOut} 2s ease-in forwards;
    `}
`;

const Heading = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1rem;
  letter-spacing: 2px;
`;

const AnimatedIcon = styled.img`
  width: 220px;
  height: auto;
  margin-top: 1rem;

  ${({ $type }) =>
    $type === "login"
      ? css`
          animation: ${shake} 0.6s ease-in-out infinite;
          animation-delay: 0.5s;
        `
      : css`
          animation: ${slideDownFade} 3s ease-in forwards;
        `}
`;
