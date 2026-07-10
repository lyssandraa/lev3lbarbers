import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { T } from '../common/theme';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const TIER_COLOR = { BRONZE: '#cd7f32', SILVER: '#a8a9ad', GOLD: '#C4922A', PLATINUM: '#e5e4e2' };

const MemberPay = () => {
  const { qrCode }  = useParams();
  const navigate    = useNavigate();
  const { isLoggedIn, isShopUser } = useAuth();

  const [member,    setMember]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [amount,    setAmount]    = useState('');
  const [charging,  setCharging]  = useState(false);
  const [success,   setSuccess]   = useState(null);

  useEffect(() => {
    if (!isLoggedIn || !isShopUser) {
      navigate(`/login?redirect=/pay/${encodeURIComponent(qrCode)}`);
      return;
    }
    lookupMember();
  }, [isLoggedIn, isShopUser]);

  const lookupMember = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/wallet/member/${encodeURIComponent(qrCode)}`);
      setMember(res.data.member);
    } catch (err) {
      setError(err.response?.data?.message || 'Member not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleCharge = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setCharging(true);
    try {
      const res = await api.post('/wallet/charge', { qrCode, amount: amt });
      setMember(m => ({ ...m, walletBalance: res.data.remainingBalance }));
      setSuccess({ charged: res.data.charged, remaining: res.data.remainingBalance });
      setAmount('');
    } catch (err) {
      alert(err.response?.data?.message || 'Charge failed.');
    } finally {
      setCharging(false); }
  };

  if (loading) return <Page><Spinner /></Page>;

  if (error) {
    return (
      <Page>
        <ErrorCard initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <ErrorIcon>✕</ErrorIcon>
          <ErrorTitle>NOT FOUND</ErrorTitle>
          <ErrorMsg>{error}</ErrorMsg>
        </ErrorCard>
      </Page>
    );
  }

  const tierColor   = TIER_COLOR[member.tier] || T.gold;
  const hasBalance  = member.walletBalance > 0;
  const overSpend   = amount && parseFloat(amount) > member.walletBalance;

  return (
    <Page>
      <Panel initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
        {/* Member header */}
        <MemberHeader>
          <MemberAvatar>{member.name?.charAt(0)?.toUpperCase()}</MemberAvatar>
          <MemberInfo>
            <MemberName>{member.name}</MemberName>
            <TierBadge $color={tierColor}>{member.tier}</TierBadge>
          </MemberInfo>
        </MemberHeader>

        {/* Balance */}
        <BalanceArea>
          <BalanceLabel>WALLET BALANCE</BalanceLabel>
          <BalanceAmt $empty={!hasBalance}>
            £{member.walletBalance.toFixed(2)}
          </BalanceAmt>
        </BalanceArea>

        {!hasBalance ? (
          <EmptyBalance>No credit on this account.</EmptyBalance>
        ) : (
          <>
            <Divider />
            <ChargeSection>
              <ChargeLabel>AMOUNT TO CHARGE</ChargeLabel>
              <ChargeRow>
                <PoundSign>£</PoundSign>
                <AmountInput
                  type="number" min="0.01" step="0.01"
                  max={member.walletBalance}
                  placeholder={`Max ${member.walletBalance.toFixed(2)}`}
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setSuccess(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleCharge()}
                  autoFocus
                />
              </ChargeRow>

              <AnimatePresence>
                {amount && parseFloat(amount) > 0 && !overSpend && (
                  <ChargePreview
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    Remaining after: £{(member.walletBalance - parseFloat(amount)).toFixed(2)}
                  </ChargePreview>
                )}
                {overSpend && (
                  <OverSpendMsg
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    Exceeds balance of £{member.walletBalance.toFixed(2)}
                  </OverSpendMsg>
                )}
              </AnimatePresence>

              <ChargeBtn
                onClick={handleCharge}
                disabled={charging || !amount || parseFloat(amount) <= 0 || overSpend}
              >
                {charging ? <BtnSpinner /> : 'CHARGE'}
              </ChargeBtn>
            </ChargeSection>
          </>
        )}

        <AnimatePresence>
          {success && (
            <SuccessBanner
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              ✓ £{success.charged.toFixed(2)} charged.{' '}
              {success.remaining > 0
                ? `£${success.remaining.toFixed(2)} remaining.`
                : 'Balance now £0.00'}
            </SuccessBanner>
          )}
        </AnimatePresence>
      </Panel>
    </Page>
  );
};

export default MemberPay;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh; background: ${T.bg};
  display: flex; align-items: center; justify-content: center;
  padding: 2rem 1.5rem; font-family: ${T.fontBody};
`;

const Spinner = styled.div`
  width: 40px; height: 40px; border-radius: 50%;
  border: 3px solid ${T.border}; border-top-color: ${T.gold};
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const Panel = styled(motion.div)`
  background: ${T.card}; border: 1px solid ${T.border};
  border-radius: 18px; overflow: hidden;
  width: 100%; max-width: 360px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
`;

const MemberHeader = styled.div`
  display: flex; align-items: center; gap: 1rem;
  padding: 1.4rem 1.5rem 1.1rem;
  border-bottom: 1px solid ${T.border};
`;
const MemberAvatar = styled.div`
  width: 46px; height: 46px; border-radius: 50%;
  background: ${T.surface}; border: 1px solid ${T.border};
  display: flex; align-items: center; justify-content: center;
  font-family: ${T.fontHead}; font-size: 1.4rem; color: ${T.gold};
  flex-shrink: 0;
`;
const MemberInfo = styled.div``;
const MemberName = styled.p`
  font-family: ${T.fontHead}; font-size: 1.15rem; letter-spacing: 2px;
  color: ${T.text}; margin: 0 0 0.25rem;
`;
const TierBadge = styled.span`
  font-size: 0.68rem; font-weight: 700; letter-spacing: 2px;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}18;
  border: 1px solid ${({ $color }) => $color}44;
  padding: 2px 8px; border-radius: 3px;
`;

const BalanceArea = styled.div`padding: 1.6rem 1.5rem 1rem; text-align: center;`;
const BalanceLabel = styled.p`
  font-family: ${T.fontHead}; font-size: 0.7rem; letter-spacing: 5px;
  color: ${T.textFaint}; margin: 0 0 0.4rem;
`;
const BalanceAmt = styled.p`
  font-family: ${T.fontHead};
  font-size: clamp(3.5rem, 14vw, 5rem);
  letter-spacing: 2px; margin: 0; line-height: 1;
  color: ${({ $empty }) => $empty ? T.textFaint : T.gold};
`;
const EmptyBalance = styled.p`
  font-size: 0.84rem; color: ${T.textFaint}; text-align: center;
  padding: 0.5rem 1.5rem 1.5rem;
`;

const Divider = styled.div`height: 1px; background: ${T.border}; margin: 0 1.5rem;`;

const ChargeSection = styled.div`padding: 1.4rem 1.5rem 1.5rem;`;
const ChargeLabel = styled.p`
  font-family: ${T.fontHead}; font-size: 0.72rem; letter-spacing: 4px;
  color: ${T.gold}; margin: 0 0 0.8rem;
`;
const ChargeRow = styled.div`
  display: flex; align-items: center;
  background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 10px;
  overflow: hidden; margin-bottom: 0.5rem;
`;
const PoundSign = styled.span`
  padding: 0 0.6rem 0 0.9rem;
  font-family: ${T.fontHead}; font-size: 1.6rem; color: ${T.textDim}; flex-shrink: 0;
`;
const AmountInput = styled.input`
  flex: 1; background: none; border: none; outline: none;
  color: ${T.text}; font-family: ${T.fontHead}; font-size: 2rem; letter-spacing: 1px;
  padding: 0.6rem 0.9rem 0.6rem 0;
  &::placeholder { color: ${T.textFaint}; }
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button, &::-webkit-inner-spin-button { -webkit-appearance: none; }
`;
const ChargePreview = styled(motion.p)`font-size: 0.8rem; color: ${T.textDim}; margin: 0 0 0.85rem; text-align: right;`;
const OverSpendMsg = styled(motion.p)`font-size: 0.8rem; color: ${T.red}; margin: 0 0 0.85rem; text-align: right;`;
const ChargeBtn = styled.button`
  width: 100%; padding: 1rem;
  background: ${T.red}; border: none; border-radius: 10px;
  color: #fff; font-family: ${T.fontHead}; font-size: 1.1rem; letter-spacing: 5px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, transform 0.1s;
  &:hover:not(:disabled) { background: #a51830; transform: scale(1.01); }
  &:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
`;
const BtnSpinner = styled.span`
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;
const SuccessBanner = styled(motion.div)`
  margin: 0 1.5rem 1.5rem;
  background: rgba(76,175,80,0.12); border: 1px solid rgba(76,175,80,0.3);
  border-radius: 8px; padding: 0.75rem 1rem;
  font-size: 0.84rem; color: #4caf50; font-weight: 600; text-align: center;
`;

const ErrorCard = styled(motion.div)`
  background: ${T.card}; border: 1px solid rgba(239,83,80,0.3);
  border-radius: 16px; padding: 3rem 2rem; text-align: center; max-width: 320px;
`;
const ErrorIcon = styled.div`
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(239,83,80,0.15); border: 2px solid rgba(239,83,80,0.4);
  color: #ef5350; font-size: 1.5rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 1.2rem;
`;
const ErrorTitle = styled.h2`
  font-family: ${T.fontHead}; font-size: 1.8rem; letter-spacing: 4px;
  color: ${T.textDim}; margin: 0 0 0.6rem;
`;
const ErrorMsg = styled.p`font-size: 0.88rem; color: ${T.textFaint}; margin: 0;`;
