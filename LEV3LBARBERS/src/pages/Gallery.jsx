import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Seo from '../common/Seo';
import api from '../utils/api';
import { resolveImageUrl } from '../config';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];

/* Same intro-aware timing used on Services — avoids cards finishing their
   reveal animation invisibly behind the IntroReveal overlay on first load. */
const introRemaining = () => Math.max(0, 4100 - performance.now());

/* Warms the browser cache so stepping to a neighbouring image is instant. */
const preloadImage = (url) => { const img = new Image(); img.src = url; };

/* ── Scroll reveal + "development" filter, per gallery item card ── */
const usePhotoReveal = (idx) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { top } = el.getBoundingClientRect();
    if (top < window.innerHeight) {
      const t = setTimeout(() => setVisible(true), introRemaining() + idx * 80);
      return () => clearTimeout(t);
    }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [ref, visible];
};

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null); // { item, index }

  useEffect(() => {
    api.get('/gallery/photos')
      .then(res => setItems(res.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Keyboard nav while lightbox is open */
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = () => setLightbox(p => p && {
    ...p, index: (p.index + 1) % p.item.images.length,
  });
  const goPrev = () => setLightbox(p => p && {
    ...p, index: (p.index - 1 + p.item.images.length) % p.item.images.length,
  });

  /* Preload the neighbouring angles so next/prev (click, key, or swipe) is instant */
  useEffect(() => {
    if (!lightbox) return;
    const { item, index } = lightbox;
    const total = item.images.length;
    if (total < 2) return;
    [(index + 1) % total, (index - 1 + total) % total].forEach(i => {
      preloadImage(resolveImageUrl(item.images[i].imageUrl));
    });
  }, [lightbox]);

  const handleDragEnd = (_e, info) => {
    if (info.offset.x < -60 || info.velocity.x < -500) goNext();
    else if (info.offset.x > 60 || info.velocity.x > 500) goPrev();
  };

  const stripPhotos = items.slice(0, 6).map(it => it.images[0]).filter(Boolean);

  return (
    <Page>
      <Seo title="Gallery" description="Browse our gallery of cuts, fades, and styles at LEV3L Barbers." />

      <Hero>
        {stripPhotos.length >= 3 ? (
          <FilmStripLayer>
            <FilmStripTrack
              as={motion.div}
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
            >
              {[...stripPhotos, ...stripPhotos].map((img, i) => (
                <FilmFrame key={i}>
                  <img src={resolveImageUrl(img.imageUrl)} alt="" />
                </FilmFrame>
              ))}
            </FilmStripTrack>
          </FilmStripLayer>
        ) : stripPhotos.length > 0 ? (
          <StaticBgLayer>
            {stripPhotos.map((img, i) => (
              <StaticBgFrame key={i}>
                <img src={resolveImageUrl(img.imageUrl)} alt="" />
              </StaticBgFrame>
            ))}
          </StaticBgLayer>
        ) : null}
        <HeroFade />

        <HeroContent
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <Eyebrow>The Work</Eyebrow>
          <Title>Gallery</Title>
          <Divider />
          <Sub>Every cut tells a story.</Sub>
        </HeroContent>
      </Hero>

      {loading ? (
        <LoadingRow>
          {[0, 1, 2].map(i => (
            <SkeletonCard key={i} style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </LoadingRow>
      ) : items.length === 0 ? (
        <Empty
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <EmptyIcon>✂</EmptyIcon>
          <EmptyTitle>Nothing here yet.</EmptyTitle>
          <EmptyText>Check back soon — the portfolio is coming.</EmptyText>
        </Empty>
      ) : (
        <Grid>
          {items.map((item, i) => (
            <PhotoCard
              key={item.id}
              item={item}
              idx={i}
              onOpen={(activeIndex) => setLightbox({ item, index: activeIndex })}
            />
          ))}
        </Grid>
      )}

      <AnimatePresence>
        {lightbox && (
          <LightboxBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <LightboxInner
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
            >
              <LightboxImgWrap>
                <DragLayer
                  drag={lightbox.item.images.length > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.8}
                  onDragEnd={handleDragEnd}
                  style={{ touchAction: 'pan-y' }}
                >
                  <AnimatePresence initial={false}>
                    <LightboxImg
                      key={lightbox.item.images[lightbox.index].id}
                      layoutId={`photo-${lightbox.item.images[lightbox.index].id}`}
                      src={resolveImageUrl(lightbox.item.images[lightbox.index].imageUrl)}
                      alt={lightbox.item.title}
                      draggable={false}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                    />
                  </AnimatePresence>
                </DragLayer>

                {lightbox.item.images.length > 1 && (
                  <>
                    <CarouselArrow $side="left" onClick={goPrev} aria-label="Previous angle">‹</CarouselArrow>
                    <CarouselArrow $side="right" onClick={goNext} aria-label="Next angle">›</CarouselArrow>
                    <Dots>
                      {lightbox.item.images.map((_, i) => (
                        <Dot key={i} $active={i === lightbox.index} />
                      ))}
                    </Dots>
                  </>
                )}
              </LightboxImgWrap>

              <LightboxCaption>
                <LightboxTitle>{lightbox.item.title}</LightboxTitle>
                {lightbox.item.description && <LightboxDesc>{lightbox.item.description}</LightboxDesc>}
              </LightboxCaption>
              <CloseBtn onClick={() => setLightbox(null)}>✕</CloseBtn>
            </LightboxInner>
          </LightboxBackdrop>
        )}
      </AnimatePresence>
    </Page>
  );
};

/* ── Single gallery card — can browse its own angles before opening the lightbox ── */
const PhotoCard = ({ item, idx, onOpen }) => {
  const [ref, visible] = usePhotoReveal(idx);
  const [active, setActive] = useState(0);
  const tilt  = idx % 2 === 0 ? 3.5 : -3.5;
  const total = item.images.length;
  const cover = item.images[active];
  if (!cover) return null;

  const prev = (e) => { e.stopPropagation(); setActive(a => (a - 1 + total) % total); };
  const next = (e) => { e.stopPropagation(); setActive(a => (a + 1) % total); };

  /* Preload neighbouring angles so card-level browsing never shows a flash */
  useEffect(() => {
    if (total < 2) return;
    [(active + 1) % total, (active - 1 + total) % total].forEach(i => {
      preloadImage(resolveImageUrl(item.images[i].imageUrl));
    });
  }, [active, total, item.images]);

  return (
    <div ref={ref}>
      <Card
        initial={{ opacity: 0, y: 26 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
        transition={{ duration: 0.5, ease: EASE }}
        whileHover={{ rotate: tilt, y: -6, transition: { type: 'spring', stiffness: 260, damping: 18 } }}
        onClick={() => onOpen(active)}
      >
        <ImgWrap>
          <AnimatePresence initial={false}>
            <DevImg
              key={cover.id}
              layoutId={`photo-${cover.id}`}
              src={resolveImageUrl(cover.imageUrl)}
              alt={item.title}
              initial={{ opacity: 0, filter: 'brightness(2.2) saturate(0)' }}
              animate={{ opacity: 1, filter: visible ? 'brightness(1) saturate(1)' : 'brightness(2.2) saturate(0)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: visible ? 0.6 : 0, ease: EASE }}
            />
          </AnimatePresence>

          {total > 1 && (
            <>
              <CountBadge>{active + 1} / {total}</CountBadge>
              <CardArrow className="card-arrow" $side="left" onClick={prev} aria-label="Previous angle">‹</CardArrow>
              <CardArrow className="card-arrow" $side="right" onClick={next} aria-label="Next angle">›</CardArrow>
            </>
          )}

          <Overlay className="overlay">
            <OverlayIcon>⊕</OverlayIcon>
          </Overlay>
        </ImgWrap>
        <CardBody>
          <CardTitle>{item.title}</CardTitle>
          {item.description && <CardDesc>{item.description}</CardDesc>}
        </CardBody>
      </Card>
    </div>
  );
};

export default Gallery;

/* ─── Layout ─── */

const Page = styled.main`
  min-height: 100vh;
  background: ${CREAM};
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  padding-bottom: 6rem;
`;

const Hero = styled.div`
  position: relative;
  overflow: hidden;
  height: clamp(280px, 38vh, 380px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FilmStripLayer = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  filter: blur(1.5px) grayscale(0.3) brightness(0.95);
  opacity: 0.5;
`;

const FilmStripTrack = styled.div`
  display: flex;
  height: 100%;
  width: max-content;
  gap: 6px;
`;

const FilmFrame = styled.div`
  flex: 0 0 auto;
  height: 100%;
  width: 220px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  @media (max-width: 600px) { width: 150px; }
`;

const StaticBgLayer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  overflow: hidden;
  filter: blur(1.5px) grayscale(0.3) brightness(0.95);
  opacity: 0.5;
`;

const StaticBgFrame = styled.div`
  flex: 1;
  height: 100%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const HeroFade = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, ${CREAM} 0%, rgba(244,240,232,0.88) 45%, rgba(244,240,232,0.62) 100%);
`;

const HeroContent = styled(motion.div)`
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 0 5%;
`;

const Eyebrow = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: ${RED};
  margin: 0 0 0.5rem;
`;

const Title = styled.h1`
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(3.5rem, 8vw, 6rem);
  letter-spacing: 5px;
  margin: 0;
  color: ${INK};
  line-height: 1;
`;

const Divider = styled.div`
  width: 48px;
  height: 2px;
  background: ${RED};
  margin: 1.2rem auto 1rem;
`;

const Sub = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(26, 26, 26, 0.55);
  letter-spacing: 1px;
  margin: 0;
`;

/* ─── Grid ─── */

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 3.5rem 5% 0;
  max-width: 1300px;
  margin: 0 auto;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    padding: 2.5rem 4% 0;
  }
`;

const Card = styled(motion.div)`
  background: transparent;
  overflow: hidden;
  border: 1px solid rgba(26, 26, 26, 0.1);
  cursor: pointer;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    border-color: rgba(26, 26, 26, 0.25);
    box-shadow: 0 16px 40px rgba(26, 26, 26, 0.16);
  }

  &:hover .overlay,
  &:hover .card-arrow {
    opacity: 1;
  }
`;

const ImgWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  overflow: hidden;
`;

const DevImg = styled(motion.img)`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const CountBadge = styled.span`
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  z-index: 2;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.8rem;
  letter-spacing: 1px;
  color: ${CREAM};
  background: rgba(26, 26, 26, 0.6);
  padding: 3px 9px;
  border-radius: 999px;
  pointer-events: none;
`;

const CardArrow = styled.button`
  position: absolute;
  top: 50%;
  ${({ $side }) => $side}: 0.5rem;
  transform: translateY(-50%);
  z-index: 2;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(26, 26, 26, 0.55);
  color: ${CREAM};
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;

  &:hover { background: rgba(26, 26, 26, 0.8); }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(26, 26, 26, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
`;

const OverlayIcon = styled.span`
  font-size: 2rem;
  color: ${CREAM};
  opacity: 0.9;
`;

const CardBody = styled.div`
  padding: 0.9rem 1.1rem 1rem;
`;

const CardTitle = styled.h3`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2rem;
  letter-spacing: 2px;
  margin: 0 0 0.25rem;
  color: ${INK};
`;

const CardDesc = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  color: rgba(26, 26, 26, 0.5);
  margin: 0;
  line-height: 1.5;
`;

/* ─── Empty state ─── */

const Empty = styled(motion.div)`
  text-align: center;
  padding: 6rem 5%;
`;

const EmptyIcon = styled.div`
  font-size: 3.5rem;
  margin-bottom: 1.2rem;
  opacity: 0.2;
`;

const EmptyTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2rem;
  letter-spacing: 3px;
  color: rgba(26, 26, 26, 0.5);
  margin: 0 0 0.5rem;
`;

const EmptyText = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: rgba(26, 26, 26, 0.35);
  font-size: 0.9rem;
  letter-spacing: 1px;
`;

/* ─── Skeleton ─── */

const LoadingRow = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 3.5rem 5% 0;
  max-width: 1300px;
  margin: 0 auto;
  overflow: hidden;
`;

const SkeletonCard = styled.div`
  flex: 1;
  min-width: 0;
  aspect-ratio: 4 / 5;
  background: linear-gradient(90deg, rgba(26,26,26,0.06) 25%, rgba(26,26,26,0.1) 50%, rgba(26,26,26,0.06) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;

  @keyframes shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }

  @media (max-width: 600px) {
    &:not(:first-child) { display: none; }
  }
`;

/* ─── Lightbox ─── */

const LightboxBackdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, 0.85);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const LightboxInner = styled(motion.div)`
  position: relative;
  max-width: 640px;
  width: 100%;
  background: ${CREAM};
  overflow: hidden;
  border: 1px solid rgba(26, 26, 26, 0.1);
`;

const LightboxImgWrap = styled.div`
  position: relative;
  background: #000;
  height: min(70vh, 520px);
`;

const DragLayer = styled(motion.div)`
  position: absolute;
  inset: 0;
  cursor: grab;
  &:active { cursor: grabbing; }
`;

const LightboxImg = styled(motion.img)`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #000;
`;

const CarouselArrow = styled.button`
  position: absolute;
  top: 50%;
  ${({ $side }) => $side}: 0.6rem;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(26, 26, 26, 0.55);
  color: ${CREAM};
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  &:hover { background: rgba(26, 26, 26, 0.8); }
`;

const Dots = styled.div`
  position: absolute;
  bottom: 0.7rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $active }) => $active ? CREAM : 'rgba(244,240,232,0.4)'};
  transition: background 0.2s;
`;

const LightboxCaption = styled.div`
  padding: 1rem 1.25rem 1.2rem;
`;

const LightboxTitle = styled.h3`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.4rem;
  letter-spacing: 2px;
  margin: 0 0 0.3rem;
  color: ${INK};
`;

const LightboxDesc = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  color: rgba(26, 26, 26, 0.55);
  margin: 0;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(26, 26, 26, 0.6);
  border: none;
  color: ${CREAM};
  font-size: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 3;

  &:hover { background: rgba(26, 26, 26, 0.85); }
`;
