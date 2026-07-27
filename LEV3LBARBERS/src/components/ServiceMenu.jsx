import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import styled from 'styled-components';
import api from '../utils/api';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];

/* IntroReveal lasts ~3.9s from page load. performance.now() is ms since
   the document navigation started — it does NOT reset on SPA route changes.
   So on first load this gives us real remaining intro time; on any later
   navigation to /services it is already > 4100 and the delay collapses to 0. */
const introRemaining = () => Math.max(0, 4100 - performance.now());

/* ── Price count-up ── */
const CountUp = ({ target, duration = 900 }) => {
  const [val, setVal] = useState(0);
  const ref    = useRef(null);
  const hasRun = useRef(false);
  const num    = parseFloat(target) || 0;
  const isFloat = num % 1 !== 0;

  useEffect(() => {
    if (!num) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !hasRun.current) {
        hasRun.current = true;
        let step = 0;
        const steps = 48;
        const timer = setInterval(() => {
          step++;
          setVal((num * step) / steps);
          if (step >= steps) clearInterval(timer);
        }, duration / steps);
      }
    }, { threshold: 0.8 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [num, duration]);

  return <span ref={ref}>£{isFloat ? val.toFixed(2) : Math.round(val)}</span>;
};

/* ── Single service card ── */
const ServiceCard = ({ svc, idx, loggedIn, setActiveIdx }) => {
  const wrapRef  = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const numStr   = String(idx + 1).padStart(2, '0');

  /* Scroll reveal — unchanged */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const { top } = el.getBoundingClientRect();
    if (top < window.innerHeight) {
      const t = setTimeout(() => setVisible(true), introRemaining() + idx * 110);
      return () => clearTimeout(t);
    }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Active card tracking for the sidebar counter */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setActiveIdx(idx); },
      { threshold: 0.4, rootMargin: '-15% 0px -15% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [idx, setActiveIdx]);

  /* 3D tilt — raw mouse position → spring → rotate + ghost parallax */
  const rawX    = useMotionValue(0);
  const rawY    = useMotionValue(0);
  const sp      = { stiffness: 300, damping: 28, mass: 0.6 };
  const spX     = useSpring(rawX, sp);
  const spY     = useSpring(rawY, sp);
  const rotateX = useTransform(spY, [-0.5, 0.5], [ 7, -7]);
  const rotateY = useTransform(spX, [-0.5, 0.5], [-7,  7]);
  const ghostX  = useTransform(spX, [-0.5, 0.5], [14, -14]);
  const ghostY  = useTransform(spY, [-0.5, 0.5], [14, -14]);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - r.left) / r.width  - 0.5);
    rawY.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const onMouseLeave = () => { setHovered(false); rawX.set(0); rawY.set(0); };

  return (
    <div ref={wrapRef}>
      <Card
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        initial={{ clipPath: 'inset(100% 0 0 0)', opacity: 0 }}
        animate={
          visible
            ? { clipPath: 'inset(0% 0 0 0)', opacity: 1 }
            : { clipPath: 'inset(100% 0 0 0)', opacity: 0 }
        }
        transition={{ duration: 0.6, ease: EASE }}
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onMouseLeave}
      >
        <AnimatePresence>
          {hovered && (
            <StripeOverlay
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.45, ease: EASE }}
            />
          )}
        </AnimatePresence>

        {/* Ghost number — parallaxes against the tilt */}
        <GhostNum
          style={{ x: ghostX, y: ghostY }}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={visible ? { scale: 1, opacity: 1 } : { scale: 1.5, opacity: 0 }}
          transition={
            visible
              ? { type: 'spring', stiffness: 200, damping: 20, delay: 0.12 }
              : { duration: 0 }
          }
        >
          {numStr}
        </GhostNum>

        <CardContent>
          <NumLabel>{numStr}</NumLabel>
          <CardRule />
          <CardName>{svc.name}</CardName>
          {svc.description && <CardDesc>{svc.description}</CardDesc>}
          <PriceLine>
            {loggedIn && svc.price ? (
              <PriceVal><CountUp target={svc.price} /></PriceVal>
            ) : (
              <PriceLocked>Members only</PriceLocked>
            )}
          </PriceLine>
        </CardContent>
      </Card>
    </div>
  );
};

/* ── Main component ── */
const ServiceMenu = () => {
  const navigate   = useNavigate();
  const [services,  setServices]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loggedIn,  setLoggedIn]  = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [intro,     setIntro]     = useState(
    'Crafted for every man. We cater to all hair types — afro, curly, straight and more. Other services available upon request.'
  );

  useEffect(() => {
    api.get('/shop-info').then(r => {
      if (r.data?.servicesIntro) setIntro(r.data.servicesIntro);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoggedIn(!!token);
    const load = async () => {
      setLoading(true);
      try {
        if (token) {
          try {
            const r = await api.get('/services/all-services');
            setServices(r.data.allServices || []);
            return;
          } catch (err) {
            if (!err.response || (err.response.status !== 401 && err.response.status !== 403)) throw err;
          }
        }
        const r = await api.get('/services/public-services');
        setServices(r.data.services || []);
      } catch { setServices([]); }
      finally   { setLoading(false); }
    };
    load();
  }, []);

  return (
    <PageWrap>
      <PageHeader
        as={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <Eyebrow>The Menu</Eyebrow>
        <PageTitle>Our Services</PageTitle>
        <PageSub>{intro}</PageSub>
      </PageHeader>

      <GridWrap>
        {loading ? (
          <StatusMsg as={motion.p} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Loading services…
          </StatusMsg>
        ) : services.length === 0 ? (
          <StatusMsg as={motion.p} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Service menu coming soon — stay tuned.
          </StatusMsg>
        ) : (
          <Grid>
            {services.map((svc, idx) => (
              <ServiceCard
                key={svc.id}
                svc={svc}
                idx={idx}
                loggedIn={loggedIn}
                setActiveIdx={setActiveIdx}
              />
            ))}
          </Grid>
        )}

        {!loggedIn && !loading && services.length > 0 && (
          <UnlockSection
            as={motion.div}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <UnlockEyebrow>Members only</UnlockEyebrow>
            <UnlockTitle>Unlock Full Pricing</UnlockTitle>
            <UnlockRule />
            <UnlockText>
              Sign up free and see our full price menu — plus access to exclusive
              member deals. Takes less than 60 seconds.
            </UnlockText>
            <UnlockBtns>
              <PrimaryBtn
                whileHover={{ opacity: 0.82 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/register')}
              >
                Join the Club
              </PrimaryBtn>
              <GhostBtn onClick={() => navigate('/login')}>
                Already a member? Sign in
              </GhostBtn>
            </UnlockBtns>
          </UnlockSection>
        )}
      </GridWrap>

      {/* Sticky section counter — hidden on mobile */}
      {!loading && services.length > 0 && (
        <StickyCounter
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
        >
          <CounterCurrent>
            <AnimatePresence mode="wait">
              <motion.span
                key={activeIdx}
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                exit={{ y: '-100%' }}
                transition={{ duration: 0.18, ease: EASE }}
                style={{ display: 'block' }}
              >
                {String(activeIdx + 1).padStart(2, '0')}
              </motion.span>
            </AnimatePresence>
          </CounterCurrent>
          <CounterLine />
          <CounterTotal>{String(services.length).padStart(2, '0')}</CounterTotal>
        </StickyCounter>
      )}
    </PageWrap>
  );
};

export default ServiceMenu;

/* ─────────── Styles ─────────── */

const PageWrap = styled.div`
  background: ${CREAM};
  color: ${INK};
  min-height: 100vh;
  font-family: 'Bebas Neue', sans-serif;
`;

const PageHeader = styled.div`
  padding: 6rem 8% 4.5rem;
  @media (max-width: 768px) { padding: 4rem 6% 3rem; }
`;

const Eyebrow = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgb(26, 26, 26);
  margin: 0 0 0.6rem;
`;

const PageTitle = styled.h1`
  font-size: clamp(3rem, 8vw, 6.5rem);
  letter-spacing: 4px;
  margin: 0 0 1.2rem;
  line-height: 1;
  color: ${INK};
`;

const PageSub = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 15px;
  font-weight: 900;
  color: rgb(26, 26, 26);
  line-height: 1.9;
  max-width: 500px;
  margin: 0;
`;

const GridWrap = styled.div`
  padding: 0 8% 6rem;
  @media (max-width: 768px) { padding: 0 6% 4rem; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.6rem;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const Card = styled(motion.div)`
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(26, 26, 26, 0.1);
  padding: 2.4rem 2rem 2rem;
  cursor: default;
  background: transparent;
  height: 100%;
  will-change: transform;
  transition: border-color 0.25s, box-shadow 0.25s;

  &:hover {
    border-color: rgba(26, 26, 26, 0.22);
    box-shadow: 0 20px 52px rgba(26, 26, 26, 0.12);
  }
`;

const StripeOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: repeating-linear-gradient(
    -48deg,
    ${RED}      0px,
    ${RED}      5px,
    transparent 5px,
    transparent 16px
  );
  opacity: 0.04;
`;

const GhostNum = styled(motion.span)`
  position: absolute;
  top: -0.2em;
  right: 0.05em;
  font-size: 8.5rem;
  font-family: 'Bebas Neue', sans-serif;
  color: rgba(0, 204, 255, 0.14);
  line-height: 1;
  pointer-events: none;
  user-select: none;
`;

const CardContent = styled.div`
  position: relative;
  z-index: 2;
`;

const NumLabel = styled.span`
  font-size: 1.9rem;
  -webkit-text-stroke: 1.5px ${RED};
  color: transparent;
  letter-spacing: 2px;
  line-height: 1;
  display: block;
`;

const CardRule = styled.div`
  width: 32px;
  height: 1.5px;
  background: rgba(26, 26, 26, 0.18);
  margin: 0.85rem 0;
`;

const CardName = styled.h2`
  font-size: clamp(1.3rem, 2.5vw, 1.85rem);
  letter-spacing: 3px;
  margin: 0 0 0.7rem;
  color: ${INK};
  line-height: 1.15;
`;

const CardDesc = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: rgba(26, 26, 26, 0.5);
  line-height: 1.85;
  margin: 0 0 1.2rem;
`;

const PriceLine = styled.div`
  padding-top: 1.1rem;
  border-top: 1px solid rgba(26, 26, 26, 0.1);
`;

const PriceVal = styled.span`
  font-size: 1.5rem;
  letter-spacing: 2px;
  color: ${INK};
`;

const PriceLocked = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.5);
`;

const StatusMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: rgba(26, 26, 26, 0.45);
  font-size: 13px;
  padding: 4rem 0;
`;

const UnlockSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 3.5rem 2rem;
  border: 1px solid rgba(26, 26, 26, 0.1);
  max-width: 480px;
  margin: 3rem auto 0;
`;

const UnlockEyebrow = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: ${RED};
  margin: 0;
`;

const UnlockTitle = styled.h3`
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  letter-spacing: 4px;
  margin: 0;
  color: ${INK};
`;

const UnlockRule = styled.div`
  width: 40px;
  height: 1.5px;
  background: rgba(26, 26, 26, 0.18);
`;

const UnlockText = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  font-weight: 900;
  color: rgb(26, 26, 26);
  line-height: 2;
  max-width: 340px;
  margin: 0;
`;

const UnlockBtns = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const PrimaryBtn = styled(motion.button)`
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: ${RED};
  color: #fff;
  padding: 14px 32px;
  border: none;
  cursor: pointer;
`;

const GhostBtn = styled.button`
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  background: transparent;
  border: none;
  color: rgb(26, 26, 26);
  cursor: pointer;
  border-bottom: 1px solid rgba(26, 26, 26, 0.2);
  padding-bottom: 2px;
  transition: color 0.2s, border-color 0.2s;
  &:hover { color: ${INK}; border-color: ${INK}; }
`;

/* Sticky section counter */
const StickyCounter = styled.div`
  position: fixed;
  left: 1.6rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  z-index: 50;
  pointer-events: none;
  user-select: none;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  letter-spacing: 3px;
  color: rgba(26, 26, 26, 0.28);

  @media (max-width: 960px) { display: none; }
`;

const CounterCurrent = styled.div`
  height: 1.2em;
  overflow: hidden;
  color: ${INK};
  opacity: 0.7;
`;

const CounterLine = styled.div`
  width: 1px;
  height: 22px;
  background: rgba(26, 26, 26, 0.2);
  margin: 5px 0;
`;

const CounterTotal = styled.div``;
