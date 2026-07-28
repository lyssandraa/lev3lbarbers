import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';

import { resolveImageUrl } from '../config';
import { CameraIcon as CameraGlyph, ImageIcon, UploadIcon, PencilIcon, TrashIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const AdminGallery = () => {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ title: '', description: '' });
  const [deleteTarget, setDeleteTarget] = useState(null); // { itemId } — whole item
  const [deleteImageTarget, setDeleteImageTarget] = useState(null); // { itemId, imageId }
  const [addingAnglesFor, setAddingAnglesFor] = useState(null); // itemId currently uploading more angles
  const fileRef = useRef();
  const addAnglesRef = useRef();

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/gallery/photos');
      setItems(res.data.items || []);
    } catch {
      // silently fail
    }
  };

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    setFiles(picked);
    setPreviews(picked.map(f => URL.createObjectURL(f)));
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert('Choose at least one photo first.');
    if (!title.trim()) return alert('Add a title for this cut.');
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append('photos', f));
      form.append('title', title.trim());
      if (description.trim()) form.append('description', description.trim());
      await api.post('/gallery/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFiles([]);
      setPreviews([]);
      setTitle('');
      setDescription('');
      if (fileRef.current) fileRef.current.value = '';
      fetchItems();
    } catch {
      alert('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const triggerAddAngles = (itemId) => {
    setAddingAnglesFor(itemId);
    addAnglesRef.current?.click();
  };

  const handleAddAngles = async (e) => {
    const picked = Array.from(e.target.files || []);
    const itemId = addingAnglesFor;
    if (picked.length === 0 || !itemId) return;
    try {
      const form = new FormData();
      picked.forEach(f => form.append('photos', f));
      await api.post(`/gallery/${itemId}/images`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchItems();
    } catch {
      alert('Could not add angles. Try again.');
    } finally {
      setAddingAnglesFor(null);
      if (addAnglesRef.current) addAnglesRef.current.value = '';
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValues({ title: item.title, description: item.description || '' });
  };

  const saveEdit = async (id) => {
    if (!editValues.title.trim()) return alert('Title is required.');
    try {
      await api.put(`/gallery/update/${id}`, editValues);
      setEditingId(null);
      fetchItems();
    } catch {
      alert('Update failed.');
    }
  };

  const confirmDeleteItem = async () => {
    try {
      await api.delete(`/gallery/delete/${deleteTarget}`);
      setDeleteTarget(null);
      fetchItems();
    } catch {
      alert('Delete failed.');
    }
  };

  const confirmDeleteImage = async () => {
    const { itemId, imageId } = deleteImageTarget;
    try {
      await api.delete(`/gallery/${itemId}/images/${imageId}`);
      setDeleteImageTarget(null);
      fetchItems();
    } catch {
      alert('Delete failed.');
    }
  };

  return (
    <Card>
      <PanelTitle>Gallery Manager</PanelTitle>

      {/* Upload form — multiple angles of the same cut in one go */}
      <UploadBox>
        <UploadLabel>
          {previews.length > 0 ? (
            <PreviewRow>
              {previews.map((src, i) => <PreviewImg key={i} src={src} alt="preview" />)}
            </PreviewRow>
          ) : (
            <UploadPlaceholder>
              <CameraIconWrap><CameraGlyph width={36} height={36} /></CameraIconWrap>
              <span>Tap to choose one or more photos — different angles of the same cut</span>
            </UploadPlaceholder>
          )}
          <HiddenInput
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </UploadLabel>

        <Field>
          <FieldLabel>Cut / Style Name *</FieldLabel>
          <Input
            placeholder="e.g. Skin Fade, Afro Taper..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>Description (optional)</FieldLabel>
          <Input
            placeholder="Any extra details..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </Field>

        <UploadBtn onClick={handleUpload} disabled={uploading}>
          <UploadIcon width={16} height={16} />
          {uploading
            ? 'Uploading…'
            : `Upload ${files.length > 1 ? `${files.length} Photos` : 'Photo'}`}
        </UploadBtn>
      </UploadBox>

      {/* Hidden input used for adding angles to an existing item */}
      <HiddenInput
        ref={addAnglesRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleAddAngles}
      />

      {/* Items list */}
      <SectionTitle><ImageIcon width={16} height={16} /> Uploaded Cuts ({items.length})</SectionTitle>

      {items.length === 0 ? (
        <EmptyText>No photos yet. Upload the first one above.</EmptyText>
      ) : (
        <PhotoList>
          {items.map(item => (
            <PhotoRow key={item.id}>
              <ThumbStrip>
                {item.images.map(img => (
                  <ThumbWrap key={img.id}>
                    <Thumb src={resolveImageUrl(img.imageUrl)} alt={item.title} />
                    {item.images.length > 1 && (
                      <RemoveImgBtn
                        onClick={() => setDeleteImageTarget({ itemId: item.id, imageId: img.id })}
                        title="Remove this angle"
                      >
                        ×
                      </RemoveImgBtn>
                    )}
                  </ThumbWrap>
                ))}
                <AddAngleBtn onClick={() => triggerAddAngles(item.id)} title="Add another angle">
                  +
                </AddAngleBtn>
              </ThumbStrip>

              {editingId === item.id ? (
                <EditFields>
                  <Input
                    value={editValues.title}
                    onChange={e => setEditValues({ ...editValues, title: e.target.value })}
                    placeholder="Title"
                  />
                  <Input
                    value={editValues.description}
                    onChange={e => setEditValues({ ...editValues, description: e.target.value })}
                    placeholder="Description"
                  />
                  <BtnRow>
                    <SaveBtn onClick={() => saveEdit(item.id)}>Save</SaveBtn>
                    <CancelBtn onClick={() => setEditingId(null)}>Cancel</CancelBtn>
                  </BtnRow>
                </EditFields>
              ) : (
                <PhotoInfo>
                  <PhotoTitle>
                    {item.title}
                    {item.images.length > 1 && <AngleBadge>{item.images.length} angles</AngleBadge>}
                  </PhotoTitle>
                  {item.description && <PhotoDesc>{item.description}</PhotoDesc>}
                  <BtnRow>
                    <EditBtn onClick={() => startEdit(item)}><PencilIcon width={14} height={14} /> Edit</EditBtn>
                    <DeleteBtn onClick={() => setDeleteTarget(item.id)}><TrashIcon width={14} height={14} /> Delete</DeleteBtn>
                  </BtnRow>
                </PhotoInfo>
              )}
            </PhotoRow>
          ))}
        </PhotoList>
      )}

      {/* Confirm delete whole item */}
      {deleteTarget && (
        <ConfirmOverlay>
          <ConfirmBox>
            <p>Delete this cut and all its photos? This cannot be undone.</p>
            <BtnRow>
              <DeleteBtn onClick={confirmDeleteItem}>Yes, delete</DeleteBtn>
              <CancelBtn onClick={() => setDeleteTarget(null)}>Cancel</CancelBtn>
            </BtnRow>
          </ConfirmBox>
        </ConfirmOverlay>
      )}

      {/* Confirm delete single angle */}
      {deleteImageTarget && (
        <ConfirmOverlay>
          <ConfirmBox>
            <p>Remove this angle?</p>
            <BtnRow>
              <DeleteBtn onClick={confirmDeleteImage}>Yes, remove</DeleteBtn>
              <CancelBtn onClick={() => setDeleteImageTarget(null)}>Cancel</CancelBtn>
            </BtnRow>
          </ConfirmBox>
        </ConfirmOverlay>
      )}
    </Card>
  );
};

export default AdminGallery;

/* ─── Styled Components ─── */

const Card = styled.div`
  background: rgba(255, 255, 255, 0.55);
  padding: 2rem;
  border-radius: 0;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(26, 26, 26, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem;
  position: relative;
`;

const PanelTitle = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 1.6rem;
  color: ${INK};
`;

const UploadBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const UploadLabel = styled.label`
  cursor: pointer;
  display: block;
  border: 2px dashed rgba(26, 26, 26, 0.15);
  border-radius: 0;
  overflow: hidden;
  transition: border-color 0.2s;
  &:hover { border-color: ${RED}; }
`;

const UploadPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: rgba(26, 26, 26, 0.55);
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  text-align: center;
`;

const CameraIconWrap = styled.span`
  display: inline-flex;
  color: rgba(26, 26, 26, 0.45);
`;

const PreviewRow = styled.div`
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 6px;
`;

const PreviewImg = styled.img`
  width: 110px;
  height: 130px;
  object-fit: cover;
  border-radius: 0;
  flex-shrink: 0;
`;

const HiddenInput = styled.input`
  display: none;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const FieldLabel = styled.label`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${RED};
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  border-radius: 0;
  border: 1px solid rgba(26, 26, 26, 0.15);
  background: #ffffff;
  color: ${INK};
  outline: none;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.95rem;
  &:focus { border-color: ${RED}; }
  &::placeholder { color: rgba(26, 26, 26, 0.35); }
`;

const UploadBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.2rem;
  border-radius: 0;
  border: none;
  background: ${RED};
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  &:hover:not(:disabled) { background: #a3172e; transform: scale(1.02); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${INK};
  margin: 0 0 0.75rem;
`;

const EmptyText = styled.p`
  color: rgba(26, 26, 26, 0.55);
  font-family: 'Montserrat', sans-serif;
  font-style: italic;
  font-weight: 600;
  font-size: 0.9rem;
`;

const PhotoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PhotoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 0;
  padding: 0.75rem;
`;

const ThumbStrip = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 2px;
`;

const ThumbWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const Thumb = styled.img`
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 0;
  display: block;
`;

const RemoveImgBtn = styled.button`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: ${RED};
  color: #fff;
  font-size: 0.8rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: #a3172e; }
`;

const AddAngleBtn = styled.button`
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 0;
  border: 2px dashed rgba(26, 26, 26, 0.15);
  background: transparent;
  color: rgba(26, 26, 26, 0.55);
  font-size: 1.4rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  &:hover { border-color: ${RED}; color: ${RED}; }
`;

const AngleBadge = styled.span`
  display: inline-block;
  margin-left: 0.5rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${RED};
  background: rgba(196, 30, 58, 0.1);
  padding: 2px 7px;
  border-radius: 999px;
  vertical-align: middle;
`;

const PhotoInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PhotoTitle = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  color: ${INK};
  margin: 0 0 0.2rem;
  font-size: 0.95rem;
`;

const PhotoDesc = styled.p`
  color: rgba(26, 26, 26, 0.6);
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  margin: 0 0 0.5rem;
`;

const EditFields = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.4rem;
  flex-wrap: wrap;
`;

const BtnBase = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 0;
  border: none;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.2s, transform 0.1s, color 0.2s, border-color 0.2s;
  &:hover { transform: scale(1.03); }
`;

const SaveBtn = styled(BtnBase)`
  background: ${RED};
  color: #fff;
  &:hover { background: #a3172e; }
`;

const EditBtn = styled(BtnBase)`
  background: transparent;
  border: 1px solid rgba(26, 26, 26, 0.15);
  color: rgba(26, 26, 26, 0.55);
  &:hover { border-color: ${INK}; color: ${INK}; background: transparent; }
`;

const DeleteBtn = styled(BtnBase)`
  background: transparent;
  border: 1px solid ${RED};
  color: ${RED};
  &:hover { background: rgba(196, 30, 58, 0.08); }
`;

const CancelBtn = styled(BtnBase)`
  background: transparent;
  border: 1px solid rgba(26, 26, 26, 0.15);
  color: rgba(26, 26, 26, 0.55);
  &:hover { border-color: ${INK}; color: ${INK}; }
`;

const ConfirmOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(244, 240, 232, 0.92);
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const ConfirmBox = styled.div`
  background: #ffffff;
  border: 1px solid rgba(26, 26, 26, 0.1);
  border-radius: 0;
  padding: 1.5rem;
  text-align: center;
  max-width: 300px;
  color: ${INK};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

  p { margin: 0 0 1rem; font-size: 0.95rem; font-family: 'Montserrat', sans-serif; }
`;
