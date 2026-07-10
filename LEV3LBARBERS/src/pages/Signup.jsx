import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import { EyeIcon, EyeOffIcon, CheckIcon, GiftIcon } from '../common/icons';
import api from '../utils/api';
import MysteryBoxModal from '../modals/MysteryBoxModal';

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

const Register = () => {
  const [form, setForm]               = useState({ name: '', email: '', password: '', referralCode: '' });
  const [error, setError]             = useState('');
  const [message, setMessage]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showBox, setShowBox]         = useState(false);
  const [status, setStatus]           = useState('idle'); // idle | loading | success
  const { login } = useAuth();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setStatus('loading');
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.user?.role || null);
      setStatus('success');
      setShowBox(true);
      setMessage(res.data.message || 'Registration successful');
    } catch (err) {
      setStatus('idle');
      setError(err.response?.data?.message || 'Something went wrong');
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

        <FormEyebrow>Join the level</FormEyebrow>
        <FormTitle>Sign Up</FormTitle>
        <FormSubRule />

        <AnimatePresence mode="wait">
          {error && (
            <StatusMsg
              key={error}
              $error
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: [0, -8, 8, -6, 6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {error}
            </StatusMsg>
          )}
          {message && (
            <StatusMsg key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {message}
            </StatusMsg>
          )}
        </AnimatePresence>

        <SwitchText>
          Already a member? <Link to="/login">Log in</Link>
        </SwitchText>

        <motion.form
          onSubmit={handleSubmit}
          variants={formVariants}
          initial="hidden"
          animate="show"
        >
          <Field variants={fieldVariants}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <FieldInput
              id="name"
              name="name"
              placeholder="John Smith"
              value={form.name}
              onChange={handleChange}
              required
            />
          </Field>

          <Field variants={fieldVariants}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <FieldInput
              id="email"
              name="email"
              type="email"
              placeholder="john.smith@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </Field>

          <Field variants={fieldVariants}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <InputWrap>
              <FieldInput
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Choose a password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <EyeBtn type="button" onClick={() => setShowPassword(!showPassword)}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={showPassword ? 'off' : 'on'}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.15, ease: EASE }}
                    style={{ display: 'flex' }}
                  >
                    {showPassword ? <EyeOffIcon width={17} height={17} /> : <EyeIcon width={17} height={17} />}
                  </motion.span>
                </AnimatePresence>
              </EyeBtn>
            </InputWrap>
          </Field>

          <Field variants={fieldVariants}>
            <FieldLabel htmlFor="referralCode">
              <GiftIcon width={12} height={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Referral Code <Optional>(optional)</Optional>
            </FieldLabel>
            <FieldInput
              id="referralCode"
              name="referralCode"
              placeholder="Enter a friend's code"
              value={form.referralCode}
              onChange={handleChange}
            />
          </Field>

          <SubmitBtn
            variants={fieldVariants}
            type="submit"
            disabled={status !== 'idle'}
            whileHover={status === 'idle' ? { scale: 1.02 } : {}}
            whileTap={status === 'idle' ? { scale: 0.97 } : {}}
          >
            {status === 'loading' ? <BtnSpinner /> : status === 'success' ? <CheckIcon width={20} height={20} /> : 'Create Account'}
          </SubmitBtn>
        </motion.form>
      </FormBox>

      <MysteryBoxModal
        isOpen={showBox}
        onClose={() => { setShowBox(false); window.location.href = '/profile'; }}
      />
    </PageWrap>
  );
};

export default Register;

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
  font-size: 3rem;
  letter-spacing: 4px;
  margin: 0;
  color: ${INK};
  line-height: 1;
`;

const FormSubRule = styled.div`
  width: 36px;
  height: 1.5px;
  background: ${RED};
  margin: 0.9rem 0 1.6rem;
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

const SwitchText = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 0.78rem;
  color: rgba(26, 26, 26, 0.65);
  margin: 0 0 1.6rem;

  a {
    color: ${RED};
    text-decoration: none;
    border-bottom: 1px solid rgba(196,30,58,0.4);
    padding-bottom: 1px;
    transition: opacity 0.2s;
    &:hover { opacity: 0.7; }
  }
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

const InputWrap = styled.div`
  position: relative;
`;

const EyeBtn = styled.button`
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  color: rgba(26, 26, 26, 0.45);
  padding: 0;
  transition: color 0.2s;
  &:hover { color: ${INK}; }
`;

const Optional = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 1px;
  color: rgba(26, 26, 26, 0.45);
  font-weight: 500;
  text-transform: none;
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
  margin-top: 0.5rem;
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
