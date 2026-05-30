import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import styled from 'styled-components';
import api from '../utils/api';

const LEVEL_THEMES = {
  1: { label: 'Bronze', color: '#d4a853' },
  2: { label: 'Silver', color: '#c0c8d8' },
  3: { label: 'Gold',   color: '#ffd700' },
};

const AdminStamps = () => {
  const [mode, setMode]           = useState('scan'); // 'scan' | 'email'

  // Scan mode
  const [isScanning, setIsScanning] = useState(false);

  // Email mode
  const [email, setEmail]         = useState('');
  const [userData, setUserData]   = useState(null);
  const [loading, setLoading]     = useState(false);

  // Shared
  const [adding, setAdding]       = useState(false);
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');

  const clearMessages = () => { setSuccess(''); setError(''); };

  /* ─── Scan flow ─────────────────────────────────── */

  // @yudiel/react-qr-scanner v2 → array of IDetectedBarcode
  const handleScan = async (detectedCodes) => {
    if (!detectedCodes?.length) return;
    const scannedEmail = detectedCodes[0].rawValue;
    setIsScanning(false);
    await addStampForEmail(scannedEmail, true); // true = fetch user data to show result
  };

  const handleScanError = (err) => {
    console.error('Scanner error:', err);
    setError('Camera error. Please try again.');
    setIsScanning(false);
  };

  /* ─── Email flow ────────────────────────────────── */

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

  /* ─── Shared add-stamp logic ────────────────────── */

  const addStampForEmail = async (targetEmail, fetchAfter = false) => {
    setAdding(true);
    clearMessages();
    try {
      const res = await api.post('/stamps/add-stamp', { email: targetEmail.trim() });
      setSuccess(res.data.message || 'Stamp added!');

      if (fetchAfter) {
        const updated = await api.get(`/stamps/user?email=${encodeURIComponent(targetEmail.trim())}`);
        setUserData(updated.data);
        setEmail(targetEmail.trim());
      } else {
        // Refresh existing panel data
        const updated = await api.get(`/stamps/user?email=${encodeURIComponent(targetEmail.trim())}`);
        setUserData(updated.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stamp');
    } finally {
      setAdding(false);
    }
  };

  const resetAll = () => {
    setUserData(null);
    setEmail('');
    setIsScanning(false);
    clearMessages();
  };

  const theme = userData ? (LEVEL_THEMES[userData.level] || LEVEL_THEMES[1]) : null;

  return (
    <FormCard>
      <PanelTitle>Stamp Manager</PanelTitle>

      {/* Mode toggle */}
      <ModeToggle>
        <ModeBtn $active={mode === 'scan'} onClick={() => { setMode('scan'); resetAll(); }}>
          📷  Scan QR
        </ModeBtn>
        <ModeBtn $active={mode === 'email'} onClick={() => { setMode('email'); resetAll(); }}>
          ✉  Search Email
        </ModeBtn>
      </ModeToggle>

      {/* ── Scan mode ─────────────────────────────── */}
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
              <Scanner
                onScan={handleScan}
                onError={handleScanError}
                constraints={{ facingMode: 'environment' }}
                videoStyle={{ width: '100%' }}
              />
            </ScannerWrapper>
          )}

          {adding && <StatusMsg>Adding stamp…</StatusMsg>}
        </>
      )}

      {/* ── Email mode ────────────────────────────── */}
      {mode === 'email' && !userData && (
        <SearchRow>
          <Input
            placeholder="Customer email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookupUser()}
          />
          <LookupButton onClick={lookupUser} disabled={loading}>
            {loading ? 'Searching…' : 'Look Up'}
          </LookupButton>
        </SearchRow>
      )}

      {error   && <ErrorMsg>{error}</ErrorMsg>}
      {success && !userData && <SuccessMsg>{success}</SuccessMsg>}

      {/* ── Result card (shared) ─────────────────── */}
      {userData && theme && (
        <UserCard>
          <UserHeader>
            <UserName>{userData.name || 'Customer'}</UserName>
            <LevelBadge $color={theme.color}>{theme.label} · L{userData.level}</LevelBadge>
          </UserHeader>
          <UserEmail>{userData.email}</UserEmail>

          <StampsRow>
            {Array.from({ length: 9 }, (_, i) => (
              <StampDot
                key={i}
                $filled={i < userData.stampsOnCurrentCard}
                $milestone={(i + 1) % 3 === 0}
                $color={theme.color}
              />
            ))}
          </StampsRow>

          <StampCount $color={theme.color}>
            {userData.stampsOnCurrentCard}/9 stamps
            {userData.nextMilestone
              ? ` · ${userData.nextMilestone - userData.stampsOnCurrentCard} until next reward`
              : ''}
          </StampCount>

          {success && <SuccessMsg>{success}</SuccessMsg>}
          {error   && <ErrorMsg>{error}</ErrorMsg>}

          {userData.pendingRewards?.length > 0 && (
            <PendingBox $color={theme.color}>
              <strong>Pending rewards (applied automatically on next stamp):</strong>
              {userData.pendingRewards.map((r) => (
                <div key={r.id}>🎁 {r.rewardValue || r.rewardType}</div>
              ))}
            </PendingBox>
          )}

          <ButtonRow>
            <AddButton onClick={() => addStampForEmail(userData.email)} disabled={adding}>
              {adding ? 'Adding…' : '+ Add Stamp'}
            </AddButton>
            <BackButton onClick={resetAll}>Done</BackButton>
          </ButtonRow>
        </UserCard>
      )}
    </FormCard>
  );
};

export default AdminStamps;


const FormCard = styled.div`
  background: rgba(255,255,255,0.05);
  padding: 2rem;
  border-radius: 14px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PanelTitle = styled.h2`
  text-align: center;
  margin-bottom: 1.2rem;
  font-size: 1.6rem;
  color: #f5f2ed;
  text-shadow: 0 0 6px rgba(0,0,0,0.6);
`;

const ModeToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.4rem;
  background: rgba(255,255,255,0.06);
  border-radius: 10px;
  padding: 4px;
`;

const ModeBtn = styled.button`
  flex: 1;
  padding: 0.55rem 1rem;
  border-radius: 7px;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  background: ${({ $active }) => $active ? '#c8b88a' : 'transparent'};
  color: ${({ $active }) => $active ? '#000' : 'rgba(255,255,255,0.6)'};

  &:hover { background: ${({ $active }) => $active ? '#b2a072' : 'rgba(255,255,255,0.08)'}; }
`;

const ScanInstruction = styled.p`
  color: rgba(255,255,255,0.6);
  font-size: 0.88rem;
  text-align: center;
  margin-bottom: 1rem;
  line-height: 1.4;

  strong { color: #c8b88a; }
`;

const ScanButton = styled.button`
  padding: 0.75rem 1.8rem;
  border-radius: 8px;
  border: none;
  background: ${({ $active }) => $active ? '#e57373' : '#c8b88a'};
  color: ${({ $active }) => $active ? '#fff' : '#000'};
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 1.2rem;
  transition: background 0.2s;

  &:hover { background: ${({ $active }) => $active ? '#d15f5f' : '#b2a072'}; }
`;

const ScannerWrapper = styled.div`
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.15);
  margin-bottom: 1rem;
`;

const StatusMsg = styled.p`
  color: #c8b88a;
  font-size: 0.92rem;
  margin-top: 0.5rem;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 0.6rem;
  width: 100%;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.08);
  color: #fff;
  font-size: 0.95rem;
  outline: none;

  &::placeholder { color: rgba(255,255,255,0.4); }
  &:focus { border-color: #c8b88a; }
`;

const LookupButton = styled.button`
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: none;
  background: #c8b88a;
  color: #000;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;

  &:hover:not(:disabled) { background: #b2a072; }
  &:disabled { opacity: 0.6; cursor: default; }
`;

const ErrorMsg = styled.p`
  color: #e57373;
  font-size: 0.88rem;
  margin: 0.5rem 0;
  text-align: center;
`;

const SuccessMsg = styled.p`
  color: #66bb6a;
  font-size: 0.88rem;
  margin: 0.5rem 0;
  text-align: center;
`;

const UserCard = styled.div`
  background: rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 1.2rem;
  width: 100%;
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.2rem;
`;

const UserName = styled.p`
  font-size: 1.1rem;
  font-weight: 700;
  color: #f5f2ed;
`;

const LevelBadge = styled.span`
  background: ${({ $color }) => $color};
  color: #000;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const UserEmail = styled.p`
  font-size: 0.82rem;
  color: rgba(255,255,255,0.45);
  margin-bottom: 1rem;
`;

const StampsRow = styled.div`
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

const StampDot = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${({ $filled, $color }) => $filled ? $color : 'rgba(255,255,255,0.08)'};
  border: 1.5px solid ${({ $milestone, $color }) => $milestone ? $color : 'rgba(255,255,255,0.2)'};
  transition: background 0.3s;
`;

const StampCount = styled.p`
  font-size: 0.85rem;
  color: ${({ $color }) => $color};
  margin-bottom: 0.9rem;
`;

const PendingBox = styled.div`
  background: rgba(255,255,255,0.05);
  border: 1px solid ${({ $color }) => `${$color}50`};
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  margin-bottom: 0.9rem;
  font-size: 0.85rem;
  color: #f5f2ed;
  line-height: 1.6;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.6rem;
  margin-top: 0.2rem;
`;

const AddButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  background: #c8b88a;
  color: #000;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;

  &:hover:not(:disabled) { background: #b2a072; transform: scale(1.01); }
  &:disabled { opacity: 0.6; cursor: default; transform: none; }
`;

const BackButton = styled.button`
  padding: 0.75rem 1.2rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent;
  color: rgba(255,255,255,0.6);
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: rgba(255,255,255,0.08); }
`;
