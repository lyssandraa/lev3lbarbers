import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Seo from '../common/Seo';
import api from '../utils/api';
import { PenIcon, TagIcon, MegaphoneIcon, NewsIcon } from '../common/icons';
import { useAuth } from '../context/AuthContext';
import AdminDrawer from '../common/AdminDrawer';
import AdminWhatsOn from '../components/AdminWhatsOn';

import { resolveImageUrl } from '../config';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const GOLD  = '#C4922A';
const EASE  = [0.22, 1, 0.36, 1];

const FILTERS = [
  { id: 'ALL',       label: 'ALL' },
  { id: 'ARTICLE',   label: 'ARTICLES' },
  { id: 'PROMOTION', label: 'PROMOTIONS' },
  { id: 'NEWS',      label: 'NEWS' },
];

const CAT = {
  ARTICLE:   { label: 'ARTICLE', color: INK,  Icon: PenIcon },
  PROMOTION: { label: 'PROMO',   color: RED,  Icon: TagIcon },
  NEWS:      { label: 'NEWS',    color: GOLD, Icon: MegaphoneIcon },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (str) => {
  const d = new Date(str);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const readingTime = (body) => {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const URGENT_MS = 24 * 60 * 60 * 1000;

/* "3d 4h left" / "5h 12m left" while there's no real urgency — but once
   under 24h, formatCountdown switches to an actual ticking "23:59:47"
   clock instead, which is a lot harder to scroll past than static text. */
const formatCountdown = (ms, urgent) => {
  const totalSeconds = Math.floor(ms / 1000);
  if (urgent) {
    const pad = (n) => String(n).padStart(2, '0');
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  const mins  = Math.floor(ms / 60000);
  const days  = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  if (days > 0)  return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

/* Ticks every 30s normally (cheap with a whole grid of these, and "3d 4h
   left" doesn't change second to second anyway) but switches to a real 1s
   tick once inside the urgent window, so the HH:MM:SS display above
   actually counts down live instead of just relabeling itself occasionally.
   Returns null once expiresAt has passed so the badge disappears rather
   than show a stale/negative countdown (the backend also auto-unpublishes
   expired posts, but this covers the gap before the next poll/reload). */
const useCountdown = (expiresAt) => {
  const [now, setNow] = useState(() => Date.now());
  const remaining = expiresAt ? new Date(expiresAt).getTime() - now : null;
  const urgent = remaining !== null && remaining > 0 && remaining < URGENT_MS;

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), urgent ? 1000 : 30000);
    return () => clearInterval(id);
  }, [expiresAt, urgent]);

  if (!expiresAt || remaining <= 0) return null;
  return { text: formatCountdown(remaining, urgent), urgent };
};

/* Lightweight body formatting: blank line = paragraph, "## " = heading,
   "- "/"• " = bullet list, "1. " = numbered list, **text** = bold. */
const parseBlocks = (body) => {
  if (!body) return [];
  const lines = body.split('\n');
  const blocks = [];
  let para = [];
  const flushPara = () => {
    if (para.length) { blocks.push({ type: 'p', text: para.join(' ').trim() }); para = []; }
  };

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) { flushPara(); i++; continue; }

    if (/^##\s+/.test(trimmed)) {
      flushPara();
      blocks.push({ type: 'h', text: trimmed.replace(/^##\s+/, '') });
      i++; continue;
    }

    if (/^[-•]\s+/.test(trimmed)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^[-•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      flushPara();
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    para.push(trimmed);
    i++;
  }
  flushPara();
  return blocks;
};

const renderInline = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );

/* ─── Main page ─────────────────────────────────────────────────────────────── */

const VALID_FILTERS = FILTERS.map(f => f.id);

const WhatsOn = () => {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  // Supports linking straight to a category, e.g. /whats-on?filter=PROMOTION
  const [filter,  setFilter]  = useState(() => {
    const fromUrl = searchParams.get('filter')?.toUpperCase();
    return VALID_FILTERS.includes(fromUrl) ? fromUrl : 'ALL';
  });
  const [search,  setSearch]  = useState('');
  const [reading, setReading] = useState(null);
  const [manageOpen, setManageOpen] = useState(false);

  const loadPosts = useCallback(() => {
    api.get('/whats-on/posts')
      .then(res => setPosts(res.data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const q = search.trim().toLowerCase();
  const filtered = posts
    .filter(p => filter === 'ALL' || p.category === filter)
    .filter(p => !q || (
      p.title.toLowerCase().includes(q) ||
      p.excerpt?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    ));

  const pinned  = filtered.filter(p => p.pinned);
  const regular = filtered.filter(p => !p.pinned);

  return (
    <Page>
      <Seo title="What's On" description="Articles, promotions, and shop news from LEV3L Barbers." />
      {/* ── Hero ── */}
      <Hero
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <Eyebrow>The Community</Eyebrow>
        <Title>What's On</Title>
        <Divider />
        <Sub>Articles · Promotions · Shop News</Sub>
        {isAdmin && (
          <ManageBtn onClick={() => setManageOpen(true)}>+ Manage Posts</ManageBtn>
        )}
      </Hero>

      {/* ── Filters + search ── */}
      <Controls>
        <FilterBar>
          {FILTERS.map(f => (
            <FilterBtn key={f.id} $active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
              {filter === f.id && <FilterLine layoutId="whats-on-underline" />}
            </FilterBtn>
          ))}
        </FilterBar>
        <SearchWrap>
          <SearchIcon>⌕</SearchIcon>
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts, tags..."
          />
          {search && <ClearSearch onClick={() => setSearch('')}>✕</ClearSearch>}
        </SearchWrap>
      </Controls>

      {/* ── Content ── */}
      {loading ? (
        <SkeletonGrid>
          {[0,1,2,3].map(i => (
            <SkeletonCard key={i} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </SkeletonGrid>
      ) : filtered.length === 0 ? (
        <Empty initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <EmptyIcon><NewsIcon width={48} height={48} /></EmptyIcon>
          <EmptyTitle>Nothing Here Yet</EmptyTitle>
          <EmptyText>{search ? 'No posts match your search.' : 'Check back soon — content is on its way.'}</EmptyText>
        </Empty>
      ) : (
        <>
          {pinned.length > 0 && (
            <Section>
              <SectionLabel><StarDot>★</StarDot> Featured</SectionLabel>
              <FeaturedGrid>
                {pinned.map((post, i) => (
                  <ArticleCard key={post.id} post={post} index={i} featured onOpen={() => setReading(post)} />
                ))}
              </FeaturedGrid>
            </Section>
          )}

          {regular.length > 0 && (
            <Section>
              {pinned.length > 0 && <SectionLabel>Latest</SectionLabel>}
              <Grid>
                {regular.map((post, i) => (
                  <ArticleCard key={post.id} post={post} index={i} onOpen={() => setReading(post)} />
                ))}
              </Grid>
            </Section>
          )}
        </>
      )}

      {/* ── Article reader modal ── */}
      <AnimatePresence>
        {reading && <ArticleReader post={reading} onClose={() => setReading(null)} />}
      </AnimatePresence>

      {isAdmin && (
        <AdminDrawer open={manageOpen} onClose={() => { setManageOpen(false); loadPosts(); }} title="Manage What's On">
          {manageOpen && <AdminWhatsOn />}
        </AdminDrawer>
      )}
    </Page>
  );
};

/* ─── Article card ───────────────────────────────────────────────────────────── */

const ArticleCard = ({ post, index, featured, onOpen }) => {
  const cat = CAT[post.category] || CAT.NEWS;
  const [hovered, setHovered] = useState(false);
  const d = new Date(post.createdAt);
  const countdown = useCountdown(post.expiresAt);

  const rawX    = useMotionValue(0);
  const rawY    = useMotionValue(0);
  const sp      = { stiffness: 300, damping: 28, mass: 0.6 };
  const spX     = useSpring(rawX, sp);
  const spY     = useSpring(rawY, sp);
  const rotateX = useTransform(spY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(spX, [-0.5, 0.5], [-4, 4]);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - r.left) / r.width  - 0.5);
    rawY.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const onMouseLeave = () => { setHovered(false); rawX.set(0); rawY.set(0); };

  return (
    <Card
      $featured={featured}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: EASE }}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      onClick={onOpen}
    >
      <CardImgWrap>
        {post.imageUrl
          ? (
            <CardImg
              src={resolveImageUrl(post.imageUrl)}
              alt={post.title}
              style={{ objectPosition: `center ${post.imageFocusY ?? 50}%` }}
              initial={{ clipPath: 'inset(100% 0 0 0)' }}
              animate={{ clipPath: 'inset(0% 0 0 0)' }}
              transition={{ duration: 0.6, ease: EASE, delay: index * 0.06 + 0.1 }}
            />
          )
          : <ImgPlaceholder><cat.Icon width={40} height={40} /></ImgPlaceholder>
        }
        <AnimatePresence>
          {hovered && (
            <StripeOverlay
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.45, ease: EASE }}
            />
          )}
        </AnimatePresence>
        <CatBadgePositioned $color={cat.color}>
          <cat.Icon width={11} height={11} />
          {cat.label}
        </CatBadgePositioned>
        <CalendarStamp>
          <CalDay>{d.getDate()}</CalDay>
          <CalRest>{MONTHS[d.getMonth()]}<br />{d.getFullYear()}</CalRest>
        </CalendarStamp>
      </CardImgWrap>

      <CardBody>
        {featured && <GhostStar>★</GhostStar>}
        <CardTitle $featured={featured}>{post.title}</CardTitle>
        <ReadTime>{readingTime(post.body)} min read</ReadTime>
        {countdown && (
          <CountdownRow $urgent={countdown.urgent}>
            <CountdownIcon $urgent={countdown.urgent}>{countdown.urgent ? '🔥' : '⏳'}</CountdownIcon>
            {countdown.text}
          </CountdownRow>
        )}
        {post.excerpt && <CardExcerpt>{post.excerpt}</CardExcerpt>}
        {post.tags?.length > 0 && (
          <TagRow>
            {post.tags.slice(0, 3).map(t => <TagPill key={t}>{t}</TagPill>)}
            {post.tags.length > 3 && <TagPill>+{post.tags.length - 3}</TagPill>}
          </TagRow>
        )}
        <ReadMore $color={cat.color}>Read More →</ReadMore>
      </CardBody>
    </Card>
  );
};

/* ─── Article reader ─────────────────────────────────────────────────────────── */

const ArticleReader = ({ post, onClose }) => {
  const cat = CAT[post.category] || CAT.NEWS;
  const countdown = useCountdown(post.expiresAt);
  return (
    <Backdrop
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ReaderPanel
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        onClick={e => e.stopPropagation()}
      >
        {post.imageUrl && (
          <ReaderCoverWrap>
            <ReaderCover
              src={resolveImageUrl(post.imageUrl)}
              alt={post.title}
              style={{ objectPosition: `center ${post.imageFocusY ?? 50}%` }}
              initial={{ clipPath: 'inset(100% 0 0 0)' }}
              animate={{ clipPath: 'inset(0% 0 0 0)' }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
            />
          </ReaderCoverWrap>
        )}
        <ReaderBody>
          <ReaderMeta>
            <CatBadge $color={cat.color}>
              <cat.Icon width={11} height={11} />
              {cat.label}
            </CatBadge>
            <ReaderDate>{fmtDate(post.createdAt)} · {readingTime(post.body)} min read</ReaderDate>
            {post.authorName && <ReaderAuthor>by {post.authorName}</ReaderAuthor>}
            {countdown && (
              <CountdownRow $urgent={countdown.urgent}>
                <CountdownIcon $urgent={countdown.urgent}>{countdown.urgent ? '🔥' : '⏳'}</CountdownIcon>
                {countdown.text}
              </CountdownRow>
            )}
          </ReaderMeta>
          <ReaderTitle>{post.title}</ReaderTitle>
          <ReaderText>
            {(() => {
              const blocks = parseBlocks(post.body);
              let paraIndex = 0;
              return blocks.map((block, i) => {
                const delay = 0.15 + i * 0.08;
                const fadeUp = {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.4, delay, ease: EASE },
                };

                if (block.type === 'h') {
                  return <ReaderHeading key={i} as={motion.h3} {...fadeUp}>{block.text}</ReaderHeading>;
                }
                if (block.type === 'ul') {
                  return (
                    <ReaderList key={i} as={motion.ul} {...fadeUp}>
                      {block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
                    </ReaderList>
                  );
                }
                if (block.type === 'ol') {
                  return (
                    <ReaderOrderedList key={i} as={motion.ol} {...fadeUp}>
                      {block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
                    </ReaderOrderedList>
                  );
                }
                const isLead = paraIndex === 0;
                paraIndex++;
                const Para = isLead ? LeadPara : motion.p;
                return <Para key={i} {...fadeUp}>{renderInline(block.text)}</Para>;
              });
            })()}
          </ReaderText>
          {post.tags?.length > 0 && (
            <ReaderTagRow>
              {post.tags.map(t => <TagPill key={t}>{t}</TagPill>)}
            </ReaderTagRow>
          )}
        </ReaderBody>
        <CloseBtn onClick={onClose} aria-label="Close">✕</CloseBtn>
      </ReaderPanel>
    </Backdrop>
  );
};

export default WhatsOn;

/* ─────────────────────── Styles ─────────────────────────────────────────────── */

const Page = styled.main`
  min-height: 100vh;
  background: ${CREAM};
  color: ${INK};
  font-family: 'Bebas Neue', sans-serif;
  padding-bottom: 6rem;
`;

/* Hero */
const Hero = styled(motion.div)`
  text-align: center;
  padding: 5rem 5% 3rem;
`;
const Eyebrow = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 10px; font-weight: 900;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: ${RED};
  margin: 0 0 0.6rem;
`;
const Title = styled.h1`
  font-size: clamp(3.5rem, 8vw, 6rem);
  letter-spacing: 5px;
  margin: 0;
  color: ${INK};
  line-height: 1;
`;
const Divider = styled.div`
  width: 48px;
  height: 2px;
  background: ${RED};
  margin: 1.4rem auto 1.2rem;
`;
const Sub = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(26, 26, 26, 0.55);
  letter-spacing: 2px;
  margin: 0;
`;
const ManageBtn = styled.button`
  margin-top: 1.4rem;
  background: ${RED}; border: none; color: #fff;
  padding: 0.6rem 1.3rem; cursor: pointer;
  font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; font-size: 0.9rem;
  transition: background 0.2s, transform 0.1s;
  &:hover { background: #a51830; transform: scale(1.02); }
`;

/* Controls */
const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 5% 2.5rem;
  flex-wrap: wrap;
  max-width: 1300px;
  margin: 0 auto;
`;
const FilterBar = styled.div`
  display: flex;
  gap: 0.1rem;
  flex-wrap: wrap;
`;
const FilterBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.88rem;
  letter-spacing: 3px;
  color: ${({ $active }) => $active ? INK : 'rgba(26, 26, 26, 0.4)'};
  padding: 6px 14px;
  position: relative;
  transition: color 0.2s;
  &:hover { color: ${INK}; }
`;
const FilterLine = styled(motion.div)`
  position: absolute;
  bottom: -1px;
  left: 14px;
  right: 14px;
  height: 1.5px;
  background: ${RED};
`;
const SearchWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;
const SearchIcon = styled.span`
  position: absolute;
  left: 0.7rem;
  color: rgba(26, 26, 26, 0.3);
  font-size: 1.1rem;
  pointer-events: none;
`;
const SearchInput = styled.input`
  background: #ffffff;
  border: 1px solid rgba(26, 26, 26, 0.15);
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.84rem;
  padding: 0.5rem 2.2rem 0.5rem 2.1rem;
  width: 220px;
  outline: none;
  transition: border-color 0.2s, width 0.3s;
  &:focus { border-color: rgba(26, 26, 26, 0.4); width: 260px; }
  &::placeholder { color: rgba(26, 26, 26, 0.3); }
  @media (max-width: 600px) { width: 160px; &:focus { width: 190px; } }
`;
const ClearSearch = styled.button`
  position: absolute;
  right: 0.55rem;
  background: none;
  border: none;
  color: rgba(26, 26, 26, 0.4);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 2px;
  line-height: 1;
  &:hover { color: ${INK}; }
`;

/* Sections */
const Section = styled.div`
  padding: 0 5%;
  max-width: 1300px;
  margin: 0 auto 3.5rem;
`;
const SectionLabel = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 10px; font-weight: 900;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: ${RED};
  margin: 0 0 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;
const StarDot = styled.span`
  color: ${RED};
`;
const FeaturedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1.5rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

/* Card */
const Card = styled(motion.div)`
  background: transparent;
  border: 1px solid ${({ $featured }) => $featured ? 'rgba(196,30,58,0.3)' : 'rgba(26, 26, 26, 0.1)'};
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.25s, box-shadow 0.25s;
  &:hover {
    border-color: ${({ $featured }) => $featured ? RED : 'rgba(26, 26, 26, 0.25)'};
    box-shadow: 0 16px 40px rgba(26, 26, 26, 0.12);
  }
`;
const CardImgWrap = styled.div`
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: rgba(26, 26, 26, 0.03);

  img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.45s ease;
  }
  ${Card}:hover & img { transform: scale(1.04); }
`;
const CardImg = styled(motion.img)`
  display: block;
`;
const StripeOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: repeating-linear-gradient(
    -48deg,
    ${RED}      0px,
    ${RED}      5px,
    transparent 5px,
    transparent 16px
  );
  opacity: 0.06;
`;
const ImgPlaceholder = styled.div`
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: ${INK};
  opacity: 0.15;
`;

/* Stamped category badge */
const CatBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.68rem;
  letter-spacing: 2px;
  padding: 4px 9px;
  border: 1.5px solid ${({ $color }) => $color};
  color: ${({ $color }) => $color};
  background: ${CREAM};
  transform: rotate(-3deg);
`;

/* box-shadow added on both stamps below — they have an opaque cream
   background already, but with no shadow they visually merge into any
   photo that happens to have light/white content behind them (a real
   problem with promo graphics, which are often white-background). The
   shadow keeps them reading as "stamped on top of" the image regardless of
   what's underneath. */
const CatBadgePositioned = styled(CatBadge)`
  position: absolute;
  top: 0.7rem; left: 0.7rem;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

/* Calendar tear-off date stamp */
const CalendarStamp = styled.div`
  position: absolute;
  top: 0.7rem; right: 0.7rem;
  z-index: 2;
  display: flex; align-items: center; gap: 6px;
  background: ${CREAM};
  border: 1px solid rgba(26, 26, 26, 0.12);
  padding: 4px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;
const CalDay = styled.span`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3rem; line-height: 1;
  color: ${INK};
`;
const CalRest = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.55rem; font-weight: 700; letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.5);
  line-height: 1.2;
`;

const CardBody = styled.div`
  position: relative;
  overflow: hidden;
  padding: 1rem 1.2rem 1.15rem;
  display: flex; flex-direction: column; gap: 0.38rem;
`;
const GhostStar = styled.span`
  position: absolute;
  top: -0.3em; right: 0.1em;
  z-index: -1;
  font-size: 4.5rem;
  color: rgba(196, 30, 58, 0.07);
  line-height: 1;
  pointer-events: none;
  user-select: none;
`;
const CardTitle = styled.h3`
  font-size: ${({ $featured }) => $featured ? '1.55rem' : '1.25rem'};
  letter-spacing: 1.5px;
  margin: 0;
  color: ${INK};
  line-height: 1.15;
`;
const ReadTime = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem; font-weight: 700;
  color: rgba(26, 26, 26, 0.55);
  letter-spacing: 0.5px;
  margin: 0;
`;

/* Countdown — a filled pill, not plain text. Non-urgent is a calm
   gold-tinted badge with an hourglass; inside 24h it goes full drama: a
   diagonal hazard-stripe background that visibly crawls, a shaking flame
   icon, and a stronger scale+glow pulse on the whole badge — plus the
   text itself switches to a live-ticking HH:MM:SS clock (see
   formatCountdown) rather than a static "23h left" that only relabels
   itself once in a while. */
const urgentPulse = keyframes`
  0%, 100% { transform: scale(1);    box-shadow: 0 0 6px rgba(196,30,58,0.45); }
  50%      { transform: scale(1.08); box-shadow: 0 0 22px rgba(196,30,58,0.95); }
`;
const stripeSlide = keyframes`
  0%   { background-position: 0 0; }
  100% { background-position: 34px 0; }
`;
const flameShake = keyframes`
  0%, 100% { transform: rotate(0deg)   scale(1); }
  20%      { transform: rotate(-16deg) scale(1.1); }
  40%      { transform: rotate(12deg)  scale(1.05); }
  60%      { transform: rotate(-10deg) scale(1.1); }
  80%      { transform: rotate(7deg)   scale(1); }
`;
const CountdownRow = styled.span`
  display: inline-flex; align-items: center; gap: 6px;
  align-self: flex-start;
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  border-radius: 3px;
  color: ${({ $urgent }) => $urgent ? '#fff' : INK};
  border: 1px solid ${({ $urgent }) => $urgent ? '#ff5a5a' : 'rgba(196,146,42,0.5)'};

  ${({ $urgent }) => $urgent ? css`
    font-size: 0.8rem;
    padding: 5px 11px;
    background: repeating-linear-gradient(
      -45deg, ${RED} 0px, ${RED} 9px, #8f1626 9px, #8f1626 18px
    );
    background-size: 200% 100%;
    animation: ${urgentPulse} 1s ease-in-out infinite, ${stripeSlide} 0.7s linear infinite;
  ` : css`
    font-size: 0.68rem;
    padding: 4px 9px 4px 7px;
    background: rgba(196,146,42,0.18);
  `}
`;
const CountdownIcon = styled.span`
  flex-shrink: 0;
  line-height: 1;
  font-size: ${({ $urgent }) => $urgent ? '0.9rem' : '0.7rem'};
  ${({ $urgent }) => $urgent && css`animation: ${flameShake} 0.7s ease-in-out infinite;`}
`;
const CardExcerpt = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  color: rgba(26, 26, 26, 0.75);
  margin: 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
const TagRow = styled.div`
  display: flex; gap: 0.35rem; flex-wrap: wrap;
  margin-top: 0.1rem;
`;
const TagPill = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  background: transparent;
  color: rgba(26, 26, 26, 0.7);
  border: 1px solid rgba(26, 26, 26, 0.2);
  letter-spacing: 0.3px;
  transition: transform 0.15s, background 0.15s, color 0.15s, border-color 0.15s;
  display: inline-block;
  &:hover { transform: translateY(-2px); background: ${RED}; color: #fff; border-color: ${RED}; }
`;
const ReadMore = styled.p`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.76rem;
  letter-spacing: 2px;
  color: ${({ $color }) => $color};
  margin: 0.25rem 0 0;
  opacity: 0.75;
  transition: opacity 0.2s;
  ${Card}:hover & { opacity: 1; }
`;

/* Empty */
const Empty = styled(motion.div)`
  text-align: center; padding: 6rem 5%;
`;
const EmptyIcon = styled.div`
  display: flex; justify-content: center;
  color: ${INK}; margin-bottom: 1.2rem; opacity: 0.25;
`;
const EmptyTitle = styled.h2`
  font-size: 2rem; letter-spacing: 3px;
  color: rgba(26, 26, 26, 0.5); margin: 0 0 0.5rem;
`;
const EmptyText = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: rgba(26, 26, 26, 0.4); font-size: 0.9rem; letter-spacing: 1px;
`;

/* Skeleton */
const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1.5rem; padding: 0 5%;
  max-width: 1300px; margin: 0 auto;
`;
const SkeletonCard = styled.div`
  aspect-ratio: 3/4;
  background: linear-gradient(90deg, rgba(26,26,26,0.06) 25%, rgba(26,26,26,0.1) 50%, rgba(26,26,26,0.06) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }
`;

/* Reader modal */
const Backdrop = styled(motion.div)`
  position: fixed; inset: 0;
  background: rgba(10, 10, 10, 0.85);
  z-index: 9000;
  display: flex; align-items: flex-start; justify-content: center;
  padding: 3rem 1.5rem 2rem;
  overflow-y: auto;
`;
const ReaderPanel = styled(motion.div)`
  position: relative;
  background: ${CREAM};
  border: 1px solid rgba(26, 26, 26, 0.1);
  max-width: 760px; width: 100%;
  overflow: hidden;
  flex-shrink: 0;
`;
const ReaderCoverWrap = styled.div`
  width: 100%;
  aspect-ratio: 16/7;
  overflow: hidden;
  background: #000;
`;
const ReaderCover = styled(motion.img)`
  width: 100%; height: 100%; object-fit: cover; display: block;
`;
const ReaderBody = styled.div`
  padding: 2rem 2.2rem 2.5rem;
  @media (max-width: 600px) { padding: 1.4rem 1.2rem 2rem; }
`;
const ReaderMeta = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  margin-bottom: 1rem; flex-wrap: wrap;
`;
const ReaderDate = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.75rem; color: rgba(26, 26, 26, 0.6); letter-spacing: 1.5px;
`;
const ReaderAuthor = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.78rem; color: rgba(26, 26, 26, 0.65); letter-spacing: 1px;
  font-style: italic;
`;
const ReaderTitle = styled.h2`
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  letter-spacing: 2px;
  margin: 0 0 1.5rem;
  color: ${INK};
  line-height: 1.1;
`;
const ReaderText = styled.div`
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 0.95rem; line-height: 1.85;
  color: rgba(26, 26, 26, 0.82);
  margin-bottom: 1.5rem;

  p, ul, ol { margin: 0 0 1.25rem; &:last-child { margin-bottom: 0; } }
  strong { color: ${INK}; font-weight: 700; }
`;

const LeadPara = styled(motion.p)`
  &::first-letter {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 2.7em;
    font-weight: 700;
    color: ${RED};
    float: left;
    line-height: 0.78;
    margin: 0.04em 0.1em 0 0;
  }
`;

const ReaderHeading = styled.h3`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.25rem;
  letter-spacing: 1.5px;
  color: ${INK};
  margin: 1.6rem 0 0.8rem;
  padding-left: 0.7rem;
  border-left: 3px solid ${RED};
  &:first-child { margin-top: 0; }
`;

const ReaderList = styled.ul`
  padding-left: 0;
  list-style: none;

  li {
    position: relative;
    padding-left: 1.3rem;
    margin-bottom: 0.55rem;
    &:last-child { margin-bottom: 0; }
    &::before {
      content: '';
      position: absolute;
      left: 0; top: 0.55em;
      width: 6px; height: 6px;
      border-radius: 50%;
      background: ${RED};
    }
  }
`;

const ReaderOrderedList = styled.ol`
  padding-left: 0;
  list-style: none;
  counter-reset: reader-ol;

  li {
    position: relative;
    counter-increment: reader-ol;
    padding-left: 1.7rem;
    margin-bottom: 0.55rem;
    &:last-child { margin-bottom: 0; }
    &::before {
      content: counter(reader-ol) '.';
      position: absolute;
      left: 0; top: 0;
      font-family: 'Bebas Neue', sans-serif;
      font-weight: 700;
      color: ${RED};
    }
  }
`;
const ReaderTagRow = styled.div`
  display: flex; gap: 0.45rem; flex-wrap: wrap;
  padding-top: 1rem;
  border-top: 1px solid rgba(26, 26, 26, 0.1);
`;
const CloseBtn = styled.button`
  position: absolute; top: 0.85rem; right: 0.85rem;
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(26, 26, 26, 0.55);
  border: none;
  color: ${CREAM}; font-size: 0.9rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s; z-index: 3;
  &:hover { background: rgba(26, 26, 26, 0.8); }
`;
