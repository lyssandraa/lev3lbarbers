import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import styled from 'styled-components';
import api from '../utils/api';
import { CameraIcon, MailIcon, CakeIcon, GiftIcon, TargetIcon } from '../common/icons.jsx';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const TIER_THEMES = {
  BRONZE:   { label: 'Bronze',   color: '#d4a853' },
  SILVER:   { label: 'Silver',   color: '#8a93a3' },
  GOLD:     { label: 'Gold',     color: '#caa400' },
  PLATINUM: { label: 'Platinum', color: '#7d8aa8' },
};

const AdminStamps = () => {
  const [mode, setMode] = useState('scan'); // 'scan' | 'email'

  // Scan / email state
  const [isScanning, setIsScanning] = useState(false);
  const [email, setEmail]           = useState('');
  const [userData, setUserData]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [adding, setAdding]         = useState(false);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');

  // Claimed-rewards popup
  const [claimedRewards, setClaimedRewards] = useState([]);   // rewards auto-claimed this visit
  const [deferred, setDeferred]             = useState(new Set()); // ids being deferred
  const [showPopup, setShowPopup]           = useState(false);

  // Birthday override state
  const [showBdOverride, setShowBdOverride] = useState(false);
  const [bdOverride, setBdOverride]         = useState({ month: '', day: '' });
  const [bdSaving, setBdSaving]             = useState(false);
  const [bdMsg, setBdMsg]                   = useState('');

  const clearMessages = () => { setSuccess(''); setError(''); };

  /* ─── Scan flow ─────────────────────────────── */

  const handleScan = async (detectedCodes) => {
    if (!detectedCodes?.length) return;
    const scannedEmail = detectedCodes[0].rawValue;
    setIsScanning(false);
    // The wallet payment QR (a /pay/ link) sits next to the stamp QR
    if (scannedEmail.includes('/pay/')) {
      setError("That's the customer's wallet QR. Open it to charge their wallet, or scan their Stamps QR here.");
      return;
    }
    await addStampForEmail(scannedEmail, true);
  };

  const handleScanError = (err) => {
    console.error('Scanner error:', err);
    setError('Camera error. Please try again.');
    setIsScanning(false);
  };

  /* ─── Email flow ─────────────────────────────── */

  const lookupUser = async () => {
    if (!email.trim()) return;
    setLoading(true);
    clearMessages();
    setUserData(null);
    try {
      const res = await api.get(`/stamps/user?email=${encodeURIComponent(email.trim())}`);
      setUserData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Customer not found');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Stamp adding ───────────────────────────── */

  const addStampForEmail = async (targetEmail, fetchAfter = false) => {
    setAdding(true);
    clearMessages();
    try {
      const res = await api.post('/stamps/add-stamp', { email: targetEmail.trim() });
      setSuccess('Stamp added!');

      // Show bonus stamp notification inline
      if (res.data.newReward?.type === 'BONUS_STAMP') {
        setSuccess('Stamp added! Bonus stamp also applied to loyalty card.');
      }

      // Show claimed-rewards popup
      if (res.data.claimedRewards?.length > 0) {
        setClaimedRewards(res.data.claimedRewards);
        setDeferred(new Set());
        setShowPopup(true);
      }

      if (fetchAfter) {
        const updated = await api.get(`/stamps/user?email=${encodeURIComponent(targetEmail.trim())}`);
        setUserData(updated.data);
        setEmail(targetEmail.trim());
      } else if (userData) {
        const updated = await api.get(`/stamps/user?email=${encodeURIComponent(userData.email)}`);
        setUserData(updated.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stamp');
    } finally {
      setAdding(false);
    }
  };

  /* ─── Defer reward ("save for next visit") ──── */

  const toggleDefer = (rewardId) => {
    setDeferred(prev => {
      const next = new Set(prev);
      next.has(rewardId) ? next.delete(rewardId) : next.add(rewardId);
      return next;
    });
  };

  const confirmPopup = async () => {
    // Defer any selected rewards back to UNCLAIMED
    for (const id of deferred) {
      try {
        await api.post('/stamps/defer-reward', { rewardId: id });
      } catch (err) {
        console.error('Failed to defer reward', id, err);
      }
    }
    setShowPopup(false);
    setClaimedRewards([]);
    setDeferred(new Set());
  };

  /* ─── Birthday override ─────────────────────── */

  const saveBdOverride = async () => {
    if (!userData?.id || !bdOverride.month || !bdOverride.day) return;
    setBdSaving(true);
    setBdMsg('');
    try {
      await api.put(`/auth/admin/users/${userData.id}/birthday`, {
        birthdayMonth: parseInt(bdOverride.month),
        birthdayDay:   parseInt(bdOverride.day),
      });
      setBdMsg('Birthday updated.');
      setShowBdOverride(false);
      setTimeout(() => setBdMsg(''), 3000);
    } catch (err) {
      setBdMsg(err.response?.data?.message || 'Failed to update birthday.');
    } finally { setBdSaving(false); }
  };

  /* ─── Helpers ─────────────────────────────────── */

  const resetAll = () => {
    setUserData(null);
    setEmail('');
    setIsScanning(false);
    clearMessages();
  };

  const theme = userData ? (TIER_THEMES[userData.tier] || TIER_THEMES.BRONZE) : null;

  /* ─── Render ──────────────────────────────────── */

  return (
    <FormCard>
      <PanelTitle>Stamp Manager</PanelTitle>

      <ModeToggle>
        <ModeBtn $active={mode === 'scan'}  onClick={() => { setMode('scan');  resetAll(); }}>
          <CameraIcon width={14} height={14} style={{ color: 'inherit' }} /> Scan QR
        </ModeBtn>
        <ModeBtn $active={mode === 'email'} onClick={() => { setMode('email'); resetAll(); }}>
          <MailIcon width={14} height={14} style={{ color: 'inherit' }} /> Search Email
        </ModeBtn>
      </ModeToggle>

      {/* ── Scan mode ──────────────────────────── */}
      {mode === 'scan' && !userData && (
        <>
          <ScanInstruction>
            Ask the customer to open their profile and show their <strong>My Barber QR</strong>.
          </ScanInstruction>
          <ScanButton $active={isScanning} onClick={() => { clearMessages(); setIsScanning(p => !p); }}>
            {isScanning ? 'Stop Camera' : 'Start Scanning'}
          </ScanButton>
          {isScanning && (
            <ScannerWrapper>
              <Scanner onScan={handleScan} onError={handleScanError}
                constraints={{ facingMode: 'environment' }} videoStyle={{ width: '100%' }} />
            </ScannerWrapper>
          )}
          {adding && <StatusMsg>Adding stamp…</StatusMsg>}
        </>
      )}

      {/* ── Email mode ─────────────────────────── */}
      {mode === 'email' && !userData && (
        <SearchRow>
          <Input placeholder="Customer email address" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookupUser()} />
          <LookupButton onClick={lookupUser} disabled={loading}>
            {loading ? 'Searching…' : 'Look Up'}
          </LookupButton>
        </SearchRow>
      )}

      {error   && <ErrorMsg>{error}</ErrorMsg>}
      {success && !showPopup && <SuccessMsg>{success}</SuccessMsg>}

      {/* ── Customer card ──────────────────────── */}
      {userData && theme && (
        <UserCard>
          <UserHeader>
            <UserName>{userData.name || 'Customer'}</UserName>
            <TierBadge $color={theme.color}>{theme.label} · {userData.stampsInCycle}/50</TierBadge>
          </UserHeader>
          <UserEmail>{userData.email}</UserEmail>

          <StatsRow>
            <Stat><StatVal $color={theme.color}>{userData.stampsInCycle}</StatVal><StatLab>This cycle</StatLab></Stat>
            <Stat><StatVal $color={theme.color}>{userData.stampCycle}</StatVal><StatLab>Cycles done</StatLab></Stat>
            <Stat><StatVal $color={theme.color}>{userData.stampsToNextReward ?? '?'}</StatVal><StatLab>To next reward</StatLab></Stat>
          </StatsRow>

          {/* Birthday override */}
          <BdRow>
            <BdInfo>
              <CakeIcon width={13} height={13} style={{ color: 'inherit', marginRight: '4px', verticalAlign: '-2px' }} />
              {userData.birthdayMonth && userData.birthdayDay
                ? `Birthday: ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][userData.birthdayMonth - 1]} ${userData.birthdayDay}`
                : 'No birthday set'}
            </BdInfo>
            <BdOverrideBtn onClick={() => setShowBdOverride(p => !p)}>
              {showBdOverride ? 'Cancel' : 'Override'}
            </BdOverrideBtn>
          </BdRow>
          {showBdOverride && (
            <BdOverrideRow>
              <BdSelect
                value={bdOverride.month}
                onChange={e => setBdOverride(b => ({ ...b, month: e.target.value }))}
              >
                <option value="">Month</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </BdSelect>
              <BdDayInput
                type="number" min="1" max="31" placeholder="Day"
                value={bdOverride.day}
                onChange={e => setBdOverride(b => ({ ...b, day: e.target.value }))}
              />
              <BdSaveBtn onClick={saveBdOverride} disabled={bdSaving}>
                {bdSaving ? '…' : 'Save'}
              </BdSaveBtn>
            </BdOverrideRow>
          )}
          {bdMsg && <SuccessMsg style={{ marginBottom: '0.5rem' }}>{bdMsg}</SuccessMsg>}

          {userData.pendingRewards?.length > 0 && (
            <PendingBox $color={theme.color}>
              <strong>Unclaimed rewards (will be given on this visit):</strong>
              {userData.pendingRewards.map(r => (
                <div key={r.id}><GiftIcon width={13} height={13} style={{ color: 'inherit', marginRight: '4px', verticalAlign: '-2px' }} /> {r.rewardValue || r.rewardType}</div>
              ))}
            </PendingBox>
          )}

          <AddButton onClick={() => addStampForEmail(userData.email)} disabled={adding}>
            {adding ? 'Adding…' : '+ Add Stamp'}
          </AddButton>
          <BackButton onClick={resetAll}>Done</BackButton>
        </UserCard>
      )}

      {/* ── Claimed-rewards popup ──────────────── */}
      {showPopup && (
        <PopupOverlay>
          <Popup>
            <PopupTitle>
              <GiftIcon width={16} height={16} style={{ color: RED, marginRight: '6px', verticalAlign: '-3px' }} />
              Give {userData?.name || 'customer'} the following:
            </PopupTitle>
            <PopupList>
              {claimedRewards.map(r => (
                <PopupRow key={r.id} $deferred={deferred.has(r.id)}>
                  <PopupReward>
                    <PopupType>{r.rewardType}</PopupType>
                    <PopupValue>{r.rewardValue || '—'}</PopupValue>
                  </PopupReward>
                  <DeferBtn
                    $active={deferred.has(r.id)}
                    onClick={() => toggleDefer(r.id)}
                    title="Save for next visit instead"
                  >
                    {deferred.has(r.id) ? '↩ Undo' : 'Next visit'}
                  </DeferBtn>
                </PopupRow>
              ))}
            </PopupList>
            {deferred.size > 0 && (
              <DeferNote>{deferred.size} reward{deferred.size > 1 ? 's' : ''} will be saved for the next visit.</DeferNote>
            )}
            <DoneBtn onClick={confirmPopup}>Done</DoneBtn>
          </Popup>
        </PopupOverlay>
      )}
    </FormCard>
  );
};

export default AdminStamps;

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
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const PanelTitle = styled.h2`
  text-align: center;
  margin-bottom: 1.2rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: 1.6rem;
  color: ${INK};
`;

const ModeToggle = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.4rem;
  background: rgba(26,26,26,0.05);
  border-radius: 0;
  padding: 4px;
`;

const ModeBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0.5rem 0.8rem;
  border-radius: 0;
  border: none;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  background: ${({ $active }) => $active ? RED : 'transparent'};
  color: ${({ $active }) => $active ? '#fff' : 'rgba(26,26,26,0.55)'};
  white-space: nowrap;
  &:hover { background: ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.08)'}; }
`;

const ScanInstruction = styled.p`
  color: rgba(26,26,26,0.6);
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.88rem;
  text-align: center;
  margin-bottom: 1rem;
  line-height: 1.4;
  strong { color: ${RED}; }
`;

const ScanButton = styled.button`
  padding: 0.75rem 1.8rem;
  border-radius: 0;
  border: none;
  background: ${({ $active }) => $active ? '#e57373' : RED};
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 1.2rem;
  transition: background 0.2s;
  &:hover { background: ${({ $active }) => $active ? '#d15f5f' : '#a01830'}; }
`;

const ScannerWrapper = styled.div`
  width: 100%;
  max-width: 400px;
  border-radius: 0;
  overflow: hidden;
  border: 2px solid rgba(26,26,26,0.15);
  margin-bottom: 1rem;
`;

const StatusMsg = styled.p`color: ${RED}; font-family: 'Montserrat', sans-serif; font-size: 0.92rem; margin-top: 0.5rem;`;
const SuccessMsg = styled.p`color: #2e7d32; font-family: 'Montserrat', sans-serif; font-size: 0.88rem; margin: 0.5rem 0; text-align: center;`;
const ErrorMsg   = styled.p`color: ${RED}; font-family: 'Montserrat', sans-serif; font-size: 0.88rem; margin: 0.5rem 0; text-align: center;`;

const SearchRow = styled.div`display: flex; gap: 0.6rem; width: 100%; margin-bottom: 0.5rem;`;

const Input = styled.input`
  flex: 1;
  padding: 0.6rem 0.9rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.95rem;
  outline: none;
  &::placeholder { color: rgba(26,26,26,0.35); }
  &:focus { border-color: ${RED}; }
`;

const LookupButton = styled.button`
  padding: 0.6rem 1.2rem;
  border-radius: 0;
  border: none;
  background: ${RED};
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  &:hover:not(:disabled) { background: #a01830; }
  &:disabled { opacity: 0.6; cursor: default; }
`;

const UserCard = styled.div`
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(26,26,26,0.1);
  border-radius: 0;
  padding: 1.2rem;
  width: 100%;
`;

const UserHeader = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.2rem;`;
const UserName = styled.p`font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; color: ${INK};`;

const TierBadge = styled.span`
  background: ${({ $color }) => $color};
  color: #fff;
  padding: 3px 10px;
  border-radius: 12px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const UserEmail = styled.p`font-family: 'Montserrat', sans-serif; font-size: 0.82rem; color: rgba(26,26,26,0.55); font-weight: 600; margin-bottom: 0.9rem;`;

const StatsRow = styled.div`display: flex; gap: 0.5rem; margin-bottom: 0.9rem;`;
const Stat = styled.div`flex: 1; background: rgba(26,26,26,0.04); border: 1px solid rgba(26,26,26,0.08); border-radius: 0; padding: 0.55rem; text-align: center;`;
const StatVal = styled.p`font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem; font-weight: 700; color: ${({ $color }) => $color}; margin: 0;`;
const StatLab = styled.p`font-family: 'Montserrat', sans-serif; font-size: 0.65rem; color: rgba(26,26,26,0.55); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin: 0;`;

const PendingBox = styled.div`
  background: rgba(26,26,26,0.03);
  border: 1px solid ${({ $color }) => `${$color}50`};
  border-radius: 0;
  padding: 0.7rem 0.9rem;
  margin-bottom: 0.9rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  color: ${INK};
  line-height: 1.6;
`;

const ButtonRow = styled.div`display: flex; gap: 0.6rem; margin-top: 0.2rem; width: 100%;`;

const AddButton = styled.button`
  flex: 1;
  width: 100%;
  padding: 0.75rem;
  border-radius: 0;
  border: none;
  background: ${RED};
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 0.6rem;
  &:hover:not(:disabled) { background: #a01830; }
  &:disabled { opacity: 0.6; cursor: default; }
`;

const BackButton = styled.button`
  width: 100%;
  padding: 0.75rem 1.2rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: transparent;
  color: rgba(26,26,26,0.55);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  &:hover { border-color: ${INK}; color: ${INK}; }
`;

/* Birthday override */
const BdRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
`;
const BdInfo = styled.span`
  display: flex;
  align-items: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(26,26,26,0.55);
`;
const BdOverrideBtn = styled.button`
  padding: 3px 10px;
  border-radius: 5px;
  border: 1px solid rgba(196,30,58,0.4);
  background: transparent;
  color: ${RED};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { opacity: 0.75; }
`;
const BdOverrideRow = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
`;
const BdSelect = styled.select`
  flex: 1;
  padding: 5px 8px;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  outline: none;
  &:focus { border-color: ${RED}; }
  option { background: #ffffff; }
`;
const BdDayInput = styled.input`
  width: 60px;
  padding: 5px 8px;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  outline: none;
  &::placeholder { color: rgba(26,26,26,0.35); }
  &:focus { border-color: ${RED}; }
`;
const BdSaveBtn = styled.button`
  padding: 5px 12px;
  border-radius: 0;
  border: none;
  background: ${RED};
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  &:hover:not(:disabled) { background: #a01830; }
  &:disabled { opacity: 0.6; cursor: default; }
`;

/* Popup */
const PopupOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(26,26,26,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
`;

const Popup = styled.div`
  background: #f4f0e8;
  border: 1px solid rgba(26,26,26,0.12);
  border-top: 3px solid ${RED};
  border-radius: 0;
  padding: 1.8rem 1.6rem;
  max-width: 420px;
  width: 100%;
`;

const PopupTitle = styled.h3`
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 1.1rem;
  font-weight: 700;
  color: ${INK};
  margin-bottom: 1.1rem;
  text-align: center;
`;

const PopupList = styled.div`display: flex; flex-direction: column; gap: 0.55rem; margin-bottom: 1rem;`;

const PopupRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ $deferred }) => $deferred ? 'rgba(26,26,26,0.03)' : 'rgba(196,30,58,0.08)'};
  border: 1px solid ${({ $deferred }) => $deferred ? 'rgba(26,26,26,0.1)' : 'rgba(196,30,58,0.3)'};
  border-radius: 0;
  padding: 0.6rem 0.8rem;
  transition: background 0.2s, border-color 0.2s;
  opacity: ${({ $deferred }) => $deferred ? 0.6 : 1};
`;

const PopupReward = styled.div``;
const PopupType = styled.p`font-family: 'Montserrat', sans-serif; font-size: 0.7rem; color: rgba(26,26,26,0.55); font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 0.15rem;`;
const PopupValue = styled.p`font-family: 'Montserrat', sans-serif; font-size: 0.95rem; color: ${INK}; font-weight: 600;`;

const DeferBtn = styled.button`
  padding: 5px 12px;
  border-radius: 0;
  border: 1px solid ${({ $active }) => $active ? 'rgba(26,26,26,0.25)' : 'rgba(196,30,58,0.45)'};
  background: transparent;
  color: ${({ $active }) => $active ? 'rgba(26,26,26,0.55)' : RED};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  &:hover { opacity: 0.75; }
`;

const DeferNote = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  color: rgba(26,26,26,0.55);
  font-weight: 600;
  text-align: center;
  margin-bottom: 0.75rem;
  font-style: italic;
`;

const DoneBtn = styled.button`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0;
  border: none;
  background: ${RED};
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 2px;
  cursor: pointer;
  &:hover { background: #a01830; }
`;
