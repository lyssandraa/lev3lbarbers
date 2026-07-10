import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { T } from '../common/theme';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const GiftCardVerify = () => {
  const { code }   = useParams();
  const navigate   = useNavigate();
  const { isLoggedIn, isShopUser } = useAuth();

  const [card,      setCard]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [amount,    setAmount]    = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [success,   setSuccess]   = useState(null);

  useEffect(() => {
    if (!isLoggedIn || !isShopUser) {
      navigate(`/login?redirect=/gc/${encodeURIComponent(code)}`);
      return;
    }
    lookup();
  }, [isLoggedIn, isShopUser]);

  const lookup = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/gift-cards/codes/lookup?code=${encodeURIComponent(code)}`);
      setCard(res.data.giftCard);
    } catch (err) {
      setError(err.response?.data?.message || 'Gift card not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setRedeeming(true);
    try {
      const res = await api.post('/gift-cards/codes/redeem', { code, amount: amt });
      setCard(res.data.giftCard);
      setSuccess(res.data.remainingBalance);
      setAmount('');
    } catch (err) {
      alert(err.response?.data?.message || 'Redemption failed.');
    } finally {
      setRedeeming(false); }
  };

  if (loading) {
    return (
      <Page>
        <Spinner />
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <ErrorCard
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <ErrorIcon>✕</ErrorIcon>
          <ErrorTitle>NOT FOUND</ErrorTitle>
          <ErrorMsg>{error}</ErrorMsg>
        </ErrorCard>
      </Page>
    );
  }

  const isSpent  = !card.active || card.balance <= 0;
  const maxSpend = card.balance;

  return (
    <Page>
      <Panel
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Status strip */}
        <StatusStrip $spent={isSpent}>
          {isSpent ? '✕  CARD SPENT / VOIDED' : '✓  VALID GIFT CARD'}
        </StatusStrip>

        {/* Balance display */}
        <BalanceArea>
          <BalanceLabel>REMAINING BALANCE</BalanceLabel>
          <BalanceAmt $spent={isSpent}>£{card.balance.toFixed(2)}</BalanceAmt>
          <FaceValue>of £{card.value.toFixed(2)} face value</FaceValue>
        </BalanceArea>

        <CodeDisplay>{card.code}</CodeDisplay>

        {/* Redeem form — only if card is still active */}
        {!isSpent && (
          <>
            <Divider />
            <RedeemSection>
              <RedeemLabel>AMOUNT TO REDEEM</RedeemLabel>
              <RedeemRow>
                <PoundSign>£</PoundSign>
                <AmountInput
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={maxSpend}
                  placeholder={`Max ${maxSpend.toFixed(2)}`}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                  autoFocus
                />
              </RedeemRow>

              <AnimatePresence>
                {amount && parseFloat(amount) > 0 && parseFloat(amount) <= maxSpend && (
                  <RedeemPreview
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    Balance after: £{(maxSpend - parseFloat(amount)).toFixed(2)}
                  </RedeemPreview>
                )}
              </AnimatePresence>

              <RedeemBtn
                onClick={handleRedeem}
                disabled={redeeming || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxSpend}
              >
                {redeeming ? <BtnSpinner /> : 'REDEEM'}
              </RedeemBtn>
            </RedeemSection>
          </>
        )}

        {/* Success flash */}
        <AnimatePresence>
          {success !== null && (
            <SuccessBanner
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              ✓ Redeemed.{' '}
              {success > 0
                ? `£${success.toFixed(2)} remaining on card.`
                : 'Card fully spent — automatically voided.'}
            </SuccessBanner>
          )}
        </AnimatePresence>
      </Panel>
    </Page>
  );
};

export default GiftCardVerify;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh;
  background: ${T.bg};
  display: flex; align-items: center; justify-content: center;
  padding: 2rem 1.5rem;
  font-family: ${T.fontBody};
`;

const Spinner = styled.div`
  width: 40px; height: 40px; border-radius: 50%;
  border: 3px solid ${T.border}; border-top-color: ${T.gold};
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const Panel = styled(motion.div)`
  background: ${T.card};
  border: 1px solid ${T.border};
  border-radius: 18px; overflow: hidden;
  width: 100%; max-width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
`;

const StatusStrip = styled.div`
  padding: 0.6rem 1.2rem;
  background: ${({ $spent }) => $spent ? 'rgba(239,83,80,0.15)' : 'rgba(76,175,80,0.15)'};
  border-bottom: 1px solid ${({ $spent }) => $spent ? 'rgba(239,83,80,0.3)' : 'rgba(76,175,80,0.3)'};
  color: ${({ $spent }) => $spent ? '#ef5350' : '#4caf50'};
  font-family: ${T.fontHead}; font-size: 0.78rem; letter-spacing: 3px; text-align: center;
`;

const BalanceArea = styled.div`
  padding: 2rem 1.5rem 1rem; text-align: center;
`;
const BalanceLabel = styled.p`
  font-family: ${T.fontHead}; font-size: 0.7rem; letter-spacing: 5px;
  color: ${T.textFaint}; margin: 0 0 0.4rem;
`;
const BalanceAmt = styled.p`
  font-family: ${T.fontHead};
  font-size: clamp(3.5rem, 14vw, 5rem);
  letter-spacing: 2px; margin: 0;
  color: ${({ $spent }) => $spent ? T.textFaint : T.gold};
  line-height: 1;
`;
const FaceValue = styled.p`
  font-size: 0.78rem; color: ${T.textFaint}; margin: 0.4rem 0 0;
`;

const CodeDisplay = styled.p`
  font-family: monospace; font-size: 0.88rem; letter-spacing: 2.5px;
  color: ${T.textDim}; text-align: center; margin: 0 0 1.2rem; padding: 0 1.5rem;
`;

const Divider = styled.div`
  height: 1px; background: ${T.border}; margin: 0 1.5rem;
`;

const RedeemSection = styled.div`
  padding: 1.4rem 1.5rem 1.5rem;
`;
const RedeemLabel = styled.p`
  font-family: ${T.fontHead}; font-size: 0.72rem; letter-spacing: 4px;
  color: ${T.gold}; margin: 0 0 0.8rem;
`;
const RedeemRow = styled.div`
  display: flex; align-items: center;
  background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 10px; overflow: hidden;
  margin-bottom: 0.5rem;
`;
const PoundSign = styled.span`
  padding: 0 0.6rem 0 0.9rem;
  font-family: ${T.fontHead}; font-size: 1.6rem; color: ${T.textDim};
  flex-shrink: 0;
`;
const AmountInput = styled.input`
  flex: 1; background: none; border: none; outline: none;
  color: ${T.text}; font-family: ${T.fontHead}; font-size: 2rem; letter-spacing: 1px;
  padding: 0.6rem 0.9rem 0.6rem 0;
  &::placeholder { color: ${T.textFaint}; }
  /* Hide spin buttons */
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button, &::-webkit-inner-spin-button { -webkit-appearance: none; }
`;
const RedeemPreview = styled(motion.p)`
  font-size: 0.8rem; color: ${T.textDim}; margin: 0 0 0.85rem; text-align: right;
`;
const RedeemBtn = styled.button`
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
