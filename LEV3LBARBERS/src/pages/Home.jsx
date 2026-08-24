import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Seo from '../common/Seo';
import heroImg from '../assets/heroShop.jpeg';
import api from '../utils/api';
import { resolveImageUrl } from '../config';

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

        <WhatsOnLink
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.55, ease: EASE }}
          onClick={() => navigate('/whats-on?filter=PROMOTION')}
        >
          Fresh Drops <span>→</span>
        </WhatsOnLink>
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
  flex: 0 0 min(580px, 78vw);
  width: min(580px, 78vw);
  height: clamp(280px, 46vh, 520px);
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

const WhatsOnLink = styled(motion.button)`
  display: block;
  margin: 14px auto 0;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${RED};
  transition: opacity 0.2s;

  span { display: inline-block; transition: transform 0.2s; }
  &:hover { opacity: 0.75; }
  &:hover span { transform: translateX(3px); }
`;
