import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
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
// import { TagIcon } from '../common/icons';

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
          <OfferGlow />
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
            <OfferTopRow>
              {/* <TagIcon width={13} height={13} /> */}
              <OfferText>Special</OfferText>
            </OfferTopRow>
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
  /* Bottom padding was 0 — the offer button sat flush against the sticky
     Hero's own bottom edge, so barely any scroll was needed before the
     next (black) Availability section started covering it, making it hard
     to see the whole button before it got cut off. */
  padding: 200px 6% 40px;
  overflow: hidden;

  /* Header.jsx tracks its own real rendered height (banner + nav rows) via
     ResizeObserver and exposes it as --site-header-h — using that instead
     of a flat guess is what keeps this correctly clear of the header
     regardless of banner state/breakpoint, instead of the hardcoded 20px
     that was overlapping the header on mobile. */
  @media (max-width: 600px) {
    padding: calc(var(--site-header-h, 160px) + 16px) 6% 30px;
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

/* The glow ("light") used to be an animated `filter: drop-shadow` on the
   SVG itself, on the same keyframes as the scale pulse. filter isn't
   compositor-only — the browser has to repaint it every frame — and on
   this multi-path/gradient SVG that repaint fell behind the buttery-smooth
   transform-based scale, so the glow visibly lagged the pulse instead of
   breathing with it (worse under any other main-thread load, e.g. the
   carousel's own re-renders). Splitting them into two elements fixes that:
   the button only ever animates `transform` (scale), and the glow is a
   separate radial-gradient layer that only ever animates `opacity` +
   `transform` — both compositor-only, no repaint, regardless of how
   complex the SVG on top of it is. Since it's a sibling mounted in the
   exact same render as the button (not a cross-component timing problem),
   sharing one duration/easing keeps the two frame-perfectly locked with no
   extra sync logic needed. */
const pulseScale = keyframes`
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.07); }
`;

const glowPulse = keyframes`
  0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1); }
  50%      { opacity: 0.85; transform: translate(-50%, -50%) scale(1.16); }
`;

/* Sized to the scalloped seal itself, not the full button box — the
   button's own aspect-ratio (200/120) includes the ribbon tails on either
   side, so an `inset` sized off that whole box stretched into a wide oval
   reaching well past the seal. The seal in the SVG's 200x120 viewBox spans
   112 units (44 to 156 horizontally, 4 to 116 vertically) — a true circle
   56% of the box's width and ~93% of its height — so matching those two
   percentages (with a little extra for glow spread) keeps the halo a
   circle sized to just the badge, centered on it via left/top 50% +
   translate rather than `inset` (which can't target an off-center or
   non-matching aspect ratio). */
const OfferGlow = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 64%;
  height: 107%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(196,30,58,0.55) 0%, rgba(196,30,58,0.16) 45%, transparent 72%);
  z-index: 0;
  pointer-events: none;
  animation: ${glowPulse} 2.6s ease-in-out infinite;
`;

const OfferBtn = styled(motion.button)`
  position: relative;
  display: block;
  width: min(190px, 50%);
  aspect-ratio: 200 / 120;
  margin: 10px auto 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  animation: ${pulseScale} 2.6s ease-in-out infinite;

  /* Direct-child combinator, not a bare descendant selector — this must
     only size the top-level ribbon SVG. A bare "svg { ... }" here was
     also matching TagIcon's own nested <svg> deeper inside OfferLabel and
     force-stretching it to 100% of the button, which is why the icon
     rendered huge despite its own explicit width/height props. */
  > svg { display: block; width: 100%; height: 100%; position: relative; z-index: 1; }

  &:hover {
    animation-play-state: paused;
    transform: scale(1.1);
  }
  &:hover ${OfferGlow} {
    animation-play-state: paused;
    opacity: 0.95;
    transform: translate(-50%, -50%) scale(1.3);
  }
`;

/* Centered via top:50%/translateY rather than top+bottom percentages —
   only depends on this element's own (auto, content-driven) height, not
   on the browser resolving a percentage height against the button's
   aspect-ratio-derived box, which is one less thing that can go wrong.
   Content is sized conservatively small on purpose so it can't outgrow
   the circle's inner (valley) radius regardless. */
const OfferLabel = styled.span`
  position: absolute;
  left: 20%;
  right: 20%;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: ${RED};
  /* Needs an explicit value now that the SVG next to it has one (z-index:1,
     added to sit above OfferGlow) — z-index:auto elements sort BELOW any
     sibling with a real z-index regardless of DOM order, so without this
     the seal SVG was painting over the text instead of behind it. */
  z-index: 2;
`;

/* Icon now sits inline with "Special" instead of floating alone above both
   lines — reads as one paired label instead of an orphaned icon on top. */
const OfferTopRow = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

/* font-size scaled down in proportion with the button (300px -> 190px,
   ~0.63x) from the previously-verified 25px, landing at 16px. At that
   size "SPECIAL"/"OFFERS" render at ~69px/~60px (0.62×fontSize per
   character, bold sans-serif estimate), comfortably inside the ~114px
   available width (20%/20% margins on 190px). Weight is 700, not 800 —
   800 has no real font file loaded and silently falls back to a weaker
   synthetic bold. */
const OfferText = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${RED};
  line-height: 1.15;
  white-space: nowrap;
`;
