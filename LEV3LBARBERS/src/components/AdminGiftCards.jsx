import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import api from '../utils/api';
import { GiftIcon, PlusIcon } from '../common/icons';

const CREAM = '#f4f0e8';
const INK = '#1a1a1a';
const RED = '#C41E3A';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (s) => { const d = new Date(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

const AdminGiftCards = () => {
  const [tab,    setTab]    = useState('denominations');
  const [denoms, setDenoms] = useState([]);
  const [codes,  setCodes]  = useState([]);
  const [value,  setValue]  = useState('');
  const [label,  setLabel]  = useState('');
  const [saving, setSaving] = useState(false);
  const [voiding, setVoiding] = useState(null);

  // Verify & redeem state
  const [lookupInput,  setLookupInput]  = useState('');
  const [lookedUp,     setLookedUp]     = useState(null); // giftCard object from lookup
  const [lookupErr,    setLookupErr]    = useState('');
  const [lookupLoading,setLookupLoading]= useState(false);
  const [redeemAmt,    setRedeemAmt]    = useState('');
  const [redeemNote,   setRedeemNote]   = useState('');
  const [redeeming,    setRedeeming]    = useState(false);
  const [redeemSuccess,setRedeemSuccess]= useState(null);

  useEffect(() => {
    loadDenoms();
    loadCodes();
  }, []);

  const loadDenoms = async () => {
    try {
      const res = await api.get('/gift-cards/denominations/all');
      setDenoms(res.data.denominations || []);
    } catch { /* silent */ }
  };

  const loadCodes = async () => {
    try {
      const res = await api.get('/gift-cards/codes');
      setCodes(res.data.codes || []);
    } catch { /* silent */ }
  };

  const addDenom = async () => {
    if (!value || isNaN(parseFloat(value))) return alert('Enter a valid amount.');
    setSaving(true);
    try {
      await api.post('/gift-cards/denominations', { value: parseFloat(value), label: label.trim() || undefined });
      setValue(''); setLabel('');
      loadDenoms();
    } catch { alert('Failed to add denomination.'); }
    finally { setSaving(false); }
  };

  const toggleDenom = async (id, active) => {
    try {
      await api.put(`/gift-cards/denominations/${id}`, { active: !active });
      loadDenoms();
    } catch { alert('Failed to update.'); }
  };

  const deleteDenom = async (id) => {
    if (!confirm('Delete this denomination?')) return;
    try {
      await api.delete(`/gift-cards/denominations/${id}`);
      loadDenoms();
    } catch { alert('Failed to delete.'); }
  };

  const voidCode = async (id) => {
    if (!confirm('Void this gift card code? This cannot be undone.')) return;
    setVoiding(id);
    try {
      await api.put(`/gift-cards/codes/${id}/void`);
      loadCodes();
    } catch { alert('Failed to void code.'); }
    finally { setVoiding(null); }
  };

  const handleLookup = async () => {
    if (!lookupInput.trim()) return;
    setLookupLoading(true); setLookupErr(''); setLookedUp(null); setRedeemSuccess(null);
    try {
      const res = await api.get(`/gift-cards/codes/lookup?code=${encodeURIComponent(lookupInput.trim())}`);
      setLookedUp(res.data.giftCard);
      setRedeemAmt('');
      setRedeemNote('');
    } catch (err) {
      setLookupErr(err.response?.data?.message || 'Code not found.');
    } finally { setLookupLoading(false); }
  };

  const handleRedeem = async () => {
    if (!lookedUp || !redeemAmt) return;
    setRedeeming(true); setRedeemSuccess(null);
    try {
      const res = await api.post('/gift-cards/codes/redeem', {
        code:   lookedUp.code,
        amount: parseFloat(redeemAmt),
        note:   redeemNote.trim() || undefined,
      });
      setRedeemSuccess(res.data);
      setLookedUp(res.data.giftCard);
      setRedeemAmt('');
      setRedeemNote('');
      loadCodes();
    } catch (err) {
      alert(err.response?.data?.message || 'Redemption failed.');
    } finally { setRedeeming(false); }
  };

  return (
    <Card>
      <TitleRow>
        <GiftIcon size={22} />
        <PanelTitle>Gift Cards</PanelTitle>
      </TitleRow>

      <TabBar>
        <Tab $active={tab === 'denominations'} onClick={() => setTab('denominations')}>Denominations</Tab>
        <Tab $active={tab === 'codes'}         onClick={() => setTab('codes')}>Issued Codes ({codes.length})</Tab>
        <Tab $active={tab === 'verify'}        onClick={() => setTab('verify')}>Verify &amp; Redeem</Tab>
      </TabBar>

      {/* ── Denominations ── */}
      {tab === 'denominations' && (
        <>
          <AddRow>
            <ValueInput
              type="number" min="1" step="0.01"
              placeholder="£ Amount (e.g. 25)"
              value={value}
              onChange={e => setValue(e.target.value)}
            />
            <LabelInput
              placeholder="Label (optional — e.g. Standard Gift Card)"
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
            <AddBtn onClick={addDenom} disabled={saving}>
              {saving ? '…' : <><PlusIcon size={14} /> Add</>}
            </AddBtn>
          </AddRow>

          {denoms.length === 0 ? (
            <EmptyMsg>No denominations yet. Add one above.</EmptyMsg>
          ) : (
            <DenomList>
              {denoms.map(d => (
                <DenomRow key={d.id} $inactive={!d.active}>
                  <DenomValue>£{d.value.toFixed(2)}</DenomValue>
                  {d.label && <DenomLabel>{d.label}</DenomLabel>}
                  <DenomActions>
                    <ToggleBtn $active={d.active} onClick={() => toggleDenom(d.id, d.active)}>
                      {d.active ? 'Active' : 'Hidden'}
                    </ToggleBtn>
                    <DelBtn onClick={() => deleteDenom(d.id)}>Delete</DelBtn>
                  </DenomActions>
                </DenomRow>
              ))}
            </DenomList>
          )}
        </>
      )}

      {/* ── Verify & Redeem ── */}
      {tab === 'verify' && (
        <VerifyPanel>
          <VerifyNote>Enter the customer's gift card code to check the balance and redeem any amount.</VerifyNote>

          <LookupRow>
            <CodeInputLarge
              value={lookupInput}
              onChange={e => setLookupInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              placeholder="LEV3L-XXXX-XXXX-XXXX"
              spellCheck={false}
            />
            <LookupBtn onClick={handleLookup} disabled={lookupLoading || !lookupInput.trim()}>
              {lookupLoading ? '…' : 'Look Up'}
            </LookupBtn>
          </LookupRow>

          {lookupErr && <LookupError>{lookupErr}</LookupError>}

          {lookedUp && (
            <LookedUpCard $voided={!lookedUp.active}>
              <LookedUpTop>
                <LookedUpCode>{lookedUp.code}</LookedUpCode>
                <LookedUpStatus $active={lookedUp.active}>
                  {lookedUp.active ? '✓ Active' : '✗ Voided'}
                </LookedUpStatus>
              </LookedUpTop>

              <BalanceRow>
                <BalanceBlock>
                  <BalanceLabel>FACE VALUE</BalanceLabel>
                  <BalanceAmt>£{lookedUp.value.toFixed(2)}</BalanceAmt>
                </BalanceBlock>
                <BalanceDivider />
                <BalanceBlock>
                  <BalanceLabel>REMAINING</BalanceLabel>
                  <BalanceAmt $highlight>£{lookedUp.balance.toFixed(2)}</BalanceAmt>
                </BalanceBlock>
              </BalanceRow>

              {lookedUp.recipientName && (
                <RecipientInfo>Issued to: {lookedUp.recipientName}{lookedUp.recipientEmail ? ` · ${lookedUp.recipientEmail}` : ''}</RecipientInfo>
              )}

              {/* Redemption history */}
              {lookedUp.redemptions?.length > 0 && (
                <RedemptionHistory>
                  <HistoryLabel>REDEMPTION HISTORY</HistoryLabel>
                  {lookedUp.redemptions.map(r => (
                    <HistoryRow key={r.id}>
                      <span>{fmtDate(r.redeemedAt)}</span>
                      <span>−£{r.amount.toFixed(2)}</span>
                      {r.note && <HistoryNote>{r.note}</HistoryNote>}
                    </HistoryRow>
                  ))}
                </RedemptionHistory>
              )}

              {/* Redeem form — only if still active and has balance */}
              {lookedUp.active && lookedUp.balance > 0 && (
                <RedeemForm>
                  <RedeemLabel>REDEEM AMOUNT</RedeemLabel>
                  <RedeemRow>
                    <RedeemInput
                      type="number" min="0.01" step="0.01"
                      max={lookedUp.balance}
                      placeholder={`Max £${lookedUp.balance.toFixed(2)}`}
                      value={redeemAmt}
                      onChange={e => setRedeemAmt(e.target.value)}
                    />
                    <RedeemNoteInput
                      placeholder="Note (optional, e.g. 'Skin fade')"
                      value={redeemNote}
                      onChange={e => setRedeemNote(e.target.value)}
                    />
                    <RedeemBtn
                      onClick={handleRedeem}
                      disabled={redeeming || !redeemAmt || parseFloat(redeemAmt) <= 0}
                    >
                      {redeeming ? '…' : 'Redeem'}
                    </RedeemBtn>
                  </RedeemRow>
                </RedeemForm>
              )}

              {redeemSuccess && (
                <RedeemSuccessMsg>
                  ✓ £{redeemSuccess.redemption.amount.toFixed(2)} redeemed.
                  Remaining balance: £{redeemSuccess.remainingBalance.toFixed(2)}
                  {redeemSuccess.remainingBalance === 0 && ' — card fully spent and voided.'}
                </RedeemSuccessMsg>
              )}
            </LookedUpCard>
          )}
        </VerifyPanel>
      )}

      {/* ── Issued codes ── */}
      {tab === 'codes' && (
        codes.length === 0 ? (
          <EmptyMsg>No gift cards have been issued yet.</EmptyMsg>
        ) : (
          <CodeList>
            {codes.map(gc => (
              <CodeRow key={gc.id} $voided={!gc.active}>
                <CodeTop>
                  <CodeStr>{gc.code}</CodeStr>
                  <CodeStatus $active={gc.active}>{gc.active ? '✓ Active' : '✗ Voided'}</CodeStatus>
                </CodeTop>
                <CodeMeta>
                  <span>£{gc.value} face value</span>
                  <span>£{gc.balance} remaining</span>
                  <span>Issued {fmtDate(gc.issuedAt)}</span>
                  {gc.order && <span>Order #{gc.order.id} · {gc.order.customerName}</span>}
                </CodeMeta>
                {gc.active && (
                  <VoidBtn
                    disabled={voiding === gc.id}
                    onClick={() => voidCode(gc.id)}
                  >
                    {voiding === gc.id ? 'Voiding…' : 'Void Code'}
                  </VoidBtn>
                )}
              </CodeRow>
            ))}
          </CodeList>
        )
      )}
    </Card>
  );
};

export default AdminGiftCards;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const Card = styled.div`
  background: rgba(255,255,255,0.55); padding: 2rem; border-radius: 0;
  backdrop-filter: blur(10px); border: 1px solid rgba(26,26,26,0.1);
  width: 100%; max-width: 640px; margin: 0 auto 2rem;
`;
const TitleRow = styled.div`display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.2rem; color: ${INK};`;
const PanelTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; letter-spacing: 2px;
  text-transform: uppercase; color: ${INK}; margin: 0;
`;

const TabBar = styled.div`
  display: flex; gap: 0; border-bottom: 1px solid rgba(26,26,26,0.1); margin-bottom: 1.4rem;
  overflow-x: auto; -webkit-overflow-scrolling: touch;
`;
const Tab = styled.button`
  background: none; border: none; border-bottom: 2px solid ${({ $active }) => $active ? RED : 'transparent'};
  color: ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.55)'};
  padding: 0.6rem 1rem 0.5rem; cursor: pointer; font-family: 'Montserrat', sans-serif;
  font-size: 0.84rem; font-weight: 700; white-space: nowrap; flex-shrink: 0;
  letter-spacing: 1px; margin-bottom: -1px; transition: color 0.18s, border-color 0.18s;
`;

const inputBase = css`
  padding: 0.5rem 0.75rem; border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff; color: ${INK};
  font-size: 0.88rem; font-family: 'Montserrat', sans-serif; outline: none;
  transition: border-color 0.18s;
  &:focus { border-color: ${RED}; }
  &::placeholder { color: rgba(26,26,26,0.35); }
`;
const ValueInput  = styled.input`${inputBase} width: 110px; flex-shrink: 0;`;
const LabelInput  = styled.input`${inputBase} flex: 1; min-width: 0;`;
const AddRow = styled.div`display: flex; gap: 0.6rem; align-items: stretch; margin-bottom: 1.2rem; flex-wrap: wrap;`;
const AddBtn = styled.button`
  background: ${RED}; border: none; color: #fff;
  padding: 0.5rem 1rem; border-radius: 0; cursor: pointer;
  font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.88rem; white-space: nowrap;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #a51830; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const EmptyMsg = styled.p`color: rgba(26,26,26,0.6); font-weight: 600; font-style: italic; font-size: 0.9rem; text-align: center; padding: 2rem 0;`;

const DenomList = styled.div`display: flex; flex-direction: column; gap: 0.5rem;`;
const DenomRow = styled.div`
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
  background: rgba(255,255,255,${({ $inactive }) => $inactive ? '0.35' : '0.55'});
  border: 1px solid rgba(26,26,26,0.1); border-radius: 0; padding: 0.7rem 0.9rem;
  opacity: ${({ $inactive }) => $inactive ? 0.55 : 1};
`;
const DenomValue = styled.span`font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; letter-spacing: 2px; color: ${RED};`;
const DenomLabel = styled.span`flex: 1; font-size: 0.82rem; font-weight: 600; color: rgba(26,26,26,0.6);`;
const DenomActions = styled.div`display: flex; gap: 0.4rem; margin-left: auto;`;

const btn = css`
  padding: 0.28rem 0.65rem; border-radius: 0; cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem; font-weight: 700; border: 1px solid; transition: all 0.15s;
`;
const ToggleBtn = styled.button`
  ${btn}
  background: ${({ $active }) => $active ? 'rgba(76,175,80,0.12)' : 'rgba(26,26,26,0.05)'};
  border-color: ${({ $active }) => $active ? 'rgba(76,175,80,0.35)' : 'rgba(26,26,26,0.15)'};
  color: ${({ $active }) => $active ? '#2e7d32' : 'rgba(26,26,26,0.5)'};
`;
const DelBtn = styled.button`
  ${btn}
  background: transparent; border-color: rgba(196,30,58,0.4); color: ${RED};
  &:hover { background: rgba(196,30,58,0.08); }
`;

const CodeList = styled.div`display: flex; flex-direction: column; gap: 0.65rem;`;
const CodeRow = styled.div`
  background: rgba(255,255,255,${({ $voided }) => $voided ? '0.35' : '0.55'});
  border: 1px solid rgba(26,26,26,0.1); border-radius: 0;
  padding: 0.85rem 1rem; opacity: ${({ $voided }) => $voided ? 0.55 : 1};
`;
const CodeTop = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;`;
const CodeStr = styled.span`font-family: monospace; font-size: 0.95rem; color: ${INK}; font-weight: 700; letter-spacing: 2px;`;
const CodeStatus = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 1px;
  color: ${({ $active }) => $active ? '#2e7d32' : 'rgba(26,26,26,0.4)'};
`;
const CodeMeta = styled.div`
  display: flex; gap: 0.85rem; flex-wrap: wrap;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.74rem; font-weight: 600; color: rgba(26,26,26,0.55); margin-bottom: 0.6rem;
`;
const VoidBtn = styled.button`
  ${btn}
  background: transparent; border-color: rgba(196,30,58,0.4); color: ${RED};
  &:hover:not(:disabled) { background: rgba(196,30,58,0.08); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/* ─── Verify & Redeem ─── */
const VerifyPanel = styled.div``;
const VerifyNote = styled.p`font-size: 0.82rem; font-weight: 600; color: rgba(26,26,26,0.6); margin: 0 0 1rem; line-height: 1.55;`;
const LookupRow = styled.div`display: flex; gap: 0.5rem; margin-bottom: 0.6rem;`;
const CodeInputLarge = styled.input`
  ${inputBase}
  flex: 1; font-family: monospace; font-size: 1rem; letter-spacing: 3px; text-transform: uppercase;
`;
const LookupBtn = styled.button`
  background: ${RED}; border: none; color: #fff;
  padding: 0.5rem 1.1rem; border-radius: 0; cursor: pointer;
  font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.88rem; white-space: nowrap;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #a51830; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const LookupError = styled.p`color: ${RED}; font-weight: 700; font-size: 0.82rem; margin: 0 0 0.75rem;`;

const LookedUpCard = styled.div`
  background: rgba(255,255,255,${({ $voided }) => $voided ? '0.35' : '0.6'});
  border: 1px solid rgba(26,26,26,${({ $voided }) => $voided ? '0.08' : '0.12'});
  border-radius: 0; padding: 1.1rem; margin-top: 0.5rem;
  opacity: ${({ $voided }) => $voided ? 0.65 : 1};
`;
const LookedUpTop = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.9rem;`;
const LookedUpCode = styled.span`font-family: monospace; font-size: 1rem; color: ${INK}; font-weight: 700; letter-spacing: 2.5px;`;
const LookedUpStatus = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 1px;
  color: ${({ $active }) => $active ? '#2e7d32' : 'rgba(26,26,26,0.4)'};
`;
const BalanceRow = styled.div`display: flex; align-items: stretch; gap: 0; margin-bottom: 0.9rem;`;
const BalanceBlock = styled.div`flex: 1; text-align: center;`;
const BalanceDivider = styled.div`width: 1px; background: rgba(26,26,26,0.1); margin: 0 0.6rem;`;
const BalanceLabel = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 3px;
  color: rgba(26,26,26,0.5); margin: 0 0 0.25rem; text-transform: uppercase;
`;
const BalanceAmt = styled.p`
  font-family: 'Bebas Neue', sans-serif; font-size: 2rem; letter-spacing: 2px; margin: 0;
  color: ${({ $highlight }) => $highlight ? RED : 'rgba(26,26,26,0.6)'};
`;
const RecipientInfo = styled.p`font-size: 0.75rem; font-weight: 600; color: rgba(26,26,26,0.55); margin: 0 0 0.75rem;`;

const RedemptionHistory = styled.div`margin-bottom: 0.9rem; padding-top: 0.75rem; border-top: 1px solid rgba(26,26,26,0.1);`;
const HistoryLabel = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.65rem; font-weight: 700; letter-spacing: 3px;
  color: rgba(26,26,26,0.45); margin: 0 0 0.45rem; text-transform: uppercase;
`;
const HistoryRow = styled.div`
  display: flex; gap: 0.75rem; align-items: center; font-size: 0.78rem; font-weight: 600;
  color: rgba(26,26,26,0.6); padding: 0.2rem 0;
  span:nth-child(2) { color: ${RED}; font-weight: 700; }
`;
const HistoryNote = styled.span`color: rgba(26,26,26,0.45) !important; font-size: 0.73rem; font-weight: 600; font-style: italic;`;

const RedeemForm = styled.div`padding-top: 0.85rem; border-top: 1px solid rgba(26,26,26,0.1);`;
const RedeemLabel = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 3px;
  text-transform: uppercase; color: ${RED}; margin: 0 0 0.5rem;
`;
const RedeemRow = styled.div`display: flex; gap: 0.5rem; flex-wrap: wrap;`;
const RedeemInput = styled.input`
  ${inputBase} width: 110px; flex-shrink: 0; font-weight: 700; text-align: center;
`;
const RedeemNoteInput = styled.input`${inputBase} flex: 1; min-width: 120px;`;
const RedeemBtn = styled.button`
  background: ${RED}; border: none; color: #fff;
  padding: 0.5rem 1.1rem; border-radius: 0; cursor: pointer;
  font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.88rem; white-space: nowrap;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #a51830; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const RedeemSuccessMsg = styled.p`
  margin: 0.75rem 0 0; font-size: 0.82rem; font-weight: 700;
  color: #2e7d32; background: rgba(76,175,80,0.1);
  border: 1px solid rgba(76,175,80,0.3); border-radius: 0; padding: 0.5rem 0.75rem;
`;
