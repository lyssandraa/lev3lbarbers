import React, { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../utils/api";

const INK = "#1a1a1a";
const RED = "#C41E3A";
const GOLD = "#c8a84b";

// Mirrors the app's WeeklyPrizeSection.jsx — same /scores/prize endpoints,
// same "only touch expiry if a fresh days value was entered" save logic.
const AdminWeeklyPrize = () => {
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [prize,     setPrize]     = useState("");
  const [desc,      setDesc]      = useState("");
  const [expiresAt, setExpiresAt] = useState(null);
  const [daysInput, setDaysInput] = useState("");
  const [msg,       setMsg]       = useState("");
  const [error,     setError]     = useState("");

  useEffect(() => {
    api.get("/scores/prize")
      .then(res => {
        setPrize(res.data.prize || "");
        setDesc(res.data.description || "");
        setExpiresAt(res.data.expiresAt || null);
      })
      .catch(() => setError("Could not load prize."))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg(""); setError("");
    try {
      const days = parseInt(daysInput, 10);
      const body = { prize: prize.trim(), description: desc.trim() || null };
      if (daysInput.trim() !== "") {
        body.expiresAt = Number.isFinite(days) && days > 0
          ? new Date(Date.now() + days * 86400000).toISOString()
          : null;
      } else {
        body.expiresAt = expiresAt;
      }
      const res = await api.put("/scores/prize", body);
      setExpiresAt(res.data.expiresAt || null);
      setDaysInput("");
      setMsg("Saved.");
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setError("Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const clearExpiry = async () => {
    setSaving(true); setError("");
    try {
      const res = await api.put("/scores/prize", { prize: prize.trim(), description: desc.trim() || null, expiresAt: null });
      setExpiresAt(res.data.expiresAt || null);
      setDaysInput("");
    } catch {
      setError("Could not clear expiration.");
    } finally {
      setSaving(false);
    }
  };

  const daysUntil = expiresAt ? Math.ceil((new Date(expiresAt) - Date.now()) / 86400000) : null;

  if (loading) return <FormCard><PanelTitle>Weekly Game Prize</PanelTitle></FormCard>;

  return (
    <FormCard>
      <PanelTitle>Weekly Game Prize</PanelTitle>
      <InfoBox>
        Whatever you write here appears on the app's Play screen as the weekly prize,
        and is included in the winner's congratulations email every Monday.
      </InfoBox>

      <Label>
        Prize this week
        <Input
          maxLength={80}
          placeholder="e.g. Free Haircut"
          value={prize}
          onChange={(e) => setPrize(e.target.value)}
        />
      </Label>

      <Label>
        Description (optional)
        <Textarea
          rows={3}
          maxLength={200}
          placeholder="e.g. Redeem at the counter — valid for one visit"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </Label>

      <Label>Expiration (optional)</Label>
      <ExpiryStatus>
        {expiresAt
          ? daysUntil > 0
            ? `Currently expires in ${daysUntil} day${daysUntil === 1 ? "" : "s"} (${new Date(expiresAt).toLocaleDateString()})`
            : "Already expired"
          : "No expiration set — runs on the normal weekly cycle only"}
      </ExpiryStatus>
      <FieldRow>
        <Input
          type="number"
          min="1"
          style={{ width: 100 }}
          placeholder="e.g. 7"
          value={daysInput}
          onChange={(e) => setDaysInput(e.target.value)}
        />
        <Unit>days from now</Unit>
      </FieldRow>
      {!!expiresAt && (
        <ClearLink onClick={clearExpiry} disabled={saving}>Clear expiration</ClearLink>
      )}

      <PreviewCard>
        <PreviewTitle>Weekly Winner Prize</PreviewTitle>
        <PreviewSub>
          {prize.trim() ? `Participate to win: ${prize.trim()}` : "The top player each Sunday earns a reward. Claim in store."}
        </PreviewSub>
      </PreviewCard>
      <PreviewHint>↑ Preview of Play screen card</PreviewHint>

      {msg && <StatusMsg $ok>{msg}</StatusMsg>}
      {error && <StatusMsg>{error}</StatusMsg>}

      <SaveButton onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save Prize"}
      </SaveButton>
    </FormCard>
  );
};

export default AdminWeeklyPrize;

/* --- Styled Components --- */

const FormCard = styled.div`
  background: rgba(255, 255, 255, 0.55);
  padding: 2rem;
  border: 1px solid rgba(26, 26, 26, 0.1);
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 560px;
  margin: 0 auto 2rem auto;
`;

const PanelTitle = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.6rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${INK};
`;

const InfoBox = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.81rem;
  font-weight: 600;
  color: rgba(26,26,26,0.6);
  background: rgba(255,255,255,0.5);
  border-left: 2px solid ${RED};
  padding: 0.65rem 0.9rem;
  line-height: 1.55;
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  color: ${RED};
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const fieldStyles = `
  margin-top: 0.5rem;
  padding: 0.6rem 0.8rem;
  border-radius: 0;
  border: 1px solid rgba(26, 26, 26, 0.15);
  background: #ffffff;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.92rem;
  outline: none;
`;

const Input = styled.input`
  ${fieldStyles}
  &:focus { border-color: ${RED}; }
  &::placeholder { color: rgba(26, 26, 26, 0.35); }
`;

const Textarea = styled.textarea`
  ${fieldStyles}
  resize: vertical;
  line-height: 1.6;
  &:focus { border-color: ${RED}; }
  &::placeholder { color: rgba(26, 26, 26, 0.35); }
`;

const ExpiryStatus = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  color: rgba(26,26,26,0.6);
  margin: -0.5rem 0 0.6rem;
`;

const FieldRow = styled.div`display: flex; align-items: center; gap: 0.6rem;`;

const Unit = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  color: rgba(26,26,26,0.5);
`;

const ClearLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin-top: 0.6rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${RED};
  cursor: pointer;
  text-decoration: underline;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const PreviewCard = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255,255,255,0.6);
  border: 1px solid ${GOLD};
`;

const PreviewTitle = styled.p`
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-size: 0.85rem;
  color: ${GOLD};
  margin: 0 0 0.3rem;
`;

const PreviewSub = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  color: rgba(26,26,26,0.7);
  margin: 0;
  line-height: 1.4;
`;

const PreviewHint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem;
  color: rgba(26,26,26,0.45);
  margin: 0.4rem 0 0;
`;

const StatusMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ $ok }) => $ok ? '#2e7d32' : '#c62828'};
  margin: 1rem 0 0;
  text-align: center;
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 0.85rem;
  background: ${RED};
  color: #fff;
  border: none;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-top: 1rem;
  transition: background 0.2s, transform 0.1s;
  &:hover:not(:disabled) { background: #a51830; transform: scale(1.01); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
