import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import logo from "../assets/logoWhite.png";
import "@fontsource/dancing-script";

const Home = () => {
  const [showBookmark, setShowBookmark] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowBookmark(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <HomeStyled>
      {/* Gold LED strips */}
      <GoldStrip $height="92%" style={{ left: '7%' }}   $delay="0s" />
      <GoldStrip $height="68%" style={{ left: '27%' }}  $delay="0.8s" />
      <GoldStrip $height="46%" style={{ right: '13%' }} $delay="1.6s" />

      {showBookmark && (
        <BookmarkWrapper>
          <FloatingBookmark>EST <br />2023</FloatingBookmark>
        </BookmarkWrapper>
      )}

        <LogoStyled src={logo} alt="Logo" />
        <SloganContainer>
          <Slogan>
            Take Your Style to The Next <Lev3l>LEV3L</Lev3l>
          </Slogan>
        </SloganContainer>
    </HomeStyled>
  );
};

export default Home;


const revealAndHide = keyframes`
  0%   { clip-path: inset(0 0 100% 0); opacity: 1; }
  20%  { clip-path: inset(0 0 0% 0);   opacity: 1; }
  80%  { clip-path: inset(0 0 0% 0);   opacity: 1; }
  100% { clip-path: inset(0 0 100% 0); opacity: 0; }
`;

const HomeStyled = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 2rem 4rem;
  gap: 1rem;
  min-height: calc(100vh - 90px);
  background: repeating-linear-gradient(
    to right,
    #000000 0px,
    #000000 4px,
    #d0d4d8 5px,
    #969a9e 10px,
    #d0d4d8 20px,
    #b8bcbf 22px,
    #000000 24px,
    #000000 29px
  );
  color: #f5f2ed;
  overflow: hidden;
  text-align: center;
`;

/* ── Gold LED strips ───────────────────────────────────────── */

const ledBreath = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.88; }
`;

const GoldStrip = styled.div`
  position: absolute;
  top: 0;
  width: 4px;
  height: ${({ $height }) => $height || '85%'};
  z-index: 1;
  pointer-events: none;

  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #fff5b0 3%,
    #ffd700 12%,
    #ffd700 100%
  );

  box-shadow:
    0 0   4px #ffffff,
    0 0  12px #ffffff,
    0 0  28px #ffd700,
    0 0  45px rgba(255,210,0,0.9),
    0 0  80px rgba(255,185,0,0.7),
    0 0 100px rgba(255,155,0,0.45),
    0 0 150px rgba(255,120,0,0.25);

  filter: brightness(1.4);

  animation: ${ledBreath} 4s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay || '0s'};
`;

/* ── Bookmark ──────────────────────────────────────────────── */

const BookmarkWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 2.5rem;
  width: 60px;
  height: 70px;
  animation: ${revealAndHide} 5s ease-in-out forwards;
  overflow: hidden;
  z-index: 100;

  @media (max-width: 768px) {
    width: 30px;
    height: 45px;
    right: 1.5rem;
  }
`;

const FloatingBookmark = styled.div`
  width: 100%;
  height: 100%;
  background-color: #990000;
  color: #fffaf6;
  font-size: 13px;
  font-weight: bold;
  font-family: 'Bebas Neue', sans-serif;
  text-align: center;
  padding-top: 6px;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%);
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);

  @media (max-width: 768px) {
    font-size: 12px;
    padding-top: 4px;
  }
`;

/* ── Content ───────────────────────────────────────────────── */


const LogoStyled = styled.img`
  position: relative;
  z-index: 2;
  width: 260px;
  height: auto;
  background: #000;
  border-radius: 15px;
  padding: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.9);

  @media (max-width: 768px) {
    width: 60%;
  }
`;

const SloganContainer = styled.div`
  position: relative;
  z-index: 2;
  pointer-events: none;
  width: 100%;
`;

const Slogan = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 5rem;
  font-weight: 900;
  line-height: 1.3;
  letter-spacing: 5px;
  text-align: center;
  color: #f5f2ed;

  opacity: 0;
  animation: slideIn 1.5s ease-out forwards;
  animation-delay: 0.3s;
  pointer-events: none;

  span {
    display: block;
  }

  @media (max-width: 768px) {
    font-size: 2.5rem;
    letter-spacing: 3px;
  }

  @keyframes slideIn {
    0%   { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0);    }
  }
`;


const Lev3l = styled.span`
  font-size: 3rem;
  letter-spacing: 6px;
  font-family: 'Bebas Neue', sans-serif;
  color: #C8A860;
  text-shadow: 0 0 16px rgba(200,168,96,0.6);

`;
