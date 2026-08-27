import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
// Site-wide Montserrat import (Header.jsx) only loads weight 400 — every
// font-weight:600+ elsewhere on the site has actually been rendering as a
// synthetic/faux bold this whole time (no real bold file to use), which
// reads noticeably weaker/thinner than true bold. Loading 700 here for a
// properly bold face instead of another synthetic approximation.
import '@fontsource/montserrat/700.css';
import Seo from '../common/Seo';
import heroImg from '../assets/heroShop.jpeg';
import api from '../utils/api';
import { resolveImageUrl } from '../config';
import { TagIcon } from '../common/icons';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];

const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

const Home = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();

  const [heroImages, setHeroImages] = useState([]);
  const [slideIdx,   setSlideIdx]   = useState(0);
  const [direction,  setDirection]  = useState(1);

  useEffect(() => {
    api.get('/hero-slideshow/public')
      .then(r => {
        const images = r.data.images || [];
        setHeroImages(images);
        const defaultIdx = images.findIndex(img => img.isDefault);
        if (defaultIdx > 0) setSlideIdx(defaultIdx);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const t = setInterval(() => {
      setDirection(1);
      setSlideIdx(i => (i + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(t);
  }, [heroImages.length]);

  const prev = () => {
    if (heroImages.length <= 1) return;
    setDirection(-1);
    setSlideIdx(i => (i - 1 + heroImages.length) % heroImages.length);
  };
  const next = () => {
    if (heroImages.length <= 1) return;
    setDirection(1);
    setSlideIdx(i => (i + 1) % heroImages.length);
  };

  const n = heroImages.length;
  const getSrc = (idx) => n > 0 ? resolveImageUrl(heroImages[idx].imageUrl) : heroImg;
  const currentSrc = n > 0 ? getSrc(slideIdx)               : heroImg;
  const prevSrc    = n > 1 ? getSrc((slideIdx - 1 + n) % n) : null;
  const nextSrc    = n > 1 ? getSrc((slideIdx + 1) % n)     : null;

  const scrollToAvailability = () =>
    document.getElementById('availability')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <PageWrap>
      <Seo description="LEV3L Barbers — precision cuts, clean fades, sharp style. Southport, UK." />

      <Progress style={{ scaleX: scrollYProgress }} />

      <Hero>
        <TagRow>
          {['precision', 'craft', 'style'].map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.55, ease: EASE }}
            >
              {word}
            </motion.span>
          ))}
        </TagRow>

        <CarouselOuter
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
        >
          {prevSrc && (
            <GhostSlot $side="left">
              <GhostImg src={prevSrc} $side="left" alt="" />
              <GhostFade $side="left" />
            </GhostSlot>
          )}

          <MainFrame>
            <AnimatePresence initial={false} custom={direction} mode="sync">
              <SlideImg
                key={slideIdx}
                src={currentSrc}
                alt="LEV3L Barbers"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: EASE }}
              />
            </AnimatePresence>

            {n > 1 && (
              <>
                <SlideBtn $side="left"  onClick={prev} aria-label="Previous">&#8249;</SlideBtn>
                <SlideBtn $side="right" onClick={next} aria-label="Next">&#8250;</SlideBtn>
              </>
            )}
          </MainFrame>

          {nextSrc && (
            <GhostSlot $side="right">
              <GhostImg src={nextSrc} $side="right" alt="" />
              <GhostFade $side="right" />
            </GhostSlot>
          )}
        </CarouselOuter>

        <BtnRow
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.88, duration: 0.55, ease: EASE }}
        >
          <PrimaryBtn onClick={scrollToAvailability}>Who's In Today</PrimaryBtn>
          <GhostBtn onClick={() => navigate('/services')}>Our Services</GhostBtn>
        </BtnRow>

        <OfferBtn
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.55, ease: EASE }}
          onClick={() => navigate('/whats-on?filter=PROMOTION')}
          aria-label="Special Offers"
        >
          {/* Ribbon stays as before. Circle is now a scalloped seal shape
              (20-bump path, generated from exact trig coordinates rather
              than hand-drawn) for the textured-edge look, in place of the
              plain smooth circle. */}
          <svg width="100%" height="100%" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="offerRibbonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e14f68" />
                <stop offset="55%" stopColor={RED} />
                <stop offset="100%" stopColor="#8f1626" />
              </linearGradient>
            </defs>
            <path d="M0,44 L56,44 L56,76 L0,76 L14,60 Z" fill="url(#offerRibbonGradient)" />
            <path d="M144,44 L200,44 L186,60 L200,76 L144,76 Z" fill="url(#offerRibbonGradient)" />
            <path
              d="M100.0,4.0 L107.8,10.6 L117.3,6.7 L122.7,15.4 L132.9,14.7 L135.4,24.6 L145.3,27.1 L144.6,37.3 L153.3,42.7 L149.4,52.2 L156.0,60.0 L149.4,67.8 L153.3,77.3 L144.6,82.7 L145.3,92.9 L135.4,95.4 L132.9,105.3 L122.7,104.6 L117.3,113.3 L107.8,109.4 L100.0,116.0 L92.2,109.4 L82.7,113.3 L77.3,104.6 L67.1,105.3 L64.6,95.4 L54.7,92.9 L55.4,82.7 L46.7,77.3 L50.6,67.8 L44.0,60.0 L50.6,52.2 L46.7,42.7 L55.4,37.3 L54.7,27.1 L64.6,24.6 L67.1,14.7 L77.3,15.4 L82.7,6.7 L92.2,10.6 Z"
              fill={CREAM}
              stroke={RED}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
          <OfferLabel>
            <TagIcon width={14} height={14} />
            <OfferText>Special</OfferText>
            <OfferText>Offers</OfferText>
          </OfferLabel>
        </OfferBtn>
      </Hero>
    </PageWrap>
  );
};

export default Home;

/* ─────────── styles ─────────── */

const PageWrap = styled.div`
  background: ${CREAM};
  color: ${INK};
  min-height: 220vh;
  position: relative;
  z-index: 16;
`;

const Progress = styled(motion.div)`
  position: fixed;
  bottom: 0; left: 0;
  height: 2px;
  width: 100%;
  background: ${RED};
  transform-origin: left;
  z-index: 200;
`;

const Hero = styled.section`
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 18;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  padding: 200px 6% 0;
  overflow: hidden;

  @media (max-width: 600px) {
    padding: 20px 6% 0;
    gap: 12px;
  }
`;

const TagRow = styled.div`
  display: flex;
  gap: 50px;
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.65);

  @media (max-width: 600px) {
    padding-bottom: 10px;
  }
`;

const CarouselOuter = styled(motion.div)`
  display: flex;
  align-items: stretch;
  overflow: hidden;
`;

const GhostSlot = styled.div`
  flex: 0 0 min(70px, 5vw);
  width: min(70px, 5vw);
  overflow: hidden;
  position: relative;
`;

const GhostImg = styled.img`
  position: absolute;
  top: 0;
  ${({ $side }) => $side === 'left' ? 'right: 0;' : 'left: 0;'}
  height: 100%;
  width: min(580px, 78vw);
  object-fit: cover;
  object-position: center;
  opacity: 0.45;
  border-radius: ${({ $side }) => $side === 'left' ? '14px 0 0 14px' : '0 14px 14px 0'};
`;

const GhostFade = styled.div`
  position: absolute;
  inset: 0;
  background: ${({ $side }) =>
    $side === 'left'
      ? `linear-gradient(to right, ${CREAM} 0%, rgba(244,240,232,0) 100%)`
      : `linear-gradient(to left,  ${CREAM} 0%, rgba(244,240,232,0) 100%)`
  };
  z-index: 1;
`;

const MainFrame = styled.div`
  /* min(580px, 78vw) capped out at exactly 580px for every screen wider than
     ~744px — tablets, laptops, and ultra-wide monitors all rendered the
     identical, tiny hero. clamp() scales it properly across the full range
     instead of flatlining past one specific width. */
  flex: 0 0 clamp(260px, 78vw, 900px);
  width: clamp(260px, 78vw, 900px);
  height: clamp(280px, 46vh, 600px);
  overflow: hidden;
  border-radius: 14px;
  box-shadow: 0 10px 50px rgba(26, 26, 26, 0.18);
  position: relative;

  @media (max-width: 600px) {
    height: clamp(260px, 48vh, 400px);
  }
`;

const SlideImg = styled(motion.img)`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
`;

const SlideBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $side }) => $side}: 10px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(26,26,26,0.48);
  color: #f4f0e8;
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 3;
  transition: background 0.2s;
  &:hover { background: rgba(26,26,26,0.82); }
`;

const BtnRow = styled(motion.div)`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 600px) {
    padding-top: 20px;
  }
`;

const PrimaryBtn = styled.button`
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: ${RED};
  color: #fff;
  padding: 14px 30px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.82; }
`;

const GhostBtn = styled.button`
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: transparent;
  border: 1px solid rgba(26, 26, 26, 0.35);
  color: ${INK};
  padding: 14px 30px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  &:hover { background: rgba(26,26,26,0.06); border-color: ${INK}; }
`;

/* The ribbon+circle SVG IS the button — sized so the circle is the
   dominant element (big enough for icon + two lines of text), with the
   ribbon showing only as tails either side of it. */
const OfferBtn = styled(motion.button)`
  position: relative;
  display: block;
  width: min(300px, 75%);
  aspect-ratio: 200 / 120;
  margin: 18px auto 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  filter: drop-shadow(0 6px 14px rgba(26, 26, 26, 0.28));
  transition: transform 0.15s ease;

  /* Direct-child combinator, not a bare descendant selector — this must
     only size the top-level ribbon SVG. A bare "svg { ... }" here was
     also matching TagIcon's own nested <svg> deeper inside OfferLabel and
     force-stretching it to 100% of the button, which is why the icon
     rendered huge despite its own explicit width/height props. */
  > svg { display: block; width: 100%; height: 100%; }
  &:hover { transform: scale(1.03); }
`;

/* Centered via top:50%/translateY rather than top+bottom percentages —
   only depends on this element's own (auto, content-driven) height, not
   on the browser resolving a percentage height against the button's
   aspect-ratio-derived box, which is one less thing that can go wrong.
   Content is sized conservatively small on purpose so it can't outgrow
   the circle's inner (valley) radius regardless. */
const OfferLabel = styled.span`
  position: absolute;
  left: 25%;
  right: 25%;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  color: ${RED};
`;

const OfferText = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${RED};
  line-height: 1.15;
  white-space: nowrap;
`;
