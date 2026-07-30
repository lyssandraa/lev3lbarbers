import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import confetti from 'canvas-confetti';
import { CheckIcon } from '../common/icons';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];
const WORDMARK = 'LEV3L BARBERS';

const VerifyEmail = () => {
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against React StrictMode's double-invoke in dev
    ran.current = true;

    const token = new URLSearchParams(location.search).get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    api.post('/auth/verify-email', { token })
      .then(res => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified!');
        if (res.data.token) login(res.data.token);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.4 }, colors: [RED, INK] });
        setTimeout(() => navigate('/profile'), 2200);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      });
  }, [location, navigate, login]);

  return (
    <PageWrap>
      <Lines aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => <Line key={i} $i={i} />)}
      </Lines>

      <FormBox
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: EASE }}
      >
        <Wordmark>
          {WORDMARK.split('').map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.025, ease: EASE }}
              style={{ display: 'inline-block' }}
            >
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </Wordmark>
        <AccentRule />

        {status === 'verifying' && (
          <>
            <FormTitle>Verifying…</FormTitle>
            <FormSubRule />
            <BtnSpinnerWrap><BtnSpinner /></BtnSpinnerWrap>
          </>
        )}

        {status === 'success' && (
          <>
            <FormTitle>Email Verified</FormTitle>
            <FormSubRule />
            <IconWrap $ok>
              <CheckIcon width={28} height={28} />
            </IconWrap>
            <StatusMsg>{message}</StatusMsg>
            <StatusMsg $dim>Taking you to your profile…</StatusMsg>
          </>
        )}

        {status === 'error' && (
          <>
            <FormTitle>Verification Failed</FormTitle>
            <FormSubRule />
            <StatusMsg $error>{message}</StatusMsg>
            <SwitchText>
              <Link to="/login">← Back to login</Link>
            </SwitchText>
          </>
        )}
      </FormBox>
    </PageWrap>
  );
};

export default VerifyEmail;

/* ─────────── Keyframes ─────────── */

const drift = keyframes`
  from { transform: translateY(0); }
  to   { transform: translateY(-100%); }
`;
const spin = keyframes`to { transform: rotate(360deg); }`;

/* ─────────── Styles ─────────── */

const PageWrap = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 92vh;
  background: ${CREAM};
  overflow: hidden;
  padding: 3rem 1.5rem;
`;

const Lines = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
`;

const Line = styled.div`
  position: absolute;
  bottom: -100%;
  width: 1px;
  height: 200%;
  background: linear-gradient(to top, transparent 0%, ${RED} 50%, transparent 100%);
  opacity: ${({ $i }) => 0.06 + ($i % 3) * 0.02};
  left: ${({ $i }) => 5 + $i * 10}%;
  animation: ${drift} ${({ $i }) => 7 + $i * 1.3}s linear infinite;
  animation-delay: ${({ $i }) => -$i * 0.9}s;
`;

const FormBox = styled(motion.div)`
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(26, 26, 26, 0.1);
  border-top: 3px solid ${RED};
  padding: 2.8rem 2.4rem 2.4rem;
  font-family: 'Bebas Neue', sans-serif;
  text-align: center;
`;

const Wordmark = styled.p`
  font-size: 0.78rem;
  letter-spacing: 4px;
  color: rgba(26, 26, 26, 0.55);
  margin: 0 0 0.6rem;
  text-align: center;
`;

const AccentRule = styled.div`
  width: 28px;
  height: 1px;
  background: ${RED};
  opacity: 0.6;
  margin: 0 auto 2rem;
`;

const FormTitle = styled.h1`
  font-size: 2.2rem;
  letter-spacing: 3px;
  margin: 0;
  color: ${INK};
  line-height: 1;
`;

const FormSubRule = styled.div`
  width: 36px;
  height: 1.5px;
  background: ${RED};
  margin: 0.9rem auto 1.6rem;
`;

const StatusMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.85rem;
  color: ${({ $error, $dim }) => $error ? RED : $dim ? 'rgba(26,26,26,0.5)' : '#2e7d32'};
  margin: 0 0 0.6rem;
  padding: ${({ $dim }) => $dim ? '0' : '0.6rem 0.8rem'};
  background: ${({ $error, $dim }) => $dim ? 'none' : $error ? 'rgba(196,30,58,0.06)' : 'rgba(46,125,50,0.08)'};
  border-left: ${({ $error, $dim }) => $dim ? 'none' : `2px solid ${$error ? RED : '#2e7d32'}`};
`;

const IconWrap = styled.div`
  display: flex;
  justify-content: center;
  color: #2e7d32;
  margin-bottom: 1rem;
`;

const BtnSpinnerWrap = styled.div`
  display: flex;
  justify-content: center;
  margin: 0.5rem 0 0.2rem;
`;

const BtnSpinner = styled.span`
  width: 28px; height: 28px; border-radius: 50%;
  border: 3px solid rgba(26,26,26,0.12); border-top-color: ${RED};
  display: inline-block;
  animation: ${spin} 0.7s linear infinite;
`;

const SwitchText = styled.p`
  text-align: center;
  margin: 1.5rem 0 0;

  a {
    font-family: 'Montserrat', sans-serif;
    font-weight: 500;
    font-size: 0.78rem;
    color: rgba(26, 26, 26, 0.6);
    text-decoration: none;
    transition: color 0.2s;
    &:hover { color: ${INK}; }
  }
`;
