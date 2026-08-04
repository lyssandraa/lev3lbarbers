import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const EASE = [0.76, 0, 0.24, 1];
const RED = '#C41E3A';

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
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
        >
          <Wordmark>
            LEV<span style={{ color: RED }}>3</span>L
          </Wordmark>
          <SubMark>Barbers</SubMark>
        </motion.div>
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

const Wordmark = styled.h1`
  margin: 0;
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(2.4rem, 9vw, 3.4rem);
  letter-spacing: 2px;
  color: #F2EDE4;
  text-align: center;
`;

const SubMark = styled.div`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 8px;
  color: #F2EDE4;
  text-align: center;
  margin-top: 2px;
`;
