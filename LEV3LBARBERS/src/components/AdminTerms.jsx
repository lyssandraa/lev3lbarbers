import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const AdminTerms = () => {
  const [content, setContent]   = useState('');
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [error, setError]       = useState('');

  useEffect(() => { fetchTerms(); }, []);

  const fetchTerms = async () => {
    try {
      const res = await api.get('/reward-terms');
      setContent(res.data.terms.content || '');
      setIsActive(res.data.terms.isActive || false);
    } catch { setError('Failed to load terms'); }
  };

  const handleSave = async () => {
    setSaving(true); setMsg(''); setError('');
    try {
      await api.put('/reward-terms', { content, isActive });
      setMsg('Terms saved.');
      setTimeout(() => setMsg(''), 3000);
    } catch { setError('Failed to save terms.'); }
    finally { setSaving(false); }
  };

  return (
    <FormCard>
      <PanelTitle>Reward Terms &amp; Conditions</PanelTitle>
      <InfoBox>
        These terms appear in the footer for all visitors. Use plain text — one clause per line works well.
        Toggle "Active Promotion" to show a visible asterisk badge next to the T&amp;C link so anyone browsing the site notices it.
      </InfoBox>

      {/* Active promotion toggle */}
      <ToggleRow>
        <ToggleLabel>Active Promotion</ToggleLabel>
        <ToggleTrack $active={isActive} onClick={() => setIsActive(a => !a)}>
          <ToggleThumb $active={isActive} />
          <ToggleText $active={isActive}>{isActive ? 'SHOWING BADGE' : 'HIDDEN'}</ToggleText>
        </ToggleTrack>
      </ToggleRow>
      {isActive && (
        <PromoNote>
          A pulsing ✦ badge will appear next to the Rewards T&amp;C link in the footer, visible to all visitors.
        </PromoNote>
      )}

      <Textarea
        rows={16}
        placeholder={PLACEHOLDER}
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      {msg   && <StatusMsg $ok>{msg}</StatusMsg>}
      {error && <StatusMsg>{error}</StatusMsg>}

      <SaveButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Terms'}
      </SaveButton>
    </FormCard>
  );
};

export default AdminTerms;

const PLACEHOLDER = `Example:

1. Rewards are issued as part of the LEV3L BARBERS loyalty programme and are subject to change.
2. Rewards must be presented and claimed in-shop at the time of your visit.
3. Rewards have no cash value and cannot be exchanged for money.
4. Unclaimed rewards expire after the period stated at the time of issue. Expired rewards cannot be reinstated.
5. Each reward can only be claimed once and is non-transferable.
6. The shop reserves the right to refuse or revoke a reward if misuse or fraud is suspected.
7. Birthday rewards are only issued during the 7-day window around your registered birthday (up to 7 days before or after).
8. Referral rewards are issued only once the referred friend has verified their email and visited the shop.
9. LEV3L BARBERS reserves the right to modify or discontinue the rewards programme at any time.`;

/* ─────────── Styles ─────────── */

const FormCard = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 680px;
  margin: 0 auto 2rem;
`;

const PanelTitle = styled.h2`
  text-align: center;
  margin-bottom: 0.9rem;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${INK};
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
  margin-bottom: 1.2rem;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const ToggleLabel = styled.span`
  font-family: 'Bebas Neue', sans-serif;
  color: ${RED};
  font-size: 0.95rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
`;

const ToggleTrack = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ $active }) => $active ? 'rgba(196,30,58,0.1)' : 'rgba(26,26,26,0.05)'};
  border: 1px solid ${({ $active }) => $active ? 'rgba(196,30,58,0.5)' : 'rgba(26,26,26,0.15)'};
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
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.55)'};
`;

const PromoNote = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(196,30,58,0.85);
  font-style: italic;
  margin: 0 0 1rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.84rem;
  line-height: 1.65;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 0.8rem;
  &::placeholder { color: rgba(26,26,26,0.35); }
  &:focus { border-color: ${RED}; }
`;

const StatusMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ $ok }) => $ok ? '#2e7d32' : '#c62828'};
  margin: 0 0 0.5rem;
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
  font-size: 1rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #a8182f; }
  &:disabled { opacity: 0.5; cursor: default; }
`;
