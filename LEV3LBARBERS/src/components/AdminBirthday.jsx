import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import RewardPicker from '../common/RewardPicker';
import { CakeIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const LEVELS = [
  { typeKey: 'level1Type', valueKey: 'level1Value', label: 'Bronze Birthday Reward' },
  { typeKey: 'level2Type', valueKey: 'level2Value', label: 'Silver Birthday Reward' },
  { typeKey: 'level3Type', valueKey: 'level3Value', label: 'Gold Birthday Reward' },
  { typeKey: 'level4Type', valueKey: 'level4Value', label: 'Platinum Birthday Reward' },
];

const toPickerValue = (settings, typeKey, valueKey) => ({
  type: settings[typeKey] || 'CUSTOM',
  text: settings[valueKey] || '',
});

const AdminBirthday = () => {
  const [settings, setSettings] = useState({
    isActive:   true,
    level1Type: 'CUSTOM', level1Value: '',
    level2Type: 'CUSTOM', level2Value: '',
    level3Type: 'CUSTOM', level3Value: '',
    level4Type: 'CUSTOM', level4Value: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');
  const [error, setError]   = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/birthday/settings');
      setSettings(res.data.settings);
    } catch { setError('Failed to load settings'); }
  };

  const handlePickerChange = (typeKey, valueKey) => (val) => {
    setSettings(s => ({ ...s, [typeKey]: val.type, [valueKey]: val.text }));
  };

  const handleSave = async () => {
    setSaving(true); setMsg(''); setError('');
    try {
      await api.put('/birthday/settings', settings);
      setMsg('Settings saved.');
      setTimeout(() => setMsg(''), 3000);
    } catch { setError('Failed to save settings.'); }
    finally { setSaving(false); }
  };

  return (
    <FormCard>
      <PanelTitle><CakeIcon /> Birthday Rewards</PanelTitle>

      <InfoBox>
        When a member scans their QR on or within 7 days of their birthday, they receive a bonus stamp and the reward configured for their loyalty level — once per year.
      </InfoBox>

      {/* Toggle */}
      <ToggleRow>
        <ToggleLabel>System Status</ToggleLabel>
        <ToggleTrack $active={settings.isActive} onClick={() => setSettings(s => ({ ...s, isActive: !s.isActive }))}>
          <ToggleThumb $active={settings.isActive} />
          <ToggleText $active={settings.isActive}>{settings.isActive ? 'ACTIVE' : 'INACTIVE'}</ToggleText>
        </ToggleTrack>
      </ToggleRow>
      {!settings.isActive && (
        <InactiveNote>Birthday rewards are disabled. Visits during birthday window will still add a normal stamp.</InactiveNote>
      )}

      <Divider />

      <SectionLabel>Rewards by Loyalty Level</SectionLabel>
      <Hint>Choose what a member receives at each loyalty level during their birthday window.</Hint>

      {LEVELS.map(({ typeKey, valueKey, label }) => (
        <RewardPicker
          key={typeKey}
          label={label}
          value={toPickerValue(settings, typeKey, valueKey)}
          onChange={handlePickerChange(typeKey, valueKey)}
        />
      ))}

      {msg   && <StatusMsg $ok>{msg}</StatusMsg>}
      {error && <StatusMsg>{error}</StatusMsg>}

      <SaveButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Settings'}
      </SaveButton>
    </FormCard>
  );
};

export default AdminBirthday;

/* ─────────── Styles ─────────── */

const FormCard = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem;
`;

const PanelTitle = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.6rem;
  color: ${INK};
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  svg { width: 1.3rem; height: 1.3rem; }
`;

const InfoBox = styled.p`
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(26,26,26,0.6);
  background: rgba(255,255,255,0.55);
  border-left: 2px solid ${RED};
  padding: 0.65rem 0.9rem;
  line-height: 1.55;
  margin-bottom: 1.3rem;
  font-family: 'Montserrat', sans-serif;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const ToggleLabel = styled.span`
  color: ${RED};
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-family: 'Bebas Neue', sans-serif;
`;

const ToggleTrack = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ $active }) => $active ? 'rgba(76,175,80,0.16)' : 'rgba(26,26,26,0.05)'};
  border: 1px solid ${({ $active }) => $active ? 'rgba(76,175,80,0.5)' : 'rgba(26,26,26,0.15)'};
  border-radius: 999px;
  padding: 0.35rem 0.75rem 0.35rem 0.45rem;
  cursor: pointer;
  transition: background 0.25s, border-color 0.25s;
  user-select: none;
`;

const ToggleThumb = styled.div`
  width: 18px; height: 18px;
  border-radius: 50%;
  background: ${({ $active }) => $active ? '#4caf50' : '#9e9e9e'};
  transition: background 0.25s;
  flex-shrink: 0;
`;

const ToggleText = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${({ $active }) => $active ? '#4caf50' : 'rgba(26,26,26,0.55)'};
  font-family: 'Montserrat', sans-serif;
`;

const InactiveNote = styled.p`
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(26,26,26,0.5);
  margin: 0.25rem 0 0;
  font-style: italic;
  font-family: 'Montserrat', sans-serif;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(26,26,26,0.1);
  margin: 1.4rem 0;
`;

const SectionLabel = styled.p`
  color: ${RED};
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
  font-family: 'Bebas Neue', sans-serif;
`;

const Hint = styled.p`
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(26,26,26,0.5);
  margin-bottom: 1rem;
  font-style: italic;
  font-family: 'Montserrat', sans-serif;
`;

const StatusMsg = styled.p`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ $ok }) => $ok ? '#2e7d32' : '#c62828'};
  margin: 0.5rem 0;
  text-align: center;
  font-family: 'Montserrat', sans-serif;
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0;
  border: none;
  cursor: pointer;
  background: ${RED};
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 0.25rem;
  transition: background 0.2s, transform 0.1s;
  font-family: 'Bebas Neue', sans-serif;
  &:hover:not(:disabled) { background: #a8172f; transform: scale(1.01); }
  &:disabled { opacity: 0.5; cursor: default; }
`;
