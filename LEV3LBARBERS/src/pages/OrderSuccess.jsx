import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import QRCode from 'react-qr-code';
import { useCart } from '../context/CartContext';
import { GiftIcon } from '../common/icons';
import api from '../utils/api';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const GOLD  = '#C4922A';
const EASE  = [0.22, 1, 0.36, 1];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (s) => { const d = new Date(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

const OrderSuccess = () => {
  const { state }         = useLocation();
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const { clearCart }     = useCart();

  const [order,     setOrder]     = useState(state?.order     || null);
  const [giftCodes, setGiftCodes] = useState(state?.giftCodes || []);
  const [confirming, setConfirming] = useState(false);

  // ── Confetti — recolored for visibility against the cream background ──
  useEffect(() => {
    const fire = (opts) =>
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.55 }, ...opts });
    setTimeout(() => {
      fire({ colors: [RED, INK, GOLD] });
      setTimeout(() => fire({ angle: 60,  colors: [GOLD, INK] }), 250);
      setTimeout(() => fire({ angle: 120, colors: [RED, GOLD] }), 400);
    }, 300);
  }, []);

  // ── 3DS redirect fallback ─────────────────────────────────────────────────────
  // Stripe redirects here with ?payment_intent=... after 3D Secure authentication.
  // We stored the orderId in sessionStorage before the payment step.
  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent');
    if (!paymentIntentId || order) return; // already have order from state

    const pendingOrderId = sessionStorage.getItem('pending_order_id');
    if (!pendingOrderId) return;

    setConfirming(true);
    api.post('/checkout/confirm-order', { orderId: parseInt(pendingOrderId, 10) })
      .then(res => {
        setOrder(res.data.order);
        setGiftCodes(res.data.giftCodes || []);
        clearCart();
        sessionStorage.removeItem('pending_order_id');
      })
      .catch(() => { /* show basic success if confirm fails */ })
      .finally(() => setConfirming(false));
  }, []);

  if (confirming) {
    return (
      <Page>
        <Center>
          <Spinner />
          <Sub style={{ marginTop: '1rem' }}>Confirming your payment…</Sub>
        </Center>
      </Page>
    );
  }

  if (!order) {
    return (
      <Page>
        <Center>
          <HeadTitle>Payment Confirmed</HeadTitle>
          <Sub>Check your email for your order details.</Sub>
          <BackBtn onClick={() => navigate('/shop')}>← Back to Shop</BackBtn>
        </Center>
      </Page>
    );
  }

  return (
    <Page>
      <Center
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <Tick>✓</Tick>
        <Eyebrow>Order #{order.id}</Eyebrow>
        <HeadTitle>Payment Confirmed</HeadTitle>
        <Sub>
          Thanks, {order.customerName}! A confirmation has been sent to{' '}
          <em>{order.customerEmail}</em>.
        </Sub>
      </Center>

      <Content>
        {/* Gift card codes */}
        {giftCodes.length > 0 && (
          <GiftSection
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <GiftTitle><GiftIcon width={20} height={20} /> Your Gift Card Code{giftCodes.length > 1 ? 's' : ''}</GiftTitle>
            <GiftNote>These codes have been emailed to you. Present in-store or share with the recipient.</GiftNote>
            <CodesGrid>
              {giftCodes.map(gc => {
                const verifyUrl = `${window.location.origin}/gc/${encodeURIComponent(gc.code)}`;
                return (
                  <CodeCard key={gc.id}>
                    <CodeValue>£{gc.value} Gift Card</CodeValue>
                    <CodeStr>{gc.code}</CodeStr>
                    <QRWrap>
                      <QRCode
                        value={verifyUrl}
                        size={140}
                        bgColor="transparent"
                        fgColor={INK}
                        level="M"
                      />
                    </QRWrap>
                    <QRNote>Staff scan this at the counter to redeem</QRNote>
                    <CopyBtn onClick={() => navigator.clipboard?.writeText(gc.code)}>
                      Copy code
                    </CopyBtn>
                  </CodeCard>
                );
              })}
            </CodesGrid>
          </GiftSection>
        )}

        {/* Order summary */}
        <OrderCard
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: giftCodes.length > 0 ? 0.4 : 0.25 }}
        >
          <OrderCardTitle>Order Summary</OrderCardTitle>
          <OrderMeta>
            <MetaRow><MetaKey>Date</MetaKey><MetaVal>{fmtDate(order.createdAt)}</MetaVal></MetaRow>
            <MetaRow><MetaKey>Total</MetaKey><MetaVal>£{order.total.toFixed(2)}</MetaVal></MetaRow>
            <MetaRow><MetaKey>Status</MetaKey><StatusBadge>Paid</StatusBadge></MetaRow>
          </OrderMeta>
          <ItemsList>
            {order.items?.map(item => (
              <OrderItem key={item.id}>
                <OrderItemName>
                  {item.name}
                  {item.itemType === 'gift-card' && ` (£${item.giftCardValue} Gift Card)`}
                </OrderItemName>
                <OrderItemRight>
                  <span>×{item.quantity}</span>
                  <span>£{(item.price * item.quantity).toFixed(2)}</span>
                </OrderItemRight>
              </OrderItem>
            ))}
          </ItemsList>
        </OrderCard>

        <Actions>
          <BackBtn onClick={() => navigate('/shop')}>← Continue Shopping</BackBtn>
        </Actions>
      </Content>
    </Page>
  );
};

export default OrderSuccess;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh;
  background: ${CREAM}; color: ${INK};
  font-family: 'Montserrat', sans-serif; padding-bottom: 6rem;
`;

const Center = styled(motion.div)`
  text-align: center;
  padding: 4rem 5% 2.5rem;
  max-width: 640px; margin: 0 auto;
`;

const Tick = styled.div`
  width: 64px; height: 64px; border-radius: 50%;
  background: rgba(46,125,50,0.1); border: 2px solid rgba(46,125,50,0.35);
  color: #2e7d32; font-size: 1.8rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.5rem;
`;

const Eyebrow = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 900;
  letter-spacing: 4px; text-transform: uppercase; color: ${RED}; margin: 0 0 0.5rem;
`;
const HeadTitle = styled.h1`
  font-family: 'Bebas Neue', sans-serif; font-size: clamp(2.5rem, 6vw, 4rem);
  letter-spacing: 4px; margin: 0 0 0.8rem; color: ${INK};
`;
const Sub = styled.p`
  font-size: 0.9rem; color: rgba(26, 26, 26, 0.55); line-height: 1.7; margin: 0;
  em { color: ${INK}; font-style: normal; }
`;

const Content = styled.div`
  max-width: 640px; margin: 0 auto; padding: 0 5%;
`;

/* Gift codes */
const GiftSection = styled(motion.div)`
  background: rgba(255, 255, 255, 0.55); border: 1px solid rgba(26, 26, 26, 0.1);
  padding: 1.8rem; margin-bottom: 1.5rem;
`;
const GiftTitle = styled.h2`
  display: flex; align-items: center; gap: 0.5rem;
  font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; letter-spacing: 2px;
  margin: 0 0 0.5rem; color: ${INK};
`;
const GiftNote = styled.p`
  font-size: 0.82rem; color: rgba(26, 26, 26, 0.55); margin: 0 0 1.2rem; line-height: 1.6;
`;
const CodesGrid = styled.div`
  display: flex; flex-direction: column; gap: 0.85rem;
`;
const CodeCard = styled.div`
  background: rgba(26, 26, 26, 0.02); border: 2px dashed rgba(196,30,58,0.3);
  border-radius: 6px; padding: 1.1rem 1.3rem;
  text-align: center;
`;
const CodeValue = styled.p`
  font-size: 0.75rem; letter-spacing: 3px; color: ${RED};
  text-transform: uppercase; margin: 0 0 0.5rem;
`;
const CodeStr = styled.p`
  font-family: monospace; font-size: 1.4rem; font-weight: 700;
  letter-spacing: 4px; color: ${INK}; margin: 0 0 0.75rem;
`;
const QRWrap = styled.div`
  display: flex; justify-content: center;
  padding: 0.75rem;
  background: #ffffff;
  border-radius: 6px; margin: 0.4rem 0;
`;
const QRNote = styled.p`
  font-size: 0.72rem; color: rgba(26, 26, 26, 0.4); margin: 0 0 0.6rem; letter-spacing: 0.5px;
`;
const CopyBtn = styled.button`
  background: none; border: 1px solid rgba(26, 26, 26, 0.15);
  color: rgba(26, 26, 26, 0.5); padding: 0.3rem 0.9rem; border-radius: 4px;
  cursor: pointer; font-size: 0.78rem; letter-spacing: 1px; transition: all 0.2s;
  &:hover { border-color: rgba(26, 26, 26, 0.35); color: ${INK}; }
`;

/* Order card */
const OrderCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.55); border: 1px solid rgba(26, 26, 26, 0.1);
  padding: 1.8rem; margin-bottom: 1.5rem;
`;
const OrderCardTitle = styled.h3`
  font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 900; letter-spacing: 4px;
  text-transform: uppercase;
  color: ${RED}; margin: 0 0 1.1rem;
`;
const OrderMeta = styled.div`
  display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.2rem;
  padding-bottom: 1.2rem; border-bottom: 1px solid rgba(26, 26, 26, 0.1);
`;
const MetaRow = styled.div`display: flex; justify-content: space-between; align-items: center;`;
const MetaKey = styled.span`font-size: 0.8rem; color: rgba(26, 26, 26, 0.5);`;
const MetaVal = styled.span`font-size: 0.88rem; color: ${INK};`;
const StatusBadge = styled.span`
  font-size: 0.68rem; font-weight: 700; letter-spacing: 2px;
  padding: 2px 9px; border-radius: 3px;
  background: rgba(46,125,50,0.1); color: #2e7d32; border: 1px solid rgba(46,125,50,0.3);
`;
const ItemsList = styled.div`display: flex; flex-direction: column; gap: 0.6rem;`;
const OrderItem = styled.div`
  display: flex; justify-content: space-between; align-items: baseline; gap: 1rem;
`;
const OrderItemName = styled.span`font-size: 0.88rem; color: ${INK};`;
const OrderItemRight = styled.div`
  display: flex; gap: 1rem; flex-shrink: 0;
  font-size: 0.84rem; color: rgba(26, 26, 26, 0.5);
  span:last-child { color: ${INK}; }
`;

const Actions = styled.div`display: flex; justify-content: center; padding-top: 0.5rem;`;
const BackBtn = styled.button`
  background: none; border: 1px solid rgba(26, 26, 26, 0.15);
  color: rgba(26, 26, 26, 0.55); padding: 0.65rem 1.5rem;
  border-radius: 4px; cursor: pointer;
  font-family: 'Bebas Neue', sans-serif; font-size: 0.9rem; letter-spacing: 2px;
  transition: all 0.2s;
  &:hover { border-color: rgba(26, 26, 26, 0.35); color: ${INK}; }
`;

const Spinner = styled.div`
  width: 40px; height: 40px; border-radius: 50%;
  border: 3px solid rgba(26, 26, 26, 0.1); border-top-color: ${RED};
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;
