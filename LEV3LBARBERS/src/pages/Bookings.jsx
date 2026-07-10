import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import confetti from 'canvas-confetti';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { DiceIcon } from '../common/icons';
import { BACKEND } from '../config';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const GOLD  = '#C4922A';
const EASE  = [0.22, 1, 0.36, 1];

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const STEPS = ['Service', 'Barber', 'Date & Time', 'Your Details', 'Pay Deposit'];

const CARD_STYLE = {
  style: {
    base: {
      color: INK,
      fontFamily: "'Montserrat', sans-serif",
      fontSize: '15px',
      '::placeholder': { color: 'rgba(26,26,26,0.35)' },
    },
    invalid: { color: RED },
  },
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS  = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ── Utility ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

// ── Reusable 3D-tilt card with a barber-pole stripe sweep on hover ────────────
function TiltCard({ children, onClick, dashed }) {
  const [hovered, setHovered] = useState(false);
  const rawX    = useMotionValue(0);
  const rawY    = useMotionValue(0);
  const sp      = { stiffness: 300, damping: 28, mass: 0.6 };
  const spX     = useSpring(rawX, sp);
  const spY     = useSpring(rawY, sp);
  const rotateX = useTransform(spY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(spX, [-0.5, 0.5], [-4, 4]);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - r.left) / r.width  - 0.5);
    rawY.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const onMouseLeave = () => { setHovered(false); rawX.set(0); rawY.set(0); };

  return (
    <CardTiltWrap
      $dashed={dashed}
      style={{ rotateX, rotateY, transformPerspective: 700 }}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <AnimatePresence>
        {hovered && (
          <TiltStripe
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        )}
      </AnimatePresence>
      {children}
    </CardTiltWrap>
  );
}

// ── Animated checkmark, drawn via SVG path ────────────────────────────────────
function CheckDraw({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M5 13l4 4L19 7"
        stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Bookings() {
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/booking-settings')
      .then(r => setSettings(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Page><Center><Spinner /></Center></Page>;

  if (!settings?.isActive) {
    return (
      <Page>
        <InactiveWrap
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <BarberScissors>✂</BarberScissors>
          <InactiveTitle>Walk-ins Welcome</InactiveTitle>
          <InactiveText>
            We're not taking online bookings right now — just drop in!<br />
            No appointment needed, come as you are.
          </InactiveText>
          <InactiveSub>Check our hours on the Contact page.</InactiveSub>
        </InactiveWrap>
      </Page>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <BookingFlow settings={settings} />
    </Elements>
  );
}

// ── Multi-step booking flow ───────────────────────────────────────────────────
function BookingFlow({ settings }) {
  const { isLoggedIn, role } = useAuth();

  const [step,        setStep]        = useState(0);
  const [services,    setServices]    = useState([]);
  const [barbers,     setBarbers]     = useState([]);
  const [selected,    setSelected]    = useState({
    service: null, barber: null, barberId: null,
    date: '', time: '', slotBarbers: [],
  });
  const [availDates,  setAvailDates]  = useState([]);
  const [availSlots,  setAvailSlots]  = useState([]);
  const [calMonth,    setCalMonth]    = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [calDir,      setCalDir]      = useState(1);
  const [details,     setDetails]     = useState({ name: '', email: '', phone: '', notes: '' });
  const [booking,     setBooking]     = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [confirmed,   setConfirmed]   = useState(false);
  const [error,       setError]       = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [profile,     setProfile]     = useState(null);

  // Load services + barbers
  useEffect(() => {
    api.get('/services').then(r => setServices(r.data.filter(s => s.type === 'public' || s.type === 'booking'))).catch(() => {});
    api.get('/barber-profiles').then(r => setBarbers(r.data.filter(b => b.isBookable))).catch(() => {});
  }, []);

  // Pre-fill details for logged-in users
  useEffect(() => {
    if (isLoggedIn) {
      api.get('/protected/profile').then(r => {
        setProfile(r.data);
        setDetails(d => ({ ...d, name: r.data.name || '', email: r.data.email || '' }));
      }).catch(() => {});
    }
  }, [isLoggedIn]);

  // Load available dates when month or barber changes
  useEffect(() => {
    const params = new URLSearchParams({ year: calMonth.year, month: calMonth.month });
    if (selected.barberId) params.set('barberId', selected.barberId);
    api.get(`/bookings/available-dates?${params}`)
      .then(r => setAvailDates(r.data))
      .catch(() => setAvailDates([]));
  }, [calMonth, selected.barberId]);

  // Load available slots when date changes
  useEffect(() => {
    if (!selected.date) return;
    setLoadingSlots(true);
    const params = new URLSearchParams({ date: selected.date });
    if (selected.barberId) params.set('barberId', selected.barberId);
    api.get(`/bookings/available-slots?${params}`)
      .then(r => setAvailSlots(r.data))
      .catch(() => setAvailSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selected.date, selected.barberId]);

  const deposit = settings.depositPercent > 0 && selected.service?.price
    ? parseFloat(((selected.service.price * settings.depositPercent) / 100).toFixed(2))
    : 0;

  const goNext = () => { setError(''); setStep(s => s + 1); };
  const goBack = () => { setError(''); setStep(s => s - 1); };

  // Step 0 → select service
  const pickService = (svc) => {
    setSelected(s => ({ ...s, service: svc }));
    goNext();
  };

  // Step 1 → select barber
  const pickBarber = (barber) => {
    if (barber === 'any') {
      setSelected(s => ({ ...s, barber: null, barberId: null }));
    } else {
      setSelected(s => ({ ...s, barber, barberId: barber.id }));
    }
    goNext();
  };

  // Step 2 → select date + time
  const pickDate = (d) => {
    setSelected(s => ({ ...s, date: d, time: '', slotBarbers: [] }));
  };

  const goPrevMonth = () => {
    setCalDir(-1);
    setCalMonth(c => {
      const d = new Date(c.year, c.month - 2, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
    setSelected(s => ({ ...s, date: '', time: '' }));
  };
  const goNextMonth = () => {
    setCalDir(1);
    setCalMonth(c => {
      const d = new Date(c.year, c.month, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
    setSelected(s => ({ ...s, date: '', time: '' }));
  };

  const pickSlot = (slot) => {
    // If "any barber", pick a random barber from those available in this slot
    let assignedBarberId = selected.barberId;
    if (!assignedBarberId && slot.barbers.length > 0) {
      const pick = slot.barbers[Math.floor(Math.random() * slot.barbers.length)];
      assignedBarberId = pick.barberId;
      setSelected(s => ({
        ...s, time: slot.time,
        barberId: pick.barberId,
        slotBarbers: slot.barbers,
        assignedBarberName: pick.displayName,
      }));
    } else {
      setSelected(s => ({ ...s, time: slot.time, slotBarbers: slot.barbers }));
    }
  };

  const confirmDateTime = () => {
    if (!selected.date || !selected.time) return setError('Please pick a date and time.');
    goNext();
  };

  // Step 3 → details
  const confirmDetails = () => {
    if (!details.name.trim()) return setError('Name is required.');
    if (!isLoggedIn && !details.email.trim() && !details.phone.trim()) {
      return setError('Please provide either an email address or phone number.');
    }
    goNext();
  };

  // Step 4 → create booking + get client_secret
  const initBooking = useCallback(async () => {
    if (booking) return; // already created
    setError('');
    try {
      const barberId = selected.barberId;
      const payload = {
        barberId,
        serviceId:    selected.service?.id,
        serviceName:  selected.service?.name,
        servicePrice: selected.service?.price,
        appointmentDate: selected.date,
        appointmentTime: selected.time,
        notes: details.notes,
        ...(!isLoggedIn && {
          guestName:  details.name,
          guestEmail: details.email,
          guestPhone: details.phone,
        }),
      };
      const { data } = await api.post('/bookings', payload);
      setBooking(data.booking);
      if (data.requiresPayment) setClientSecret(data.clientSecret);
      else setConfirmed(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create booking. Please try again.');
    }
  }, [booking, selected, details, isLoggedIn]);

  useEffect(() => {
    if (step === 4) initBooking();
  }, [step]);

  if (confirmed) return <ConfirmationScreen booking={booking} details={details} selected={selected} settings={settings} />;

  const barberForSlot = barbers.find(b => b.id === selected.barberId);
  const displayBarberName = selected.barber?.displayName || selected.assignedBarberName || 'Any Available';
  const progressPct = (step / (STEPS.length - 1)) * 100;

  return (
    <Page>
      <PageTitle
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Book an Appointment
      </PageTitle>

      <StepIndicator>
        <ProgressTrack />
        <ProgressFill
          as={motion.div}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.45, ease: EASE }}
        />
        {STEPS.map((label, i) => (
          <StepDot key={i} $done={i < step} $active={i === step}>
            <DotCircle $done={i < step} $active={i === step}>
              {i < step ? <CheckDraw /> : i + 1}
            </DotCircle>
            <DotLabel $active={i === step}>{label}</DotLabel>
          </StepDot>
        ))}
      </StepIndicator>

      <AnimatePresence mode="wait">
        <StepPane
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          {/* ── Step 0: Service ── */}
          {step === 0 && (
            <StepCard>
              <StepTitle>Choose a Service</StepTitle>
              <ServiceGrid>
                {services.map(svc => (
                  <TiltCard key={svc.id} onClick={() => pickService(svc)}>
                    {svc.imageUrl && <ServiceImg src={`${BACKEND}${svc.imageUrl}`} alt={svc.name} />}
                    <ServiceName>{svc.name}</ServiceName>
                    {svc.price
                      ? <ServicePrice>£{(svc.price).toFixed(2)}</ServicePrice>
                      : <ServicePrice style={{ color: 'rgba(26,26,26,0.5)' }}>POA</ServicePrice>}
                    {svc.description && <ServiceDesc>{svc.description}</ServiceDesc>}
                  </TiltCard>
                ))}
                {services.length === 0 && <Empty>No services available.</Empty>}
              </ServiceGrid>
            </StepCard>
          )}

          {/* ── Step 1: Barber ── */}
          {step === 1 && (
            <StepCard>
              <StepTitle>Choose Your Barber</StepTitle>
              <BarberGrid>
                <TiltCard dashed onClick={() => pickBarber('any')}>
                  <AnyIconWrap className="dice-wiggle"><DiceIcon width={32} height={32} /></AnyIconWrap>
                  <BarberName>Any Available Barber</BarberName>
                  <BarberSub>We'll assign the first available barber for your slot</BarberSub>
                </TiltCard>
                {barbers.map(b => (
                  <TiltCard key={b.id} onClick={() => pickBarber(b)}>
                    {b.imageUrl
                      ? <BarberImg src={`${BACKEND}${b.imageUrl}`} alt={b.displayName} />
                      : <BarberImgPlaceholder>{b.displayName[0]}</BarberImgPlaceholder>
                    }
                    <BarberName>{b.displayName}</BarberName>
                    {b.priceFrom && <PriceFrom>From £{b.priceFrom}</PriceFrom>}
                    {b.bio && <BarberSub>{b.bio}</BarberSub>}
                  </TiltCard>
                ))}
              </BarberGrid>
              <BackBtn onClick={goBack}>← Back</BackBtn>
            </StepCard>
          )}

          {/* ── Step 2: Date & Time ── */}
          {step === 2 && (
            <StepCard>
              <StepTitle>Choose a Date & Time</StepTitle>
              <CalendarWrap>
                <CalNav>
                  <CalNavBtn onClick={goPrevMonth}>‹</CalNavBtn>
                  <CalMonthLabel>{MONTH_NAMES[calMonth.month - 1]} {calMonth.year}</CalMonthLabel>
                  <CalNavBtn onClick={goNextMonth}>›</CalNavBtn>
                </CalNav>

                <CalDayLabelRow>
                  {DAY_LABELS.map(d => <CalDayLabel key={d}>{d}</CalDayLabel>)}
                </CalDayLabelRow>

                <CalGridClip>
                  <AnimatePresence mode="wait" custom={calDir} initial={false}>
                    <CalGrid
                      key={`${calMonth.year}-${calMonth.month}`}
                      custom={calDir}
                      initial={{ x: calDir > 0 ? 40 : -40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: calDir > 0 ? -40 : 40, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                    >
                      {buildCalendarDays(calMonth.year, calMonth.month).map((day, i) => {
                        if (!day) return <CalCell key={i} $blank />;
                        const dateStr = `${calMonth.year}-${String(calMonth.month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                        const isAvailable = availDates.includes(dateStr);
                        const isSelected  = selected.date === dateStr;
                        const isPast      = new Date(dateStr) < new Date(new Date().toDateString());
                        return (
                          <CalCell
                            key={i}
                            $available={isAvailable && !isPast}
                            $selected={isSelected}
                            $past={isPast}
                            onClick={() => isAvailable && !isPast && pickDate(dateStr)}
                          >
                            {isSelected ? (
                              <motion.span
                                key="sel"
                                initial={{ scale: 1.5, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                              >
                                {day}
                              </motion.span>
                            ) : day}
                            {isAvailable && !isPast && !isSelected && <AvailDot />}
                          </CalCell>
                        );
                      })}
                    </CalGrid>
                  </AnimatePresence>
                </CalGridClip>
              </CalendarWrap>

              {selected.date && (
                <TimeWrap>
                  <TimeDateLabel>{fmtDate(selected.date)}</TimeDateLabel>
                  {loadingSlots ? <Center><Spinner small /></Center> : (
                    <>
                      <SlotGrid>
                        {availSlots.map((slot, i) => (
                          <SlotBtn
                            key={slot.time}
                            $selected={selected.time === slot.time}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.04, ease: EASE }}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => pickSlot(slot)}
                          >
                            {slot.time}
                          </SlotBtn>
                        ))}
                      </SlotGrid>
                      {availSlots.length === 0 && <Empty>No slots available for this date.</Empty>}
                    </>
                  )}
                </TimeWrap>
              )}

              {error && <ErrorMsg>{error}</ErrorMsg>}
              <RowBtns>
                <BackBtn onClick={goBack}>← Back</BackBtn>
                <NextBtn onClick={confirmDateTime} disabled={!selected.date || !selected.time}>
                  Continue →
                </NextBtn>
              </RowBtns>
            </StepCard>
          )}

          {/* ── Step 3: Details ── */}
          {step === 3 && (
            <StepCard>
              <StepTitle>Your Details</StepTitle>
              {isLoggedIn && <MemberNote>✓ Logged in — details pre-filled. This booking will appear on your profile.</MemberNote>}

              <FormGrid>
                <FormField>
                  <FormLabel>Full Name *</FormLabel>
                  <FormInput
                    value={details.name}
                    onChange={e => setDetails(d => ({ ...d, name: e.target.value }))}
                    placeholder="Your name"
                    disabled={isLoggedIn && !!profile?.name}
                  />
                </FormField>
                <FormField>
                  <FormLabel>Email {!isLoggedIn && '(or phone)'}</FormLabel>
                  <FormInput
                    type="email"
                    value={details.email}
                    onChange={e => setDetails(d => ({ ...d, email: e.target.value }))}
                    placeholder="you@example.com"
                    disabled={isLoggedIn && !!profile?.email}
                  />
                </FormField>
                {!isLoggedIn && (
                  <FormField>
                    <FormLabel>Phone Number</FormLabel>
                    <FormInput
                      type="tel"
                      value={details.phone}
                      onChange={e => setDetails(d => ({ ...d, phone: e.target.value }))}
                      placeholder="+44 7xxx xxxxxx"
                    />
                  </FormField>
                )}
                <FormField style={{ gridColumn: '1 / -1' }}>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormTextarea
                    rows={2}
                    value={details.notes}
                    onChange={e => setDetails(d => ({ ...d, notes: e.target.value }))}
                    placeholder="Anything we should know? e.g. style preferences"
                  />
                </FormField>
              </FormGrid>

              <BookingSummaryBox>
                <SummaryTitle>Booking Summary</SummaryTitle>
                {[
                  ['Service', selected.service?.name],
                  ['Barber', displayBarberName],
                  ['Date', fmtDate(selected.date)],
                  ['Time', selected.time],
                  ...(selected.service?.price ? [['Service Price', `£${selected.service.price.toFixed(2)}`]] : []),
                ].map(([label, value], i) => (
                  <SummaryRow
                    key={label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06, ease: EASE }}
                  >
                    <span>{label}</span><strong>{value}</strong>
                  </SummaryRow>
                ))}
                <SummaryRow
                  $highlight
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3, ease: EASE }}
                >
                  <span>Deposit ({settings.depositPercent}%)</span>
                  <strong>{deposit > 0 ? `£${deposit.toFixed(2)}` : 'No deposit'}</strong>
                </SummaryRow>
                {deposit > 0 && (
                  <CancellationNote>
                    Deposit is fully refundable if cancelled at least {settings.cancellationHours}h before your appointment.
                  </CancellationNote>
                )}
              </BookingSummaryBox>

              {error && <ErrorMsg>{error}</ErrorMsg>}
              <RowBtns>
                <BackBtn onClick={goBack}>← Back</BackBtn>
                <NextBtn onClick={confirmDetails}>
                  {deposit > 0 ? 'Pay Deposit →' : 'Confirm Booking →'}
                </NextBtn>
              </RowBtns>
            </StepCard>
          )}

          {/* ── Step 4: Pay deposit ── */}
          {step === 4 && (
            <StepCard>
              <StepTitle>{deposit > 0 ? 'Pay Deposit' : 'Confirming Booking…'}</StepTitle>
              {error && <ErrorMsg>{error}</ErrorMsg>}
              {deposit > 0 && clientSecret ? (
                <PaymentForm
                  clientSecret={clientSecret}
                  deposit={deposit}
                  onSuccess={() => setConfirmed(true)}
                  onError={setError}
                />
              ) : !confirmed && !error ? (
                <Center><Spinner /></Center>
              ) : null}
              {deposit === 0 && confirmed === false && !error && <Center><Spinner /></Center>}
            </StepCard>
          )}
        </StepPane>
      </AnimatePresence>
    </Page>
  );
}

// ── Stripe Payment Form ───────────────────────────────────────────────────────
function PaymentForm({ clientSecret, deposit, onSuccess, onError }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const pay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    onError('');
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });
    if (error) {
      onError(error.message);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess();
    }
    setPaying(false);
  };

  return (
    <PayForm onSubmit={pay}>
      <DepositAmount>Deposit: <strong>£{deposit.toFixed(2)}</strong></DepositAmount>
      <CardWrap>
        <CardElement options={CARD_STYLE} />
      </CardWrap>
      <PayBtn type="submit" disabled={!stripe || paying} whileTap={{ scale: 0.98 }}>
        {paying ? 'Processing…' : `Pay £${deposit.toFixed(2)} Deposit`}
      </PayBtn>
      <CardNote>Your card details are handled securely by Stripe. We never store card data.</CardNote>
    </PayForm>
  );
}

// ── Confirmation Screen ───────────────────────────────────────────────────────
function ConfirmationScreen({ booking, details, selected, settings }) {
  const displayBarberName = selected.barber?.displayName || selected.assignedBarberName || 'A barber';

  useEffect(() => {
    const fire = (opts) => confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 }, ...opts });
    setTimeout(() => {
      fire({ colors: [RED, INK, GOLD] });
      setTimeout(() => fire({ angle: 60,  colors: [GOLD, INK] }), 250);
      setTimeout(() => fire({ angle: 120, colors: [RED, GOLD] }), 400);
    }, 200);
  }, []);

  return (
    <Page>
      <ConfirmWrap
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <ConfirmIcon>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
            />
          </svg>
        </ConfirmIcon>
        <ConfirmTitle>Booking Confirmed</ConfirmTitle>
        <ConfirmSub>We'll see you at the chair!</ConfirmSub>

        <ConfirmCard>
          <ConfirmRow><span>Service</span><strong>{selected.service?.name}</strong></ConfirmRow>
          <ConfirmRow><span>Barber</span><strong>{displayBarberName}</strong></ConfirmRow>
          <ConfirmRow><span>Date</span><strong>{fmtDate(selected.date)}</strong></ConfirmRow>
          <ConfirmRow><span>Time</span><strong>{selected.time}</strong></ConfirmRow>
        </ConfirmCard>

        <ConfirmNote>
          A confirmation email {details.phone ? 'and SMS' : ''} has been sent.
          You'll also receive a reminder 24h before your appointment.
        </ConfirmNote>
        {settings.depositPercent > 0 && (
          <ConfirmNote style={{ color: 'rgba(26,26,26,0.5)' }}>
            Your deposit is refundable if cancelled at least {settings.cancellationHours}h before.
          </ConfirmNote>
        )}

        <NextBtn as="a" href="/" style={{ display:'inline-block', textDecoration:'none', marginTop:'1.5rem' }}>
          Back to Home
        </NextBtn>
      </ConfirmWrap>
    </Page>
  );
}

// ── Calendar helper ───────────────────────────────────────────────────────────
function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const wiggle = keyframes`
  0%, 100% { transform: rotate(0deg); }
  20%      { transform: rotate(-18deg); }
  40%      { transform: rotate(14deg); }
  60%      { transform: rotate(-8deg); }
  80%      { transform: rotate(6deg); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: ${CREAM};
  color: ${INK};
  font-family: 'Bebas Neue', sans-serif;
  padding: 6rem 5% 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Center = styled.div`
  display: flex; justify-content: center; align-items: center;
  padding: 3rem 0;
  width: 100%;
`;

const Spinner = styled.div`
  width: ${({ small }) => small ? '28px' : '44px'};
  height: ${({ small }) => small ? '28px' : '44px'};
  border: 3px solid rgba(26, 26, 26, 0.1);
  border-top-color: ${RED};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const PageTitle = styled(motion.h1)`
  font-size: clamp(2rem, 5vw, 3.2rem);
  letter-spacing: 5px;
  color: ${INK};
  margin: 0 0 2.5rem;
  text-align: center;
`;

const StepIndicator = styled.div`
  position: relative;
  display: flex;
  gap: clamp(8px, 2vw, 24px);
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const ProgressTrack = styled.div`
  position: absolute;
  top: 16px; left: 16px; right: 16px;
  height: 2px;
  background: rgba(26, 26, 26, 0.1);
  z-index: -1;
  @media (max-width: 480px) { display: none; }
`;

const ProgressFill = styled.div`
  position: absolute;
  top: 16px; left: 16px;
  height: 2px;
  background: ${RED};
  z-index: -1;
  @media (max-width: 480px) { display: none; }
`;

const StepDot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: ${({ $done, $active }) => ($done || $active) ? 1 : 0.4};
  transition: opacity 0.3s;
`;

const DotCircle = styled.div`
  width: 32px; height: 32px;
  border-radius: 50%;
  background: ${({ $done, $active }) => $done ? RED : $active ? RED : CREAM};
  border: 1px solid ${({ $done, $active }) => ($done || $active) ? RED : 'rgba(26,26,26,0.2)'};
  color: ${({ $done, $active }) => ($done || $active) ? '#fff' : INK};
  display: flex; align-items: center; justify-content: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem; font-weight: 700;
  transition: background 0.3s, border-color 0.3s;
`;

const DotLabel = styled.span`
  font-size: 0.65rem;
  letter-spacing: 1.5px;
  color: ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.5)'};
  text-transform: uppercase;
  white-space: nowrap;
`;

const StepPane = styled(motion.div)`
  width: 100%;
  max-width: 760px;
`;

const StepCard = styled.div`
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(26, 26, 26, 0.1);
  padding: clamp(1.25rem, 4vw, 2.5rem);
`;

const StepTitle = styled.h2`
  letter-spacing: 3px;
  font-size: 1.3rem;
  color: ${INK};
  text-transform: uppercase;
  margin: 0 0 1.75rem;
`;

// Tilt card wrapper (Service / Barber / Any-barber)
const CardTiltWrap = styled(motion.button)`
  position: relative;
  overflow: hidden;
  background: transparent;
  border: 1px solid rgba(26, 26, 26, 0.12);
  border-style: ${({ $dashed }) => $dashed ? 'dashed' : 'solid'};
  padding: 16px;
  cursor: pointer;
  text-align: center;
  color: ${INK};
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:hover { border-color: rgba(26, 26, 26, 0.3); box-shadow: 0 12px 28px rgba(26, 26, 26, 0.1); }
  &:hover .dice-wiggle { animation: ${wiggle} 0.6s ease; }
`;

const TiltStripe = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    -48deg,
    ${RED}      0px,
    ${RED}      5px,
    transparent 5px,
    transparent 16px
  );
  opacity: 0.05;
`;

// Services
const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
`;

const ServiceImg = styled.img`
  width: 100%; height: 100px; object-fit: cover; margin-bottom: 6px;
  position: relative; z-index: 1;
`;

const ServiceName = styled.p`
  letter-spacing: 2px; font-size: 0.95rem; margin: 0; position: relative; z-index: 1;
`;

const ServicePrice = styled.p`
  color: ${RED}; font-family: 'Montserrat', sans-serif; font-size: 0.9rem; font-weight: 700; margin: 0;
  position: relative; z-index: 1;
`;

const ServiceDesc = styled.p`
  font-family: 'Montserrat', sans-serif; font-weight: 500;
  color: rgba(26, 26, 26, 0.6); font-size: 0.75rem; margin: 0; line-height: 1.4;
  position: relative; z-index: 1;
`;

// Barbers
const BarberGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 1.5rem;
`;

const AnyIconWrap = styled.div`
  display: flex; color: ${RED}; position: relative; z-index: 1;
`;

const BarberImg = styled.img`
  width: 72px; height: 72px; border-radius: 50%; object-fit: cover;
  position: relative; z-index: 1;
`;

const BarberImgPlaceholder = styled.div`
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(196,30,58,0.08); color: ${RED};
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem;
  position: relative; z-index: 1;
`;

const BarberName = styled.p`
  letter-spacing: 2px; font-size: 0.9rem; margin: 0; position: relative; z-index: 1;
`;

const PriceFrom = styled.p`
  color: ${RED}; font-family: 'Montserrat', sans-serif; font-size: 0.78rem; margin: 0;
  position: relative; z-index: 1;
`;

const BarberSub = styled.p`
  font-family: 'Montserrat', sans-serif; font-weight: 500;
  color: rgba(26, 26, 26, 0.6); font-size: 0.72rem; margin: 0; line-height: 1.4; text-align: center;
  position: relative; z-index: 1;
`;

// Calendar
const CalendarWrap = styled.div`
  background: transparent;
  border: 1px solid rgba(26, 26, 26, 0.1);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
`;

const CalNav = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;
`;

const CalMonthLabel = styled.span`
  letter-spacing: 3px; font-size: 1rem; color: ${INK};
`;

const CalNavBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(26, 26, 26, 0.15);
  color: ${INK}; cursor: pointer;
  width: 34px; height: 34px; font-size: 1.2rem;
  transition: border-color 0.2s, background 0.2s;
  &:hover { border-color: rgba(26, 26, 26, 0.35); background: rgba(26,26,26,0.04); }
`;

const CalDayLabelRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const CalDayLabel = styled.div`
  text-align: center; font-family: 'Montserrat', sans-serif; font-size: 0.7rem; color: rgba(26,26,26,0.5);
  letter-spacing: 1px; padding: 4px 0;
`;

const CalGridClip = styled.div`
  overflow: hidden;
`;

const CalGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const CalCell = styled.div`
  position: relative;
  display: ${({ $blank }) => $blank ? 'block' : 'flex'};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-align: center;
  padding: 8px 4px;
  min-height: 20px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.88rem;
  cursor: ${({ $available, $past }) => (!$past && $available) ? 'pointer' : 'default'};
  color: ${({ $available, $past, $selected }) =>
    $past ? 'rgba(26,26,26,0.25)' :
    $selected ? '#fff' :
    $available ? INK : 'rgba(26,26,26,0.3)'};
  background: ${({ $selected, $available, $past }) =>
    $selected ? RED :
    $available && !$past ? 'rgba(196,30,58,0.06)' : 'transparent'};
  font-weight: ${({ $available, $past }) => (!$past && $available) ? '600' : '400'};
  transition: background 0.15s;
  &:hover {
    background: ${({ $available, $past, $selected }) =>
      !$past && $available && !$selected ? 'rgba(196,30,58,0.14)' : undefined};
  }
`;

const AvailDot = styled.span`
  display: block;
  width: 3px; height: 3px; border-radius: 50%;
  background: ${RED};
`;

const TimeWrap = styled.div`
  margin-bottom: 1.5rem;
`;

const TimeDateLabel = styled.p`
  letter-spacing: 2px; font-size: 0.95rem; color: ${RED};
  margin: 0 0 1rem;
`;

const SlotGrid = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px;
`;

const SlotBtn = styled(motion.button)`
  background: ${({ $selected }) => $selected ? RED : 'transparent'};
  color: ${({ $selected }) => $selected ? '#fff' : INK};
  border: 1px solid ${({ $selected }) => $selected ? RED : 'rgba(26,26,26,0.15)'};
  padding: 8px 16px; cursor: pointer;
  font-family: 'Montserrat', sans-serif; font-size: 0.88rem;
  transition: background 0.15s, border-color 0.15s;
  &:hover { border-color: ${({ $selected }) => $selected ? RED : 'rgba(26,26,26,0.35)'}; }
`;

// Details form
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

const FormField = styled.div``;

const FormLabel = styled.label`
  display: block;
  font-family: 'Montserrat', sans-serif; font-weight: 700;
  font-size: 0.72rem; letter-spacing: 1.5px; color: ${RED};
  text-transform: uppercase; margin-bottom: 6px;
`;

const FormInput = styled.input`
  width: 100%; box-sizing: border-box;
  background: #ffffff;
  border: 1px solid rgba(26,26,26,0.15);
  color: ${INK}; padding: 10px 12px;
  font-family: 'Montserrat', sans-serif; font-size: 0.88rem;
  &:focus { outline: none; border-color: rgba(26,26,26,0.4); }
  &:disabled { opacity: 0.5; }
`;

const FormTextarea = styled.textarea`
  width: 100%; box-sizing: border-box;
  background: #ffffff;
  border: 1px solid rgba(26,26,26,0.15);
  color: ${INK}; padding: 10px 12px;
  font-family: 'Montserrat', sans-serif; font-size: 0.88rem;
  resize: vertical;
  &:focus { outline: none; border-color: rgba(26,26,26,0.4); }
`;

const BookingSummaryBox = styled.div`
  background: rgba(255,255,255,0.5);
  border: 1px dashed rgba(26, 26, 26, 0.2);
  padding: 1.25rem; margin-bottom: 1.5rem;
`;

const SummaryTitle = styled.p`
  letter-spacing: 2px; font-size: 0.8rem;
  color: rgba(26,26,26,0.5); text-transform: uppercase; margin: 0 0 0.75rem;
`;

const SummaryRow = styled(motion.div)`
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(26,26,26,0.1);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.88rem;
  &:last-of-type { border-bottom: none; }
  span { color: rgba(26,26,26,0.5); }
  strong { color: ${({ $highlight }) => $highlight ? RED : INK}; }
`;

const CancellationNote = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem; color: rgba(26,26,26,0.5); margin: 8px 0 0; line-height: 1.5;
`;

const MemberNote = styled.div`
  background: rgba(46,125,50,0.08);
  border: 1px solid rgba(46,125,50,0.25);
  padding: 10px 14px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem; color: #2e7d32;
  margin-bottom: 1.25rem;
`;

// Payment
const PayForm = styled.form`
  display: flex; flex-direction: column; gap: 1.25rem;
`;

const DepositAmount = styled.p`
  font-size: 1.1rem; color: ${INK}; margin: 0;
  strong { color: ${RED}; font-size: 1.3rem; }
`;

const CardWrap = styled.div`
  background: #ffffff;
  border: 1px solid rgba(26,26,26,0.15);
  padding: 14px 16px;
`;

const PayBtn = styled(motion.button)`
  background: ${RED}; color: #fff;
  border: none; cursor: pointer;
  padding: 14px 28px;
  letter-spacing: 3px; font-size: 1rem;
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const CardNote = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem; color: rgba(26,26,26,0.45); text-align: center; margin: 0;
`;

// Navigation buttons
const RowBtns = styled.div`
  display: flex; gap: 12px; margin-top: 1.5rem; flex-wrap: wrap;
`;

const BackBtn = styled.button`
  background: transparent;
  border: 1px solid rgba(26,26,26,0.15);
  color: rgba(26,26,26,0.55); cursor: pointer;
  padding: 11px 22px;
  font-family: 'Montserrat', sans-serif; font-size: 0.88rem;
  transition: color 0.2s, border-color 0.2s;
  &:hover { color: ${INK}; border-color: rgba(26,26,26,0.35); }
`;

const NextBtn = styled.button`
  background: ${RED}; color: #fff;
  border: none; cursor: pointer;
  padding: 11px 28px;
  letter-spacing: 2px; font-size: 0.9rem;
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.35; cursor: default; }
`;

const ErrorMsg = styled.p`
  color: ${RED}; font-family: 'Montserrat', sans-serif; font-size: 0.85rem; margin: 0.75rem 0 0;
  background: rgba(196,30,58,0.06);
  padding: 8px 12px;
`;

const Empty = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: rgba(26,26,26,0.45); font-size: 0.85rem; text-align: center; padding: 2rem 0;
`;

// Inactive state
const InactiveWrap = styled(motion.div)`
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 4rem 2rem;
`;

const BarberScissors = styled.div`
  font-size: 4rem; color: ${RED}; opacity: 0.6; margin-bottom: 1.5rem;
`;

const InactiveTitle = styled.h1`
  font-size: clamp(2rem, 6vw, 3.5rem);
  letter-spacing: 5px; color: ${INK}; margin: 0 0 1rem;
`;

const InactiveText = styled.p`
  font-family: 'Montserrat', sans-serif; font-weight: 500;
  font-size: 1.1rem; color: rgba(26,26,26,0.6); line-height: 1.7;
  max-width: 460px; margin: 0 0 0.75rem;
`;

const InactiveSub = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem; color: rgba(26,26,26,0.4);
`;

// Confirmation
const ConfirmWrap = styled(motion.div)`
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 3rem 2rem;
  max-width: 520px; width: 100%;
`;

const ConfirmIcon = styled.div`
  width: 72px; height: 72px; border-radius: 50%;
  background: rgba(46,125,50,0.1);
  border: 2px solid rgba(46,125,50,0.35);
  color: #2e7d32;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1.25rem;
`;

const ConfirmTitle = styled.h1`
  letter-spacing: 4px;
  font-size: clamp(1.5rem, 4vw, 2.2rem); color: ${INK}; margin: 0 0 0.5rem;
`;

const ConfirmSub = styled.p`
  color: ${RED}; font-size: 1rem; letter-spacing: 2px; margin: 0 0 2rem;
`;

const ConfirmCard = styled.div`
  background: rgba(255,255,255,0.55); border: 1px solid rgba(26,26,26,0.1);
  padding: 1.25rem;
  width: 100%; margin-bottom: 1.5rem;
`;

const ConfirmRow = styled.div`
  display: flex; justify-content: space-between;
  padding: 7px 0; border-bottom: 1px solid rgba(26,26,26,0.1);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.88rem;
  &:last-child { border-bottom: none; }
  span { color: rgba(26,26,26,0.5); }
  strong { color: ${INK}; }
`;

const ConfirmNote = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: rgba(26,26,26,0.5); font-size: 0.8rem; line-height: 1.6; margin: 0 0 0.5rem;
`;
