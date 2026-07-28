import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import api from '../utils/api';

import { resolveImageUrl } from '../config';
import { ImageIcon, MegaphoneIcon, TagIcon, PenIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const CATEGORIES = [
  { id: 'ARTICLE',   label: 'Article' },
  { id: 'PROMOTION', label: 'Promotion' },
  { id: 'NEWS',      label: 'Shop News' },
];

const CAT_COLOR = { ARTICLE: '#C4922A', PROMOTION: '#C41E3A', NEWS: '#3576a8' };

const emptyForm = () => ({
  title: '', category: 'ARTICLE', authorName: '',
  excerpt: '', body: '', tags: [],
  pinned: false, published: true,
});

/* ─── Component ─────────────────────────────────────────────────────────────── */

const AdminWhatsOn = () => {
  const [view,          setView]          = useState('list');
  const [posts,         setPosts]         = useState([]);
  const [form,          setForm]          = useState(emptyForm());
  const [editingId,     setEditingId]     = useState(null);
  const [tagInput,      setTagInput]      = useState('');
  const [file,          setFile]          = useState(null);
  const [preview,       setPreview]       = useState(null);
  const [existingImg,   setExistingImg]   = useState(null);
  const [removeImg,     setRemoveImg]     = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const fileRef = useRef();

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    try {
      const res = await api.get('/whats-on/posts/all');
      setPosts(res.data.posts || []);
    } catch { /* silent */ }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const openCreate = () => {
    setForm(emptyForm());
    setEditingId(null);
    setFile(null); setPreview(null); setExistingImg(null); setRemoveImg(false);
    setTagInput('');
    setView('form');
  };

  const openEdit = (post) => {
    setForm({
      title:      post.title,
      category:   post.category,
      authorName: post.authorName  || '',
      excerpt:    post.excerpt     || '',
      body:       post.body,
      tags:       post.tags        || [],
      pinned:     post.pinned,
      published:  post.published,
    });
    setEditingId(post.id);
    setFile(null); setPreview(null);
    setExistingImg(post.imageUrl || null);
    setRemoveImg(false);
    setTagInput('');
    setView('form');
  };

  /* ── Tags ── */
  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/,/g, '');
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  };
  const removeTag = (tag) => set('tags', form.tags.filter(t => t !== tag));

  /* ── Image ── */
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setRemoveImg(false);
  };
  const handleRemoveImg = () => {
    setFile(null); setPreview(null); setRemoveImg(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!form.title.trim()) return alert('Title is required.');
    if (!form.body.trim())  return alert('Body is required.');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title',    form.title.trim());
      fd.append('category', form.category);
      fd.append('body',     form.body.trim());
      if (form.authorName.trim()) fd.append('authorName', form.authorName.trim());
      if (form.excerpt.trim())    fd.append('excerpt',    form.excerpt.trim());
      fd.append('tags',      JSON.stringify(form.tags));
      fd.append('pinned',    String(form.pinned));
      fd.append('published', String(form.published));
      if (file)        fd.append('coverImage',  file);
      if (removeImg)   fd.append('removeImage', 'true');

      if (editingId) {
        await api.put(`/whats-on/posts/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/whats-on/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      await loadPosts();
      setView('list');
    } catch {
      alert(`Failed to ${editingId ? 'update' : 'create'} post.`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    try {
      await api.delete(`/whats-on/posts/${deleteTarget}`);
      setDeleteTarget(null);
      loadPosts();
    } catch { alert('Delete failed.'); }
  };

  /* ── Quick toggle published ── */
  const togglePublished = async (post) => {
    try {
      const fd = new FormData();
      fd.append('title',    post.title);
      fd.append('category', post.category);
      fd.append('body',     post.body);
      fd.append('tags',     JSON.stringify(post.tags || []));
      fd.append('pinned',   String(post.pinned));
      fd.append('published', String(!post.published));
      await api.put(`/whats-on/posts/${post.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      loadPosts();
    } catch { alert('Update failed.'); }
  };

  /* ── Form view ───────────────────────────────────────────────────────────── */
  if (view === 'form') {
    const imgSrc = !removeImg && (preview || (existingImg ? resolveImageUrl(existingImg) : null));
    return (
      <Card>
        <TitleRow>
          <PanelTitle>{editingId ? 'Edit Post' : 'New Post'}</PanelTitle>
          <BackBtn onClick={() => setView('list')}>← Back</BackBtn>
        </TitleRow>

        <FormGrid>
          <FullField>
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Post title..." />
          </FullField>

          <HalfField>
            <Label>Category *</Label>
            <Select value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
          </HalfField>

          <HalfField>
            <Label>Author Name</Label>
            <Input value={form.authorName} onChange={e => set('authorName', e.target.value)} placeholder="Optional..." />
          </HalfField>

          <FullField>
            <Label>Excerpt <Hint>short teaser shown on the card</Hint></Label>
            <Textarea
              rows={2}
              value={form.excerpt}
              onChange={e => set('excerpt', e.target.value)}
              placeholder="Brief summary..."
            />
          </FullField>

          <FullField>
            <Label>
              Body *{' '}
              <Hint>
                blank line = new paragraph · "## " = heading · "- " = bullet list ·
                "1. " = numbered list · **text** = bold
              </Hint>
            </Label>
            <Textarea
              rows={11}
              value={form.body}
              onChange={e => set('body', e.target.value)}
              placeholder={'Write the full content here...\n\n## A subheading\n\n- First point\n- Second point'}
            />
          </FullField>

          <FullField>
            <Label>Cover Image</Label>
            {imgSrc ? (
              <ImgPreviewWrap>
                <PreviewImg src={imgSrc} alt="cover preview" />
                <RemoveImgBtn onClick={handleRemoveImg}>✕ Remove</RemoveImgBtn>
              </ImgPreviewWrap>
            ) : (
              <UploadLabel>
                <UploadInner>
                  <ImageIcon size={32} />
                  <span>Click to upload a cover image</span>
                </UploadInner>
                <HiddenInput ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} />
              </UploadLabel>
            )}
          </FullField>

          <FullField>
            <Label>Tags</Label>
            <TagInputRow>
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                placeholder="Type a tag and press Enter or comma..."
              />
              <AddTagBtn type="button" onClick={addTag}>+ Add</AddTagBtn>
            </TagInputRow>
            {form.tags.length > 0 && (
              <Chips>
                {form.tags.map(tag => (
                  <Chip key={tag}>
                    {tag}
                    <ChipX onClick={() => removeTag(tag)}>✕</ChipX>
                  </Chip>
                ))}
              </Chips>
            )}
          </FullField>

          <ToggleRow>
            <ToggleLabel>
              <Toggle type="checkbox" checked={form.pinned} onChange={e => set('pinned', e.target.checked)} />
              <ToggleText $on={form.pinned}>★ Feature / Pin this post</ToggleText>
            </ToggleLabel>
            <ToggleLabel>
              <Toggle type="checkbox" checked={form.published} onChange={e => set('published', e.target.checked)} />
              <ToggleText $on={form.published}>{form.published ? '✓ Published' : '○ Save as draft'}</ToggleText>
            </ToggleLabel>
          </ToggleRow>
        </FormGrid>

        <SubmitBtn onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Publish Post'}
        </SubmitBtn>
      </Card>
    );
  }

  /* ── List view ───────────────────────────────────────────────────────────── */
  return (
    <Card>
      <TitleRow>
        <PanelTitle>What's On</PanelTitle>
        <NewBtn onClick={openCreate}>+ New Post</NewBtn>
      </TitleRow>

      {posts.length === 0 ? (
        <EmptyMsg>No posts yet. Hit "+ New Post" to get started.</EmptyMsg>
      ) : (
        <PostList>
          {posts.map(post => (
            <PostRow key={post.id}>
              <Thumb>
                {post.imageUrl
                  ? <ThumbImg src={resolveImageUrl(post.imageUrl)} alt="" />
                  : <ThumbIcon $color={CAT_COLOR[post.category]}>
                      {post.category === 'ARTICLE'
                        ? <PenIcon size={20} />
                        : post.category === 'PROMOTION'
                          ? <TagIcon size={20} />
                          : <MegaphoneIcon size={20} />}
                    </ThumbIcon>
                }
              </Thumb>
              <PostMeta>
                <PostMetaTop>
                  <CatBadge $color={CAT_COLOR[post.category]}>{post.category}</CatBadge>
                  {post.pinned && <PinnedTag>★ PINNED</PinnedTag>}
                </PostMetaTop>
                <PostTitle>{post.title}</PostTitle>
                {post.excerpt && <PostExcerpt>{post.excerpt}</PostExcerpt>}
                <ActionRow>
                  <StatusBtn $on={post.published} onClick={() => togglePublished(post)}>
                    {post.published ? '✓ Published' : '○ Draft'}
                  </StatusBtn>
                  <EditBtn onClick={() => openEdit(post)}>Edit</EditBtn>
                  <DeleteBtn onClick={() => setDeleteTarget(post.id)}>Delete</DeleteBtn>
                </ActionRow>
              </PostMeta>
            </PostRow>
          ))}
        </PostList>
      )}

      {deleteTarget && (
        <ConfirmOverlay>
          <ConfirmBox>
            <p>Delete this post permanently?</p>
            <BtnRow>
              <DeleteBtn onClick={handleDelete}>Yes, delete</DeleteBtn>
              <CancelBtn onClick={() => setDeleteTarget(null)}>Cancel</CancelBtn>
            </BtnRow>
          </ConfirmBox>
        </ConfirmOverlay>
      )}
    </Card>
  );
};

export default AdminWhatsOn;

/* ─────────────────────── Styles ─────────────────────────────────────────────── */

const Card = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 700px;
  margin: 0 auto 2rem;
  position: relative;
`;

const TitleRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1.5rem;
`;
const PanelTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1.5px; text-transform: uppercase;
  font-size: 1.6rem; color: ${INK};
  margin: 0;
`;
const BackBtn = styled.button`
  background: transparent; border: 1px solid rgba(26,26,26,0.15);
  color: rgba(26,26,26,0.55); padding: 0.4rem 0.9rem;
  border-radius: 0; cursor: pointer; font-size: 0.85rem;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.18s;
  &:hover { color: ${INK}; border-color: rgba(26,26,26,0.3); }
`;
const NewBtn = styled.button`
  background: ${RED}; border: none; color: #fff;
  padding: 0.5rem 1.1rem; border-radius: 0; cursor: pointer;
  font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; text-transform: uppercase;
  font-weight: 700; font-size: 0.88rem;
  transition: background 0.2s, transform 0.1s;
  &:hover { background: #a51830; transform: scale(1.02); }
`;

const FormGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 1rem 1.2rem; margin-bottom: 1.5rem;
  @media (max-width: 540px) { grid-template-columns: 1fr; }
`;
const FullField = styled.div`
  grid-column: 1 / -1; display: flex; flex-direction: column; gap: 0.4rem;
`;
const HalfField = styled.div`
  display: flex; flex-direction: column; gap: 0.4rem;
`;
const Label = styled.label`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: ${RED};
`;
const Hint = styled.span`
  color: rgba(26,26,26,0.5); text-transform: none; letter-spacing: 0;
  font-weight: 600; font-size: 0.74rem; margin-left: 4px;
`;

const inputStyles = css`
  padding: 0.55rem 0.8rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.91rem;
  outline: none;
  transition: border-color 0.2s;
  &:focus { border-color: ${RED}; }
  &::placeholder { color: rgba(26,26,26,0.35); }
`;
const Input    = styled.input`${inputStyles}`;
const Select   = styled.select`${inputStyles} cursor: pointer; option { background: #fff; color: ${INK}; }`;
const Textarea = styled.textarea`${inputStyles} resize: vertical; min-height: 70px; line-height: 1.6;`;

const UploadLabel = styled.label`
  cursor: pointer;
  border: 2px dashed rgba(26,26,26,0.18);
  border-radius: 0; overflow: hidden;
  transition: border-color 0.2s;
  &:hover { border-color: ${RED}; }
`;
const UploadInner = styled.div`
  display: flex; flex-direction: column; align-items: center;
  gap: 0.45rem; padding: 1.5rem;
  color: rgba(26,26,26,0.5); font-weight: 600;
  font-family: 'Montserrat', sans-serif; font-size: 0.87rem;
`;
const HiddenInput = styled.input`display: none;`;
const ImgPreviewWrap = styled.div`
  position: relative; border-radius: 0; overflow: hidden;
  border: 1px solid rgba(26,26,26,0.1);
`;
const PreviewImg = styled.img`
  width: 100%; max-height: 220px; object-fit: cover; display: block;
`;
const RemoveImgBtn = styled.button`
  position: absolute; bottom: 0.5rem; right: 0.5rem;
  background: rgba(26,26,26,0.78); color: #fff; border: none;
  padding: 0.3rem 0.65rem; border-radius: 0; cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem; transition: background 0.18s;
  &:hover { background: ${RED}; }
`;

const TagInputRow = styled.div`display: flex; gap: 0.5rem;`;
const AddTagBtn = styled.button`
  white-space: nowrap;
  background: rgba(196,30,58,0.08);
  border: 1px solid rgba(196,30,58,0.35);
  color: ${RED}; padding: 0.5rem 0.85rem;
  border-radius: 0; cursor: pointer; font-size: 0.84rem; font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  transition: background 0.18s;
  &:hover { background: rgba(196,30,58,0.16); }
`;
const Chips = styled.div`
  display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem;
`;
const Chip = styled.span`
  display: inline-flex; align-items: center; gap: 0.3rem;
  background: rgba(196,30,58,0.06); border: 1px solid rgba(196,30,58,0.28);
  color: ${RED}; padding: 3px 9px; border-radius: 4px;
  font-family: 'Montserrat', sans-serif; font-weight: 600;
  font-size: 0.77rem; letter-spacing: 0.5px;
`;
const ChipX = styled.button`
  background: none; border: none; color: rgba(196,30,58,0.6);
  cursor: pointer; padding: 0; font-size: 0.74rem; line-height: 1;
  &:hover { color: ${RED}; }
`;

const ToggleRow = styled.div`
  grid-column: 1 / -1; display: flex; gap: 2rem; flex-wrap: wrap;
`;
const ToggleLabel = styled.label`
  display: flex; align-items: center; gap: 0.55rem; cursor: pointer;
`;
const Toggle = styled.input`
  width: 17px; height: 17px; cursor: pointer; accent-color: ${RED};
`;
const ToggleText = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.87rem; font-weight: 700;
  color: ${({ $on }) => $on ? RED : 'rgba(26,26,26,0.5)'};
  transition: color 0.2s;
`;

const SubmitBtn = styled.button`
  width: 100%; padding: 0.85rem;
  background: ${RED}; color: #fff; border: none;
  border-radius: 0; font-weight: 700; font-size: 1rem; cursor: pointer;
  font-family: 'Bebas Neue', sans-serif; letter-spacing: 1.5px; text-transform: uppercase;
  transition: background 0.2s, transform 0.1s;
  &:hover:not(:disabled) { background: #a51830; transform: scale(1.01); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/* List */
const PostList = styled.div`display: flex; flex-direction: column; gap: 0.75rem;`;
const PostRow = styled.div`
  display: flex; gap: 0.9rem; align-items: flex-start;
  background: rgba(255,255,255,0.5);
  border: 1px solid rgba(26,26,26,0.08);
  border-radius: 0; padding: 0.8rem;
`;
const Thumb = styled.div`
  width: 72px; height: 72px; flex-shrink: 0;
  border-radius: 0; overflow: hidden;
`;
const ThumbImg = styled.img`width: 100%; height: 100%; object-fit: cover;`;
const ThumbIcon = styled.div`
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(26,26,26,0.04);
  color: ${({ $color }) => $color};
`;
const PostMeta = styled.div`flex: 1; min-width: 0;`;
const PostMetaTop = styled.div`
  display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;
`;
const CatBadge = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.67rem; letter-spacing: 1.5px; padding: 2px 7px;
  border-radius: 3px; font-weight: 700;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}1a;
  border: 1px solid ${({ $color }) => $color}40;
`;
const PinnedTag = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.67rem; color: #C4922A; letter-spacing: 1px; font-weight: 700;
`;
const PostTitle = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-weight: 700; color: ${INK}; margin: 0 0 0.2rem;
  font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const PostExcerpt = styled.p`
  color: rgba(26,26,26,0.55); font-weight: 600; font-size: 0.76rem; margin: 0 0 0.5rem;
  font-family: 'Montserrat', sans-serif;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const ActionRow = styled.div`
  display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center;
`;

const Btn = css`
  padding: 0.28rem 0.65rem; border-radius: 0; border: 1px solid;
  cursor: pointer; font-size: 0.79rem; font-weight: 700; transition: background 0.18s;
  font-family: 'Montserrat', sans-serif;
`;
const StatusBtn = styled.button`
  ${Btn}
  background: ${({ $on }) => $on ? 'rgba(76,175,80,0.1)' : 'rgba(26,26,26,0.05)'};
  border-color: ${({ $on }) => $on ? 'rgba(76,175,80,0.35)' : 'rgba(26,26,26,0.15)'};
  color: ${({ $on }) => $on ? '#3d8b40' : 'rgba(26,26,26,0.5)'};
  &:hover { background: ${({ $on }) => $on ? 'rgba(76,175,80,0.2)' : 'rgba(26,26,26,0.1)'}; }
`;
const EditBtn = styled.button`
  ${Btn}
  background: rgba(196,146,42,0.1); border-color: rgba(196,146,42,0.3);
  color: #9c7521;
  &:hover { background: rgba(196,146,42,0.2); }
`;
const DeleteBtn = styled.button`
  ${Btn}
  background: transparent; border-color: rgba(196,30,58,0.4);
  color: ${RED};
  &:hover { background: rgba(196,30,58,0.08); }
`;
const CancelBtn = styled.button`
  ${Btn}
  background: transparent; border-color: rgba(26,26,26,0.15);
  color: rgba(26,26,26,0.55);
  &:hover { background: rgba(26,26,26,0.06); color: ${INK}; }
`;
const BtnRow = styled.div`display: flex; gap: 0.5rem; margin-top: 0.4rem;`;
const EmptyMsg = styled.p`
  color: rgba(26,26,26,0.5); font-weight: 600; font-style: italic; font-size: 0.9rem;
  font-family: 'Montserrat', sans-serif;
  text-align: center; padding: 2rem 0;
`;

const ConfirmOverlay = styled.div`
  position: absolute; inset: 0;
  background: rgba(244,240,232,0.92);
  border-radius: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 10;
`;
const ConfirmBox = styled.div`
  background: #ffffff; border-radius: 0; padding: 1.5rem;
  text-align: center; max-width: 300px; color: ${INK};
  border: 1px solid rgba(26,26,26,0.1);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  font-family: 'Montserrat', sans-serif;
  p { margin: 0 0 1rem; font-size: 0.95rem; font-weight: 600; }
`;
