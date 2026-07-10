import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import QRCode from 'react-qr-code';
import confetti from 'canvas-confetti';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];

const TIER_THEMES = {
  BRONZE:   { label: 'Bronze',   accent: '#e0b27a', gradient: 'linear-gradient(135deg, #6b4423, #b97a3c)' },
  SILVER:   { label: 'Silver',   accent: '#dde2e8', gradient: 'linear-gradient(135deg, #5b6470, #9aa4b2)' },
  GOLD:     { label: 'Gold',     accent: '#ffe08a', gradient: 'linear-gradient(135deg, #7a5a10, #C4922A)' },
  PLATINUM: { label: 'Platinum', accent: '#eef2f9', gradient: 'linear-gradient(135deg, #454c56, #8d99ab)' },
};

const NEXT_TIER_LABEL = { BRONZE: 'Silver', SILVER: 'Gold', GOLD: 'Platinum', PLATINUM: 'Complete cycle' };

/* Quick integer count-up, fires once on mount */
const useCountUp = (target, duration = 700) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let step = 0;
    const steps = 24;
    const timer = setInterval(() => {
      step++;
      setVal(Math.round((target * step) / steps));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
};

const LoyaltyCard = ({ data, email, walletQrCode }) => {
  const [face, setFace] = useState('front'); // 'front' | 'back'
  const [hovered, setHovered] = useState(false);
  const firedConfetti = useRef(false);

  const rawY = useMotionValue(0);
  const spY  = useSpring(rawY, { stiffness: 260, damping: 22 });
  const rotateX = useTransform(spY, [-0.5, 0.5], [6, -6]);
  const scaleX = useMotionValue(1);

  if (!data) return null;

  const {
    tier = 'BRONZE',
    stampsInCycle = 0,
    stampCycle = 0,
    stampsToNextTier,
    stampsToNextReward,
    nextMilestone,
    tierMin = 0,
    tierMax = 9,
    cycleLength = 50,
    pendingRewards = [],
    expiringRewards = [],
  } = data;

  const $t = TIER_THEMES[tier] || TIER_THEMES.BRONZE;
  const tierSpan = Math.max(tierMax - tierMin + 1, 1);
  const tierProgress = Math.min((stampsInCycle - tierMin + 1) / tierSpan, 1);
  const animatedCount = useCountUp(stampsInCycle);

  const soonest = expiringRewards[0];
  const daysLeft = soonest
    ? Math.ceil((new Date(soonest.expiresAt) - Date.now()) / 86400000)
    : null;

  // Small celebratory burst the first time the card mounts with something to collect
  useEffect(() => {
    if (pendingRewards.length > 0 && !firedConfetti.current) {
      firedConfetti.current = true;
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.4 }, colors: [RED, $t.accent, INK] });
    }
  }, [pendingRewards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    rawY.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onMouseLeave = () => { setHovered(false); rawY.set(0); };

  const hasBack = !!(email || walletQrCode);

  const handleFlip = () => {
    if (!hasBack) return;
    animate(scaleX, 0, {
      duration: 0.22,
      ease: 'easeIn',
      onComplete: () => {
        setFace(f => (f === 'front' ? 'back' : 'front'));
        animate(scaleX, 1, { duration: 0.26, ease: 'easeOut' });
      },
    });
  };

  return (
    <CardScene
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      onClick={handleFlip}
      $clickable={hasBack}
    >
      <CardInner style={{ rotateX, scaleX }}>
        {face === 'front' ? (
          <CardFace $gradient={$t.gradient}>
            <Sheen $show={hovered} />

            <TopRow>
              <TierBadge $color={$t.accent}>{$t.label}</TierBadge>
              {stampCycle > 0 && (
                <CycleTag $color={$t.accent}>Platinum Graduate ×{stampCycle}</CycleTag>
              )}
              <StampCount $color={$t.accent}>{animatedCount} / {cycleLength}</StampCount>
            </TopRow>

            <ProgressSection>
              <ProgressMeta>
                <ProgressLabel>Tier progress</ProgressLabel>
                <ProgressLabel $right>
                  {tier === 'PLATINUM'
                    ? `${cycleLength - stampsInCycle} to complete cycle`
                    : `${stampsToNextTier ?? '?'} to ${NEXT_TIER_LABEL[tier] || 'next tier'}`}
                </ProgressLabel>
              </ProgressMeta>
              <Track>
                <Fill
                  as={motion.div}
                  initial={{ width: 0 }}
                  animate={{ width: `${tierProgress * 100}%` }}
                  transition={{ duration: 0.7, ease: EASE }}
                  $color={$t.accent}
                />
                <Milestone $pct={33.3} />
                <Milestone $pct={66.6} />
              </Track>
            </ProgressSection>

            <RewardHint $color={$t.accent}>
              {stampsToNextReward === 1
                ? '1 more stamp until your next reward'
                : `${stampsToNextReward ?? 3} stamps until next reward`}
              {nextMilestone && <> · stamp #{nextMilestone}</>}
            </RewardHint>

            {soonest && daysLeft !== null && daysLeft <= 14 && (
              <ExpiryWarn>
                ⚠ Reward expiring in {daysLeft} day{daysLeft !== 1 ? 's' : ''} — visit soon!
              </ExpiryWarn>
            )}

            {pendingRewards.length > 0 && (
              <PendingBox>
                <PendingTitle>Ready to collect at your next visit</PendingTitle>
                {pendingRewards.map((r) => (
                  <PendingItem key={r.id}>{r.rewardValue || r.rewardType}</PendingItem>
                ))}
              </PendingBox>
            )}

            <DotsRow>
              {Array.from({ length: Math.min(9, tierSpan) }, (_, i) => {
                const stamp = tierMin + i;
                const filled = stampsInCycle >= stamp;
                const isMilestone = stamp % 3 === 0;
                return (
                  <Dot
                    key={i}
                    as={motion.div}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={filled ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 16, delay: i * 0.03 }}
                    $filled={filled}
                    $milestone={isMilestone}
                    $color={$t.accent}
                  >
                    {filled ? <DotMark>✦</DotMark> : <DotNum>{stamp}</DotNum>}
                  </Dot>
                );
              })}
              {tierSpan > 9 && (
                <DotMore $color={$t.accent}>+{tierSpan - Math.min(9, tierSpan)} more</DotMore>
              )}
            </DotsRow>

            {hasBack && <FlipHint>Tap card for your barber QR →</FlipHint>}
          </CardFace>
        ) : (
          <CardFace $gradient={$t.gradient} $back>
            <BackTitle>My Barber QR</BackTitle>

            {email && (
              <QRBlock>
                <QRSmallLabel>Stamps / Check-in</QRSmallLabel>
                <QRWrap><QRCode value={email} size={128} bgColor="#ffffff" fgColor={INK} /></QRWrap>
              </QRBlock>
            )}

            {walletQrCode && (
              <QRBlock>
                <QRSmallLabel>Wallet Payment</QRSmallLabel>
                <QRWrap>
                  <QRCode
                    value={`${window.location.origin}/pay/${encodeURIComponent(walletQrCode)}`}
                    size={128}
                    bgColor="#ffffff"
                    fgColor={INK}
                  />
                </QRWrap>
              </QRBlock>
            )}

            <FlipHint>← Tap to flip back</FlipHint>
          </CardFace>
        )}
      </CardInner>
    </CardScene>
  );
};

export default LoyaltyCard;

/* ─────────── Animations ─────────── */
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(196,30,58,0.25); }
  50%      { box-shadow: 0 0 18px rgba(196,30,58,0.4); }
`;

/* ─────────── Styles ─────────── */

const CardScene = styled.div`
  position: relative;
  width: 100%;
  perspective: 1200px;
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
`;

const CardInner = styled(motion.div)`
  position: relative;
  width: 100%;
`;

const CardFace = styled.div`
  position: relative;
  width: 100%;
  background: ${({ $gradient }) => $gradient};
  border-radius: 20px;
  padding: 1.8rem 1.6rem 1.5rem;
  box-shadow: 0 18px 40px rgba(26, 26, 26, 0.25);
  overflow: hidden;
  color: ${CREAM};
  box-sizing: border-box;

  ${({ $back }) => $back && css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 320px;
  `}
`;

const Sheen = styled.div`
  position: absolute;
  top: -50%; left: -60%;
  width: 60%; height: 200%;
  background: linear-gradient(75deg, transparent, rgba(255,255,255,0.22), transparent);
  transform: ${({ $show }) => $show ? 'translateX(220%)' : 'translateX(-40%)'};
  transition: transform 0.7s ease;
  pointer-events: none;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1.3rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`;

const TierBadge = styled.span`
  background: ${({ $color }) => $color};
  color: #1a1a1a;
  padding: 4px 13px;
  border-radius: 12px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  white-space: nowrap;
`;

const CycleTag = styled.span`
  font-size: 0.82rem;
  color: ${({ $color }) => $color};
  font-weight: 800;
  font-family: 'Montserrat', sans-serif;
  opacity: 0.95;
`;

const StampCount = styled.span`
  margin-left: auto;
  color: ${({ $color }) => $color};
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 1px;
`;

const ProgressSection = styled.div`margin-bottom: 0.6rem; position: relative; z-index: 1;`;

const ProgressMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
`;

const ProgressLabel = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.8rem;
  color: rgba(244,240,232,0.85);
  text-align: ${({ $right }) => $right ? 'right' : 'left'};
`;

const Track = styled.div`
  position: relative;
  height: 9px;
  background: rgba(244,240,232,0.18);
  border-radius: 99px;
  overflow: hidden;
`;

const Fill = styled.div`
  height: 100%;
  background: ${({ $color }) => $color};
  border-radius: 99px;
`;

const Milestone = styled.div`
  position: absolute;
  top: 0; bottom: 0;
  left: ${({ $pct }) => $pct}%;
  width: 1.5px;
  background: rgba(244,240,232,0.4);
`;

const RewardHint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.92rem;
  color: ${({ $color }) => $color};
  margin: 0.7rem 0;
  text-align: center;
  position: relative; z-index: 1;
`;

const ExpiryWarn = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  color: #1a1a1a;
  background: rgba(255,255,255,0.55);
  border-radius: 6px;
  padding: 0.5rem 0.8rem;
  margin: 0.6rem 0;
  text-align: center;
  position: relative; z-index: 1;
`;

const PendingBox = styled.div`
  background: rgba(255,255,255,0.14);
  border: 1.5px solid rgba(255,255,255,0.4);
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  margin: 0.7rem 0;
  position: relative; z-index: 1;
  animation: ${pulse} 2.5s ease-in-out infinite;
`;

const PendingTitle = styled.p`
  color: ${CREAM};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.88rem;
  font-weight: 800;
  margin-bottom: 0.35rem;
`;

const PendingItem = styled.p`
  color: ${CREAM};
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  opacity: 0.9;
`;

const DotsRow = styled.div`
  display: flex;
  gap: 0.45rem;
  margin-top: 1.2rem;
  flex-wrap: wrap;
  align-items: center;
  position: relative; z-index: 1;
`;

const Dot = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid ${({ $milestone, $color }) => $milestone ? $color : 'rgba(244,240,232,0.3)'};
  background: ${({ $filled, $color }) => $filled ? $color : 'rgba(244,240,232,0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DotMark = styled.span`
  color: #1a1a1a;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
`;

const DotNum = styled.span`
  color: rgba(244,240,232,0.65);
  font-size: 0.72rem;
  font-weight: 800;
`;

const DotMore = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.78rem;
  color: ${({ $color }) => $color};
  opacity: 0.85;
  margin-left: 0.3rem;
`;

const FlipHint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.76rem;
  letter-spacing: 0.5px;
  color: rgba(244,240,232,0.7);
  text-align: center;
  margin: 1rem 0 0;
  position: relative; z-index: 1;
`;

const BackTitle = styled.p`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.35rem;
  letter-spacing: 2px;
  margin: 0.2rem 0 1.1rem;
`;

const QRBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
`;

const QRSmallLabel = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(244,240,232,0.75);
  margin: 0 0 0.6rem;
`;

const QRWrap = styled.div`
  background: #fff;
  padding: 10px;
  border-radius: 8px;
`;
