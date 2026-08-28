import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import Seo from '../common/Seo';
import api from '../utils/api';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/* % of today's open window that has already elapsed — null if closed today */
function computeTodayProgress(dh) {
  if (!dh || dh.closed) return null;
  const [oh, om] = dh.open.split(':').map(Number);
  const [ch, cm] = dh.close.split(':').map(Number);
  const now = new Date();
  const nowMins   = now.getHours() * 60 + now.getMinutes();
  const openMins  = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  if (nowMins <= openMins)  return 0;
  if (nowMins >= closeMins) return 100;
  return ((nowMins - openMins) / (closeMins - openMins)) * 100;
}

/* ── Reveal once visible — checks geometry immediately on mount so
   above-the-fold sections show right away (IntersectionObserver alone can
   miss elements that are already in view at first paint, before layout
   has settled), and falls back to the observer for below-the-fold ones. ── */
const useInViewOnce = (threshold = 0.2) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { top, bottom } = el.getBoundingClientRect();
    if (top < window.innerHeight && bottom > 0) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return [ref, inView];
};

/* ── Types a string out character by character once `active` flips true ── */
const TypeText = ({ text, active, delay = 0, speed = 28 }) => {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!active || !text) return;
    let i = 0;
    const start = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(iv);
      }, speed);
    }, delay);
    return () => clearTimeout(start);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span>{out}</span>;
};

/* ── Simple line-art icons ── */
const PhoneIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M5 3h3.5l1.5 5-2.3 1.6a11 11 0 0 0 6.7 6.7l1.6-2.3 5 1.5V19a2 2 0 0 1-2 2C11.5 21 3 12.5 3 5a2 2 0 0 1 2-2Z"
      stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const EnvelopeBody = (props) => (
  <path d="M3 6h18v12H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" {...props} />
);
const EnvelopeFlap = (props) => (
  <motion.path d="M3 6l9 7 9-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" {...props} />
);

const ContactPage = () => {
  const [info,  setInfo]  = useState(null);
  // null (not a hardcoded guess) until the real schedule loads — a fallback
  // that assumed Sunday was closed by default was exactly what made a
  // properly-configured Sunday flash as "Closed" before the fetch resolved.
  const [hours, setHours] = useState(null);
  const [copied, setCopied] = useState(false);
  const todayIdx = new Date().getDay();

  const [locRef,   locVisible]   = useInViewOnce(0.15);
  const [infoRef,  infoVisible]  = useInViewOnce(0.15);
  const [hoursRef, hoursVisible] = useInViewOnce(0.15);

  useEffect(() => {
    Promise.all([
      api.get('/shop-info'),
      api.get('/shop-status'),
    ]).then(([infoRes, statusRes]) => {
      setInfo(infoRes.data);
      if (statusRes.data.openingHours) {
        setHours(statusRes.data.openingHours);
      }
    }).catch(() => {});
  }, []);

  const fullAddress = [info?.address || '76 Eastbank Street', info?.city, info?.postcode]
    .filter(Boolean).join(', ');
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(fullAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const todayProgress = hours ? computeTodayProgress(hours[todayIdx]) : null;

  return (
    <PageWrap>
      <Seo title="Contact & Hours" description="Get in touch with LEV3L Barbers. Find our location, opening hours, and contact details." />

      <CornerPole />

      <PageHeader
        as={motion.div}
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: EASE }}
      >
        <HeaderDotGrid />
        <HeaderPinDrop
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 0.55 }}
          transition={{ type: 'spring', stiffness: 240, damping: 13, mass: 0.7, delay: 0.55 }}
        >
          <PinSvg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 31C12 31 22 19.8 22 12a10 10 0 1 0-20 0c0 7.8 10 19 10 19Z" fill={RED} />
            <circle cx="12" cy="12" r="4" fill={CREAM} />
          </PinSvg>
        </HeaderPinDrop>

        <HeaderInner>
          <Eyebrow>Get in Touch</Eyebrow>
          <PageTitle>Find Us</PageTitle>
          <HeaderRule />
        </HeaderInner>
      </PageHeader>

      <Content>
        {/* Location */}
        <div ref={locRef}>
        <Block
          id="location"
          style={{ scrollMarginTop: '110px' }}
          as={motion.div}
          initial={{ opacity: 0, y: 28 }}
          animate={locVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <BlockLabel>Our Location</BlockLabel>

          <AddressBlock
            role="button"
            tabIndex={0}
            onClick={handleCopyAddress}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCopyAddress(); }}
            title="Click to copy address"
          >
            <BlockTitle>{info?.address || '76 Eastbank Street'}</BlockTitle>
            {(info?.city || info?.postcode) && (
              <AddressLine>
                {[info.city, info.postcode].filter(Boolean).join(' · ')}
              </AddressLine>
            )}
          </AddressBlock>

          <AddressActions>
            <CopyHint>
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span key="copied" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
                    ✓ Copied
                  </motion.span>
                ) : (
                  <motion.span key="copy" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
                    Tap address to copy
                  </motion.span>
                )}
              </AnimatePresence>
            </CopyHint>

            <DirectionsLink href={directionsUrl} target="_blank" rel="noopener noreferrer">
              Get Directions <span className="dir-arrow">→</span>
            </DirectionsLink>
          </AddressActions>

          <MapFrame>
            <iframe
              title="LEV3L Barbers Location"
              src={info?.mapEmbedUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2365.179804219527!2d-3.0026584655850725!3d53.64376606025772!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487b3f28c2404633%3A0x865d00ff707467f9!2sLev3l%20barbers!5e0!3m2!1sen!2suk!4v1752950880062!5m2!1sen!2suk'}
              allow="fullscreen"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </MapFrame>
        </Block>
        </div>

        <SectionDivider />

        {/* Contact info */}
        <div ref={infoRef}>
        <Block
          id="info"
          style={{ scrollMarginTop: '110px' }}
          as={motion.div}
          initial={{ opacity: 0, y: 28 }}
          animate={infoVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <BlockLabel>Contact Info</BlockLabel>
          <BlockTitle>Reach Us</BlockTitle>
          <InfoList>
            {info?.phone && (
              <InfoRow>
                <InfoKey>Phone</InfoKey>
                <InfoVal>
                  <a href={`tel:${info.phone.replace(/\s/g, '')}`}>
                    <IconWrap whileHover={{ rotate: [0, 10, -10, 8, -8, 0] }} transition={{ duration: 0.55 }}>
                      <PhoneIcon />
                    </IconWrap>
                    {info.phone}
                  </a>
                </InfoVal>
              </InfoRow>
            )}
            {info?.email && (
              <InfoRow>
                <InfoKey>Email</InfoKey>
                <InfoVal>
                  <a href={`mailto:${info.email}`}>
                    <IconWrap whileHover="open" initial="closed">
                      <EnvelopeIconSvg viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <EnvelopeBody />
                        <EnvelopeFlap
                          variants={{ closed: { y: 0, rotate: 0 }, open: { y: -1.5, rotate: -2 } }}
                          transition={{ duration: 0.3, ease: EASE }}
                          style={{ transformOrigin: '3px 6px' }}
                        />
                      </EnvelopeIconSvg>
                    </IconWrap>
                    {info.email}
                  </a>
                </InfoVal>
              </InfoRow>
            )}
            {info?.instagram && (
              <InfoRow>
                <InfoKey>Social</InfoKey>
                <InfoVal>{info.instagram}</InfoVal>
              </InfoRow>
            )}
            {!info && (
              <>
                <InfoRow>
                  <InfoKey>Phone</InfoKey>
                  <InfoVal>
                    <a href="tel:+447538420684">
                      <IconWrap whileHover={{ rotate: [0, 10, -10, 8, -8, 0] }} transition={{ duration: 0.55 }}>
                        <PhoneIcon />
                      </IconWrap>
                      +44 7538 420 684
                    </a>
                  </InfoVal>
                </InfoRow>
                <InfoRow>
                  <InfoKey>Email</InfoKey>
                  <InfoVal>
                    <a href="mailto:lev3lbarbers@gmail.com">
                      <IconWrap whileHover="open" initial="closed">
                        <EnvelopeIconSvg viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <EnvelopeBody />
                          <EnvelopeFlap
                            variants={{ closed: { y: 0, rotate: 0 }, open: { y: -1.5, rotate: -2 } }}
                            transition={{ duration: 0.3, ease: EASE }}
                            style={{ transformOrigin: '3px 6px' }}
                          />
                        </EnvelopeIconSvg>
                      </IconWrap>
                      lev3lbarbers@gmail.com
                    </a>
                  </InfoVal>
                </InfoRow>
                <InfoRow>
                  <InfoKey>Social</InfoKey>
                  <InfoVal>@lev3l_barbers</InfoVal>
                </InfoRow>
              </>
            )}
          </InfoList>
        </Block>
        </div>

        <SectionDivider />

        {/* Opening hours — typewriter reveal + today's progress bar */}
        <Block
          id="hours"
          style={{ scrollMarginTop: '110px' }}
          as={motion.div}
          initial={{ opacity: 0, y: 28 }}
          animate={hoursVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <BlockLabel>Opening Hours</BlockLabel>
          <BlockTitle>When We're Here</BlockTitle>
          <HoursList ref={hoursRef}>
            {!hours ? (
              <HoursLoading>Loading hours…</HoursLoading>
            ) : DAY_NAMES.map((day, i) => {
              const dh = hours[i];
              const isToday = i === todayIdx;
              const timeText = dh?.closed ? 'Closed' : `${fmtTime(dh?.open)} – ${fmtTime(dh?.close)}`;
              return (
                <HoursRow key={i} $today={isToday}>
                  <HoursDay $today={isToday}>
                    {day}
                    {isToday && <TodayPip />}
                  </HoursDay>
                  <HoursDot />
                  <HoursTime $closed={dh?.closed}>
                    <TypeText text={timeText} active={hoursVisible} delay={i * 80} speed={26} />
                  </HoursTime>

                  {isToday && todayProgress !== null && (
                    <ProgressFill
                      initial={{ width: 0 }}
                      animate={{ width: hoursVisible ? `${todayProgress}%` : 0 }}
                      transition={{ duration: 0.9, delay: i * 0.08 + 0.5, ease: EASE }}
                    />
                  )}
                </HoursRow>
              );
            })}
          </HoursList>
        </Block>
      </Content>
    </PageWrap>
  );
};

export default ContactPage;

/* ─────────── Styles ─────────── */

const PageWrap = styled.div`
  position: relative;
  background: ${CREAM};
  min-height: 100vh;
  color: ${INK};
  font-family: 'Bebas Neue', sans-serif;
  overflow: hidden;
`;

const CornerPole = styled.div`
  position: fixed;
  bottom: -30px;
  right: 5%;
  width: 22px;
  height: 130px;
  border-radius: 11px;
  overflow: hidden;
  opacity: 0.14;
  pointer-events: none;
  z-index: 0;
  background: repeating-linear-gradient(
    45deg,
    #C41E3A 0,    #C41E3A 6px,
    #ffffff 6px,  #ffffff 12px,
    #1a3a8f 12px, #1a3a8f 18px
  );
  background-size: 18px 70px;

  @media (max-width: 600px) { display: none; }
`;

const PageHeader = styled.div`
  position: relative;
  z-index: 1;
  overflow: hidden;
  padding: 5.5rem 8% 3.5rem;
  border-bottom: 1px solid rgba(26, 26, 26, 0.1);
  @media (max-width: 768px) { padding: 3.5rem 6% 2.5rem; }
`;

const HeaderDotGrid = styled.div`
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(26, 26, 26, 0.08) 1px, transparent 1px);
  background-size: 20px 20px;
  z-index: 0;
`;

const HeaderPinDrop = styled(motion.div)`
  position: absolute;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 0;

  @media (max-width: 600px) { display: none; }
`;

const PinSvg = styled.svg`
  width: 30px;
  height: 40px;
  filter: drop-shadow(0 4px 6px rgba(26, 26, 26, 0.25));
`;

const HeaderInner = styled.div`
  position: relative;
  z-index: 1;
`;

const Eyebrow = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 10px; font-weight: 900; letter-spacing: 5px;
  text-transform: uppercase; color: ${RED}; margin: 0 0 0.5rem;
`;

const PageTitle = styled.h1`
  font-size: clamp(3rem, 7vw, 5.5rem);
  letter-spacing: 4px; margin: 0; line-height: 1; color: ${INK};
`;

const HeaderRule = styled.div`
  width: 52px; height: 2px; background: ${RED}; margin: 1.2rem 0 0;
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  padding: 0 8% 6rem; max-width: 900px;
  @media (max-width: 768px) { padding: 0 6% 4rem; }
`;

const Block = styled.div`padding: 4rem 0 3rem;`;

const BlockLabel = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 10px; font-weight: 900; letter-spacing: 5px;
  text-transform: uppercase; color: ${RED}; margin: 0 0 0.5rem;
`;

const BlockTitle = styled.h2`
  font-size: clamp(1.8rem, 4vw, 2.8rem); letter-spacing: 3px; margin: 0 0 0.4rem; color: ${INK};
`;

const AddressLine = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 500;
  color: rgba(26, 26, 26, 0.55); letter-spacing: 1px; margin: 0;
`;

const AddressBlock = styled.div`
  display: inline-block;
  cursor: pointer;
  border-radius: 4px;
  transition: opacity 0.2s;
  &:hover { opacity: 0.7; }
`;

const AddressActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin: 1rem 0 1.6rem;
`;

const CopyHint = styled.div`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.5);
  height: 1.2em;
  overflow: hidden;
`;

const DirectionsLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${RED};
  text-decoration: none;

  .dir-arrow {
    display: inline-block;
    transition: transform 0.2s ease;
  }
  &:hover .dir-arrow { transform: translateX(5px); }
`;

const MapFrame = styled.div`
  width: 100%; aspect-ratio: 16 / 7; overflow: hidden; border: 1px solid rgba(26, 26, 26, 0.1);
  iframe { width: 100%; height: 100%; border: 0; display: block; }
  @media (max-width: 768px) { aspect-ratio: 4 / 3; }
`;

const SectionDivider = styled.div`
  position: relative; z-index: 1;
  width: 100%; height: 1px; background: rgba(26, 26, 26, 0.1);
`;

const InfoList = styled.dl`margin: 0; display: flex; flex-direction: column; gap: 1.2rem;`;

const InfoRow = styled.div`
  display: flex; align-items: baseline; gap: 1.5rem;
  border-bottom: 1px solid rgba(26, 26, 26, 0.1); padding-bottom: 1.2rem;
  &:last-child { border-bottom: none; }
`;

const InfoKey = styled.dt`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.48);
  width: 70px; flex-shrink: 0;
`;

const InfoVal = styled.dd`
  font-family: 'Montserrat', sans-serif; font-size: 0.95rem; color: ${INK}; margin: 0;
  a {
    display: inline-flex; align-items: center; gap: 0.5rem;
    color: ${RED}; text-decoration: none; transition: opacity 0.2s;
    &:hover { opacity: 0.75; }
  }
`;

const IconWrap = styled(motion.span)`
  display: inline-flex;
  color: ${RED};
`;

const EnvelopeIconSvg = styled.svg`
  width: 18px;
  height: 14px;
`;

const HoursList = styled.div`display: flex; flex-direction: column; gap: 0;`;

const HoursLoading = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.9rem; font-weight: 600;
  color: rgba(26, 26, 26, 0.45); padding: 1.1rem 0;
`;

const HoursRow = styled.div`
  position: relative;
  overflow: hidden;
  display: flex; align-items: center; gap: 1.2rem; padding: 1.1rem 0;
  border-bottom: 1px solid rgba(26, 26, 26, 0.1);
  background: ${({ $today }) => $today ? 'rgba(196, 30, 58, 0.04)' : 'transparent'};
  &:last-child { border-bottom: none; }
`;

const HoursDay = styled.span`
  font-size: 1.1rem; letter-spacing: 2px; width: 130px; flex-shrink: 0;
  color: ${({ $today }) => $today ? RED : INK};
  display: flex; align-items: center; gap: 0.5rem;
  @media (max-width: 480px) { width: auto; font-size: 1rem; }
`;

const TodayPip = styled.span`
  display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: ${RED}; flex-shrink: 0;
`;

const HoursDot = styled.div`flex: 1; height: 1px; background: rgba(26, 26, 26, 0.1);`;

const HoursTime = styled.span`
  font-family: 'Montserrat', sans-serif; font-size: 0.88rem; font-weight: 600; letter-spacing: 1px; flex-shrink: 0;
  min-width: 130px;
  color: ${({ $closed }) => $closed ? 'rgba(26, 26, 26, 0.42)' : RED};
`;

/* Today's elapsed-time progress bar, sits along the row's bottom edge */
const ProgressFill = styled(motion.div)`
  position: absolute;
  left: 0; bottom: 0;
  height: 2px;
  background: ${RED};
`;
