import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import logo from '../assets/logoWhite.png';

const EASE = [0.76, 0, 0.24, 1];

const IntroReveal = () => {
  const [phase, setPhase] = useState('brand'); // brand | split | done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('split'), 2500);
    // unmount only after Wrap has fully faded (split + 0.6s delay + 0.7s fade = 1.3s)
    const t2 = setTimeout(() => {
      setPhase('done');
      sessionStorage.setItem('introPlayed', '1');
    }, 3900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'done') return null;

  const splitting = phase === 'split';

  return (
    <Wrap
      animate={{ opacity: splitting ? 0 : 1 }}
      transition={{ delay: splitting ? 0.6 : 0, duration: 0.7, ease: 'easeIn' }}
    >
      <PanelLeft
        animate={{ x: splitting ? '-110%' : '0%' }}
        transition={{ duration: 0.85, ease: EASE }}
      />
      <PanelRight
        animate={{ x: splitting ? '110%' : '0%' }}
        transition={{ duration: 0.85, ease: EASE }}
      />

      <Brand
        animate={{ opacity: splitting ? 0 : 1, y: splitting ? -10 : 0 }}
        transition={{ duration: 0.35, ease: 'easeIn' }}
      >
        <motion.img
          src={logo}
          alt="LEV3L Barbers"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
          style={{ width: 'min(220px, 50vw)', height: 'auto', display: 'block' }}
        />
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          style={{
            display: 'block',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '0.6rem',
            letterSpacing: '6px',
            color: '#F2EDE4',
            marginTop: '1rem',
            textTransform: 'uppercase',
          }}
        >
          Southport · Est. 2023
        </motion.span>
      </Brand>

      <Seam
        animate={{ opacity: splitting ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      />
    </Wrap>
  );
};

export default IntroReveal;

/* ─────────── styles ─────────── */

const Wrap = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
  overflow: hidden;
`;

const PanelLeft = styled(motion.div)`
  position: absolute;
  top: 0; left: 0;
  width: 50%;
  height: 100%;
  background: #0a0a0a;
`;

const PanelRight = styled(motion.div)`
  position: absolute;
  top: 0; right: 0;
  width: 50%;
  height: 100%;
  background: #0a0a0a;
`;

const Brand = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

const Seam = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 100%;
  background: rgba(255,255,255,0.06);
  z-index: 1;
`;
