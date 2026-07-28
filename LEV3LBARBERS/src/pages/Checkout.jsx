import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { GiftIcon, BagIcon, LockIcon } from '../common/icons';
import api from '../utils/api';

import { resolveImageUrl } from '../config';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const STRIPE_APPEARANCE = {
  theme: 'stripe',
  variables: {
    colorPrimary:    RED,
    colorBackground: '#ffffff',
    colorText:       INK,
    colorTextSecondary: 'rgba(26,26,26,0.5)',
    colorDanger:     RED,
    fontFamily:      "'Montserrat', sans-serif",
    borderRadius:    '4px',
  },
  rules: {
    '.Input':       { backgroundColor: '#ffffff', border: '1px solid rgba(26,26,26,0.15)' },
    '.Input:focus': { border: '1px solid rgba(26,26,26,0.4)', boxShadow: 'none' },
    '.Label':       { color: RED, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' },
  },
};

/* ─── Outer wrapper ───────────────────────────────────────────────────────── */

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total: cartTotal, clearCart } = useCart();

  // Step
  const [step,         setStep]         = useState('details');
  const [clientSecret, setClientSecret] = useState(null);
  const [orderId,      setOrderId]      = useState(null);

  // Contact
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Delivery
  const [delivery, setDelivery] = useState({ line1: '', line2: '', city: '', postcode: '' });
  const setDel = (k, v) => setDelivery(d => ({ ...d, [k]: v }));

  // Gift card recipients
  const [giftRecipients, setGiftRecipients] = useState({});
  const setRecipient = (cartId, field, value) =>
    setGiftRecipients(p => ({
      ...p,
      [cartId]: { sendToRecipient: false, name: '', email: '', message: '', ...p[cartId], [field]: value },
    }));

  // Promo
  const [promoInput,   setPromoInput]   = useState('');
  const [promoData,    setPromoData]    = useState(null);
  const [promoErr,     setPromoErr]     = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // T&C + errors
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formErr,    setFormErr]    = useState('');
  const [proceeding, setProceeding] = useState(false);

  const hasPhysical = items.some(i => i.type === 'product');
  const giftItems   = items.filter(i => i.type === 'gift-card');
  const discount    = promoData?.discount || 0;
  const finalTotal  = Math.max(0, parseFloat((cartTotal - discount).toFixed(2)));

  if (items.length === 0) {
    return (
      <Page>
        <EmptyState initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyIcon><BagIcon width={56} height={56} /></EmptyIcon>
          <EmptyTitle>Your Cart Is Empty</EmptyTitle>
          <EmptyBtn onClick={() => navigate('/shop')}>Browse the Shop →</EmptyBtn>
        </EmptyState>
      </Page>
    );
  }

  /* ── Apply promo ── */
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true); setPromoErr(''); setPromoData(null);
    try {
      const { data } = await api.post('/promo/validate', { code: promoInput.trim(), orderTotal: cartTotal });
      setPromoData(data);
    } catch (err) {
      setPromoErr(err.response?.data?.message || 'Invalid promo code');
    } finally { setPromoLoading(false); }
  };

  /* ── Continue to payment ── */
  const handleContinue = async () => {
    setFormErr('');
    if (!name.trim())  return setFormErr('Name is required.');
    if (!email.trim()) return setFormErr('Email is required.');
    if (hasPhysical) {
      if (!delivery.line1.trim())    return setFormErr('Delivery address line 1 is required.');
      if (!delivery.city.trim())     return setFormErr('City is required.');
      if (!delivery.postcode.trim()) return setFormErr('Postcode is required.');
    }
    if (!agreeTerms) return setFormErr('Please agree to the Terms & Conditions to continue.');

    setProceeding(true);
    try {
      const { data } = await api.post('/checkout/create-payment-intent', {
        items: items.map(i => {
          const r = giftRecipients[i.cartId];
          const send = i.type === 'gift-card' && r?.sendToRecipient && r?.email?.trim();
          return {
            name:           i.name,
            price:          i.price,
            quantity:       i.quantity,
            type:           i.type,
            productId:      i.productId    || null,
            giftCardValue:  i.giftCardValue || null,
            imageUrl:       i.imageUrl     || null,
            recipientName:  send ? r.name?.trim()    || null : null,
            recipientEmail: send ? r.email?.trim()   || null : null,
            message:        send ? r.message?.trim() || null : null,
          };
        }),
        customerName:    name.trim(),
        customerEmail:   email.trim(),
        customerPhone:   phone.trim() || undefined,
        deliveryAddress: hasPhysical ? {
          line1:    delivery.line1.trim(),
          line2:    delivery.line2.trim() || undefined,
          city:     delivery.city.trim(),
          postcode: delivery.postcode.trim(),
          country:  'UK',
        } : undefined,
        promoCode: promoData?.code || undefined,
      });

      // Save orderId for the 3DS redirect fallback
      sessionStorage.setItem('pending_order_id', String(data.orderId));
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
      setStep('payment');
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Could not create order. Please try again.');
    } finally { setProceeding(false); }
  };

  /* ── Payment step ── */
  if (step === 'payment' && clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
        <PaymentStep
          total={finalTotal}
          subtotal={cartTotal}
          discount={discount}
          promoCode={promoData?.code}
          orderId={orderId}
          items={items}
          onBack={() => setStep('details')}
          onSuccess={clearCart}
        />
      </Elements>
    );
  }

  /* ── Details step ── */
  return (
    <Page>
      <PageGrid>
        {/* Order summary */}
        <Summary initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <Eyebrow>Order Summary</Eyebrow>
          <ItemsList>
            {items.map(item => (
              <SummaryItem key={item.cartId}>
                <SummaryThumb>
                  {item.imageUrl ? <img src={resolveImageUrl(item.imageUrl)} alt={item.name} /> : <ThumbPh>{item.type === 'gift-card' ? <GiftIcon width={18} height={18} /> : '✦'}</ThumbPh>}
                  <QtyBadge>{item.quantity}</QtyBadge>
                </SummaryThumb>
                <SummaryName>
                  {item.name}
                  {item.type === 'gift-card' && <SummarySub>£{item.giftCardValue} Gift Card</SummarySub>}
                </SummaryName>
                <SummaryPrice>£{(item.price * item.quantity).toFixed(2)}</SummaryPrice>
              </SummaryItem>
            ))}
          </ItemsList>
          {discount > 0 && (
            <DiscountLine>
              <span>Discount {promoData?.code && `(${promoData.code})`}</span>
              <span style={{ color: '#2e7d32' }}>−£{discount.toFixed(2)}</span>
            </DiscountLine>
          )}
          <TotalLine>
            <TotalLabel>Total</TotalLabel>
            <TotalAmt>£{finalTotal.toFixed(2)}</TotalAmt>
          </TotalLine>
        </Summary>

        {/* Details form */}
        <DetailsPanel initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}>
          {/* Contact */}
          <Eyebrow>Your Details</Eyebrow>
          <FieldGroup>
            <Field><Label>Full Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" autoComplete="name" /></Field>
            <Field><Label>Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" autoComplete="email" /></Field>
            <Field><Label>Phone <LabelHint>(optional)</LabelHint></Label><Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7700 000000" autoComplete="tel" /></Field>
          </FieldGroup>

          {/* Delivery address */}
          {hasPhysical && (
            <>
              <Eyebrow style={{ marginTop: '1.6rem' }}>Delivery Address</Eyebrow>
              <FieldGroup>
                <Field><Label>Address Line 1 *</Label><Input value={delivery.line1} onChange={e => setDel('line1', e.target.value)} placeholder="123 High Street" autoComplete="address-line1" /></Field>
                <Field><Label>Address Line 2 <LabelHint>(optional)</LabelHint></Label><Input value={delivery.line2} onChange={e => setDel('line2', e.target.value)} placeholder="Flat 4" autoComplete="address-line2" /></Field>
                <TwoCol>
                  <Field><Label>City *</Label><Input value={delivery.city} onChange={e => setDel('city', e.target.value)} placeholder="London" autoComplete="address-level2" /></Field>
                  <Field><Label>Postcode *</Label><Input value={delivery.postcode} onChange={e => setDel('postcode', e.target.value)} placeholder="SW1A 1AA" autoComplete="postal-code" /></Field>
                </TwoCol>
              </FieldGroup>
            </>
          )}

          {/* Gift card recipients */}
          {giftItems.length > 0 && (
            <>
              <Eyebrow style={{ marginTop: '1.6rem' }}>Gift Card Options</Eyebrow>
              {giftItems.map(item => {
                const r = giftRecipients[item.cartId] || {};
                return (
                  <GiftBlock key={item.cartId}>
                    <GiftBlockTitle>
                      <GiftIcon width={16} height={16} />
                      £{item.giftCardValue} Gift Card{item.quantity > 1 ? ` ×${item.quantity}` : ''}
                    </GiftBlockTitle>
                    <SendToggle>
                      <input type="checkbox" id={`send-${item.cartId}`} checked={!!r.sendToRecipient} onChange={e => setRecipient(item.cartId, 'sendToRecipient', e.target.checked)} />
                      <label htmlFor={`send-${item.cartId}`}>Send directly to recipient</label>
                    </SendToggle>
                    {r.sendToRecipient && (
                      <RecipientFields>
                        <Field><Label>Recipient Name</Label><Input value={r.name||''} onChange={e => setRecipient(item.cartId,'name',e.target.value)} placeholder="Jane Smith" /></Field>
                        <Field><Label>Recipient Email *</Label><Input type="email" value={r.email||''} onChange={e => setRecipient(item.cartId,'email',e.target.value)} placeholder="jane@example.com" /></Field>
                        <Field><Label>Message <LabelHint>(optional)</LabelHint></Label><MsgArea rows={2} value={r.message||''} onChange={e => setRecipient(item.cartId,'message',e.target.value)} placeholder="Happy birthday! Enjoy your cut 🎉" /></Field>
                      </RecipientFields>
                    )}
                  </GiftBlock>
                );
              })}
            </>
          )}

          {/* Promo code */}
          <Eyebrow style={{ marginTop: '1.6rem' }}>Promo Code</Eyebrow>
          <PromoRow>
            <Input
              value={promoInput}
              onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoErr(''); if (promoData) setPromoData(null); }}
              onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
              placeholder="Enter code..."
              style={{ fontFamily: 'monospace', letterSpacing: '2px' }}
              disabled={!!promoData}
            />
            {promoData
              ? <PromoRemoveBtn onClick={() => { setPromoData(null); setPromoInput(''); }}>✕ Remove</PromoRemoveBtn>
              : <PromoApplyBtn onClick={handleApplyPromo} disabled={promoLoading || !promoInput.trim()}>{promoLoading ? '…' : 'Apply'}</PromoApplyBtn>
            }
          </PromoRow>
          {promoData && <PromoSuccess>✓ {promoData.description || `${promoData.type === 'PERCENT' ? promoData.value + '%' : '£' + promoData.value} off`} — saving £{promoData.discount.toFixed(2)}</PromoSuccess>}
          {promoErr && <PromoError>{promoErr}</PromoError>}

          {/* T&C */}
          <TCRow>
            <input type="checkbox" id="agree-tc" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
            <label htmlFor="agree-tc">
              I agree to the <TCLink href="#" onClick={e => e.preventDefault()}>Terms &amp; Conditions</TCLink> and <TCLink href="#" onClick={e => e.preventDefault()}>Privacy Policy</TCLink>
            </label>
          </TCRow>

          {formErr && <FormError>{formErr}</FormError>}

          <ContinueBtn onClick={handleContinue} disabled={proceeding}>
            {proceeding ? <BtnSpinner /> : 'Continue to Payment →'}
          </ContinueBtn>

          <SecureNote><LockIcon width={11} height={11} /> Payments processed securely by Stripe</SecureNote>
        </DetailsPanel>
      </PageGrid>
    </Page>
  );
};

/* ─── Payment step (inner — needs Stripe hooks) ─────────────────────────── */

const PaymentStep = ({ total, subtotal, discount, promoCode, orderId, items, onBack, onSuccess }) => {
  const stripe    = useStripe();
  const elements  = useElements();
  const navigate  = useNavigate();
  const [paying,  setPaying]  = useState(false);
  const [payErr,  setPayErr]  = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPayErr(''); setPaying(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/order-success` },
        redirect: 'if_required',
      });

      if (error) { setPayErr(error.message); setPaying(false); return; }

      if (paymentIntent?.status === 'succeeded') {
        const confirm = await api.post('/checkout/confirm-order', { orderId });
        onSuccess();
        sessionStorage.removeItem('pending_order_id');
        navigate('/order-success', { state: { order: confirm.data.order, giftCodes: confirm.data.giftCodes || [] } });
      }
    } catch (err) {
      setPayErr(err.response?.data?.message || 'Payment failed. Please try again.');
      setPaying(false);
    }
  };

  return (
    <Page>
      <PageGrid>
        {/* Compact summary */}
        <Summary initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <Eyebrow>Order Summary</Eyebrow>
          <ItemsList>
            {items.map(item => (
              <SummaryItem key={item.cartId}>
                <SummaryThumb>
                  {item.imageUrl ? <img src={resolveImageUrl(item.imageUrl)} alt={item.name} /> : <ThumbPh>{item.type === 'gift-card' ? <GiftIcon width={18} height={18} /> : '✦'}</ThumbPh>}
                  <QtyBadge>{item.quantity}</QtyBadge>
                </SummaryThumb>
                <SummaryName>{item.name}{item.type === 'gift-card' && <SummarySub>£{item.giftCardValue} Gift Card</SummarySub>}</SummaryName>
                <SummaryPrice>£{(item.price * item.quantity).toFixed(2)}</SummaryPrice>
              </SummaryItem>
            ))}
          </ItemsList>
          {discount > 0 && (
            <DiscountLine>
              <span>Discount{promoCode ? ` (${promoCode})` : ''}</span>
              <span style={{ color: '#2e7d32' }}>−£{discount.toFixed(2)}</span>
            </DiscountLine>
          )}
          <TotalLine>
            <TotalLabel>Total</TotalLabel>
            <TotalAmt>£{total.toFixed(2)}</TotalAmt>
          </TotalLine>
          <BackLink onClick={onBack}>← Edit details</BackLink>
        </Summary>

        {/* Payment */}
        <DetailsPanel initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: EASE }}>
          <Eyebrow>Payment</Eyebrow>
          <PaymentElementWrap>
            <PaymentElement options={{ layout: 'tabs' }} />
          </PaymentElementWrap>
          {payErr && <FormError>{payErr}</FormError>}
          <ContinueBtn onClick={handlePay} disabled={paying || !stripe}>
            {paying ? <BtnSpinner /> : `Pay £${total.toFixed(2)}`}
          </ContinueBtn>
          <SecureNote><LockIcon width={11} height={11} /> Payments processed securely by Stripe. Apple Pay &amp; Google Pay supported.</SecureNote>
        </DetailsPanel>
      </PageGrid>
    </Page>
  );
};

export default Checkout;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh; background: ${CREAM}; color: ${INK};
  font-family: 'Montserrat', sans-serif; padding: 3rem 5% 6rem;
`;
const PageGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 3rem; max-width: 980px; margin: 0 auto; align-items: start;
  @media (max-width: 720px) { grid-template-columns: 1fr; gap: 2rem; }
`;
const Summary = styled(motion.div)`
  background: rgba(255, 255, 255, 0.55); border: 1px solid rgba(26, 26, 26, 0.1);
  padding: 1.8rem;
  position: sticky; top: 7rem;
  @media (max-width: 720px) { position: static; }
`;
const DetailsPanel = styled(motion.div)`
  background: rgba(255, 255, 255, 0.55); border: 1px solid rgba(26, 26, 26, 0.1);
  padding: 1.8rem;
`;
const Eyebrow = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 900; letter-spacing: 4px;
  text-transform: uppercase;
  color: ${RED}; margin: 0 0 1.1rem;
`;
const ItemsList = styled.div`display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.1rem;`;
const SummaryItem = styled.div`display: flex; align-items: center; gap: 0.8rem;`;
const SummaryThumb = styled.div`
  position: relative; width: 50px; height: 50px; flex-shrink: 0;
  overflow: hidden; background: rgba(26, 26, 26, 0.03); border: 1px solid rgba(26, 26, 26, 0.1);
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const ThumbPh = styled.div`
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; color: rgba(26, 26, 26, 0.25);
`;
const QtyBadge = styled.span`
  position: absolute; top: -5px; right: -5px;
  width: 17px; height: 17px; border-radius: 50%;
  background: ${CREAM}; border: 1px solid rgba(26, 26, 26, 0.2);
  color: ${INK}; font-size: 0.62rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
`;
const SummaryName = styled.div`flex: 1; min-width: 0; font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px;`;
const SummarySub = styled.p`font-size: 0.7rem; font-family: 'Montserrat', sans-serif; color: ${RED}; margin: 2px 0 0; letter-spacing: 0.5px;`;
const SummaryPrice = styled.span`font-family: 'Bebas Neue', sans-serif; font-size: 0.92rem; color: ${INK}; flex-shrink: 0;`;
const DiscountLine = styled.div`
  display: flex; justify-content: space-between;
  font-size: 0.82rem; color: rgba(26, 26, 26, 0.55);
  padding-bottom: 0.75rem; margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(26, 26, 26, 0.1);
`;
const TotalLine = styled.div`display: flex; justify-content: space-between; align-items: baseline;`;
const TotalLabel = styled.span`font-family: 'Bebas Neue', sans-serif; font-size: 0.75rem; letter-spacing: 3px; color: rgba(26, 26, 26, 0.5);`;
const TotalAmt = styled.span`font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; letter-spacing: 2px; color: ${INK};`;
const BackLink = styled.button`
  background: none; border: none; cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem; color: rgba(26, 26, 26, 0.5); padding: 0; margin-top: 1rem;
  transition: color 0.2s;
  &:hover { color: ${INK}; }
`;

const FieldGroup = styled.div`display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 0.2rem;`;
const Field = styled.div`display: flex; flex-direction: column; gap: 0.4rem;`;
const TwoCol = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;`;
const Label = styled.label`font-family: 'Montserrat', sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${RED};`;
const LabelHint = styled.span`color: rgba(26, 26, 26, 0.35); text-transform: none; letter-spacing: 0; font-weight: 400;`;
const Input = styled.input`
  background: #ffffff; border: 1px solid rgba(26, 26, 26, 0.15); border-radius: 4px;
  color: ${INK}; font-family: 'Montserrat', sans-serif; font-size: 0.9rem;
  padding: 0.62rem 0.9rem; outline: none; transition: border-color 0.2s; width: 100%; box-sizing: border-box;
  &:focus { border-color: rgba(26, 26, 26, 0.4); }
  &::placeholder { color: rgba(26, 26, 26, 0.3); }
  &:disabled { opacity: 0.5; }
`;
const MsgArea = styled.textarea`
  background: #ffffff; border: 1px solid rgba(26, 26, 26, 0.15); border-radius: 4px;
  color: ${INK}; font-family: 'Montserrat', sans-serif; font-size: 0.88rem;
  padding: 0.6rem 0.9rem; outline: none; resize: vertical; line-height: 1.5; width: 100%; box-sizing: border-box;
  &:focus { border-color: rgba(26, 26, 26, 0.4); } &::placeholder { color: rgba(26, 26, 26, 0.3); }
`;

const GiftBlock = styled.div`
  background: rgba(26, 26, 26, 0.03); border: 1px solid rgba(26, 26, 26, 0.1); border-radius: 6px;
  padding: 0.9rem 1rem; margin-bottom: 0.6rem;
`;
const GiftBlockTitle = styled.p`
  display: flex; align-items: center; gap: 0.45rem;
  font-family: 'Bebas Neue', sans-serif; font-size: 0.85rem; letter-spacing: 2px; color: ${RED}; margin: 0 0 0.6rem;
`;
const SendToggle = styled.div`
  display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;
  input { cursor: pointer; accent-color: ${RED}; width: 15px; height: 15px; }
  label { font-family: 'Montserrat', sans-serif; font-size: 0.8rem; color: rgba(26, 26, 26, 0.55); cursor: pointer; }
`;
const RecipientFields = styled.div`
  display: flex; flex-direction: column; gap: 0.65rem;
  padding-top: 0.65rem; border-top: 1px solid rgba(26, 26, 26, 0.1);
`;

const PromoRow = styled.div`display: flex; gap: 0.5rem; align-items: stretch;`;
const PromoApplyBtn = styled.button`
  background: transparent; border: 1px solid ${RED}; color: ${RED};
  padding: 0 1rem; border-radius: 4px; cursor: pointer;
  font-family: 'Bebas Neue', sans-serif; font-size: 0.85rem; letter-spacing: 2px; white-space: nowrap;
  transition: background 0.18s;
  &:hover:not(:disabled) { background: rgba(196,30,58,0.08); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;
const PromoRemoveBtn = styled(PromoApplyBtn)`
  border-color: rgba(26, 26, 26, 0.2); color: rgba(26, 26, 26, 0.5);
  &:hover:not(:disabled) { border-color: ${RED}; color: ${RED}; background: rgba(196,30,58,0.08); }
`;
const PromoSuccess = styled.p`font-family: 'Montserrat', sans-serif; font-size: 0.78rem; color: #2e7d32; margin: 0.4rem 0 0;`;
const PromoError   = styled.p`font-family: 'Montserrat', sans-serif; font-size: 0.78rem; color: ${RED}; margin: 0.4rem 0 0;`;

const TCRow = styled.div`
  display: flex; align-items: center; gap: 0.5rem; margin-top: 1.3rem;
  input { cursor: pointer; accent-color: ${RED}; width: 15px; height: 15px; flex-shrink: 0; }
  label { font-family: 'Montserrat', sans-serif; font-size: 0.78rem; color: rgba(26, 26, 26, 0.55); cursor: pointer; line-height: 1.45; }
`;
const TCLink = styled.a`color: ${RED}; text-decoration: none; &:hover { text-decoration: underline; }`;

const FormError = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.82rem; color: ${RED}; margin: 0.75rem 0 0;
  padding: 0.55rem 0.8rem; background: rgba(196,30,58,0.06);
  border: 1px solid rgba(196,30,58,0.25); border-radius: 4px;
`;

const ContinueBtn = styled.button`
  width: 100%; padding: 1rem; margin-top: 1.2rem;
  background: ${RED}; border: none; border-radius: 4px;
  color: #fff; font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 3px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, transform 0.1s;
  &:hover:not(:disabled) { background: #a51830; transform: scale(1.01); }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;
const BtnSpinner = styled.span`
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;
const SecureNote = styled.p`
  display: flex; align-items: center; justify-content: center; gap: 0.35rem;
  font-family: 'Montserrat', sans-serif; font-size: 0.72rem; color: rgba(26, 26, 26, 0.4); text-align: center; margin: 0.8rem 0 0;
`;
const PaymentElementWrap = styled.div`
  background: rgba(26, 26, 26, 0.02); border: 1px solid rgba(26, 26, 26, 0.1); border-radius: 6px;
  padding: 1rem; margin-bottom: 0.2rem;
  &:focus-within { border-color: rgba(26, 26, 26, 0.3); }
`;

const EmptyState = styled(motion.div)`
  display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center;
`;
const EmptyIcon = styled.div`
  display: flex; justify-content: center;
  color: ${INK}; margin-bottom: 1.5rem; opacity: 0.3;
`;
const EmptyTitle = styled.h2`font-family: 'Bebas Neue', sans-serif; font-size: 2rem; letter-spacing: 3px; color: rgba(26, 26, 26, 0.5); margin: 0 0 1.5rem;`;
const EmptyBtn = styled.button`
  background: none; border: 1px solid rgba(26, 26, 26, 0.15); color: rgba(26, 26, 26, 0.55);
  padding: 0.65rem 1.5rem; border-radius: 4px; cursor: pointer;
  font-family: 'Bebas Neue', sans-serif; font-size: 0.9rem; letter-spacing: 2px;
  transition: all 0.2s;
  &:hover { border-color: rgba(26, 26, 26, 0.35); color: ${INK}; }
`;
