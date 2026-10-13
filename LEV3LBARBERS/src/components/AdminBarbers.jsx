import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { resolveImageUrl } from '../config';

const CREAM = '#f4f0e8';
const INK = '#1a1a1a';
const RED = '#C41E3A';
const FONT_HEAD = "'Bebas Neue', sans-serif";
const FONT_BODY = "'Montserrat', sans-serif";

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
// Working-day picker, Monday first (values are JS weekdays: 0 = Sunday)
const WEEK = [[1,'Mon'],[2,'Tue'],[3,'Wed'],[4,'Thu'],[5,'Fri'],[6,'Sat'],[0,'Sun']];

const fmt = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminBarbers() {
  const [tab, setTab] = useState('today');

  return (
    <Wrap>
      <Tabs>
        <Tab $active={tab === 'today'}        onClick={() => setTab('today')}>Who's In</Tab>
        <Tab $active={tab === 'profiles'}      onClick={() => setTab('profiles')}>Profiles</Tab>
        <Tab $active={tab === 'availability'}  onClick={() => setTab('availability')}>Availability</Tab>
      </Tabs>

      {tab === 'today'        && <WhosInTab />}
      {tab === 'profiles'     && <ProfilesTab />}
      {tab === 'availability' && <AvailabilityTab />}
    </Wrap>
  );
}

// ── Who's In Today Tab ──────────────────────────────────────────────────────
function WhosInTab() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId,  setBusyId]  = useState(null);
  const [newName, setNewName] = useState('');
  const [adding,  setAdding]   = useState(false);
  const [msg,     setMsg]      = useState('');

  const load = () => {
    setLoading(true);
    api.get('/barber-profiles').then(r => setBarbers(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Replace one barber with the server's copy (it works out workingToday)
  const applyUpdate = (updated) =>
    setBarbers(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x));

  // "Today only" change: lapses at midnight, then the regular days apply again
  const toggle = async (b) => {
    setBusyId(b.id); setMsg('');
    try {
      const { data } = await api.put(`/barber-profiles/${b.id}/working-today`, { workingToday: !b.workingToday });
      applyUpdate(data);
    } catch { setMsg('Could not update today. Please try again.'); }
    finally { setBusyId(null); }
  };

  const toggleDay = async (b, day) => {
    const current = b.workingDays || [];
    const workingDays = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    setBusyId(b.id); setMsg('');
    try {
      const { data } = await api.put(`/barber-profiles/${b.id}/working-days`, { workingDays });
      applyUpdate(data);
    } catch { setMsg('Could not save working days. Please try again.'); }
    finally { setBusyId(null); }
  };

  const addBarber = async () => {
    if (!newName.trim()) return;
    setAdding(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('displayName', newName.trim());
      await api.post('/barber-profiles', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewName('');
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to add barber.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <SectionTitle>Who's In Today</SectionTitle>
      <SubHint>
        Pick the days each barber normally works and the "Who's In Today" section on the
        homepage and app updates itself every day. For a one-off change (sick day, swapped
        shift) use the In Today button: it only affects today and resets at midnight.
        Quick-added barbers don't need a login account; add photo/price/bio for them later
        under Profiles if you want them bookable online.
      </SubHint>

      <AddRow>
        <Input
          placeholder="Barber's name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addBarber()}
        />
        <SaveBtn onClick={addBarber} disabled={adding}>{adding ? 'Adding…' : 'Add Barber'}</SaveBtn>
      </AddRow>
      {msg && <Feedback>{msg}</Feedback>}

      {loading ? (
        <Loading>Loading…</Loading>
      ) : barbers.length === 0 ? (
        <Empty>No barber profiles yet — add one under the Profiles tab first.</Empty>
      ) : (
        <BarberList>
          {barbers.map(b => (
            <BarberRow key={b.id}>
              {b.imageUrl
                ? <BarberImg src={resolveImageUrl(b.imageUrl)} alt={b.displayName} />
                : <BarberAvatar>{b.displayName[0]}</BarberAvatar>
              }
              <BarberInfo>
                <strong>{b.displayName}</strong>
                <DayPicker role="group" aria-label={`${b.displayName}'s working days`}>
                  {WEEK.map(([day, label]) => (
                    <DayChip
                      key={day}
                      type="button"
                      $on={(b.workingDays || []).includes(day)}
                      aria-pressed={(b.workingDays || []).includes(day)}
                      disabled={busyId === b.id}
                      onClick={() => toggleDay(b, day)}
                    >
                      {label}
                    </DayChip>
                  ))}
                </DayPicker>
                {!(b.workingDays || []).length && <DayHint>No working days set yet</DayHint>}
              </BarberInfo>
              <TodayCol>
                <CheckToggle
                  $on={b.workingToday}
                  disabled={busyId === b.id}
                  onClick={() => toggle(b)}
                  title="Changes today only; resets at midnight"
                >
                  {b.workingToday ? '✓ In Today' : 'Not In Today'}
                </CheckToggle>
                {b.todayIsOverride && <DayHint>Today only · back to schedule tomorrow</DayHint>}
              </TodayCol>
            </BarberRow>
          ))}
        </BarberList>
      )}
    </Card>
  );
}

// ── Profiles Tab (barber directory: photo, price, bio, bookable) ───────────
function ProfilesTab() {
  const [barbers,    setBarbers]    = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [form, setForm]             = useState({ userId:'', displayName:'', bio:'', priceFrom:'', phone:'', isBookable: true });
  const [editId, setEditId]         = useState(null);
  const [msg,   setMsg]             = useState('');
  const [saving, setSaving]         = useState(false);
  const fileRef = useRef();

  const load = () => {
    api.get('/barber-profiles').then(r => setBarbers(r.data)).catch(console.error);
    api.get('/barber-profiles/staff-users').then(r => setStaffUsers(r.data)).catch(console.error);
  };
  useEffect(load, []);

  const resetForm = () => {
    setForm({ userId:'', displayName:'', bio:'', priceFrom:'', phone:'', isBookable: true });
    setEditId(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const startEdit = (b) => {
    setEditId(b.id);
    setForm({ userId: b.userId, displayName: b.displayName, bio: b.bio||'', priceFrom: b.priceFrom||'', phone: b.phone||'', isBookable: b.isBookable });
  };

  const submit = async () => {
    if (!form.displayName.trim()) return setMsg('Display name required.');
    setSaving(true); setMsg('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (fileRef.current?.files[0]) fd.append('image', fileRef.current.files[0]);

      if (editId) {
        await api.put(`/barber-profiles/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('Updated!');
      } else {
        await api.post('/barber-profiles', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('Barber profile created!');
      }
      load(); resetForm();
    } catch (e) { setMsg(e.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const toggleBookable = async (b) => {
    try {
      await api.put(`/barber-profiles/${b.id}`, JSON.stringify({ isBookable: !b.isBookable }), {
        headers: { 'Content-Type': 'application/json' },
      });
      load();
    } catch { /* ignore */ }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this barber profile?')) return;
    await api.delete(`/barber-profiles/${id}`);
    load();
  };

  const resetPin = async (b) => {
    if (!window.confirm(`Reset ${b.displayName}'s quick-login PIN? They'll need to set a new one from their profile.`)) return;
    try {
      await api.put(`/auth/admin/users/${b.userId}/reset-pin`);
      setMsg('PIN reset.');
    } catch {
      setMsg('Failed to reset PIN.');
    }
  };

  return (
    <Card>
      <SectionTitle>Barber Profiles</SectionTitle>

      <SubCard>
        <SubTitle>{editId ? 'Edit Profile' : 'Add Barber Profile'}</SubTitle>

        {!editId && (
          <Field>
            <Label>Linked Login Account <Hint>optional — only needed if they'll log in / use quick-PIN</Hint></Label>
            <Select value={form.userId} onChange={e => setForm(s => ({ ...s, userId: e.target.value }))}>
              <option value="">— None (roster/display only) —</option>
              {staffUsers.filter(u => !u.barberProfile).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </Select>
          </Field>
        )}

        <Grid2>
          <Field>
            <Label>Display Name</Label>
            <Input value={form.displayName} onChange={e => setForm(s => ({ ...s, displayName: e.target.value }))} placeholder="e.g. Marcus" />
          </Field>
          <Field>
            <Label>From Price (£)</Label>
            <Input type="number" min="0" step="0.50" value={form.priceFrom} onChange={e => setForm(s => ({ ...s, priceFrom: e.target.value }))} placeholder="e.g. 15" />
          </Field>
          <Field>
            <Label>Phone (for SMS reminders)</Label>
            <Input value={form.phone} onChange={e => setForm(s => ({ ...s, phone: e.target.value }))} placeholder="+44 7xxx xxxxxx" />
          </Field>
          <Field>
            <Label>Photo</Label>
            <Input type="file" accept="image/*" ref={fileRef} />
          </Field>
        </Grid2>
        <Field>
          <Label>Bio</Label>
          <Textarea rows={2} value={form.bio} onChange={e => setForm(s => ({ ...s, bio: e.target.value }))} placeholder="Short bio…" />
        </Field>
        <ToggleRow>
          <span>Bookable</span>
          <Toggle $on={form.isBookable} onClick={() => setForm(s => ({ ...s, isBookable: !s.isBookable }))}>
            <ToggleKnob $on={form.isBookable} />
          </Toggle>
        </ToggleRow>

        <BtnRow>
          <SaveBtn onClick={submit} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Create'}</SaveBtn>
          {editId && <GhostBtn onClick={resetForm}>Cancel</GhostBtn>}
        </BtnRow>
        {msg && <Feedback $ok={!msg.toLowerCase().includes('fail')}>{msg}</Feedback>}
      </SubCard>

      <BarberList>
        {barbers.map(b => (
          <BarberRow key={b.id}>
            {b.imageUrl
              ? <BarberImg src={resolveImageUrl(b.imageUrl)} alt={b.displayName} />
              : <BarberAvatar>{b.displayName[0]}</BarberAvatar>
            }
            <BarberInfo>
              <strong>{b.displayName}</strong>
              <span style={{ color: 'rgba(26,26,26,0.6)', fontWeight: 600, fontSize:'0.8rem' }}>
                {b.user ? `${b.user.name} · ${b.user.email}` : 'No login account (roster/display only)'}
              </span>
              {b.priceFrom && <span style={{ color: RED, fontSize:'0.8rem' }}>From £{b.priceFrom}</span>}
            </BarberInfo>
            <BarberActions>
              <Toggle $on={b.isBookable} onClick={() => toggleBookable(b)} title={b.isBookable ? 'Deactivate' : 'Activate'}>
                <ToggleKnob $on={b.isBookable} />
              </Toggle>
              <SmBtn onClick={() => startEdit(b)}>Edit</SmBtn>
              {b.userId && <SmBtn onClick={() => resetPin(b)}>Reset PIN</SmBtn>}
              <DangerBtn onClick={() => del(b.id)}>Delete</DangerBtn>
            </BarberActions>
          </BarberRow>
        ))}
        {barbers.length === 0 && <Empty>No barber profiles yet.</Empty>}
      </BarberList>
    </Card>
  );
}

// ── Availability Tab ──────────────────────────────────────────────────────────
function AvailabilityTab() {
  const [barbers,      setBarbers]      = useState([]);
  const [selectedId,   setSelectedId]   = useState('');
  const [rules,        setRules]        = useState([]);
  const [ruleType,     setRuleType]     = useState('RANGE');
  const [rangeForm,    setRangeForm]    = useState({ dayOfWeek:'1', startTime:'09:00', endTime:'17:00' });
  const [slotForm,     setSlotForm]     = useState({ slotDate:'', slotTime:'10:00' });
  const [msg,          setMsg]          = useState('');

  useEffect(() => {
    api.get('/barber-profiles').then(r => setBarbers(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api.get(`/bookings/availability/${selectedId}`).then(r => setRules(r.data)).catch(console.error);
  }, [selectedId]);

  const reload = () => {
    if (selectedId) api.get(`/bookings/availability/${selectedId}`).then(r => setRules(r.data));
  };

  const addRule = async () => {
    if (!selectedId) return setMsg('Select a barber first.');
    setMsg('');
    try {
      const payload = ruleType === 'RANGE'
        ? { barberId: selectedId, type:'RANGE', ...rangeForm }
        : { barberId: selectedId, type:'SLOT', ...slotForm };
      await api.post('/bookings/availability', payload);
      setMsg('Rule added!');
      reload();
    } catch (e) { setMsg(e.response?.data?.message || 'Failed.'); }
  };

  const toggleRule = async (rule) => {
    await api.put(`/bookings/availability/${rule.id}`, { isActive: !rule.isActive });
    reload();
  };

  const deleteRule = async (id) => {
    if (!window.confirm('Delete this availability rule?')) return;
    await api.delete(`/bookings/availability/${id}`);
    reload();
  };

  const rangeRules = rules.filter(r => r.type === 'RANGE');
  const slotRules  = rules.filter(r => r.type === 'SLOT');

  return (
    <Card>
      <SectionTitle>Availability</SectionTitle>

      <Field>
        <Label>Barber</Label>
        <Select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="">— Select barber —</option>
          {barbers.map(b => <option key={b.id} value={b.id}>{b.displayName}</option>)}
        </Select>
      </Field>

      {selectedId && (
        <>
          <SubCard>
            <SubTitle>Add Availability Rule</SubTitle>
            <ToggleRow style={{ marginBottom:'1rem' }}>
              <RuleTypeBtn $active={ruleType==='RANGE'} onClick={() => setRuleType('RANGE')}>Weekly Range</RuleTypeBtn>
              <RuleTypeBtn $active={ruleType==='SLOT'}  onClick={() => setRuleType('SLOT')}>Individual Slot</RuleTypeBtn>
            </ToggleRow>

            {ruleType === 'RANGE' ? (
              <Grid2>
                <Field>
                  <Label>Day of Week</Label>
                  <Select value={rangeForm.dayOfWeek} onChange={e => setRangeForm(s => ({ ...s, dayOfWeek: e.target.value }))}>
                    {DAYS.map((d,i) => <option key={i} value={i}>{d}</option>)}
                  </Select>
                </Field>
                <Field />
                <Field>
                  <Label>Start Time</Label>
                  <Input type="time" value={rangeForm.startTime} onChange={e => setRangeForm(s => ({ ...s, startTime: e.target.value }))} />
                </Field>
                <Field>
                  <Label>End Time</Label>
                  <Input type="time" value={rangeForm.endTime} onChange={e => setRangeForm(s => ({ ...s, endTime: e.target.value }))} />
                </Field>
              </Grid2>
            ) : (
              <Grid2>
                <Field>
                  <Label>Date</Label>
                  <Input type="date" value={slotForm.slotDate} min={new Date().toISOString().slice(0,10)} onChange={e => setSlotForm(s => ({ ...s, slotDate: e.target.value }))} />
                </Field>
                <Field>
                  <Label>Time</Label>
                  <Input type="time" value={slotForm.slotTime} onChange={e => setSlotForm(s => ({ ...s, slotTime: e.target.value }))} />
                </Field>
              </Grid2>
            )}

            <SaveBtn onClick={addRule}>Add Rule</SaveBtn>
            {msg && <Feedback $ok={msg === 'Rule added!'}>{msg}</Feedback>}
          </SubCard>

          {rangeRules.length > 0 && (
            <>
              <SubTitle style={{ marginTop:'1.5rem' }}>Weekly Ranges</SubTitle>
              <RuleList>
                {rangeRules.map(r => (
                  <RuleItem key={r.id} $active={r.isActive}>
                    <span><strong>{DAYS[r.dayOfWeek]}</strong> · {r.startTime} – {r.endTime}</span>
                    <BtnRow>
                      <Toggle $on={r.isActive} onClick={() => toggleRule(r)}><ToggleKnob $on={r.isActive} /></Toggle>
                      <DangerBtn onClick={() => deleteRule(r.id)}>×</DangerBtn>
                    </BtnRow>
                  </RuleItem>
                ))}
              </RuleList>
            </>
          )}

          {slotRules.length > 0 && (
            <>
              <SubTitle style={{ marginTop:'1.5rem' }}>Individual Slots</SubTitle>
              <RuleList>
                {slotRules.map(r => (
                  <RuleItem key={r.id} $active={r.isActive}>
                    <span>{fmt(r.slotDate)} at <strong>{r.slotTime}</strong></span>
                    <BtnRow>
                      <Toggle $on={r.isActive} onClick={() => toggleRule(r)}><ToggleKnob $on={r.isActive} /></Toggle>
                      <DangerBtn onClick={() => deleteRule(r.id)}>×</DangerBtn>
                    </BtnRow>
                  </RuleItem>
                ))}
              </RuleList>
            </>
          )}

          {rules.length === 0 && <Empty>No availability rules yet for this barber.</Empty>}
        </>
      )}
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

const SubCard = styled.div`
  background: rgba(255,255,255,0.4);
  border: 1px solid rgba(26,26,26,0.1);
  border-radius: 0;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-family: ${FONT_HEAD};
  letter-spacing: 3px;
  font-size: 1.3rem;
  color: ${INK};
  margin: 0 0 1.5rem;
  text-transform: uppercase;
`;

const SubTitle = styled.p`
  font-family: ${FONT_HEAD};
  letter-spacing: 2px;
  font-size: 0.85rem;
  color: ${RED};
  text-transform: uppercase;
  margin: 0 0 1rem;
`;

const SubHint = styled.p`
  font-family: ${FONT_BODY};
  font-size: 0.8rem;
  color: rgba(26,26,26,0.55);
  margin: -1rem 0 1.5rem;
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

const Hint = styled.span`
  color: rgba(26,26,26,0.4);
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const AddRow = styled.div`
  display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;

  & > input { flex: 1; min-width: 160px; }
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

const Textarea = styled.textarea`
  background: #ffffff;
  border: 1px solid rgba(26,26,26,0.15);
  border-radius: 0;
  color: ${INK};
  padding: 9px 12px;
  font-family: ${FONT_BODY};
  font-size: 0.88rem;
  resize: vertical;
  &:focus { outline: none; border-color: ${RED}; }
  &::placeholder { color: rgba(26,26,26,0.35); }
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

const CheckToggle = styled.button`
  padding: 7px 16px; border-radius: 0; cursor: pointer;
  font-family: ${FONT_BODY}; font-weight: 700; font-size: 0.78rem;
  border: 1px solid ${({ $on }) => $on ? '#2e7d32' : 'rgba(26,26,26,0.2)'};
  color: ${({ $on }) => $on ? '#2e7d32' : 'rgba(26,26,26,0.55)'};
  background: ${({ $on }) => $on ? 'rgba(46,125,50,0.08)' : 'transparent'};
  transition: all 0.18s;
  flex-shrink: 0;
  &:disabled { opacity: 0.5; cursor: default; }
`;

const DayPicker = styled.div`
  display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;
`;

const DayChip = styled.button`
  min-width: 40px; padding: 4px 6px; border-radius: 0; cursor: pointer;
  font-family: ${FONT_BODY}; font-weight: 700; font-size: 0.7rem; letter-spacing: 0.5px;
  border: 1px solid ${({ $on }) => $on ? INK : 'rgba(26,26,26,0.2)'};
  color: ${({ $on }) => $on ? CREAM : 'rgba(26,26,26,0.55)'};
  background: ${({ $on }) => $on ? INK : 'transparent'};
  transition: all 0.15s;
  &:disabled { opacity: 0.5; cursor: default; }
`;

const DayHint = styled.span`
  font-family: ${FONT_BODY}; font-size: 0.7rem; color: rgba(26,26,26,0.5); margin-top: 4px;
`;

const TodayCol = styled.div`
  display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0;
  @media (max-width: 640px) { align-items: flex-start; }
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

const GhostBtn = styled.button`
  background: transparent;
  color: rgba(26,26,26,0.55);
  border: 1px solid rgba(26,26,26,0.15); cursor: pointer;
  padding: 10px 20px; border-radius: 0;
  font-family: ${FONT_BODY}; font-size: 0.85rem;
  transition: color 0.2s;
  &:hover { color: ${INK}; border-color: rgba(26,26,26,0.3); }
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

const BtnRow = styled.div`
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
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

const BarberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BarberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255,255,255,0.4);
  border: 1px solid rgba(26,26,26,0.1);
  border-radius: 0;
  padding: 12px 16px;

  @media (max-width: 640px) {
    flex-wrap: wrap;
  }
`;

const BarberImg = styled.img`
  width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
`;

const BarberAvatar = styled.div`
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(196,30,58,0.12); color: ${RED};
  display: flex; align-items: center; justify-content: center;
  font-family: ${FONT_HEAD}; font-size: 1.4rem; flex-shrink: 0;
`;

const BarberInfo = styled.div`
  flex: 1;
  display: flex; flex-direction: column; gap: 2px;
  font-size: 0.88rem;
  color: ${INK};
`;

const BarberActions = styled.div`
  display: flex; gap: 8px; align-items: center; flex-wrap: wrap;

  @media (max-width: 640px) {
    width: 100%;
    padding-left: 62px; /* align under BarberInfo — 48px avatar + 14px gap */
  }
`;

const RuleTypeBtn = styled.button`
  background: ${({ $active }) => $active ? RED : 'transparent'};
  color: ${({ $active }) => $active ? '#fff' : 'rgba(26,26,26,0.55)'};
  border: 1px solid ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.15)'};
  cursor: pointer;
  padding: 7px 16px; border-radius: 0;
  font-family: ${FONT_BODY}; font-size: 0.82rem; font-weight: 600;
  transition: all 0.2s;
`;

const RuleList = styled.div`
  display: flex; flex-direction: column; gap: 8px;
`;

const RuleItem = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(255,255,255,0.4);
  border: 1px solid ${({ $active }) => $active ? 'rgba(26,26,26,0.15)' : 'rgba(26,26,26,0.08)'};
  border-radius: 0;
  padding: 10px 14px;
  font-size: 0.85rem;
  color: ${({ $active }) => $active ? INK : 'rgba(26,26,26,0.6)'};
  font-weight: ${({ $active }) => $active ? 400 : 600};
  opacity: ${({ $active }) => $active ? 1 : 0.6};
`;
