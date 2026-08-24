import React from 'react';
import styled from 'styled-components';

/**
 * Reusable reward selector used wherever admin configures a reward.
 *
 * Props:
 *   label      – field label text
 *   value      – { type: 'RANDOM' | 'CUSTOM' | 'MYSTERY_BOX', text: string }
 *   onChange   – (newValue) => void
 *   showRandom – show the "Random from pool" option (default true for milestone pickers)
 */
const RewardPicker = ({ label, value = { type: 'CUSTOM', text: '' }, onChange, showRandom = false }) => {
  const type = value.type || 'CUSTOM';

  return (
    <Wrap>
      {label && <FieldLabel>{label}</FieldLabel>}
      <TypeRow>
        {showRandom && (
          <TypeBtn
            $active={type === 'RANDOM'}
            $random={true}
            onClick={() => onChange({ type: 'RANDOM', text: '' })}
            type="button"
          >
            🎲 Random
          </TypeBtn>
        )}
        <TypeBtn
          $active={type === 'CUSTOM'}
          onClick={() => onChange({ ...value, type: 'CUSTOM' })}
          type="button"
        >
          Custom
        </TypeBtn>
        <TypeBtn
          $active={type === 'MYSTERY_BOX'}
          $mystery={true}
          onClick={() => onChange({ ...value, type: 'MYSTERY_BOX' })}
          type="button"
        >
          🎁 Mystery Box
        </TypeBtn>
        <TypeBtn
          $active={type === 'BONUS_STAMP'}
          $bonus={true}
          onClick={() => onChange({ type: 'BONUS_STAMP', text: '' })}
          type="button"
        >
          🎯 Bonus Stamp
        </TypeBtn>
      </TypeRow>

      {type === 'RANDOM' && (
        <MysteryBadge $random>Draws randomly from this tier's reward pool</MysteryBadge>
      )}

      {type === 'CUSTOM' && (
        <Input
          placeholder="e.g. Free Nose Wax, 10% off next cut…"
          value={value.text || ''}
          onChange={e => onChange({ ...value, text: e.target.value })}
        />
      )}

      {type === 'MYSTERY_BOX' && (
        <MysteryBadge>A mystery box reward will be issued automatically</MysteryBadge>
      )}

      {type === 'BONUS_STAMP' && (
        <MysteryBadge $bonus>1 bonus stamp is added to their loyalty card immediately — no visit required</MysteryBadge>
      )}
    </Wrap>
  );
};

export default RewardPicker;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const Wrap = styled.div`
  margin-bottom: 1.1rem;
`;

const FieldLabel = styled.p`
  font-size: 0.8rem;
  color: rgba(255,255,255,0.65);
  margin-bottom: 0.45rem;
  font-weight: 600;
`;

const TypeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
`;

const TypeBtn = styled.button`
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;

  border-color: ${({ $active, $mystery, $random, $bonus }) =>
    $active
      ? $mystery ? '#c8b88a' : $random ? '#a78bfa' : $bonus ? '#4ade80' : 'rgba(255,255,255,0.55)'
      : 'rgba(255,255,255,0.15)'};
  background: ${({ $active, $mystery, $random, $bonus }) =>
    $active
      ? $mystery ? 'rgba(200,184,138,0.18)' : $random ? 'rgba(167,139,250,0.15)' : $bonus ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.14)'
      : 'transparent'};
  color: ${({ $active, $mystery, $random, $bonus }) =>
    $active
      ? $mystery ? '#c8b88a' : $random ? '#a78bfa' : $bonus ? '#4ade80' : '#fff'
      : 'rgba(255,255,255,0.35)'};

  &:hover { opacity: 0.85; }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.52rem 0.78rem;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.08);
  color: white;
  font-size: 0.88rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;

  &::placeholder { color: rgba(255,255,255,0.3); }
  &:focus { border-color: #c8b88a; }
`;

const MysteryBadge = styled.p`
  font-size: 0.75rem;
  color: ${({ $random, $bonus }) =>
    $bonus  ? 'rgba(74,222,128,0.8)' :
    $random ? 'rgba(167,139,250,0.75)' :
    'rgba(200,184,138,0.7)'};
  font-style: italic;
  margin: 0;
`;
