import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import barberChair from '../assets/barberChair.webp';
import shopOpen from '../common/shopOpen';
import { getPulsePhaseOffset } from '../utils/pulseSync';

const DARK  = '#0c0c0c';
const CREAM = '#EAE0CA';
const RED   = '#C41E3A';

const WAIT_LEVELS = [
  { id: 1, label: 'Ready for You',   desc: 'Walk right in',    color: '#22c55e', bars: 1 },
  { id: 2, label: 'Short Wait',      desc: 'Grab a seat',      color: '#f59e0b', bars: 2 },
  { id: 3, label: 'Worth the Wait',  desc: 'We\'re pretty busy', color: '#ef4444', bars: 3 },
];

const getWaitLevel = (w) => (w <= 10 ? 1 : w <= 25 ? 2 : 3);

const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13 } },
};
const itemV = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const ChairCard = ({ name, active, pulseDelay = 0 }) => {
  // `active` starts false (shopOpen()'s initial state) and flips true only
  // once the status fetch resolves — the SpotlightGlow div doesn't exist in
  // the DOM, and its CSS animation doesn't actually start, until that
  // moment. Computing the phase once at ChairCard's own mount (before
  // `active` flips) bakes in a stale timestamp from before the animation
  // began, throwing the sync off by however long the fetch took. Keying
  // this off `active` instead recomputes it exactly when the glow is about
  // to appear — and won't recompute again on the 10s poll re-renders that
  // follow, since `active`'s boolean value doesn't change on those. See
  // pulseSync.js for why the recompute is always safe/correct regardless
  // of the exact real time it happens at.
  // `active` is intentionally a trigger-only dependency: the callback body
  // doesn't read it, but its transition is what should cause the recompute.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const phase = useMemo(() => getPulsePhaseOffset(), [active]);
  return (
    <Chair as={motion.div} variants={itemV} $active={active}>
      <ChairImgWrap $active={active}>
        {active && (
          <SpotlightGlow style={{ animationDelay: `${phase + pulseDelay}s` }} />
        )}
        <img src={barberChair} alt="barber chair" />
      </ChairImgWrap>
      <ChairName $active={active}>
        {name || ''}
      </ChairName>
    </Chair>
  );
};

const Availability = () => {
  const { isOpen, barbers, waitTime } = shopOpen();
  const chairs = [barbers[0] || '', barbers[1] || '', barbers[2] || ''];
  const level  = isOpen ? getWaitLevel(waitTime) : 0;
  const current = WAIT_LEVELS.find(l => l.id === level);

  return (
    <Section id="availability">
      <Inner>
        <HeaderBlock
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionTitle>Who's In Today</SectionTitle>
          <TitleRule />
        </HeaderBlock>

        <Panels>
          {/* ── Barber chairs — triangle formation ── */}
          <Panel>
            <PanelLabel>Available Barbers</PanelLabel>

            <TriangleWrap>
              <TopRow
                as={motion.div}
                variants={containerV}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                {[0, 1].map(i => (
                  <ChairCard
                    key={i}
                    name={isOpen ? chairs[i] : 'Closed'}
                    active={isOpen && !!chairs[i]}
                    pulseDelay={i * 0.6}
                  />
                ))}
              </TopRow>
              <BottomRow
                as={motion.div}
                variants={containerV}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                <ChairCard
                  name={isOpen ? chairs[2] : 'Closed'}
                  active={isOpen && !!chairs[2]}
                  pulseDelay={1.2}
                />
              </BottomRow>
            </TriangleWrap>
          </Panel>

          <Divider />

          {/* ── Wait level ── */}
          <Panel>
            <PanelLabel>Waiting Level</PanelLabel>

            {!isOpen ? (
              <ClosedMsg
                as={motion.div}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                We're closed right now.
                <ClosedSub>Check back during opening hours.</ClosedSub>
              </ClosedMsg>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <BarTrack>
                  <BarFill
                    $level={level}
                    initial={{ width: '0%' }}
                    whileInView={{ width: level === 1 ? '33.33%' : level === 2 ? '66.66%' : '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                  />
                </BarTrack>
                <BarScale>
                  <BarScaleTick>Low</BarScaleTick>
                  <BarScaleTick>Medium</BarScaleTick>
                  <BarScaleTick>High</BarScaleTick>
                </BarScale>

                <CurrentStatus>
                  <StatusText $color={current?.color}>{current?.label}</StatusText>
                  <StatusDesc>{current?.desc}</StatusDesc>
                </CurrentStatus>
              </motion.div>
            )}
          </Panel>
        </Panels>
      </Inner>
    </Section>
  );
};

export default Availability;

/* ─────────── Styles ─────────── */

const Section = styled.section`
  background: ${DARK};
  color: ${CREAM};
  padding: 5.5rem 0 6rem;
  margin-top: -100vh;
  position: relative;
  z-index: 20;
  border-radius: 28px 28px 0 0;
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 6%;
`;

const HeaderBlock = styled(motion.div)`
  margin-bottom: 4rem;
`;

const SectionTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(56px, 8vw, 110px);
  letter-spacing: -1px;
  line-height: 0.9;
  margin: 0;
  color: ${CREAM};
`;

const TitleRule = styled.div`
  width: 48px;
  height: 2px;
  background: ${RED};
  margin: 1rem 0 0;
`;

const Panels = styled.div`
  display: flex;
  align-items: flex-start;
  @media (max-width: 768px) { flex-direction: column; }
`;

const Panel = styled.div`
  flex: 1;
  @media (max-width: 768px) { padding: 0 0 3.5rem; width: 100%; }
`;

const Divider = styled.div`
  width: 1px;
  align-self: stretch;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent);
  margin: 0 5%;
  @media (max-width: 768px) {
    width: 100%; height: 1px;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent);
    margin: 0 0 3.5rem;
  }
`;

const PanelLabel = styled.h3`
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(1.5rem, 2vw, 1.4rem);
  letter-spacing: 3px;
  color: rgba(234, 224, 202, 0.5);
  margin: 0 0 2rem;
`;

/* ── Chairs ── */

const TriangleWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const TopRow = styled.div`
  display: flex;
  gap: 4rem;
  @media (max-width: 600px) { gap: 2.5rem; }
  @media (max-width: 400px) { gap: 1.5rem; }
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: center;
`;

const Chair = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  opacity: ${({ $active }) => $active ? 1 : 0.22};
  transition: opacity 0.3s;
`;

const ChairImgWrap = styled.div`
  position: relative;
  width: 210px;

  img {
    width: 100%;
    height: auto;
    display: block;
    position: relative;
    z-index: 1;
    filter: ${({ $active }) => $active
      ? 'drop-shadow(0 0 20px rgba(196,146,42,0.35))'
      : 'grayscale(1) brightness(0.25)'};
    transition: filter 0.4s;
  }

  @media (max-width: 768px) { width: 160px; }
  @media (max-width: 480px) { width: 130px; }
`;

const spotlightPulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.9; }
`;

/* Plain CSS animation, not framer-motion's `animate` prop — this component's
   parent (Availability) re-renders every 10s from shopOpen()'s status poll,
   and framer-motion was being handed a brand-new `animate`/`transition`
   object literal on every one of those re-renders, which restarted the tween
   mid-cycle each time and read as a stutter. A CSS animation only cares
   about the animation-name/delay staying the same string, which they do
   across re-renders, so it runs untouched by React entirely. */
const SpotlightGlow = styled.div`
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  background: radial-gradient(ellipse at 50% 65%,
    rgba(196,146,42,0.28) 0%,
    rgba(196,30,58,0.1) 40%,
    transparent 68%
  );
  z-index: 0;
  pointer-events: none;
  animation: ${spotlightPulse} 2.6s ease-in-out infinite;
`;

const ChairName = styled.span`
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(1.3rem, 3vw, 1.4rem);
  letter-spacing: 3px;
  color: ${({ $active }) => $active ? CREAM : 'rgba(234,224,202,0.22)'};
  transition: color 0.3s;
`;

/* ── Wait level ── */

const BarTrack = styled.div`
  width: 100%;
  height: 18px;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.07);
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.55);
  position: relative;
  overflow: hidden;
  margin-bottom: 0.55rem;
`;

const BarFill = styled(motion.div)`
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  border-radius: 6px;
  background: ${({ $level }) =>
    $level === 1
      ? 'linear-gradient(90deg, #14532d 0%, #16a34a 45%, #4ade80 100%)'
      : $level === 2
      ? 'linear-gradient(90deg, #14532d 0%, #22c55e 30%, #ca8a04 65%, #fde047 100%)'
      : 'linear-gradient(90deg, #14532d 0%, #22c55e 22%, #ca8a04 48%, #ea580c 72%, #ef4444 100%)'
  };
  box-shadow: 5px 0 28px ${({ $level }) =>
    $level === 1 ? '#22c55e' : $level === 2 ? '#fde047' : '#ef4444'}55;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom,
      rgba(255,255,255,0.22) 0%,
      rgba(255,255,255,0.04) 50%,
      transparent 100%
    );
    border-radius: 6px;
  }
`;

const BarScale = styled.div`
  display: flex;
  margin-bottom: 2rem;
`;

const BarScaleTick = styled.span`
  flex: 1;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(234, 224, 202, 0.75);
  text-align: center;
  &:first-child { text-align: left; }
  &:last-child  { text-align: right; }
`;

const CurrentStatus = styled.div`
  margin-bottom: 2rem;
`;

const StatusText = styled.div`
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(2.6rem, 5vw, 4rem);
  letter-spacing: 0px;
  line-height: 1;
  color: ${({ $color }) => $color};
  margin-bottom: 0.5rem;

  @media (max-width: 600px) {
    font-size: clamp(2.8rem, 9vw, 4rem);
  }
`;

const StatusDesc = styled.div`
  font-family: 'Montserrat', sans-serif;
  font-size: clamp(0.85rem, 1.5vw, 1rem);
  font-weight: 800;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(234, 224, 202, 0.75);
`;


const ClosedMsg = styled.div`
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(1.6rem, 3.5vw, 2rem);
  letter-spacing: 2px;
  color: rgba(234, 224, 202, 0.35);
  line-height: 1.4;
`;

const ClosedSub = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(234, 224, 202, 0.22);
  margin: 10px 0 0;
`;
