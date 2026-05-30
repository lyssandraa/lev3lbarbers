import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import api from "../utils/api";

const Banner = ({onFinish}) => {
  const [messages, setMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(12); 
  const navigate = useNavigate();
  const bannerRef = useRef(null);

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

  // cycle messages
  useEffect(() => {
    if (!messages.length) return;
  
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, duration * 1000); 
  
    return () => clearInterval(interval);
  }, [messages, duration]);

  // const interval = setInterval(() => {
  //   setCurrentIndex((prev) => {
  //     const next = (prev + 1) % messages.length;
  //     if (onFinish) onFinish(messages[prev]); // pass message to vertical
  //     return next;
  //   });
//   // }, duration * 1000);

//   return () => clearInterval(interval);
// }, [messages, duration, onFinish]);

  useEffect(() => {
    if (messages.length > 0) setReady(true);
  }, [messages]);

  if (!messages.length) return null;

  const currentMessage = messages[currentIndex];

  return (
    <BannerWrapper>
      {ready && (
        <BannerItem
          key={currentIndex}
          ref={bannerRef}
          duration={duration}
          onClick={() =>
            currentMessage.page && navigate(`/${currentMessage.page}`)
          }
          style={{ cursor: currentMessage.page ? "pointer" : "default" }}
        >
          {currentMessage.imageUrl && (
            <Logo
              src={currentMessage.imageUrl}
              alt="banner logo"
            />
          )}
          {currentMessage.message}
        </BannerItem>
      )}
    </BannerWrapper>
  );
};

export default Banner;

// --- styles ---
const slide = keyframes`
  0%   { transform: translateX(-100%); }              
  30%  { transform: translateX(calc(50vw - 50%)); }   
  60%  { transform: translateX(calc(50vw - 50%)); }   
  100% { transform: translateX(calc(100vw + 100%));} 
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
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 1.1rem;
  white-space: nowrap;
  position: absolute;
  left: 0;
  will-change: transform;

  ${({ duration }) => css`
    animation: ${slide} ${duration}s linear infinite;
  `}
`;

const Logo = styled.img`
  height: 24px;
  margin-right: 10px;
  vertical-align: middle;
`;