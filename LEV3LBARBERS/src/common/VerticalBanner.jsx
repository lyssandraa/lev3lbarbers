// Banner.js
import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import api from "../utils/api";

const Banner = ({ onFinish, duration = 8 }) => {
  const [messages, setMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await api.get("/banners/public");
      setMessages(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // When animation finishes, notify parent
  useEffect(() => {
    if (!messages.length) return;

    const timer = setTimeout(() => {
      if (onFinish) onFinish(messages[currentIndex]);
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [messages, currentIndex, duration, onFinish]);

  if (!messages.length) return null;

  const currentMessage = messages[currentIndex];

  return (
    <BannerWrapper>
      <BannerItem duration={duration}>{currentMessage.message}</BannerItem>
    </BannerWrapper>
  );
};

export default Banner;

// --- styles ---
const slide = keyframes`
  0%   { transform: translateX(-100%); }
  30%  { transform: translateX(calc(50vw - 50%)); }
  60%  { transform: translateX(calc(50vw - 50%)); }
  100% { transform: translateX(100%); }
`;

const BannerWrapper = styled.div`
  width: 100%;
  height: 40px;
  overflow: hidden;
  background: #000;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const BannerItem = styled.div`
  display: inline-block;
  font-weight: bold;
  font-size: 1.1rem;
  white-space: nowrap;
  position: absolute;
  left: 0;
  will-change: transform;

  ${({ duration }) => css`
    animation: ${slide} ${duration}s linear forwards;
  `}
`;
