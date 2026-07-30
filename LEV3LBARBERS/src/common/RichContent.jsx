import React from 'react';
import styled from 'styled-components';

/**
 * Renders admin-authored HTML (from RichTextEditor) with consistent typography.
 * Content is only ever written by an authenticated ADMIN, not end users, so
 * rendering it as HTML here is safe — it isn't user-generated content.
 */
const RichContent = ({ html, emptyText = 'Nothing published yet.' }) => {
  if (!html || !html.trim() || html === '<p></p>') {
    return <Empty>{emptyText}</Empty>;
  }
  return <Wrap dangerouslySetInnerHTML={{ __html: html }} />;
};

export default RichContent;

const Wrap = styled.div`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  line-height: 1.7;

  p { margin: 0 0 0.9em; }
  h3 { font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; margin: 1em 0 0.4em; font-size: 1.15rem; }
  ul, ol { padding-left: 1.4em; margin: 0 0 0.9em; }
  strong { font-weight: 800; }
  a { color: inherit; }
`;

const Empty = styled.p`
  opacity: 0.4;
  font-style: italic;
  font-family: 'Montserrat', sans-serif;
`;
