import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { GearIcon, TrophyIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const FIELDS = [
  { key: 'cycleLength',        label: 'Cycle length (stamps per full cycle)',   hint: 'e.g. 50 — after this many stamps the cycle resets to Bronze' },
  { key: 'rewardInterval',     label: 'Reward interval (every N stamps)',        hint: 'e.g. 3 — a reward is earned every 3rd stamp in the cycle' },
  { key: 'birthdayWindowDays', label: 'Birthday window (days either side)',      hint: 'e.g. 7 — bonus stamp activates up to 7 days before or after birthday' },
  { key: 'bronzeMax',          label: 'Bronze tier — up to stamp #',            hint: 'e.g. 9 — Bronze covers stamps 1 through this value' },
  { key: 'silverMax',          label: 'Silver tier — up to stamp #',            hint: 'Must be higher than Bronze max. e.g. 21' },
  { key: 'goldMax',            label: 'Gold tier — up to stamp #',              hint: 'Must be higher than Silver max. Platinum fills the rest up to cycle length.' },
];

const DISCOUNT_FIELDS = [
  { key: 'silverDiscount',   label: 'Silver discount (%)',   hint: 'Auto-applied at checkout for Silver members' },
  { key: 'goldDiscount',     label: 'Gold discount (%)',     hint: 'Auto-applied at checkout for Gold members' },
  { key: 'platinumDiscount', label: 'Platinum discount (%)', hint: 'Auto-applied at checkout for Platinum members' },
];

const AdminLoyaltySettings = () => {
  const [settings, setSettings] = useState({
    cycleLength: 50, rewardInterval: 3, birthdayWindowDays: 7,
    bronzeMax: 9, silverMax: 21, goldMax: 36,
    silverDiscount: 5, goldDiscount: 10, platinumDiscount: 15,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');
  const [error, setError]   = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/loyalty-settings/settings');
      setSettings(res.data.settings);
    } catch { setError('Failed to load settings'); }
  };

  const handleSave = async () => {
    setSaving(true); setMsg(''); setError('');
    try {
      await api.put('/loyalty-settings/settings', settings);
      setMsg('Settings saved.');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally { setSaving(false); }
  };

  const s = settings;
  const tierPreview = [
    { label: 'Bronze',   range: `1 – ${s.bronzeMax}` },
    { label: 'Silver',   range: `${s.bronzeMax + 1} – ${s.silverMax}` },
    { label: 'Gold',     range: `${s.silverMax + 1} – ${s.goldMax}` },
    { label: 'Platinum', range: `${s.goldMax + 1} – ${s.cycleLength}` },
  ];

  return (
    <FormCard>
      <PanelTitle><GearIcon /> Loyalty Settings</PanelTitle>
      <InfoBox>
        Changes take effect on the customer's next visit. Existing stamp counts are not affected —
        only how their progress is calculated going forward.
      </InfoBox>

      <TierPreviewTitle><TrophyIcon /> Tier Preview</TierPreviewTitle>
      <TierPreview>
        {tierPreview.map(t => (
          <TierChip key={t.label}><strong>{t.label}</strong> stamps {t.range}</TierChip>
        ))}
      </TierPreview>

      {FIELDS.map(({ key, label, hint }) => (
        <FieldGroup key={key}>
          <FieldLabel>{label}</FieldLabel>
          <NumInput
            type="number"
            min="1"
            value={settings[key] ?? ''}
            onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
          />
          <Hint>{hint}</Hint>
        </FieldGroup>
      ))}

      <DiscountSection>
        <DiscountTitle>MEMBER TIER DISCOUNTS</DiscountTitle>
        <DiscountInfo>Automatically applied at checkout when a member is logged in. Set to 0 to disable.</DiscountInfo>
        {DISCOUNT_FIELDS.map(({ key, label, hint }) => (
          <FieldGroup key={key}>
            <FieldLabel>{label}</FieldLabel>
            <NumInput
              type="number" min="0" max="100" step="0.5"
              value={settings[key] ?? ''}
              onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
            />
            <Hint>{hint}</Hint>
          </FieldGroup>
        ))}
      </DiscountSection>

      {msg   && <StatusMsg $ok>{msg}</StatusMsg>}
      {error && <StatusMsg>{error}</StatusMsg>}

      <SaveButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Settings'}
      </SaveButton>
    </FormCard>
  );
};

export default AdminLoyaltySettings;

const FormCard = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(26,26,26,0.1);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 580px;
  margin: 0 auto 2rem;
`;

const PanelTitle = styled.h2`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center; margin-bottom: 0.9rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: 1.6rem; color: ${INK};

  svg { width: 22px; height: 22px; }
`;

const InfoBox = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.81rem;
  font-weight: 600;
  color: rgba(26,26,26,0.6);
  background: rgba(255,255,255,0.4);
  border-left: 2px solid ${RED};
  padding: 0.65rem 0.9rem;
  line-height: 1.55;
  margin-bottom: 1.2rem;
`;

const TierPreviewTitle = styled.p`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: 0.85rem;
  color: ${INK};
  margin: 0 0 0.6rem;

  svg { width: 16px; height: 16px; }
`;

const TierPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.3rem;
`;

const TierChip = styled.span`
  background: rgba(196,30,58,0.08);
  border: 1px solid rgba(196,30,58,0.3);
  border-radius: 999px;
  padding: 4px 12px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.74rem;
  font-weight: 600;
  color: ${RED};
  strong { margin-right: 0.3rem; }
`;

const FieldGroup = styled.div`margin-bottom: 1.1rem;`;

const FieldLabel = styled.label`
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  color: rgba(26,26,26,0.7);
  font-weight: 700;
  margin-bottom: 0.35rem;
`;

const NumInput = styled.input`
  width: 120px;
  padding: 0.52rem 0.75rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.92rem;
  outline: none;
  &:focus { border-color: ${RED}; }
  &::placeholder { color: rgba(26,26,26,0.35); }
`;

const Hint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(26,26,26,0.5);
  margin-top: 0.25rem;
  font-style: italic;
`;

const StatusMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
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
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #a8182f; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const DiscountSection = styled.div`
  margin: 1.8rem 0 0.5rem;
  padding-top: 1.4rem;
  border-top: 1px solid rgba(26,26,26,0.1);
`;

const DiscountTitle = styled.p`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 4px;
  text-transform: uppercase; color: ${RED}; margin: 0 0 0.5rem;
`;

const DiscountInfo = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem; font-weight: 600; color: rgba(26,26,26,0.5);
  margin: 0 0 1rem; line-height: 1.5;
`;
