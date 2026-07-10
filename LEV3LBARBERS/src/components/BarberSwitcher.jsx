import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import api from '../utils/api';
import { BACKEND } from '../config';
import { useAuth } from '../context/AuthContext';
import { LockIcon } from '../common/icons';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];
const PIN_LENGTH = 6;
const KEYS = ['1','2','3','4','5','6','7','8','9','','0','back'];

export default function BarberSwitcher() {
  const { login } = useAuth();
  const [barbers, setBarbers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [pin, setPin]             = useState('');
  const [error, setError]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/barber-profiles')
      .then(r => setBarbers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const back = () => { setSelected(null); setPin(''); setError(''); };

  const submitPin = useCallback(async (fullPin, barber) => {
    setSubmitting(true);
    try {
      const res = await api.post('/auth/pin-login', { userId: barber.userId, pin: fullPin });
      login(res.data.token, res.data.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect PIN');
      setPin('');
      setSubmitting(false);
    }
  }, [login]);

  const handleKey = (key) => {
    if (submitting) return;
    if (key === 'back') { setPin(p => p.slice(0, -1)); setError(''); return; }
    if (key === '' || pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    setError('');
    if (next.length === PIN_LENGTH) submitPin(next, selected);
  };

  return (
    <PageWrap>
      <AnimatePresence mode="wait">
        {!selected ? (
          <Box key="grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            <Eyebrow>LEV3L Barbers</Eyebrow>
            <Title>Who's Working?</Title>
            <SubRule />

            {loading ? (
              <Hint>Loading barbers…</Hint>
            ) : barbers.length === 0 ? (
              <Hint>No barber profiles set up yet.</Hint>
            ) : (
              <Grid>
                {barbers.map(b => (
                  <BarberCard key={b.id} onClick={() => setSelected(b)} whileTap={{ scale: 0.96 }}>
                    {b.imageUrl
                      ? <Avatar src={`${BACKEND}${b.imageUrl}`} alt={b.displayName} />
                      : <AvatarFallback>{b.displayName[0]}</AvatarFallback>
                    }
                    <BarberName>{b.displayName}</BarberName>
                  </BarberCard>
                ))}
              </Grid>
            )}

            <UsePasswordLink>
              <Link to="/login">Use email &amp; password instead</Link>
            </UsePasswordLink>
          </Box>
        ) : (
          <Box key="pin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            <BackBtn onClick={back}>&larr; Back</BackBtn>
            <LockIcon width={22} height={22} style={{ color: RED, margin: '0 auto 0.6rem', display: 'block' }} />
            <Title as="h2" style={{ fontSize: '2rem' }}>{selected.displayName}</Title>
            <Hint>Enter your {PIN_LENGTH}-digit PIN</Hint>

            <Dots>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <Dot key={i} $filled={i < pin.length} $shake={Boolean(error)} />
              ))}
            </Dots>

            <AnimatePresence mode="wait">
              {error && (
                <ErrorMsg key={error} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {error}
                </ErrorMsg>
              )}
            </AnimatePresence>

            <Keypad>
              {KEYS.map((k, i) => (
                k === ''
                  ? <KeySpacer key={i} />
                  : (
                    <KeyBtn key={i} onClick={() => handleKey(k)} disabled={submitting} $wide={k === 'back'}>
                      {k === 'back' ? '⌫' : k}
                    </KeyBtn>
                  )
              ))}
            </Keypad>
          </Box>
        )}
      </AnimatePresence>
    </PageWrap>
  );
}

/* ─────────── Styles ─────────── */

const shakeKf = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
`;

const PageWrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 90vh;
  background: ${CREAM};
  padding: 3rem 1.5rem;
`;

const Box = styled(motion.div)`
  width: 100%;
  max-width: 480px;
  text-align: center;
  font-family: 'Bebas Neue', sans-serif;
`;

const Eyebrow = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 10px; font-weight: 900;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: ${RED};
  margin: 0 0 0.4rem;
`;

const Title = styled.h1`
  font-size: 2.6rem;
  letter-spacing: 3px;
  margin: 0;
  color: ${INK};
  line-height: 1;
`;

const SubRule = styled.div`
  width: 36px;
  height: 1.5px;
  background: ${RED};
  margin: 0.9rem auto 1.8rem;
`;

const Hint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  color: rgba(26, 26, 26, 0.55);
  margin: 0.6rem 0 1.4rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.9rem;
  margin-bottom: 1.6rem;
`;

const BarberCard = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(26, 26, 26, 0.1);
  border-top: 3px solid ${RED};
  padding: 1.2rem 0.6rem;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.2s;
  &:hover { border-color: ${RED}; }
`;

const Avatar = styled.img`
  width: 56px; height: 56px;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarFallback = styled.div`
  width: 56px; height: 56px;
  border-radius: 50%;
  background: ${RED};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  letter-spacing: 0;
`;

const BarberName = styled.span`
  font-size: 1rem;
  letter-spacing: 1px;
  color: ${INK};
`;

const UsePasswordLink = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  color: rgba(26, 26, 26, 0.55);

  a {
    color: ${RED};
    text-decoration: none;
    border-bottom: 1px solid rgba(196,30,58,0.4);
    padding-bottom: 1px;
    transition: opacity 0.2s;
    &:hover { opacity: 0.7; }
  }
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 1px;
  color: rgba(26, 26, 26, 0.55);
  margin-bottom: 1.2rem;
  transition: color 0.2s;
  &:hover { color: ${INK}; }
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.7rem;
  margin: 1.4rem 0 1rem;
`;

const Dot = styled.span`
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 1.5px solid ${({ $filled }) => $filled ? RED : 'rgba(26,26,26,0.25)'};
  background: ${({ $filled }) => $filled ? RED : 'transparent'};
  ${({ $shake }) => $shake && `animation: ${shakeKf} 0.4s ease;`}
`;

const ErrorMsg = styled(motion.p)`
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  color: ${RED};
  margin: 0 0 1rem;
`;

const Keypad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.7rem;
  max-width: 280px;
  margin: 0.6rem auto 0;
`;

const KeyBtn = styled.button`
  padding: 1rem 0;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(26, 26, 26, 0.12);
  color: ${INK};
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3rem;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  &:hover:not(:disabled) { border-color: ${RED}; background: rgba(196,30,58,0.06); }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const KeySpacer = styled.div``;
