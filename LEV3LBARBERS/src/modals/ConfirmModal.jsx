// src/components/common/ConfirmModal.js
import React from "react";
import styled from "styled-components";

const ConfirmModal = ({ message, onCancel, onConfirm }) => (
  <ModalOverlay>
    <ModalCard>
      <ModalMessage>{message}</ModalMessage>
      <ModalActions>
        <ConfirmButton onClick={onConfirm}>Yes</ConfirmButton>
        <CancelModalButton onClick={onCancel}>Cancel</CancelModalButton>
      </ModalActions>
    </ModalCard>
  </ModalOverlay>
);

export default ConfirmModal;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalCard = styled.div`
  background: rgba(255,255,255,0.95);
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
`;

const ModalMessage = styled.p`
  margin-bottom: 1.5rem;
  font-weight: bold;
  color: #999;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const ConfirmButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #e57373;
  color: white;
  font-weight: bold;
  border: none;
  cursor: pointer;
  &:hover { background: #d15f5f; }
`;

const CancelModalButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #999;
  color: white;
  font-weight: bold;
  border: none;
  cursor: pointer;
  &:hover { background: #777; }
`;
