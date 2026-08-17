import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';

// Generic slide-in drawer for hosting an existing Admin*.jsx panel directly
// on a public page (matching CartDrawer's pattern) — this is what makes
// "inline admin editing" possible on the website without rebuilding every
// admin form: the drawer just hosts the same component already used in
// the full admin panel.
const AdminDrawer = ({ open, onClose, title, children }) => {
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <Backdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <Drawer
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <DrawerHead>
              <DrawerTitle>{title}</DrawerTitle>
              <CloseBtn onClick={onClose} aria-label="Close">✕</CloseBtn>
            </DrawerHead>
            <DrawerBody>{children}</DrawerBody>
          </Drawer>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AdminDrawer;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const Backdrop = styled(motion.div)`
  position: fixed; inset: 0;
  background: rgba(10,10,10,0.55);
  z-index: 8000;
`;

const Drawer = styled(motion.div)`
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: min(760px, 100vw);
  background: ${CREAM};
  border-left: 1px solid rgba(26, 26, 26, 0.1);
  z-index: 8001;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(26, 26, 26, 0.18);
`;

const DrawerHead = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.5rem 1.4rem 1.2rem;
  border-bottom: 1px solid rgba(26, 26, 26, 0.1);
  flex-shrink: 0;
`;

const DrawerTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3rem; letter-spacing: 3px; margin: 0;
  color: ${INK};
`;

const CloseBtn = styled.button`
  background: none; border: none; cursor: pointer;
  color: rgba(26, 26, 26, 0.5); font-size: 1.1rem; padding: 4px;
  transition: color 0.2s; line-height: 1;
  &:hover { color: ${INK}; }
`;

const DrawerBody = styled.div`
  flex: 1; overflow-y: auto; padding: 1.5rem 1.2rem;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(26, 26, 26, 0.15); }
`;
