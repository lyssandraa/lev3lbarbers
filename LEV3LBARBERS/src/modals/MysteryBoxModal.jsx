import React, { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import api from "../utils/api";

import giftBox from "../assets/giftBox.png";
import giftLid from "../assets/giftLid.png";

const MysteryBoxModal = ({ isOpen, onClose }) => {
  const [rewardValue, setRewardValue]     = useState(null);
  const [rewardId, setRewardId]           = useState(null);
  const [status, setStatus]               = useState(null); // 'LOCKED' | 'UNCLAIMED'
  const [opened, setOpened]               = useState(false);
  const [showConfetti, setShowConfetti]   = useState(false);
  const [qrCode, setQrCode]               = useState(null);
  const [claiming, setClaiming]           = useState(false);
  const [resending, setResending]         = useState(false);
  const [resendMsg, setResendMsg]         = useState('');

  // Keep a stable ref to onClose so the timer effect never needs it as a dep.
  // Without this, every parent re-render recreates the inline onClose arrow and
  // resets the 60-second countdown back to zero.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Auto-close after 1 minute if user walks away
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => onCloseRef.current(), 60_000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Reset whenever the modal reopens
  useEffect(() => {
    if (isOpen) {
      setRewardValue(null);
      setRewardId(null);
      setStatus(null);
      setOpened(false);
      setShowConfetti(false);
      setQrCode(null);
      setClaiming(false);
      setResending(false);
      setResendMsg('');
    }
  }, [isOpen]);

  const handleBoxClick = async () => {
    if (opened) return;
    setOpened(true);

    try {
      // Reveal the reward value (works before email is verified)
      const revealRes = await api.post("/rewards/reveal-reward", { rewardType: "Mystery box" });
      setRewardValue(revealRes.data.rewardValue);

      setTimeout(() => setShowConfetti(true), 1200);
      setTimeout(() => setShowConfetti(false), 7000);

      // Check whether the reward is claimable yet
      const rewardsRes = await api.get("/rewards/user-rewards");
      const mysteryReward = rewardsRes.data.rewards.find(
        (r) =>
          r.rewardType?.toLowerCase().includes("mystery") &&
          r.status !== "CLAIMED"
      );
      if (mysteryReward) {
        setRewardId(mysteryReward.id);
        setStatus(mysteryReward.status);
      }
    } catch {
      setRewardValue("Mystery reward unlocked!");
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      const res = await api.post('/auth/resend-verification');
      setResendMsg(res.data.message || 'Check your inbox for the verification email.');
    } catch (e) {
      setResendMsg(e.response?.data?.message || 'Could not send email. Try again.');
    } finally {
      setResending(false);
    }
  };

  const handleClaim = async () => {
    if (!rewardId) return;
    setClaiming(true);
    try {
      const res = await api.post(`/rewards/${rewardId}/claim`);
      setQrCode(res.data.qrCode);
    } catch {
      // ignore — QR stays null, user can close
    } finally {
      setClaiming(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* ── QR step ─────────────────────────────────────── */}
          {qrCode ? (
            <QRContent
              as={motion.div}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120 }}
              onClick={(e) => e.stopPropagation()}
            >
              <QRTitle>Show this to your barber</QRTitle>
              <QRImage src={qrCode} alt="Claim QR Code" />
              <ActionButton onClick={onClose}>Done</ActionButton>
            </QRContent>
          ) : (
            /* ── Reveal step ─────────────────────────────────── */
            <ModalContent
              as={motion.div}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120 }}
              onClick={(e) => e.stopPropagation()}
            >
              {!opened && (
                <Title>You Unlocked a Mystery Box!<br />Click to reveal 🎁</Title>
              )}

              <BoxContainer
                onClick={handleBoxClick}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <BoxImage src={giftBox} alt="Gift Box" />
                <LidImage
                  as={motion.img}
                  src={giftLid}
                  alt="Gift Lid"
                  animate={opened ? { y: -260, rotate: -15 } : { y: -93 }}
                  transition={{ type: "spring", stiffness: 120, damping: 10 }}
                />
                {opened && <Sparkles />}
              </BoxContainer>

              {opened && rewardValue && (
                <RewardWrapper>
                  <Rays />
                  <Reward
                    as={motion.h2}
                    initial={{ scale: 0, rotate: -20, opacity: 0 }}
                    animate={{ scale: [0, 1.3, 1], rotate: [0, 10, 0], opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  >
                    ✨ {rewardValue} ✨
                  </Reward>
                </RewardWrapper>
              )}

              {/* Show claim/locked button only after reveal */}
              {opened && rewardValue && (
                <>
                  {status === "LOCKED" && (
                    <LockedRow>
                      <LockIcon>🔒</LockIcon>
                      <LockedText>Verify your email to claim this reward</LockedText>
                      {resendMsg ? (
                        <ResendMsg>{resendMsg}</ResendMsg>
                      ) : (
                        <ResendLink onClick={handleResend} disabled={resending}>
                          {resending ? "sending…" : "Resend verification email"}
                        </ResendLink>
                      )}
                      <ActionButton onClick={onClose}>Got it!</ActionButton>
                    </LockedRow>
                  )}

                  {status === "UNCLAIMED" && (
                    <ActionButton onClick={handleClaim} disabled={claiming} $gold>
                      {claiming ? "Generating QR…" : "Claim Reward"}
                    </ActionButton>
                  )}

                  {/* Fallback if status fetch failed */}
                  {!status && (
                    <ActionButton onClick={onClose}>Awesome!</ActionButton>
                  )}
                </>
              )}
            </ModalContent>
          )}

          {showConfetti && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              numberOfPieces={400}
              recycle={false}
              gravity={0.3}
            />
          )}
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default MysteryBoxModal;


const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(18, 18, 20, 0.88);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  position: relative;
  text-align: center;
  z-index: 2;
`;

const QRContent = styled.div`
  background: #121214;
  padding: 2.5rem 2rem;
  border-radius: 16px;
  text-align: center;
  max-width: 360px;
  width: 90%;
  color: white;
  border: 1px solid rgba(255,255,255,0.1);
`;

const QRTitle = styled.h2`
  font-size: 1.3rem;
  margin-bottom: 1.2rem;
  color: #f5f2ed;
`;

const QRImage = styled.img`
  width: 220px;
  margin: 0 auto 1.5rem auto;
  display: block;
  border: 4px solid white;
  border-radius: 10px;
`;

const Title = styled.h1`
  position: absolute;
  top: -250px;
  width: 500px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 1.8rem;
  text-align: center;
  z-index: 5;
`;

const BoxContainer = styled(motion.div)`
  position: relative;
  width: 220px;
  height: 220px;
  margin: 0 auto;
  cursor: pointer;
  z-index: 1;
`;

const BoxImage = styled.img`
  width: 100%;
  position: relative;
  z-index: 1;
`;

const LidImage = styled(motion.img)`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
`;

const RewardWrapper = styled.div`
  position: absolute;
  top: -10%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
`;

const glowPulse = keyframes`
  0%   { text-shadow: 0 0 12px gold, 0 0 24px orange, 0 0 36px yellow; }
  50%  { text-shadow: 0 0 24px gold, 0 0 48px orange, 0 0 72px yellow; }
  100% { text-shadow: 0 0 12px gold, 0 0 24px orange, 0 0 36px yellow; }
`;

const Reward = styled.h2`
  font-size: 1.6rem;
  width: 250px;
  color: #fff;
  font-weight: bold;
  animation: ${glowPulse} 2s infinite;
  position: relative;
  z-index: 2;
`;

const spin = keyframes`
  0%   { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
`;

const Rays = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate(-50%, -50%);
  background: conic-gradient(
    from 0deg,
    rgba(255,215,0,0.6), transparent 20%,
    rgba(255,215,0,0.6) 40%, transparent 60%,
    rgba(255,215,0,0.6) 80%, transparent
  );
  border-radius: 50%;
  filter: blur(12px);
  animation: ${spin} 6s linear infinite;
  z-index: 1;
`;

const ActionButton = styled.button`
  margin-top: 30px;
  padding: 10px 22px;
  background: ${({ $gold }) => $gold ? '#c8b88a' : '#121214'};
  color: ${({ $gold }) => $gold ? '#000' : '#fff'};
  border: none;
  border-radius: 8px;
  font-size: 1.3rem;
  font-weight: 900;
  cursor: pointer;
  transition: background 0.3s;

  &:hover:not(:disabled) {
    background: ${({ $gold }) => $gold ? '#b2a072' : '#2a2a2d'};
  }
  &:disabled { opacity: 0.6; cursor: default; }
`;

const LockedRow = styled.div`
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

const LockIcon = styled.span`
  font-size: 2rem;
`;

const LockedText = styled.p`
  color: rgba(255,255,255,0.65);
  font-size: 0.95rem;
  max-width: 220px;
`;

const ResendLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: #c8b88a;
  font-size: 0.85rem;
  text-decoration: underline;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: default; }
`;

const ResendMsg = styled.p`
  color: #8fce9a;
  font-size: 0.85rem;
  max-width: 220px;
  text-align: center;
`;

/* Sparkles burst */
const floatUp = keyframes`
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-120px) scale(0.2); opacity: 0; }
`;

const Sparkle = styled(motion.div)`
  position: absolute;
  width: 8px;
  height: 8px;
  background: gold;
  border-radius: 50%;
  box-shadow: 0 0 8px gold;
  animation: ${floatUp} 1.5s ease-out forwards;
`;

const Sparkles = () =>
  Array.from({ length: 8 }).map((_, i) => (
    <Sparkle
      key={i}
      style={{
        left: `${50 + (Math.random() * 60 - 30)}%`,
        bottom: "20%",
      }}
      animate={{
        y: [-10, -80 - Math.random() * 50],
        x: [0, (Math.random() - 0.5) * 80],
        opacity: [1, 0],
        scale: [1, 0],
      }}
      transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
    />
  ));
