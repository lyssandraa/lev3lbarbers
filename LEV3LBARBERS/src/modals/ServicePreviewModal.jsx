import React from "react";
import styled from "styled-components";
import ServiceMenu from "../components/ServiceMenu";
import background from '../assets/servicesBackground.png';

const ServicePreviewModal = ({ services, onCancel, onConfirm }) => {
  return (
    <Overlay>
      <Modal>
        <ModalContent>
          <CloseButton onClick={onCancel}>×</CloseButton>
          <ServiceMenu services={services} />
        </ModalContent>
        {/* <Actions>
          <CancelButton onClick={onCancel}>Back</CancelButton>
          <SaveButton onClick={onConfirm}>Confirm & Save</SaveButton>
        </Actions> */}
      </Modal>
    </Overlay>
  );
};

export default ServicePreviewModal;

// Styles
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  width: 100%;
`;

const Modal = styled.div`
background-image: url(${background});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 14px;
  width: 70%;
`;

const ModalContent = styled.div`
  border-radius: 14px;
  padding: 1rem;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  left: 90%;
  font-size: 1.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const ButtonBase = styled.button`
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
`;

const CancelButton = styled(ButtonBase)`
  background: #ccc;
  color: #000;
`;

const SaveButton = styled(ButtonBase)`
  background: #c8b88a;
  color: #000;
  &:hover {
    background: #b2a072;
  }
`;
