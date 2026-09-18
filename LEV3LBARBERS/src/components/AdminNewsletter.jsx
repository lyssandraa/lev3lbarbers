import React, { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../utils/api";
import ConfirmModal from "../modals/ConfirmModal";

const INK = "#1a1a1a";
const RED = "#C41E3A";

const AdminNewsletter = () => {
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");
  const [count,   setCount]     = useState(null);
  const [sending, setSending]   = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result,  setResult]    = useState("");

  useEffect(() => {
    api.get("/newsletter/subscribers")
      .then(res => setCount(res.data.count))
      .catch(() => setCount(null));
  }, []);

  const send = async () => {
    setConfirming(false);
    setSending(true);
    setResult("");
    try {
      const res = await api.post("/newsletter/send", { subject: subject.trim(), message: message.trim() });
      setResult(res.data.message);
      setSubject("");
      setMessage("");
    } catch (err) {
      setResult(err.response?.data?.message || "Failed to send newsletter.");
    } finally {
      setSending(false);
    }
  };

  const canSend = subject.trim() && message.trim() && !sending;

  return (
    <FormCard>
      <PanelTitle>Newsletter</PanelTitle>

      <SubscriberLine>
        {count === null ? "…" : count} subscriber{count === 1 ? "" : "s"} currently opted in
      </SubscriberLine>

      <Label>
        Subject
        <Input
          placeholder="e.g. New Autumn Offers at LEV3L"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </Label>

      <Label>
        Message
        <Textarea
          rows={10}
          placeholder="Write your update here. Plain text — line breaks are kept, no other formatting."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Label>

      <Hint>Every email includes an unsubscribe link automatically — you don't need to add one.</Hint>

      {result && <ResultMsg>{result}</ResultMsg>}

      <SendButton onClick={() => setConfirming(true)} disabled={!canSend}>
        {sending ? "Sending…" : `Send to ${count ?? "…"} Subscriber${count === 1 ? "" : "s"}`}
      </SendButton>

      {confirming && (
        <ConfirmModal
          message={`Send "${subject.trim()}" to ${count ?? 0} subscriber${count === 1 ? "" : "s"}? This can't be undone.`}
          onCancel={() => setConfirming(false)}
          onConfirm={send}
        />
      )}
    </FormCard>
  );
};

export default AdminNewsletter;

/* --- Styled Components --- */

const FormCard = styled.div`
  background: rgba(255, 255, 255, 0.55);
  padding: 2rem;
  border: 1px solid rgba(26, 26, 26, 0.1);
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 600px;
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

const SubscriberLine = styled.p`
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(26, 26, 26, 0.55);
  margin: 0 0 1.5rem;
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

const Hint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.76rem;
  color: rgba(26, 26, 26, 0.5);
  margin: -0.5rem 0 1.2rem;
`;

const ResultMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${INK};
  background: rgba(26, 26, 26, 0.05);
  padding: 0.7rem 1rem;
  margin-bottom: 1rem;
`;

const SendButton = styled.button`
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
  transition: background 0.2s, transform 0.1s;
  &:hover:not(:disabled) { background: #a51830; transform: scale(1.01); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
