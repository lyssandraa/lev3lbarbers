import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import RewardPicker from '../common/RewardPicker';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const MILESTONES = [
  { rewardKey: 'reward1', typeKey: 'reward1Type', label: 'Milestone 1 — 1 referral' },
  { rewardKey: 'reward2', typeKey: 'reward2Type', label: 'Milestone 2 — 3 referrals' },
  { rewardKey: 'reward3', typeKey: 'reward3Type', label: 'Milestone 3 — 5 referrals (then resets)' },
];

const toPickerValue = (settings, typeKey, rewardKey) => ({
  type: settings[typeKey] || 'CUSTOM',
  text: settings[rewardKey] || '',
});

const AdminReferrals = () => {
  const [settings, setSettings] = useState({
    isActive: true,
    reward1Type: 'CUSTOM', reward1: '',
    reward2Type: 'CUSTOM', reward2: '',
    reward3Type: 'CUSTOM', reward3: '',
  });
  const [referrals, setReferrals] = useState([]);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [error, setError]         = useState('');

  useEffect(() => {
    fetchSettings();
    fetchReferrals();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/referrals/settings');
      setSettings(res.data.settings);
    } catch { setError('Failed to load settings'); }
  };

  const fetchReferrals = async () => {
    try {
      const res = await api.get('/referrals/all');
      setReferrals(res.data.referrals);
    } catch { /* non-critical */ }
  };

  const handlePickerChange = (typeKey, rewardKey) => (val) => {
    setSettings(s => ({ ...s, [typeKey]: val.type, [rewardKey]: val.text }));
  };

  const handleSave = async () => {
    setSaving(true); setMsg(''); setError('');
    try {
      await api.put('/referrals/settings', settings);
      setMsg('Settings saved.');
      setTimeout(() => setMsg(''), 3000);
    } catch { setError('Failed to save settings.'); }
    finally { setSaving(false); }
  };

  const pending   = referrals.filter(r => r.status === 'PENDING').length;
  const completed = referrals.filter(r => r.status === 'COMPLETED').length;

  return (
    <FormCard>
      <PanelTitle>Referral System</PanelTitle>

      {/* Toggle */}
      <ToggleRow>
        <ToggleLabel>System Status</ToggleLabel>
        <ToggleTrack $active={settings.isActive} onClick={() => setSettings(s => ({ ...s, isActive: !s.isActive }))}>
          <ToggleThumb $active={settings.isActive} />
          <ToggleText $active={settings.isActive}>{settings.isActive ? 'ACTIVE' : 'INACTIVE'}</ToggleText>
        </ToggleTrack>
      </ToggleRow>
      {!settings.isActive && (
        <InactiveNote>Referral system is disabled. Codes will not be accepted at signup.</InactiveNote>
      )}

      <Divider />

      <SectionLabel>Milestone Rewards</SectionLabel>
      <MilestoneHint>Select the reward type for each milestone. Leave Custom blank to skip issuing a reward.</MilestoneHint>

      {MILESTONES.map(({ rewardKey, typeKey, label }) => (
        <RewardPicker
          key={rewardKey}
          label={label}
          value={toPickerValue(settings, typeKey, rewardKey)}
          onChange={handlePickerChange(typeKey, rewardKey)}
        />
      ))}

      {msg   && <StatusMsg $ok>{msg}</StatusMsg>}
      {error && <StatusMsg>{error}</StatusMsg>}

      <SaveButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Settings'}
      </SaveButton>

      <Divider />

      {/* Stats */}
      <SectionLabel>Overview</SectionLabel>
      <StatsRow>
        <StatBox><StatNum>{pending}</StatNum><StatLab>Pending</StatLab></StatBox>
        <StatBox><StatNum>{completed}</StatNum><StatLab>Completed</StatLab></StatBox>
        <StatBox><StatNum>{referrals.length}</StatNum><StatLab>Total</StatLab></StatBox>
      </StatsRow>

      {referrals.length > 0 ? (
        <TableScroll>
          <ReferralTable>
            <thead>
              <tr>
                <Th>Referrer</Th>
                <Th>Referred Email</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(r => (
                <tr key={r.id}>
                  <Td>{r.referrer?.name} <Email>({r.referrer?.email})</Email></Td>
                  <Td>{r.refereeEmail}</Td>
                  <Td><Badge $completed={r.status === 'COMPLETED'}>{r.status}</Badge></Td>
                  <Td>{new Date(r.createdAt).toLocaleDateString()}</Td>
                </tr>
              ))}
            </tbody>
          </ReferralTable>
        </TableScroll>
      ) : (
        <EmptyText>No referrals yet.</EmptyText>
      )}
    </FormCard>
  );
};

export default AdminReferrals;

/* ─────────── Styles ─────────── */

const FormCard = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(26,26,26,0.1);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 700px;
  margin: 0 auto 2rem;
`;

const PanelTitle = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${INK};
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const ToggleLabel = styled.span`
  font-family: 'Bebas Neue', sans-serif;
  color: ${RED};
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const ToggleTrack = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ $active }) => $active ? 'rgba(196,30,58,0.1)' : 'rgba(26,26,26,0.05)'};
  border: 1px solid ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.18)'};
  border-radius: 999px;
  padding: 0.35rem 0.75rem 0.35rem 0.45rem;
  cursor: pointer;
  transition: background 0.25s, border-color 0.25s;
  user-select: none;
`;

const ToggleThumb = styled.div`
  width: 18px; height: 18px;
  border-radius: 50%;
  background: ${({ $active }) => $active ? RED : '#9e9e9e'};
  transition: background 0.25s;
  flex-shrink: 0;
`;

const ToggleText = styled.span`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.5)'};
`;

const InactiveNote = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(26,26,26,0.55);
  margin: 0.25rem 0 0;
  font-style: italic;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(26,26,26,0.1);
  margin: 1.4rem 0;
`;

const SectionLabel = styled.p`
  font-family: 'Bebas Neue', sans-serif;
  color: ${RED};
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
`;

const MilestoneHint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(26,26,26,0.55);
  margin-bottom: 1rem;
  font-style: italic;
`;

const StatusMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ $ok }) => $ok ? '#2e7d32' : RED};
  margin: 0.5rem 0;
  text-align: center;
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0;
  border: none;
  cursor: pointer;
  background: ${RED};
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 0.25rem;
  transition: background 0.2s, transform 0.1s;
  &:hover:not(:disabled) { background: #a51830; transform: scale(1.01); }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const StatsRow = styled.div`display: flex; gap: 1rem; margin-bottom: 1.2rem;`;

const StatBox = styled.div`
  flex: 1;
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(26,26,26,0.1);
  border-radius: 0;
  padding: 1rem;
  text-align: center;
`;

const StatNum = styled.p`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: ${RED};
  margin: 0 0 0.2rem;
`;
const StatLab = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: rgba(26,26,26,0.55);
  text-transform: uppercase;
  margin: 0;
`;

const TableScroll = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const ReferralTable = styled.table`
  width: 100%;
  min-width: 480px;
  border-collapse: collapse;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.83rem;
  color: ${INK};
`;

const Th = styled.th`
  text-align: left;
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid rgba(26,26,26,0.15);
  font-family: 'Bebas Neue', sans-serif;
  color: ${RED};
  font-size: 0.78rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-weight: 700;
`;

const Td = styled.td`
  padding: 0.55rem 0.6rem;
  border-bottom: 1px solid rgba(26,26,26,0.08);
  vertical-align: middle;
`;

const Email = styled.span`
  color: rgba(26,26,26,0.55);
  font-weight: 600;
  font-size: 0.76rem;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: ${({ $completed }) => $completed ? 'rgba(46,125,50,0.12)' : 'rgba(196,30,58,0.1)'};
  color: ${({ $completed }) => $completed ? '#2e7d32' : RED};
  border: 1px solid ${({ $completed }) => $completed ? 'rgba(46,125,50,0.4)' : 'rgba(196,30,58,0.35)'};
`;

const EmptyText = styled.p`
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  color: rgba(26,26,26,0.55);
  font-weight: 600;
  font-style: italic;
  font-size: 0.88rem;
`;
