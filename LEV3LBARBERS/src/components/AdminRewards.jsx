import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import ConfirmModal from '../modals/ConfirmModal';
import RewardPicker from '../common/RewardPicker';
import { TargetIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const TIER_META = [
  { key: 'BRONZE',      label: 'Bronze',     color: '#a8732e', cardOrder: 1 },
  { key: 'SILVER',      label: 'Silver',     color: '#6b7585', cardOrder: 2 },
  { key: 'GOLD',        label: 'Gold',       color: '#a9870a', cardOrder: 3 },
  { key: 'PLATINUM',    label: 'Platinum',   color: '#5a6b8c', cardOrder: 4 },
  { key: '__MYSTERY__', label: 'Mystery Box', color: '#7c5cd4', cardOrder: null },
];

// Compute milestone stamp numbers for a tier given loyalty settings
function milestonesForTier(tierKey, ls) {
  if (!ls || tierKey === '__MYSTERY__') return [];
  const { bronzeMax, silverMax, goldMax, cycleLength, rewardInterval } = ls;
  const ranges = {
    BRONZE:   [1,            bronzeMax],
    SILVER:   [bronzeMax+1,  silverMax],
    GOLD:     [silverMax+1,  goldMax  ],
    PLATINUM: [goldMax+1,    cycleLength],
  };
  const [start, end] = ranges[tierKey] || [1, 9];
  const milestones = [];
  const first = Math.ceil(start / rewardInterval) * rewardInterval;
  for (let m = first; m <= end; m += rewardInterval) milestones.push(m);
  return milestones;
}

// Convert a StampRewardRule into a RewardPicker value
function ruleToPicker(rule) {
  if (!rule) return { type: 'RANDOM', text: '' };
  if (rule.rewardIsMystery) return { type: 'MYSTERY_BOX', text: '' };
  return { type: 'CUSTOM', text: rule.rewardValue || '' };
}

const AdminRewards = () => {
  const [pool, setPool]           = useState([]);
  const [cards, setCards]         = useState([]);     // StampCards from API
  const [ls, setLs]               = useState(null);   // LoyaltySettings
  const [milestoneEdits, setMilestoneEdits] = useState({}); // { [tier]: { [stampCount]: pickerValue } }
  const [expanded, setExpanded]   = useState('BRONZE');
  const [newReward, setNewReward] = useState({ reward: '', weight: 50 });
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ reward: '', weight: 50 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [savingMilestones, setSavingMilestones] = useState(null);
  const [milestoneMsg, setMilestoneMsg] = useState({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [poolRes, cardsRes, lsRes] = await Promise.allSettled([
      api.get('/reward-pool/get-reward-pool'),
      api.get('/stamps/cards'),
      api.get('/loyalty-settings/settings'),
    ]);
    if (poolRes.status === 'fulfilled') setPool(poolRes.value.data);
    if (cardsRes.status === 'fulfilled') setCards(cardsRes.value.data.cards || []);
    if (lsRes.status  === 'fulfilled') setLs(lsRes.value.data.settings);
  };

  // Build initial milestone edits from loaded cards
  const getMilestoneState = useCallback((tierKey) => {
    const meta = TIER_META.find(t => t.key === tierKey);
    if (!meta || !ls) return {};
    const milestones = milestonesForTier(tierKey, ls);
    const card = cards.find(c => c.order === meta.cardOrder);
    const state = {};
    milestones.forEach(stampCount => {
      const rule = card?.rules.find(r => r.stampCount === stampCount);
      state[stampCount] = ruleToPicker(rule);
    });
    return state;
  }, [cards, ls]);

  const openTier = (key) => {
    setExpanded(prev => prev === key ? null : key);
    if (key !== '__MYSTERY__' && !milestoneEdits[key]) {
      setMilestoneEdits(e => ({ ...e, [key]: getMilestoneState(key) }));
    }
  };

  const updateMilestone = (tierKey, stampCount, val) => {
    setMilestoneEdits(e => ({
      ...e,
      [tierKey]: { ...(e[tierKey] || {}), [stampCount]: val },
    }));
  };

  const saveMilestones = async (tierKey) => {
    const meta = TIER_META.find(t => t.key === tierKey);
    if (!meta) return;
    setSavingMilestones(tierKey);
    const edits = milestoneEdits[tierKey] || {};
    const milestones = milestonesForTier(tierKey, ls);

    // Build rules array: skip RANDOM (no rule), include CUSTOM and MYSTERY_BOX
    const rules = milestones
      .filter(m => edits[m]?.type !== 'RANDOM' && edits[m] !== undefined)
      .map(m => {
        const v = edits[m];
        return {
          stampCount:      m,
          rewardType:      v.type === 'MYSTERY_BOX' ? 'Mystery box' : 'Stamp',
          rewardValue:     v.type === 'CUSTOM' ? (v.text || null) : null,
          rewardIsMystery: v.type === 'MYSTERY_BOX',
        };
      });

    try {
      const card = cards.find(c => c.order === meta.cardOrder);
      if (card) {
        await api.put(`/stamps/cards/${card.id}`, { name: card.name, order: card.order, rules });
      } else {
        await api.post('/stamps/cards', { name: meta.label, order: meta.cardOrder, rules });
      }
      setMilestoneMsg(m => ({ ...m, [tierKey]: 'Saved!' }));
      setTimeout(() => setMilestoneMsg(m => ({ ...m, [tierKey]: '' })), 3000);
      const res = await api.get('/stamps/cards');
      setCards(res.data.cards || []);
    } catch {
      setMilestoneMsg(m => ({ ...m, [tierKey]: 'Failed to save.' }));
    } finally {
      setSavingMilestones(null);
    }
  };

  // Pool CRUD
  const addBonusStamp = async (tierKey) => {
    const isMystery = tierKey === '__MYSTERY__';
    try {
      await api.post('/reward-pool/create-reward-pool', {
        reward: '__BONUS_STAMP__',
        weight: newReward.weight,
        tier:   isMystery ? null : tierKey,
        type:   isMystery ? 'Mystery box' : tierKey,
      });
      const res = await api.get('/reward-pool/get-reward-pool');
      setPool(res.data);
    } catch (err) { console.error(err); }
  };

  const addReward = async (tierKey) => {
    if (!newReward.reward.trim()) return;
    const isMystery = tierKey === '__MYSTERY__';
    try {
      await api.post('/reward-pool/create-reward-pool', {
        ...newReward,
        tier:  isMystery ? null : tierKey,
        type:  isMystery ? 'Mystery box' : tierKey,
      });
      setNewReward({ reward: '', weight: 50 });
      const res = await api.get('/reward-pool/get-reward-pool');
      setPool(res.data);
    } catch (err) { console.error(err); }
  };

  const saveEdit = async (id) => {
    try {
      const item = pool.find(r => r.id === id);
      await api.put(`/reward-pool/update-reward/${id}`, { ...editValues, tier: item.tier, type: item.type });
      setEditingId(null);
      const res = await api.get('/reward-pool/get-reward-pool');
      setPool(res.data);
    } catch (err) { console.error(err); }
  };

  const deleteReward = async (id) => {
    try {
      await api.delete(`/reward-pool/delete-reward/${id}`);
      setPool(prev => prev.filter(r => r.id !== id));
      setDeleteTarget(null);
    } catch (err) { console.error(err); }
  };

  return (
    <FormCard>
      <PanelTitle>Reward Pool</PanelTitle>
      <WeightNote>
        <strong>Weights:</strong> Any positive whole number. They're proportional — e.g. 70 vs 30 = 70 %/30 % chance. Milestone overrides below take priority over pool draws.
      </WeightNote>

      {TIER_META.map(tier => {
        const isOpen  = expanded === tier.key;
        const tierPool = tier.key === '__MYSTERY__'
          ? pool.filter(r => r.type === 'Mystery box')
          : pool.filter(r => r.tier === tier.key);
        const milestones = milestonesForTier(tier.key, ls);
        const edits = milestoneEdits[tier.key] || {};

        return (
          <TierBlock key={tier.key}>
            <TierHeader $color={tier.color} onClick={() => openTier(tier.key)}>
              <TierLeft>
                <TierDot $color={tier.color} />
                <span>{tier.label}</span>
                {tier.key !== '__MYSTERY__' && ls && (
                  <TierCount>{tierPool.length} in pool</TierCount>
                )}
              </TierLeft>
              <span>{isOpen ? '−' : '+'}</span>
            </TierHeader>

            {isOpen && (
              <TierBody>
                {/* ── Milestone overrides (not for Mystery Box tier) ── */}
                {tier.key !== '__MYSTERY__' && milestones.length > 0 && (
                  <MilestoneSection>
                    <SubLabel>Milestone Rewards</SubLabel>
                    <SubHint>
                      Set a guaranteed reward at each milestone. Leave as Random to draw from the pool above.
                    </SubHint>
                    {milestones.map(stampCount => (
                      <MilestoneRow key={stampCount}>
                        <RewardPicker
                          showRandom
                          label={`Stamp #${stampCount}`}
                          value={edits[stampCount] || { type: 'RANDOM', text: '' }}
                          onChange={v => updateMilestone(tier.key, stampCount, v)}
                        />
                      </MilestoneRow>
                    ))}
                    {milestoneMsg[tier.key] && (
                      <MilestoneStatus $ok={milestoneMsg[tier.key] === 'Saved!'}>
                        {milestoneMsg[tier.key]}
                      </MilestoneStatus>
                    )}
                    <SaveMilestonesBtn
                      onClick={() => saveMilestones(tier.key)}
                      disabled={savingMilestones === tier.key}
                    >
                      {savingMilestones === tier.key ? 'Saving…' : 'Save Milestones'}
                    </SaveMilestonesBtn>
                    <Divider />
                  </MilestoneSection>
                )}

                {/* ── Random pool ── */}
                <SubLabel>
                  {tier.key === '__MYSTERY__' ? 'Mystery Box Contents' : 'Random Pool'}
                </SubLabel>
                <SubHint>
                  {tier.key === '__MYSTERY__'
                    ? 'Items drawn when a mystery box is issued (signup, referral, etc.)'
                    : 'Drawn randomly when no milestone override is set.'}
                </SubHint>
                <AddRow>
                  <Input
                    placeholder="Reward name"
                    value={newReward.reward}
                    onChange={e => setNewReward(n => ({ ...n, reward: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addReward(tier.key)}
                  />
                  <WeightInput
                    type="number" min="1" title="Weight"
                    placeholder="Weight"
                    value={newReward.weight}
                    onChange={e => setNewReward(n => ({ ...n, weight: Number(e.target.value) }))}
                  />
                  <AddBtn onClick={() => addReward(tier.key)}>Add</AddBtn>
                </AddRow>
                <BonusStampBtn onClick={() => addBonusStamp(tier.key)}>
                  + Add Bonus Stamp option (weight: {newReward.weight})
                </BonusStampBtn>

                <RewardList>
                  {tierPool.length === 0 && <EmptyText>No rewards yet.</EmptyText>}
                  {tierPool.map(r => (
                    <RewardItem key={r.id}>
                      {editingId === r.id ? (
                        <>
                          {r.reward === '__BONUS_STAMP__' ? (
                            <BonusStampTag><TargetIcon width={14} height={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />Bonus Stamp</BonusStampTag>
                          ) : (
                            <Input value={editValues.reward} onChange={e => setEditValues(v => ({ ...v, reward: e.target.value }))} />
                          )}
                          <WeightInput type="number" min="1" value={editValues.weight} onChange={e => setEditValues(v => ({ ...v, weight: Number(e.target.value) }))} />
                          <SmallBtn $save onClick={() => saveEdit(r.id)}>Save</SmallBtn>
                          <SmallBtn onClick={() => setEditingId(null)}>Cancel</SmallBtn>
                        </>
                      ) : (
                        <>
                          {r.reward === '__BONUS_STAMP__' ? (
                            <BonusStampTag><TargetIcon width={14} height={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />Bonus Stamp</BonusStampTag>
                          ) : (
                            <RewardName>{r.reward}</RewardName>
                          )}
                          <WeightTag>w:{r.weight}</WeightTag>
                          <SmallBtn $edit onClick={() => { setEditingId(r.id); setEditValues({ reward: r.reward, weight: r.weight }); }}>Edit</SmallBtn>
                          <SmallBtn $del onClick={() => setDeleteTarget(r)}>Delete</SmallBtn>
                        </>
                      )}
                    </RewardItem>
                  ))}
                </RewardList>
              </TierBody>
            )}
          </TierBlock>
        );
      })}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.reward}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteReward(deleteTarget.id)}
        />
      )}
    </FormCard>
  );
};

export default AdminRewards;

/* ─────────── Styles ─────────── */

const FormCard = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border: 1px solid rgba(26,26,26,0.1);
  border-radius: 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 680px;
  margin: 0 auto 2rem;
`;

const PanelTitle = styled.h2`
  text-align: center; margin-bottom: 0.6rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: 1.6rem; color: ${INK};
`;

const WeightNote = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(26,26,26,0.6);
  background: rgba(255,255,255,0.5);
  border-left: 2px solid ${RED};
  padding: 0.55rem 0.9rem;
  margin-bottom: 1.2rem;
  line-height: 1.5;
  strong { color: ${RED}; }
`;

const TierBlock = styled.div`
  margin-bottom: 0.7rem;
  border-radius: 0;
  overflow: hidden;
  border: 1px solid rgba(26,26,26,0.08);
  background: rgba(255,255,255,0.4);
`;

const TierHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  cursor: pointer;
  background: rgba(255,255,255,0.5);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.92rem;
  font-weight: 700;
  color: ${({ $color }) => $color};
  &:hover { background: rgba(255,255,255,0.7); }
`;

const TierLeft = styled.div`display: flex; align-items: center; gap: 0.55rem;`;
const TierDot  = styled.div`width:10px; height:10px; border-radius:50%; background:${({$color})=>$color}; flex-shrink:0;`;
const TierCount = styled.span`font-size:0.7rem; color:rgba(26,26,26,0.55); font-weight:600;`;

const TierBody = styled.div`padding: 1rem;`;

const MilestoneSection = styled.div`margin-bottom: 0.5rem;`;
const SubLabel = styled.p`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.8rem; letter-spacing: 2px;
  text-transform: uppercase; color: ${RED};
  margin-bottom: 0.25rem;
`;
const SubHint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.73rem; color: rgba(26,26,26,0.55); font-weight: 600;
  font-style: italic; margin-bottom: 0.75rem;
`;

const MilestoneRow = styled.div`
  background: rgba(255,255,255,0.5);
  border: 1px solid rgba(26,26,26,0.08);
  border-radius: 0;
  padding: 0.65rem 0.8rem;
  margin-bottom: 0.4rem;
`;

const MilestoneStatus = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ $ok }) => $ok ? '#2e7d32' : '#c62828'};
  text-align: center;
  margin: 0.4rem 0;
`;

const SaveMilestonesBtn = styled.button`
  width: 100%;
  padding: 0.55rem;
  border-radius: 0;
  border: 1px solid ${RED};
  background: transparent;
  color: ${RED};
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 0.3rem;
  transition: background 0.18s, color 0.18s;
  &:hover:not(:disabled) { background: ${RED}; color: #fff; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const Divider = styled.hr`border:none; border-top:1px solid rgba(26,26,26,0.1); margin: 0.9rem 0 0.7rem;`;

const AddRow = styled.div`
  display: flex; gap: 0.5rem; margin-bottom: 0.3rem; flex-wrap: wrap;

  @media (max-width: 480px) {
    & > input:first-child { flex-basis: 100%; }
  }
`;

const Input = styled.input`
  flex: 1; padding: 0.48rem 0.7rem; border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15); background: #ffffff;
  font-family: 'Montserrat', sans-serif;
  color: ${INK}; font-size: 0.88rem; outline: none;
  &::placeholder { color: rgba(26,26,26,0.35); }
  &:focus { border-color: ${RED}; }
`;

const WeightInput = styled.input`
  width: 70px; padding: 0.48rem 0.5rem; border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15); background: #ffffff;
  font-family: 'Montserrat', sans-serif;
  color: ${INK}; font-size: 0.88rem; outline: none; text-align: center; flex-shrink: 0;
  &:focus { border-color: ${RED}; }
`;

const AddBtn = styled.button`
  padding: 0.48rem 1rem; border-radius: 0; border: none;
  background: ${RED}; color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 700; font-size: 0.85rem;
  cursor: pointer; white-space: nowrap;
  transition: background 0.18s;
  &:hover { background: #a01830; }
`;

const RewardList = styled.div`display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.4rem;`;

const RewardItem = styled.div`
  display: flex; align-items: center; gap: 0.4rem;
  background: rgba(255,255,255,0.5); border: 1px solid rgba(26,26,26,0.08);
  padding: 0.5rem 0.7rem; border-radius: 0;
`;

const RewardName = styled.span`
  flex:1; font-family: 'Montserrat', sans-serif;
  font-size:0.86rem; color: ${INK};
`;
const WeightTag  = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size:0.7rem; color:rgba(26,26,26,0.55); font-weight: 600; margin-right:0.2rem;
`;

const SmallBtn = styled.button`
  padding: 3px 10px; border-radius: 0; border: 1px solid; font-size: 0.75rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700; cursor: pointer; background: transparent;
  transition: background 0.18s, color 0.18s;
  border-color: ${({ $save,$edit,$del }) => $save?'#2e7d32':$edit?'rgba(26,26,26,0.15)':$del?RED:'rgba(26,26,26,0.15)'};
  color: ${({ $save,$edit,$del }) => $save?'#2e7d32':$edit?'rgba(26,26,26,0.55)':$del?RED:'rgba(26,26,26,0.55)'};
  &:hover {
    background: ${({ $save,$edit,$del }) => $save?'rgba(46,125,50,0.08)':$edit?'transparent':$del?'rgba(196,30,58,0.08)':'transparent'};
    border-color: ${({ $save,$edit,$del }) => $edit || (!$save && !$del) ? INK : undefined};
    color: ${({ $save,$edit,$del }) => $edit || (!$save && !$del) ? INK : undefined};
  }
`;

const EmptyText = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem; color: rgba(26,26,26,0.55); font-weight: 600;
  font-style: italic; text-align: center; padding: 0.4rem 0;
`;

const BonusStampBtn = styled.button`
  width: 100%;
  padding: 5px 10px;
  border-radius: 0;
  border: 1px dashed rgba(26,26,26,0.25);
  background: transparent;
  font-family: 'Montserrat', sans-serif;
  color: rgba(26,26,26,0.6);
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.35rem;
  transition: background 0.18s, border-color 0.18s, color 0.18s;
  &:hover { background: rgba(196,30,58,0.08); border-color: ${RED}; color: ${RED}; }
`;

const BonusStampTag = styled.span`
  flex: 1;
  display: flex;
  align-items: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.86rem;
  color: ${RED};
  font-weight: 700;
`;
