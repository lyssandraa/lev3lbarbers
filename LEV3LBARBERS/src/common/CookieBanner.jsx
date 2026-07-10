import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { T } from './theme';

const KEY = 'lev3l_cookies_accepted';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <Banner
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={{ y: 80,    opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <BannerText>
            We use essential cookies to keep your cart and session working.{' '}
            <PolicyLink href="/contact" onClick={accept}>Privacy Policy</PolicyLink>
          </BannerText>
          <BannerActions>
            <AcceptBtn onClick={accept}>Accept</AcceptBtn>
          </BannerActions>
        </Banner>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;

const Banner = styled(motion.div)`
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 9999;
  background: ${T.surface};
  border-top: 1px solid ${T.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 5%;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.5);

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem 6%;
  }
`;

const BannerText = styled.p`
  font-family: ${T.fontBody};
  font-size: 0.82rem;
  color: ${T.textDim};
  margin: 0;
  line-height: 1.55;
  max-width: 680px;
`;

const PolicyLink = styled.a`
  color: ${T.gold};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const BannerActions = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-shrink: 0;
`;

const AcceptBtn = styled.button`
  background: ${T.red};
  border: none;
  color: #fff;
  padding: 0.5rem 1.4rem;
  border-radius: 6px;
  cursor: pointer;
  font-family: ${T.fontHead};
  font-size: 0.85rem;
  letter-spacing: 2px;
  transition: background 0.2s;
  &:hover { background: #a51830; }
`;
