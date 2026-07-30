import React, { useEffect, useState, Suspense, lazy } from 'react';
import styled from 'styled-components';
import api from '../utils/api';

// Lazy-loaded: Tiptap is sizeable and only needed on this admin screen, not by
// every visitor of the site.
const RichTextEditor = lazy(() => import('../common/RichTextEditor'));

const INK = '#1a1a1a';
const RED = '#C41E3A';

/**
 * Shared admin editor for simple single-document content (General Terms,
 * Privacy Notice) — same shape as AdminTerms.jsx minus the reward-specific
 * "Active Promotion" toggle.
 */
const AdminLegalDocument = ({ title, endpoint, dataKey, infoText, placeholder }) => {
  const [content, setContent] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => { fetchDoc(); }, [endpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDoc = async () => {
    try {
      const res = await api.get(endpoint);
      setContent(res.data[dataKey]?.content || '');
    } catch { setError('Failed to load.'); }
  };

  const handleSave = async () => {
    setSaving(true); setMsg(''); setError('');
    try {
      await api.put(endpoint, { content });
      setMsg('Saved.');
      setTimeout(() => setMsg(''), 3000);
    } catch { setError('Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <FormCard>
      <PanelTitle>{title}</PanelTitle>
      {infoText && <InfoBox>{infoText}</InfoBox>}

      <EditorWrap>
        <Suspense fallback={<EditorLoading>Loading editor…</EditorLoading>}>
          <RichTextEditor content={content} onChange={setContent} placeholder={placeholder} />
        </Suspense>
      </EditorWrap>

      {msg   && <StatusMsg $ok>{msg}</StatusMsg>}
      {error && <StatusMsg>{error}</StatusMsg>}

      <SaveButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </SaveButton>
    </FormCard>
  );
};

export default AdminLegalDocument;

/* ─────────── Styles ─────────── */

const FormCard = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 680px;
  margin: 0 auto 2rem;
`;

const PanelTitle = styled.h2`
  text-align: center;
  margin-bottom: 0.9rem;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  letter-spacing: 1px;
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
  margin-bottom: 1.2rem;
`;

const EditorWrap = styled.div`
  margin-bottom: 0.8rem;
`;

const EditorLoading = styled.div`
  padding: 2rem; text-align: center;
  border: 1px solid rgba(26,26,26,0.15);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  color: rgba(26,26,26,0.5);
`;

const StatusMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ $ok }) => $ok ? '#2e7d32' : '#c62828'};
  margin: 0 0 0.5rem;
  text-align: center;
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  border-radius: 0;
  border: none;
  cursor: pointer;
  background: ${RED};
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: #a8182f; }
  &:disabled { opacity: 0.5; cursor: default; }
`;
