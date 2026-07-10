import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled, { keyframes, css } from 'styled-components';
import { FaFacebookF, FaTiktok, FaInstagram } from 'react-icons/fa';
import privacyPolicyText from '../common/privacyPolicy';
import { BACKEND } from '../config';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';

const Footer = ({ fixed = false }) => {
  const [showModal,      setShowModal]      = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent,   setTermsContent]   = useState('');
  const [termsActive,    setTermsActive]    = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND}/reward-terms`)
      .then(r => r.json())
      .then(data => {
        setTermsContent(data.terms?.content || '');
        setTermsActive(data.terms?.isActive || false);
      })
      .catch(() => {});
  }, []);

  const NAV_LINKS = [
    { label: 'Shop',        to: '/shop' },
    { label: 'Services',    to: '/services' },
    { label: 'Gallery',     to: '/gallery' },
    { label: "What's On",   to: '/whats-on' },
    { label: 'Contact',     to: '/contact#info' },
  ];

  const SOCIALS = [
    { icon: <FaInstagram />, href: 'https://www.instagram.com/lev3l_barbers/',                              label: 'Instagram' },
    { icon: <FaTiktok />,    href: 'https://www.tiktok.com/@lev3lbarbers',                                 label: 'TikTok'    },
    { icon: <FaFacebookF />, href: 'https://www.facebook.com/people/Lev3l-barbers/61565542892469/',        label: 'Facebook'  },
  ];

  return (
    <>
      <StyledFooter $fixed={fixed}>
        {termsActive && (
          <PromoStrip onClick={() => setShowTermsModal(true)}>
            ✦ Active promotion — <u>see Rewards T&amp;C</u>
          </PromoStrip>
        )}
        <Inner>
          {/* Brand sign-off */}
          <BrandBlock
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => navigate('/')}
          >
            LEV3L BARBERS
          </BrandBlock>

          <Rule />

          {/* Main content: nav column + right side */}
          <ContentRow>
            {/* Nav — big stacked list */}
            <NavCol>
              {NAV_LINKS.map(({ label, to }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <NavLink to={to}>{label}</NavLink>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: NAV_LINKS.length * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <NavButton onClick={() => setShowModal(true)}>Privacy</NavButton>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (NAV_LINKS.length + 1) * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <NavButton onClick={() => setShowTermsModal(true)}>
                  Rewards T&amp;C
                  <RewardsDot $active={termsActive} />
                </NavButton>
              </motion.div>
            </NavCol>

            {/* Right: socials + location */}
            <RightCol>
              <Socials>
                {SOCIALS.map(({ icon, href, label }) => (
                  <motion.a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                  >
                    {icon}
                  </motion.a>
                ))}
              </Socials>

              <Location>
                <span>Southport, UK</span>
                <span>Est. 2023</span>
              </Location>
            </RightCol>
          </ContentRow>

          <BottomBar>
            © {new Date().getFullYear()} LEV3L Barbers. All rights reserved.
          </BottomBar>
        </Inner>
      </StyledFooter>

      {/* Privacy modal */}
      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalClose onClick={() => setShowModal(false)}>×</ModalClose>
            <ModalTitle>Privacy Policy</ModalTitle>
            <ModalBody>
              {privacyPolicyText.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
            </ModalBody>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* Rewards T&C modal */}
      {showTermsModal && (
        <ModalOverlay onClick={() => setShowTermsModal(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalClose onClick={() => setShowTermsModal(false)}>×</ModalClose>
            <ModalTitle>
              Rewards T&amp;C
              {termsActive && <ActiveBadge>✦ Active</ActiveBadge>}
            </ModalTitle>
            <ModalBody>
              {termsContent
                ? termsContent.split('\n').map((line, i) =>
                    line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                  )
                : <p style={{ opacity: 0.4, fontStyle: 'italic' }}>No terms published yet.</p>
              }
            </ModalBody>
          </ModalBox>
        </ModalOverlay>
      )}
    </>
  );
};

export default Footer;

/* ─────────── keyframes ─────────── */

const pulseDot = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.7); }
`;

/* ─────────── styles ─────────── */

const StyledFooter = styled.footer`
  background: ${CREAM};
  ${({ $fixed }) => $fixed && css`
    border-radius: 28px 28px 0 0;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 15;
  `}
`;

const Inner = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 6%;

  @media (max-width: 600px) {
    padding: 1rem;
  }
`;

const BrandBlock = styled(motion.div)`
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(28px, 6vw, 80px);
  letter-spacing: -1px;
  line-height: 0.88;
  color: ${INK};
  padding: 2.2rem 0 1.8rem;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.55; }

  @media (max-width: 600px) {
    padding: 1.2rem 0 1rem;
  }
`;

const Rule = styled.div`
  height: 1px;
  background: linear-gradient(to right, rgba(26,26,26,0.15), rgba(26,26,26,0.05));
  margin-bottom: 2rem;

  @media (max-width: 600px) {
    margin-bottom: 1.2rem;
  }
`;

const ContentRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
`;

/* Big stacked nav list */
const NavCol = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const navStyle = `
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(1rem, 2.5vw, 2rem);
  letter-spacing: 1px;
  color: rgba(26,26,26,0.75);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.15;
  &:hover { color: ${INK}; }
`;

const NavLink = styled(Link)`${navStyle}`;
const NavButton = styled.span`${navStyle}`;

const RewardsDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${RED};
  flex-shrink: 0;
  animation: ${({ $active }) => $active ? `${pulseDot} 1.6s ease-in-out infinite` : 'none'};
  opacity: ${({ $active }) => $active ? 1 : 0.35};
`;

const RightCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2rem;
  padding-top: 0.4rem;

  @media (max-width: 600px) {
    align-items: flex-end;
  }
`;

const Socials = styled.div`
  display: flex;
  align-items: center;
  gap: 1.4rem;

  a {
    color: rgba(26,26,26,0.45);
    font-size: 1.4rem;
    display: inline-flex;
    transition: color 0.2s;
    &:hover { color: ${INK}; }
  }
`;

const Location = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(26,26,26,0.35);

  @media (max-width: 600px) { align-items: flex-end; }
`;

const BottomBar = styled.div`
  margin-top: 2rem;
  padding: 1rem 0;

  @media (max-width: 600px) {
    margin-top: 1rem;
    padding: 0.8rem 0;
  }
  border-top: 1px solid rgba(26,26,26,0.08);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(26,26,26,0.28);
`;

/* Promo strip */
const PromoStrip = styled.div`
  background: ${RED};
  padding: 0.55rem 6%;
  text-align: center;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fff;
  transition: opacity 0.2s;
  u { text-underline-offset: 3px; }
  &:hover { opacity: 0.88; }
`;

/* Modals */
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
`;

const ModalBox = styled.div`
  background: #f4f0e8;
  border: 1px solid rgba(26,26,26,0.1);
  padding: 2rem 1.8rem;
  max-width: 500px;
  width: 90%;
  max-height: 72vh;
  overflow-y: auto;
  position: relative;
  border-radius: 4px;
`;

const ModalClose = styled.button`
  position: absolute;
  top: 10px; right: 14px;
  background: none;
  border: none;
  color: rgba(26,26,26,0.4);
  font-size: 1.8rem;
  cursor: pointer;
  line-height: 1;
  &:hover { color: ${INK}; }
`;

const ModalTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.6rem;
  letter-spacing: 3px;
  margin: 0 0 1.2rem;
  color: ${INK};
`;

const ModalBody = styled.div`
  font-size: 0.8rem;
  color: rgba(26,26,26,0.6);
  line-height: 1.8;
  p { margin-bottom: 1rem; }
`;

const ActiveBadge = styled.span`
  display: inline-block;
  margin-left: 0.75rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${RED};
  border: 1px solid rgba(196,30,58,0.35);
  padding: 2px 8px;
  border-radius: 999px;
  vertical-align: middle;
`;
