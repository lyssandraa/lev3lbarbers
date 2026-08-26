import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../utils/api';

const CREAM = '#f4f0e8';
const INK = '#1a1a1a';
const RED = '#C41E3A';
const FONT_HEAD = "'Bebas Neue', sans-serif";
const FONT_BODY = "'Montserrat', sans-serif";

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const STATUS_COLORS = {
  PENDING:   '#b45309',
  CONFIRMED: '#2e7d32',
  COMPLETED: '#4f46e5',
  CANCELLED: '#C41E3A',
  NO_SHOW:   '#6b7280',
};

// ── Utility ──────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminBookings() {
  const [tab, setTab] = useState('settings');

  return (
    <Wrap>
      <Tabs>
        {['settings','bookings'].map(t => (
          <Tab key={t} $active={tab === t} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Tab>
        ))}
      </Tabs>

      {tab === 'settings'     && <SettingsTab />}
      {tab === 'bookings'     && <BookingsTab />}
    </Wrap>
  );
}

// ── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings]   = useState(null);
  const [saving,   setSaving]     = useState(false);
  const [msg,      setMsg]        = useState('');

  useEffect(() => {
    api.get('/booking-settings').then(r => setSettings(r.data)).catch(console.error);
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const { data } = await api.put('/booking-settings', settings);
      setSettings(data);
      setMsg('Saved!');
    } catch { setMsg('Failed to save.'); }
    finally { setSaving(false); }
  };

  if (!settings) return <Loading>Loading…</Loading>;

  return (
    <Card>
      <SectionTitle>Booking Settings</SectionTitle>

      <ToggleRow>
        <span>Accept Bookings</span>
        <Toggle $on={settings.isActive} onClick={() => setSettings(s => ({ ...s, isActive: !s.isActive }))}>
          <ToggleKnob $on={settings.isActive} />
        </Toggle>
        <StatusBadge $on={settings.isActive}>{settings.isActive ? 'Active' : 'Inactive'}</StatusBadge>
      </ToggleRow>

      <Grid2>
        <Field>
          <Label>Deposit %</Label>
          <Input
            type="number" min="0" max="100"
            value={settings.depositPercent}
            onChange={e => setSettings(s => ({ ...s, depositPercent: parseFloat(e.target.value) || 0 }))}
          />
        </Field>
        <Field>
          <Label>Slot Duration (mins)</Label>
          <Input
            type="number" min="15" step="15"
            value={settings.slotDurationMins}
            onChange={e => setSettings(s => ({ ...s, slotDurationMins: parseInt(e.target.value) || 30 }))}
          />
        </Field>
        <Field>
          <Label>Free Cancellation Window (hours)</Label>
          <Input
            type="number" min="0"
            value={settings.cancellationHours}
            onChange={e => setSettings(s => ({ ...s, cancellationHours: parseInt(e.target.value) || 24 }))}
          />
        </Field>
      </Grid2>

      <SaveBtn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</SaveBtn>
      {msg && <Feedback $ok={msg === 'Saved!'}>{msg}</Feedback>}
    </Card>
  );
}

// ── Bookings Tab ──────────────────────────────────────────────────────────────
function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [filter,   setFilter]   = useState({ status:'', barberId:'' });
  const [barbers,  setBarbers]  = useState([]);
  const [msg,      setMsg]      = useState('');

  useEffect(() => {
    api.get('/barber-profiles').then(r => setBarbers(r.data)).catch(console.error);
  }, []);

  const load = () => {
    const params = new URLSearchParams();
    if (filter.status)   params.set('status',   filter.status);
    if (filter.barberId) params.set('barberId',  filter.barberId);
    api.get(`/bookings?${params}`).then(r => setBookings(r.data)).catch(console.error);
  };
  useEffect(load, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
      setMsg(`Marked as ${status}.`);
    } catch { setMsg('Failed.'); }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking? The deposit will be refunded if within the window.')) return;
    try {
      const { data } = await api.post(`/bookings/${id}/cancel`, { cancelledBy: 'ADMIN' });
      setMsg(data.message);
      load();
    } catch { setMsg('Failed to cancel.'); }
  };

  return (
    <Card>
      <SectionTitle>All Bookings</SectionTitle>

      <FilterRow>
        <Select value={filter.status} onChange={e => setFilter(s => ({ ...s, status: e.target.value }))}>
          <option value="">All statuses</option>
          {['PENDING','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select value={filter.barberId} onChange={e => setFilter(s => ({ ...s, barberId: e.target.value }))}>
          <option value="">All barbers</option>
          {barbers.map(b => <option key={b.id} value={b.id}>{b.displayName}</option>)}
        </Select>
      </FilterRow>

      {msg && <Feedback $ok={!msg.toLowerCase().includes('fail')} style={{ marginBottom:'1rem' }}>{msg}</Feedback>}

      {bookings.length === 0 && <Empty>No bookings found.</Empty>}

      {bookings.map(b => {
        const name  = b.user?.name  || b.guestName  || 'Guest';
        const email = b.user?.email || b.guestEmail || '—';
        return (
          <BookingCard key={b.id}>
            <BookingHeader>
              <div>
                <strong>{fmt(b.appointmentAt)}</strong> at <strong>{fmtTime(b.appointmentAt)}</strong>
              </div>
              <StatusPill $color={STATUS_COLORS[b.status]}>{b.status}</StatusPill>
            </BookingHeader>
            <BookingBody>
              <BookingDetail><span>Service</span><strong>{b.serviceName}</strong></BookingDetail>
              <BookingDetail><span>Barber</span><strong>{b.barber?.displayName}</strong></BookingDetail>
              <BookingDetail><span>Customer</span><strong>{name}</strong></BookingDetail>
              <BookingDetail><span>Email</span><span>{email}</span></BookingDetail>
              {b.guestPhone && <BookingDetail><span>Phone</span><span>{b.guestPhone}</span></BookingDetail>}
              <BookingDetail>
                <span>Deposit</span>
                <span>
                  {b.depositAmount > 0
                    ? `£${b.depositAmount.toFixed(2)} ${b.depositPaid ? '✓ Paid' : '⏳ Pending'}`
                    : 'None'}
                </span>
              </BookingDetail>
              {b.notes && <BookingDetail><span>Notes</span><span>{b.notes}</span></BookingDetail>}
            </BookingBody>
            {!['CANCELLED','COMPLETED','NO_SHOW'].includes(b.status) && (
              <ActionRow>
                {b.status === 'CONFIRMED' && (
                  <>
                    <SmBtn onClick={() => updateStatus(b.id, 'COMPLETED')}>Complete</SmBtn>
                    <SmBtn onClick={() => updateStatus(b.id, 'NO_SHOW')}>No Show</SmBtn>
                  </>
                )}
                {b.status === 'PENDING' && (
                  <SmBtn onClick={() => updateStatus(b.id, 'CONFIRMED')}>Confirm</SmBtn>
                )}
                <DangerBtn onClick={() => cancel(b.id)}>Cancel</DangerBtn>
              </ActionRow>
            )}
          </BookingCard>
        );
      })}
    </Card>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const Wrap = styled.div`
  width: 100%;
  max-width: 860px;
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  background: ${({ $active }) => $active ? RED : 'transparent'};
  color: ${({ $active }) => $active ? '#fff' : 'rgba(26,26,26,0.55)'};
  border: 1px solid ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.15)'};
  cursor: pointer;
  padding: 8px 20px; border-radius: 0;
  font-family: ${FONT_HEAD}; letter-spacing: 2px; font-size: 0.82rem;
  transition: all 0.2s;
  &:hover { background: ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.05)'}; color: ${({ $active }) => $active ? '#fff' : INK}; }
`;

const Card = styled.div`
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(26,26,26,0.1);
  border-radius: 0;
  padding: 2rem;
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-family: ${FONT_HEAD};
  letter-spacing: 3px;
  font-size: 1.3rem;
  color: ${INK};
  margin: 0 0 1.5rem;
  text-transform: uppercase;
`;

const Label = styled.label`
  display: block;
  font-size: 0.72rem;
  letter-spacing: 1.5px;
  color: rgba(26,26,26,0.6);
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 6px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const Input = styled.input`
  background: #ffffff;
  border: 1px solid rgba(26,26,26,0.15);
  border-radius: 0;
  color: ${INK};
  padding: 9px 12px;
  font-family: ${FONT_BODY};
  font-size: 0.88rem;
  width: 100%;
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${RED}; }
  &::placeholder { color: rgba(26,26,26,0.35); }
  &[type="file"] { padding: 6px; cursor: pointer; }
`;

const Select = styled.select`
  background: #ffffff;
  border: 1px solid rgba(26,26,26,0.15);
  border-radius: 0;
  color: ${INK};
  padding: 9px 12px;
  font-family: ${FONT_BODY};
  font-size: 0.88rem;
  cursor: pointer;
  &:focus { outline: none; border-color: ${RED}; }
  option { background: #fff; }
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
  font-size: 0.88rem;
  color: ${INK};
`;

const Toggle = styled.div`
  width: 44px; height: 24px;
  background: ${({ $on }) => $on ? RED : 'rgba(26,26,26,0.15)'};
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
`;

const ToggleKnob = styled.div`
  width: 18px; height: 18px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: ${({ $on }) => $on ? '23px' : '3px'};
  transition: left 0.2s;
`;

const StatusBadge = styled.span`
  font-size: 0.72rem; letter-spacing: 1px;
  color: ${({ $on }) => $on ? '#2e7d32' : '#C41E3A'};
  font-weight: 700;
`;

const SaveBtn = styled.button`
  background: ${RED};
  color: #fff;
  border: none; cursor: pointer;
  padding: 10px 24px; border-radius: 0;
  font-family: ${FONT_HEAD}; letter-spacing: 2px; font-size: 0.85rem;
  transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const SmBtn = styled.button`
  background: rgba(26,26,26,0.06);
  color: ${INK};
  border: none; cursor: pointer;
  padding: 6px 14px; border-radius: 0;
  font-family: ${FONT_BODY}; font-size: 0.78rem; font-weight: 600;
  transition: background 0.2s;
  &:hover { background: rgba(26,26,26,0.12); }
`;

const DangerBtn = styled.button`
  background: rgba(196,30,58,0.08);
  color: ${RED};
  border: 1px solid rgba(196,30,58,0.3); cursor: pointer;
  padding: 6px 14px; border-radius: 0;
  font-family: ${FONT_BODY}; font-size: 0.78rem; font-weight: 600;
  transition: background 0.2s;
  &:hover { background: rgba(196,30,58,0.16); }
`;

const Feedback = styled.p`
  margin-top: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ $ok }) => $ok ? '#2e7d32' : '#C41E3A'};
`;

const Loading = styled.p`
  color: rgba(26,26,26,0.6);
  font-weight: 600;
`;

const Empty = styled.p`
  color: rgba(26,26,26,0.6);
  font-weight: 600;
  font-size: 0.85rem;
  text-align: center;
  padding: 2rem 0;
`;

const FilterRow = styled.div`
  display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 1.5rem;
`;

const BookingCard = styled.div`
  background: rgba(255,255,255,0.4);
  border: 1px solid rgba(26,26,26,0.1);
  border-radius: 0;
  margin-bottom: 12px;
  overflow: hidden;
`;

const BookingHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  background: rgba(255,255,255,0.5);
  border-bottom: 1px solid rgba(26,26,26,0.1);
  font-size: 0.9rem;
  color: ${INK};
`;

const StatusPill = styled.span`
  background: ${({ $color }) => $color}1a;
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => $color}40;
  padding: 2px 10px; border-radius: 20px;
  font-size: 0.7rem; letter-spacing: 1px; font-weight: 700;
`;

const BookingBody = styled.div`
  padding: 12px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  color: ${INK};
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const BookingDetail = styled.div`
  display: flex; flex-direction: column;
  span:first-child { font-size: 0.68rem; letter-spacing: 1px; color: rgba(26,26,26,0.6); font-weight: 600; text-transform: uppercase; }
  span:last-child, strong { font-size: 0.85rem; }
`;

const ActionRow = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid rgba(26,26,26,0.1);
  background: rgba(255,255,255,0.25);
`;
