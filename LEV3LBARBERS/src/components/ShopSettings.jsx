import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { GearIcon, StoreIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const waitLevels = [
  { label: "Level 1 — Smooth Sailing",  value: 10  },
  { label: "Level 2 — Buzzin' a Little", value: 25  },
  { label: "Level 3 — Packed House",    value: 999 },
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_HOURS = {
  0: { closed: true,  open: '10:00', close: '16:00' },
  1: { closed: false, open: '09:00', close: '18:00' },
  2: { closed: false, open: '09:00', close: '18:00' },
  3: { closed: false, open: '09:00', close: '18:00' },
  4: { closed: false, open: '09:00', close: '18:00' },
  5: { closed: false, open: '09:00', close: '19:00' },
  6: { closed: false, open: '09:00', close: '19:00' },
};

const ShopSettings = ({ refreshShopStatus }) => {
  const [formData,     setFormData]     = useState({ isOpen: false, barbers: [], waitTime: 0, override: false });
  const [openingHours, setOpeningHours] = useState(DEFAULT_HOURS);
  const [shopInfo,     setShopInfo]     = useState({ address: '', city: '', postcode: '', phone: '', email: '', instagram: '', mapEmbedUrl: '' });
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [savingInfo,   setSavingInfo]   = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/shop-status'),
      api.get('/shop-info'),
    ]).then(([statusRes, infoRes]) => {
      setFormData(statusRes.data);
      if (statusRes.data.openingHours) {
        setOpeningHours({ ...DEFAULT_HOURS, ...statusRes.data.openingHours });
      }
      setShopInfo({
        address:     infoRes.data.address     || '',
        city:        infoRes.data.city        || '',
        postcode:    infoRes.data.postcode    || '',
        phone:       infoRes.data.phone       || '',
        email:       infoRes.data.email       || '',
        instagram:   infoRes.data.instagram   || '',
        mapEmbedUrl: infoRes.data.mapEmbedUrl || '',
      });
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading>Loading...</Loading>;

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'barbers') value = value.split(',').map(n => n.trim());
    if (field === 'waitTime') value = Number(value);
    if (field === 'isOpen')   value = e.target.value === 'open';
    if (field === 'override') value = e.target.checked;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const setInfo = (k, v) => setShopInfo(prev => ({ ...prev, [k]: v }));

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    try {
      await api.put('/shop-info', shopInfo);
    } catch (err) {
      console.error(err);
      alert('Failed to save contact details.');
    } finally {
      setSavingInfo(false);
    }
  };

  const setHour = (dayIdx, field, value) => {
    setOpeningHours(prev => ({
      ...prev,
      [dayIdx]: { ...prev[dayIdx], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.put('/shop-status', { ...formData, openingHours });
      refreshShopStatus?.();
    } catch (err) {
      console.error(err);
      alert('Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  return (
  <>
    <FormCard>
      <PanelTitle><GearIcon width={20} height={20} /> Shop Settings</PanelTitle>

      {/* Override control */}
      <FormGroup>
        <Label>Override Automatic Hours</Label>
        <CheckboxWrapper>
          <Checkbox type="checkbox" checked={formData.override} onChange={handleChange('override')} />
          <span>Force open/closed regardless of schedule below</span>
        </CheckboxWrapper>
      </FormGroup>

      {formData.override && (
        <FormGroup>
          <Label>Forced Status</Label>
          <Select value={formData.isOpen ? 'open' : 'closed'} onChange={handleChange('isOpen')}>
            <option value="open">OPEN</option>
            <option value="closed">CLOSED</option>
          </Select>
        </FormGroup>
      )}

      {/* Opening hours editor */}
      <FormGroup>
        <Label>Opening Hours</Label>
        <HoursGrid>
          <HoursHeader>
            <span>Day</span><span>Closed</span><span>Opens</span><span>Closes</span>
          </HoursHeader>
          {DAY_NAMES.map((day, i) => {
            const dh = openingHours[i] || DEFAULT_HOURS[i];
            return (
              <HoursRow key={i}>
                <DayName>{day}</DayName>
                <ClosedCell>
                  <Checkbox
                    type="checkbox"
                    checked={!!dh.closed}
                    onChange={e => setHour(i, 'closed', e.target.checked)}
                  />
                </ClosedCell>
                <TimeInput
                  type="time"
                  value={dh.open || '09:00'}
                  disabled={dh.closed}
                  onChange={e => setHour(i, 'open', e.target.value)}
                />
                <TimeInput
                  type="time"
                  value={dh.close || '18:00'}
                  disabled={dh.closed}
                  onChange={e => setHour(i, 'close', e.target.value)}
                />
              </HoursRow>
            );
          })}
        </HoursGrid>
      </FormGroup>

      {/* Barbers */}
      <FormGroup>
        <Label>Barbers on Today</Label>
        <Input
          placeholder="Enter barbers separated by commas"
          value={formData.barbers.join(', ')}
          onChange={handleChange('barbers')}
        />
      </FormGroup>

      {/* Wait time */}
      <FormGroup>
        <Label>Waiting Level</Label>
        <Select value={formData.waitTime} onChange={handleChange('waitTime')}>
          {waitLevels.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </Select>
      </FormGroup>

      <SaveButton onClick={handleSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </SaveButton>
    </FormCard>

    {/* ── Contact Details card ── */}
    <FormCard>
      <PanelTitle><StoreIcon width={20} height={20} /> Contact Details</PanelTitle>

      <FormGroup>
        <Label>Street Address</Label>
        <Input placeholder="76 Eastbank Street" value={shopInfo.address} onChange={e => setInfo('address', e.target.value)} />
      </FormGroup>

      <TwoCol>
        <FormGroup>
          <Label>City &amp; Country</Label>
          <Input placeholder="Southport, UK" value={shopInfo.city} onChange={e => setInfo('city', e.target.value)} />
        </FormGroup>
        <FormGroup>
          <Label>Postcode</Label>
          <Input placeholder="PR8 1EF" value={shopInfo.postcode} onChange={e => setInfo('postcode', e.target.value)} />
        </FormGroup>
      </TwoCol>

      <FormGroup>
        <Label>Phone</Label>
        <Input placeholder="+44 7538 420 684" value={shopInfo.phone} onChange={e => setInfo('phone', e.target.value)} />
      </FormGroup>

      <FormGroup>
        <Label>Email</Label>
        <Input type="email" placeholder="lev3lbarbers@gmail.com" value={shopInfo.email} onChange={e => setInfo('email', e.target.value)} />
      </FormGroup>

      <FormGroup>
        <Label>Instagram / Social</Label>
        <Input placeholder="@lev3l_barbers" value={shopInfo.instagram} onChange={e => setInfo('instagram', e.target.value)} />
      </FormGroup>

      <FormGroup>
        <Label>Google Maps Embed URL</Label>
        <Input
          placeholder="Paste the src URL from Google Maps → Share → Embed a map"
          value={shopInfo.mapEmbedUrl}
          onChange={e => setInfo('mapEmbedUrl', e.target.value)}
        />
        <MapHint>In Google Maps, click Share → Embed a map → copy the URL from inside the src="..." attribute.</MapHint>
      </FormGroup>

      <SaveButton onClick={handleSaveInfo} disabled={savingInfo}>
        {savingInfo ? 'Saving...' : 'Save Contact Details'}
      </SaveButton>
    </FormCard>
  </>
  );
};

export default ShopSettings;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const FormCard = styled.div`
  background: rgba(255,255,255,0.55); padding: 2rem; border-radius: 0;
  backdrop-filter: blur(10px); border: 1px solid rgba(26,26,26,0.1);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%; max-width: 600px; margin: 0 auto 2rem;
`;

const PanelTitle = styled.h2`
  display: flex; align-items: center; justify-content: center; gap: 0.6rem;
  text-align: center; margin-bottom: 1.5rem; font-size: 1.6rem;
  font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; text-transform: uppercase;
  color: ${INK};
`;

const FormGroup = styled.div`
  display: flex; flex-direction: column; margin-bottom: 1.25rem; min-width: 0;
`;

const Label = styled.label`
  font-size: 0.9rem; color: ${RED}; margin-bottom: 0.5rem;
  font-family: 'Bebas Neue', sans-serif; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;
`;

const Input = styled.input`
  width: 100%; min-width: 0;
  padding: 0.7rem; border-radius: 0; font-family: 'Montserrat', sans-serif;
  border: 1px solid rgba(26,26,26,0.15); background: #ffffff;
  color: ${INK}; font-size: 1rem;
  &:focus { outline: none; border-color: ${RED}; }
  &::placeholder { color: rgba(26,26,26,0.35); }
`;

const Select = styled.select`
  padding: 0.7rem; border-radius: 0; font-family: 'Montserrat', sans-serif;
  border: 1px solid rgba(26,26,26,0.15); background: #ffffff;
  color: ${INK}; font-size: 1rem; cursor: pointer;
  &:focus { outline: none; border-color: ${RED}; }
  option { background: #ffffff; }
`;

const CheckboxWrapper = styled.div`
  display: flex; align-items: center; gap: 0.5rem; color: rgba(26,26,26,0.6); font-weight: 600;
  font-family: 'Montserrat', sans-serif; font-size: 0.9rem;
`;

const Checkbox = styled.input`transform: scale(1.3); cursor: pointer; accent-color: ${RED};`;

/* Hours grid */
const HoursGrid = styled.div`
  border: 1px solid rgba(26,26,26,0.1); border-radius: 0; overflow: hidden;
`;

const HoursHeader = styled.div`
  display: grid; grid-template-columns: minmax(90px, 1fr) 60px 100px 100px;
  padding: 0.5rem 0.85rem;
  background: rgba(26,26,26,0.05);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.68rem; letter-spacing: 3px; text-transform: uppercase; color: ${RED};
  gap: 0.5rem;

  @media (max-width: 480px) { grid-template-columns: minmax(80px, 1fr) 50px 80px 80px; }
`;

const HoursRow = styled.div`
  display: grid; grid-template-columns: minmax(90px, 1fr) 60px 100px 100px;
  padding: 0.6rem 0.85rem;
  border-top: 1px solid rgba(26,26,26,0.08);
  align-items: center; gap: 0.5rem;
  transition: background 0.15s;
  &:hover { background: rgba(26,26,26,0.03); }

  @media (max-width: 480px) { grid-template-columns: minmax(80px, 1fr) 50px 80px 80px; }
`;

const DayName = styled.span`font-size: 0.88rem; font-family: 'Montserrat', sans-serif; font-weight: 600; color: ${INK};`;

const ClosedCell = styled.div`display: flex; justify-content: center;`;

const TimeInput = styled.input`
  padding: 0.35rem 0.5rem; border-radius: 0; font-family: 'Montserrat', sans-serif;
  border: 1px solid rgba(26,26,26,0.15); background: #ffffff;
  color: ${INK}; font-size: 0.85rem; width: 100%;
  &:focus { outline: none; border-color: ${RED}; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
  color-scheme: light;
`;

const SaveButton = styled.button`
  width: 100%; padding: 0.85rem; border-radius: 0;
  background: ${RED}; color: #fff; font-family: 'Bebas Neue', sans-serif;
  font-weight: bold; letter-spacing: 1px; text-transform: uppercase; border: none;
  cursor: pointer; font-size: 1rem; margin-top: 1rem;
  transition: background 0.3s ease, transform 0.1s ease;
  &:hover:not(:disabled) { background: #a8172f; transform: scale(1.02); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Loading = styled.p`
  text-align: center; color: ${INK}; font-family: 'Montserrat', sans-serif; font-size: 1.2rem; margin-top: 3rem;
`;

const TwoCol = styled.div`
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0.75rem;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const MapHint = styled.p`
  font-size: 0.72rem; font-family: 'Montserrat', sans-serif; font-weight: 600;
  color: rgba(26,26,26,0.5); margin: 0.35rem 0 0; line-height: 1.5;
`;
