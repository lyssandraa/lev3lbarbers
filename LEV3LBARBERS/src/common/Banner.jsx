import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import api from "../utils/api";

const DURATION = 12;

const Banner = ({ lightMode = false }) => {
  const [messages, setMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ready, setReady] = useState(false);
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
    }, DURATION * 1000);

    return () => clearInterval(interval);
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) setReady(true);
  }, [messages]);

  if (!messages.length) return null;

  const currentMessage = messages[currentIndex];

  return (
    <BannerWrapper $lightMode={lightMode}>
      {ready && (
        <BannerItem
          key={currentIndex}
          ref={bannerRef}
          $duration={DURATION}
          $lightMode={lightMode}
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
// Centering must be based on the wrapper's own width (a % of its containing
// block), not vw — vw is measured against the full viewport including any
// scrollbar gutter, while a %-width wrapper is not, so on a device that
// shows a layout scrollbar (e.g. iPad landscape) the two diverge and the
// "centered" position lands slightly off. `left: 50%` + `translateX(-50%)`
// centers using only the wrapper's own box, so it stays exact regardless.
// The off-screen start/end points just need to clear the viewport, so an
// approximate vw distance there is fine — only the centered point needs to
// be precise.
const slide = keyframes`
  0%   { transform: translateX(calc(-50% - 100vw)); }
  30%  { transform: translateX(-50%); }
  60%  { transform: translateX(-50%); }
  100% { transform: translateX(calc(-50% + 100vw)); }
`;

const BannerWrapper = styled.div`
  width: 100%;
  height: 44px;
  overflow: hidden;
  background: ${({ $lightMode }) => $lightMode ? '#f4f0e8' : '#C41E3A'};
  color: ${({ $lightMode }) => $lightMode ? '#1a1a1a' : '#fff'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.4s ease, color 0.4s ease;
`;

const BannerItem = styled.div`
  display: flex;
  align-items: center;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  white-space: nowrap;
  color: ${({ $lightMode }) => $lightMode ? '#1a1a1a' : '#fff'};
  position: absolute;
  left: 50%;
  will-change: transform;
  transition: color 0.4s ease;

  ${({ $duration }) => css`
    animation: ${slide} ${$duration}s linear infinite;
  `}
`;

const Logo = styled.img`
  height: 24px;
  margin-right: 10px;
  vertical-align: middle;
`;