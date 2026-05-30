import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

const QRCodeModal = ({ isOpen, onClose, qrCode, rewardId }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ModalContent
            as={motion.div}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <h2>Show this QR to Barber</h2>
            {qrCode ? (
              <QRCodeImage src={qrCode} alt="Reward QR Code" />
            ) : (
              <p>Generating QR code...</p>
            )}
            <CloseButton onClick={onClose}>Close</CloseButton>
          </ModalContent>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default QRCodeModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(18, 18, 20, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: #121214;
  padding: 2rem;
  border-radius: 14px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  color: white;
`;

const QRCodeImage = styled.img`
  width: 220px;
  margin: 1rem auto;
  display: block;
  border: 4px solid white;
  border-radius: 10px;
`;

const CloseButton = styled.button`
  margin-top: 1rem;
  padding: 10px 16px;
  background: #c8b88a;
  color: black;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
  &:hover {
    background: #b2a072;
  }
`;
