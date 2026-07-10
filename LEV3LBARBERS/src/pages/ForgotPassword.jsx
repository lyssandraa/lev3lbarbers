import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import confetti from 'canvas-confetti';
import { CheckIcon } from '../common/icons';
import api from '../utils/api';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];
const WORDMARK = 'LEV3L BARBERS';

const formVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};
const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ error: '', message: '' });
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | loading | success

  useEffect(() => {
    if (submitStatus === 'success') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.4 }, colors: [RED, INK] });
    }
  }, [submitStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', message: '' });
    setSubmitStatus('loading');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setStatus({ message: res.data.message });
      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus('idle');
      setStatus({ error: err.response?.data?.message || 'Error sending reset email' });
    }
  };

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

        <FormEyebrow>Locked out?</FormEyebrow>
        <FormTitle>Reset Password</FormTitle>
        <FormSubRule />

        <FormText>Enter your email and we'll send you a link to reset your password.</FormText>

        <AnimatePresence mode="wait">
          {status.error && (
            <StatusMsg
              key={status.error}
              $error
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: [0, -8, 8, -6, 6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {status.error}
            </StatusMsg>
          )}
          {status.message && (
            <StatusMsg key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {status.message}
            </StatusMsg>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleSubmit}
          variants={formVariants}
          initial="hidden"
          animate="show"
        >
          <Field variants={fieldVariants}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <FieldInput
              id="email"
              type="email"
              placeholder="john.smith@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <SubmitBtn
            variants={fieldVariants}
            type="submit"
            disabled={submitStatus !== 'idle'}
            whileHover={submitStatus === 'idle' ? { scale: 1.02 } : {}}
            whileTap={submitStatus === 'idle' ? { scale: 0.97 } : {}}
          >
            {submitStatus === 'loading' ? <BtnSpinner /> : submitStatus === 'success' ? <CheckIcon width={20} height={20} /> : 'Send Reset Link'}
          </SubmitBtn>
        </motion.form>

        <SwitchText>
          <Link to="/login">← Back to login</Link>
        </SwitchText>
      </FormBox>
    </PageWrap>
  );
};

export default ForgotPassword;

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

const FormEyebrow = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 10px; font-weight: 900;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: ${RED};
  margin: 0 0 0.4rem;
`;

const FormTitle = styled.h1`
  font-size: 2.4rem;
  letter-spacing: 3px;
  margin: 0;
  color: ${INK};
  line-height: 1;
`;

const FormSubRule = styled.div`
  width: 36px;
  height: 1.5px;
  background: ${RED};
  margin: 0.9rem 0 1.2rem;
`;

const FormText = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  font-weight: 500;
  color: rgba(26, 26, 26, 0.65);
  line-height: 1.6;
  margin: 0 0 1.4rem;
`;

const StatusMsg = styled(motion.p)`
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  color: ${({ $error }) => $error ? RED : '#2e7d32'};
  margin: 0 0 1rem;
  padding: 0.6rem 0.8rem;
  background: ${({ $error }) => $error ? 'rgba(196,30,58,0.06)' : 'rgba(46,125,50,0.08)'};
  border-left: 2px solid ${({ $error }) => $error ? RED : '#2e7d32'};
`;

const Field = styled(motion.div)`
  margin-bottom: 1.1rem;
`;

const FieldLabel = styled.label`
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.68rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.55);
  margin-bottom: 0.5rem;
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid rgba(26, 26, 26, 0.15);
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  box-sizing: border-box;

  &::placeholder { color: rgba(26, 26, 26, 0.35); }
  &:focus { border-color: ${RED}; box-shadow: 0 0 0 3px rgba(196,30,58,0.08); transform: translateY(-2px); }
`;

const SubmitBtn = styled(motion.button)`
  width: 100%;
  padding: 14px;
  background: ${RED};
  color: #fff;
  border: none;
  cursor: pointer;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  transition: opacity 0.22s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { cursor: default; }
`;

const BtnSpinner = styled.span`
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
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
