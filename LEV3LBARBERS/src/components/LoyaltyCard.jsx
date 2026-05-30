import React from 'react';
import styled, { keyframes } from 'styled-components';

const LEVEL_THEMES = {
  1: { label: 'Bronze', primary: '#d4a853', dim: '#9a7040', bg: 'rgba(212,168,83,0.18)',  glow: 'rgba(212,168,83,0.35)' },
  2: { label: 'Silver', primary: '#c0c8d8', dim: '#8090a8', bg: 'rgba(192,200,216,0.18)', glow: 'rgba(192,200,216,0.3)' },
  3: { label: 'Gold',   primary: '#ffd700', dim: '#c8a000', bg: 'rgba(255,215,0,0.18)',   glow: 'rgba(255,215,0,0.45)'  },
};

// Split 9 stamps into 3 rows of 3, each row paired with its milestone rule
const buildRows = (stampsOnCurrentCard, rules = []) => {
  return [0, 1, 2].map((rowIdx) => {
    const start      = rowIdx * 3;           // 0, 3, 6
    const milestoneN = start + 3;            // 3, 6, 9
    const rule       = rules.find((r) => r.stampCount === milestoneN);
    return {
      stamps: [start, start + 1, start + 2].map((i) => ({
        n:           i + 1,
        filled:      i < stampsOnCurrentCard,
        isMilestone: i === start + 2,
      })),
      milestoneN,
      reward: rule?.rewardValue || rule?.rewardType || null,
      unlocked: stampsOnCurrentCard >= milestoneN,
    };
  });
};

const LoyaltyCard = ({ data }) => {
  if (!data) return null;

  const { level, stampsOnCurrentCard, currentCard, pendingRewards, nextMilestone } = data;
  const $t   = LEVEL_THEMES[level] || LEVEL_THEMES[1];
  const rows = buildRows(stampsOnCurrentCard, currentCard?.rules);
  const stepsToNext = nextMilestone ? nextMilestone - stampsOnCurrentCard : null;

  return (
    <Wrapper $bg={$t.bg} $border={$t.primary} $glow={$t.glow}>
      {/* Header */}
      <TopRow>
        <LevelBadge $color={$t.primary}>{$t.label}</LevelBadge>
        <CardName>{currentCard?.name || `Level ${level}`}</CardName>
        <CountPill $color={$t.primary}>{stampsOnCurrentCard}/9</CountPill>
      </TopRow>

      {/* 3 stamp rows, each ending with its reward label */}
      <StampRows>
        {rows.map((row, ri) => (
          <StampRow key={ri}>
            <Stamps>
              {row.stamps.map((s) => (
                <StampWrap key={s.n}>
                  <StampCircle $filled={s.filled} $milestone={s.isMilestone} $primary={$t.primary} $glow={$t.glow}>
                    {s.filled
                      ? <StampMark $color={$t.primary}>✦</StampMark>
                      : <StampNum>{s.n}</StampNum>}
                  </StampCircle>
                </StampWrap>
              ))}
            </Stamps>

            <Arrow $unlocked={row.unlocked} $color={$t.primary}>→</Arrow>

            <RewardLabel $unlocked={row.unlocked} $color={$t.primary} $dim={$t.dim}>
              {row.reward || `Reward`}
            </RewardLabel>
          </StampRow>
        ))}
      </StampRows>

      {/* Progress hint */}
      {stepsToNext !== null && stepsToNext > 0 && (
        <Hint $color={$t.primary}>
          {stepsToNext} more stamp{stepsToNext !== 1 ? 's' : ''} until your next reward
        </Hint>
      )}

      {/* Pending rewards */}
      {pendingRewards?.length > 0 && (
        <PendingBox $primary={$t.primary}>
          <PendingTitle>🎁 Reward ready for your next visit</PendingTitle>
          {pendingRewards.map((r) => (
            <PendingItem key={r.id}>{r.rewardValue || r.rewardType}</PendingItem>
          ))}
        </PendingBox>
      )}
    </Wrapper>
  );
};

export default LoyaltyCard;


const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 8px var(--pending-glow); }
  50%       { box-shadow: 0 0 18px var(--pending-glow); }
`;

const Wrapper = styled.div`
  background: ${({ $bg }) => $bg};
  border: 1.5px solid ${({ $border }) => $border};
  border-radius: 16px;
  padding: 1.3rem 1.1rem 1.2rem;
  width: 100%;
  box-shadow: 0 0 28px ${({ $glow }) => $glow};
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.1rem;
`;

const LevelBadge = styled.span`
  background: ${({ $color }) => $color};
  color: #000;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
`;

const CardName = styled.span`
  flex: 1;
  text-align: center;
  color: #f5f2ed;
  font-size: 0.92rem;
  font-weight: 600;
`;

const CountPill = styled.span`
  color: ${({ $color }) => $color};
  font-size: 0.9rem;
  font-weight: 700;
`;

/* ── Stamp rows ─────────────────────────────── */

const StampRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-bottom: 0.9rem;
`;

const StampRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Stamps = styled.div`
  display: flex;
  gap: 0.45rem;
`;

const StampWrap = styled.div`
  display: flex;
  align-items: center;
`;

const StampCircle = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid ${({ $milestone, $primary }) =>
    $milestone ? $primary : 'rgba(255,255,255,0.35)'};
  background: ${({ $filled, $primary }) =>
    $filled ? $primary : 'rgba(255,255,255,0.10)'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.35s ease, box-shadow 0.35s ease;
  box-shadow: ${({ $filled, $glow }) =>
    $filled ? `0 0 12px ${$glow}` : 'none'};
`;

const StampMark = styled.span`
  color: #000;
  font-size: 1.2rem;
  line-height: 1;
`;

const StampNum = styled.span`
  color: rgba(255,255,255,0.55);
  font-size: 0.82rem;
  font-weight: 600;
`;

const Arrow = styled.span`
  font-size: 1rem;
  color: ${({ $unlocked, $color }) => $unlocked ? $color : 'rgba(255,255,255,0.25)'};
  flex-shrink: 0;
  transition: color 0.3s;
`;

const RewardLabel = styled.span`
  flex: 1;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ $unlocked, $color, $dim }) => $unlocked ? $color : 'rgba(255,255,255,0.5)'};
  transition: color 0.3s;
  min-width: 0;
`;

/* ── Bottom info ─────────────────────────────── */

const Hint = styled.p`
  text-align: center;
  color: ${({ $color }) => $color};
  font-size: 0.82rem;
  margin-bottom: 0.8rem;
`;

const PendingBox = styled.div`
  --pending-glow: ${({ $primary }) => $primary};
  background: ${({ $primary }) => `${$primary}22`};
  border: 1.5px solid ${({ $primary }) => `${$primary}80`};
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  animation: ${pulse} 2.5s ease-in-out infinite;
`;

const PendingTitle = styled.p`
  color: #f5f2ed;
  font-size: 0.82rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const PendingItem = styled.p`
  color: #c8b88a;
  font-size: 0.88rem;
`;
