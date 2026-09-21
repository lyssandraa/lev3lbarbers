import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { ClockIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const FIELDS = [
  { key: 'stampDays',      label: 'Stamp rewards',     hint: 'Default: 60 days' },
  { key: 'referralDays',   label: 'Referral rewards',  hint: 'Leave blank = never expire' },
  { key: 'mysteryBoxDays', label: 'Mystery box',        hint: 'Leave blank = never expire' },
  { key: 'gameWinDays',    label: 'Weekly game prize',  hint: 'Days a winner has to redeem in store. Default: 7 days' },
];

const AdminExpiry = () => {
  const [settings, setSettings] = useState({ stampDays: 60, referralDays: '', mysteryBoxDays: '', gameWinDays: 7 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');
  const [error, setError]   = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/expiry/settings');
      const s = res.data.settings;
      setSettings({
        stampDays:      s.stampDays      ?? '',
        referralDays:   s.referralDays   ?? '',
        mysteryBoxDays: s.mysteryBoxDays ?? '',
        gameWinDays:    s.gameWinDays    ?? '',
      });
    } catch { setError('Failed to load settings'); }
  };

  const handleSave = async () => {
    setSaving(true); setMsg(''); setError('');
    try {
      await api.put('/expiry/settings', settings);
      setMsg('Saved.');
      setTimeout(() => setMsg(''), 3000);
    } catch { setError('Failed to save settings.'); }
    finally { setSaving(false); }
  };

  return (
    <FormCard>
      <PanelTitle><ClockIcon /> Reward Expiry</PanelTitle>
      <InfoBox>
        Set how many days after being issued a reward expires if not collected at a visit.
        Birthday rewards always expire 7 days after the customer's birthday (end of the window).
      </InfoBox>

      {FIELDS.map(({ key, label, hint }) => (
        <FieldGroup key={key}>
          <FieldLabel>{label}</FieldLabel>
          <FieldRow>
            <Input
              type="number"
              min="1"
              placeholder="Days (blank = never)"
              value={settings[key]}
              onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
            />
            <Unit>days</Unit>
          </FieldRow>
          <Hint>{hint}</Hint>
        </FieldGroup>
      ))}

      {msg   && <StatusMsg $ok>{msg}</StatusMsg>}
      {error && <StatusMsg>{error}</StatusMsg>}

      <SaveButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Settings'}
      </SaveButton>
    </FormCard>
  );
};

export default AdminExpiry;

/* ─────────── Styles ─────────── */

const FormCard = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  width: 100%;
  max-width: 520px;
  margin: 0 auto 2rem;
`;

const PanelTitle = styled.h2`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
  margin-bottom: 0.9rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: 1.6rem;
  color: ${INK};

  svg { width: 1.3rem; height: 1.3rem; }
`;

const InfoBox = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.81rem;
  font-weight: 600;
  color: rgba(26,26,26,0.6);
  background: rgba(255,255,255,0.5);
  border-left: 2px solid ${RED};
  padding: 0.65rem 0.9rem;
  line-height: 1.55;
  margin-bottom: 1.5rem;
`;

const FieldGroup = styled.div`margin-bottom: 1.1rem;`;

const FieldLabel = styled.label`
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  color: rgba(26,26,26,0.7);
  font-weight: 700;
  margin-bottom: 0.4rem;
`;

const FieldRow = styled.div`display: flex; align-items: center; gap: 0.5rem;`;

const Input = styled.input`
  width: 120px;
  padding: 0.52rem 0.75rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.92rem;
  outline: none;
  &::placeholder { color: rgba(26,26,26,0.35); }
  &:focus { border-color: ${RED}; }
`;

const Unit = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  color: rgba(26,26,26,0.5);
`;

const Hint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem;
  color: rgba(26,26,26,0.5);
  margin-top: 0.25rem;
  font-style: italic;
`;

const StatusMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ $ok }) => $ok ? '#2e7d32' : '#c62828'};
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
  margin-top: 0.4rem;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #a3162e; }
  &:disabled { opacity: 0.5; cursor: default; }
`;
