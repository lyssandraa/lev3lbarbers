import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import api from '../utils/api';
import { TagIcon, PlusIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (s) => { const d = new Date(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

const empty = () => ({ code: '', type: 'PERCENT', value: '', description: '', maxUses: '', minOrderAmount: '', expiresAt: '', bannerMessage: '' });

const AdminPromos = () => {
  const [promos,   setPromos]   = useState([]);
  const [form,     setForm]     = useState(empty());
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const r = await api.get('/promo'); setPromos(r.data.promos || []); } catch { /* silent */ }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.code.trim()) return alert('Code is required.');
    if (!form.value)       return alert('Value is required.');
    setSaving(true);
    try {
      await api.post('/promo', {
        code:           form.code.trim(),
        type:           form.type,
        value:          parseFloat(form.value),
        description:    form.description.trim() || undefined,
        maxUses:        form.maxUses      ? parseInt(form.maxUses, 10)          : undefined,
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount)  : undefined,
        expiresAt:      form.expiresAt    || undefined,
        bannerMessage:  form.bannerMessage.trim() || undefined,
      });
      setForm(empty());
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed to create code.'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (promo) => {
    try { await api.put(`/promo/${promo.id}`, { active: !promo.active }); load(); }
    catch { alert('Failed to update.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo code?')) return;
    setDeleting(id);
    try { await api.delete(`/promo/${id}`); load(); }
    catch { alert('Failed to delete.'); }
    finally { setDeleting(null); }
  };

  return (
    <Card>
      <PanelTitle><TagIcon size={20} /> Promo Codes</PanelTitle>

      {/* Create form */}
      <CreateSection>
        <SectionLabel>CREATE NEW CODE</SectionLabel>
        <FormGrid>
          <FullField>
            <FLabel>Code *</FLabel>
            <FInput
              value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER20"
              style={{ fontFamily: 'monospace', letterSpacing: '2px' }}
            />
          </FullField>

          <HalfField>
            <FLabel>Type *</FLabel>
            <FSelect value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="PERCENT">% Percentage off</option>
              <option value="FIXED">£ Fixed amount off</option>
            </FSelect>
          </HalfField>

          <HalfField>
            <FLabel>{form.type === 'PERCENT' ? 'Percentage (%)' : 'Amount (£)'} *</FLabel>
            <FInput
              type="number" min="0.01" step={form.type === 'PERCENT' ? '1' : '0.01'}
              placeholder={form.type === 'PERCENT' ? '10' : '5.00'}
              value={form.value}
              onChange={e => set('value', e.target.value)}
            />
          </HalfField>

          <HalfField>
            <FLabel>Max Uses <Hint>blank = unlimited</Hint></FLabel>
            <FInput type="number" min="1" placeholder="—" value={form.maxUses} onChange={e => set('maxUses', e.target.value)} />
          </HalfField>

          <HalfField>
            <FLabel>Min Order (£) <Hint>optional</Hint></FLabel>
            <FInput type="number" min="0" step="0.01" placeholder="—" value={form.minOrderAmount} onChange={e => set('minOrderAmount', e.target.value)} />
          </HalfField>

          <HalfField>
            <FLabel>Expiry Date <Hint>optional</Hint></FLabel>
            <FInput type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
          </HalfField>

          <FullField>
            <FLabel>Description <Hint>shown to customer when applied</Hint></FLabel>
            <FInput placeholder="e.g. 20% off summer promotion" value={form.description} onChange={e => set('description', e.target.value)} />
          </FullField>

          <FullField>
            <FLabel>Banner Announcement <Hint>optional — auto-rotates into the site's header banner while this code is live, disappears when it's paused, deleted, expired, or used up</Hint></FLabel>
            <FInput placeholder="e.g. Use code SUMMER20 for 20% off this week!" value={form.bannerMessage} onChange={e => set('bannerMessage', e.target.value)} />
          </FullField>
        </FormGrid>
        <CreateBtn onClick={handleCreate} disabled={saving}>
          {saving ? 'Creating…' : <><PlusIcon size={14} /> Create Code</>}
        </CreateBtn>
      </CreateSection>

      {/* Codes list */}
      <SectionLabel style={{ marginBottom: '0.75rem' }}>ALL CODES ({promos.length})</SectionLabel>
      {promos.length === 0 ? (
        <EmptyMsg>No promo codes yet.</EmptyMsg>
      ) : (
        <PromoList>
          {promos.map(p => (
            <PromoRow key={p.id} $inactive={!p.active}>
              <PromoLeft>
                <PromoCode>{p.code}</PromoCode>
                <PromoValue>
                  {p.type === 'PERCENT' ? `${p.value}% off` : `£${p.value.toFixed(2)} off`}
                  {p.minOrderAmount ? ` · min £${p.minOrderAmount.toFixed(2)}` : ''}
                </PromoValue>
                {p.description && <PromoDesc>{p.description}</PromoDesc>}
                {p.bannerMessage && (
                  <BannerTag $live={p.active}>
                    {p.active ? '📣 Live on site banner' : '📣 Banner set (paused while inactive)'}: "{p.bannerMessage}"
                  </BannerTag>
                )}
                <PromoMeta>
                  Used: {p.usedCount}{p.maxUses !== null ? ` / ${p.maxUses}` : ''}{' '}
                  {p.expiresAt && `· Expires ${fmtDate(p.expiresAt)}`}
                </PromoMeta>
              </PromoLeft>
              <PromoActions>
                <ToggleBtn $active={p.active} onClick={() => toggleActive(p)}>
                  {p.active ? 'Active' : 'Paused'}
                </ToggleBtn>
                <DelBtn disabled={deleting === p.id} onClick={() => handleDelete(p.id)}>
                  {deleting === p.id ? '…' : 'Delete'}
                </DelBtn>
              </PromoActions>
            </PromoRow>
          ))}
        </PromoList>
      )}
    </Card>
  );
};

export default AdminPromos;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const Card = styled.div`
  background: rgba(255,255,255,0.55); padding: 2rem; border-radius: 0;
  backdrop-filter: blur(10px); border: 1px solid rgba(26,26,26,0.1);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%; max-width: 680px; margin: 0 auto 2rem;
`;
const PanelTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; letter-spacing: 2px;
  text-transform: uppercase; color: ${INK}; margin: 0 0 1.5rem;
  display: flex; align-items: center; gap: 0.6rem;
`;
const SectionLabel = styled.p`font-family: 'Bebas Neue', sans-serif; font-size: 0.78rem; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: ${RED}; margin: 0 0 0.8rem;`;
const CreateSection = styled.div`margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(26,26,26,0.1);`;
const FormGrid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem 1rem; margin-bottom: 1rem; @media(max-width:520px){grid-template-columns:1fr;}`;
const FullField = styled.div`grid-column: 1 / -1; display: flex; flex-direction: column; gap: 0.3rem;`;
const HalfField = styled.div`display: flex; flex-direction: column; gap: 0.3rem;`;
const FLabel = styled.label`font-family: 'Montserrat', sans-serif; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(26,26,26,0.6);`;
const Hint = styled.span`color: rgba(26,26,26,0.45); text-transform: none; letter-spacing: 0; font-weight: 600; font-size: 0.72rem;`;
const inputStyle = css`
  padding: 0.5rem 0.75rem; border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15); background: #ffffff;
  color: ${INK}; font-size: 0.88rem; font-family: 'Montserrat', sans-serif; outline: none;
  transition: border-color 0.18s;
  &:focus { border-color: ${RED}; }
  &::placeholder { color: rgba(26,26,26,0.35); }
`;
const FInput  = styled.input`${inputStyle}`;
const FSelect = styled.select`${inputStyle} cursor: pointer; option { background: #ffffff; color: ${INK}; }`;
const CreateBtn = styled.button`
  background: ${RED}; border: none; color: #fff;
  padding: 0.6rem 1.3rem; border-radius: 0; cursor: pointer; font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1.5px; text-transform: uppercase; font-size: 0.9rem;
  display: inline-flex; align-items: center; gap: 0.45rem;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #a8172f; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const PromoList = styled.div`display: flex; flex-direction: column; gap: 0.6rem;`;
const PromoRow = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem;
  background: rgba(255,255,255,0.55); border: 1px solid rgba(26,26,26,0.1);
  border-radius: 0; padding: 0.85rem 1rem;
  opacity: ${({ $inactive }) => $inactive ? 0.55 : 1};
`;
const PromoLeft = styled.div`flex: 1; min-width: 0;`;
const PromoCode = styled.p`font-family: monospace; font-size: 1rem; font-weight: 700; color: ${INK}; letter-spacing: 2px; margin: 0 0 0.2rem;`;
const PromoValue = styled.p`font-family: 'Montserrat', sans-serif; font-size: 0.82rem; font-weight: 700; color: ${RED}; margin: 0 0 0.15rem;`;
const PromoDesc = styled.p`font-family: 'Montserrat', sans-serif; font-size: 0.76rem; font-weight: 600; color: rgba(26,26,26,0.6); margin: 0 0 0.15rem;`;
const PromoMeta = styled.p`font-family: 'Montserrat', sans-serif; font-size: 0.72rem; font-weight: 600; color: rgba(26,26,26,0.45); margin: 0;`;
const BannerTag = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.74rem; font-weight: 700;
  color: ${({ $live }) => $live ? '#2e7d32' : 'rgba(26,26,26,0.45)'};
  margin: 0 0 0.25rem;
`;
const PromoActions = styled.div`display: flex; flex-direction: column; gap: 0.35rem; flex-shrink: 0;`;
const btn = css`padding: 0.28rem 0.65rem; border-radius: 0; cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 0.76rem; font-weight: 700; border: 1px solid; transition: all 0.15s;`;
const ToggleBtn = styled.button`
  ${btn}
  background: ${({ $active }) => $active ? 'rgba(76,175,80,0.12)' : 'rgba(26,26,26,0.05)'};
  border-color: ${({ $active }) => $active ? 'rgba(76,175,80,0.35)' : 'rgba(26,26,26,0.15)'};
  color: ${({ $active }) => $active ? '#2e7d32' : 'rgba(26,26,26,0.5)'};
`;
const DelBtn = styled.button`
  ${btn}
  background: transparent; border-color: rgba(196,30,58,0.4); color: ${RED};
  &:hover:not(:disabled) { background: rgba(196,30,58,0.08); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const EmptyMsg = styled.p`font-family: 'Montserrat', sans-serif; color: rgba(26,26,26,0.5); font-weight: 600; font-style: italic; font-size: 0.88rem; text-align: center; padding: 1.5rem 0;`;
