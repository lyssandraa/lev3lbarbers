import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Seo from '../common/Seo';
import RichContent from '../common/RichContent';
import { BACKEND } from '../config';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';

// Standalone, directly-linkable version of the content Footer.jsx shows in a
// modal — needed as a real URL for things like the App Store Connect privacy
// policy field, which requires a link that opens straight to the policy.
const LegalPage = ({ endpoint, dataKey, title, emptyText }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND}${endpoint}`)
      .then(r => r.json())
      .then(data => setContent(data[dataKey]?.content || ''))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [endpoint, dataKey]);

  return (
    <PageWrap>
      <Seo title={title} />
      <Inner>
        <Title>{title}</Title>
        {loading ? <Loading>Loading…</Loading> : <RichContent html={content} emptyText={emptyText} />}
      </Inner>
    </PageWrap>
  );
};

export default LegalPage;

const PageWrap = styled.div`
  background: ${CREAM};
  min-height: 100vh;
  color: ${INK};
`;

const Inner = styled.div`
  max-width: 760px;
  margin: 0 auto;
  padding: 140px 24px 100px;
`;

const Title = styled.h1`
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: 1px;
  margin: 0 0 2rem;
`;

const Loading = styled.p`
  font-family: 'Montserrat', sans-serif;
  opacity: 0.5;
  font-style: italic;
`;
