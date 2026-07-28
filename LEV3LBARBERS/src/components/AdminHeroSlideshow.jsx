import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { resolveImageUrl } from '../config';
import { ImageIcon, UploadIcon, TrashIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const AdminHeroSlideshow = () => {
  const [images,      setImages]      = useState([]);
  const [file,        setFile]        = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileRef = useRef();

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    try {
      const res = await api.get('/hero-slideshow/public');
      setImages(res.data.images || []);
    } catch { /* silent */ }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return alert('Choose an image first.');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      await api.post('/hero-slideshow/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchImages();
    } catch {
      alert('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/hero-slideshow/${deleteTarget}`);
      setDeleteTarget(null);
      fetchImages();
    } catch {
      alert('Delete failed.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/hero-slideshow/${id}/default`);
      fetchImages();
    } catch {
      alert('Could not set default. Try again.');
    }
  };

  return (
    <Card>
      <PanelTitle>Hero Slideshow</PanelTitle>
      <Hint>Images cycle every 4 seconds on the home page. Mark one as the start slide — visitors always land on it first.</Hint>

      <UploadBox>
        <UploadLabel>
          {preview ? (
            <PreviewImg src={preview} alt="preview" />
          ) : (
            <UploadPlaceholder>
              <Icon><ImageIcon /></Icon>
              <span>Tap to choose a photo</span>
            </UploadPlaceholder>
          )}
          <HiddenInput
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </UploadLabel>

        <UploadBtn onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading…' : (<><UploadIcon /> Add to Slideshow</>)}
        </UploadBtn>
      </UploadBox>

      <SectionTitle>Current Slides ({images.length})</SectionTitle>

      {images.length === 0 ? (
        <EmptyText>No slides yet. Upload the first one above.</EmptyText>
      ) : (
        <Grid>
          {images.map((img, i) => (
            <SlideCard key={img.id} $isDefault={img.isDefault}>
              <SlideNum>#{i + 1}</SlideNum>
              {img.isDefault && <DefaultBadge>★ Start</DefaultBadge>}
              <SlideImg src={resolveImageUrl(img.imageUrl)} alt={`Slide ${i + 1}`} />
              <CardActions>
                {!img.isDefault && (
                  <SetDefaultBtn onClick={() => handleSetDefault(img.id)}>
                    Set as start
                  </SetDefaultBtn>
                )}
                <DeleteBtn onClick={() => setDeleteTarget(img.id)}><TrashIcon /> Remove</DeleteBtn>
              </CardActions>
            </SlideCard>
          ))}
        </Grid>
      )}

      {deleteTarget && (
        <ConfirmOverlay>
          <ConfirmBox>
            <p>Remove this slide? This cannot be undone.</p>
            <BtnRow>
              <DeleteBtn onClick={confirmDelete}>Yes, remove</DeleteBtn>
              <CancelBtn onClick={() => setDeleteTarget(null)}>Cancel</CancelBtn>
            </BtnRow>
          </ConfirmBox>
        </ConfirmOverlay>
      )}
    </Card>
  );
};

export default AdminHeroSlideshow;

/* ─── Styles ─── */

const Card = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 620px;
  margin: 0 auto 2rem;
  position: relative;
`;

const PanelTitle = styled.h2`
  text-align: center;
  margin-bottom: 0.4rem;
  font-size: 1.6rem;
  color: ${INK};
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const Hint = styled.p`
  text-align: center;
  font-size: 0.8rem;
  color: rgba(26,26,26,0.6);
  font-weight: 600;
  margin: 0 0 1.6rem;
  letter-spacing: 0.03em;
  font-family: 'Montserrat', sans-serif;
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
  border: 2px dashed rgba(26,26,26,0.15);
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
  color: rgba(26,26,26,0.6);
  font-weight: 600;
  font-size: 0.9rem;
  font-family: 'Montserrat', sans-serif;
`;

const Icon = styled.span`
  font-size: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${INK};
  svg { width: 2.2rem; height: 2.2rem; }
`;

const PreviewImg = styled.img`
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  display: block;
`;

const HiddenInput = styled.input`display: none;`;

const UploadBtn = styled.button`
  padding: 0.65rem 1.2rem;
  border-radius: 0;
  border: none;
  background: ${RED};
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s, transform 0.1s;
  &:hover:not(:disabled) { background: #a81830; transform: scale(1.02); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  svg { width: 1rem; height: 1rem; }
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${RED};
  margin: 0 0 0.75rem;
  font-family: 'Bebas Neue', sans-serif;
`;

const EmptyText = styled.p`
  color: rgba(26,26,26,0.6);
  font-weight: 600;
  font-style: italic;
  font-size: 0.9rem;
  font-family: 'Montserrat', sans-serif;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
`;

const SlideCard = styled.div`
  position: relative;
  border-radius: 0;
  overflow: hidden;
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(26,26,26,0.1);
  ${({ $isDefault }) => $isDefault && `
    outline: 2px solid ${RED};
    outline-offset: -2px;
  `}
`;

const SlideNum = styled.span`
  position: absolute;
  top: 6px;
  left: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: #fff;
  background: rgba(26,26,26,0.65);
  padding: 2px 6px;
  border-radius: 0;
  z-index: 1;
  font-family: 'Bebas Neue', sans-serif;
`;

const DefaultBadge = styled.span`
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: #fff;
  background: ${RED};
  padding: 2px 7px;
  border-radius: 4px;
  z-index: 1;
  text-transform: uppercase;
  font-family: 'Bebas Neue', sans-serif;
`;

const SlideImg = styled.img`
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  display: block;
`;

const CardActions = styled.div`
  display: flex;
`;

const SetDefaultBtn = styled.button`
  flex: 1;
  padding: 0.4rem;
  border: none;
  border-top: 1px solid rgba(26,26,26,0.1);
  background: rgba(255,255,255,0.7);
  color: ${INK};
  font-size: 0.8rem;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  &:hover { background: ${RED}; color: #fff; }
`;

const DeleteBtn = styled.button`
  flex: 1;
  padding: 0.4rem;
  border: none;
  border-top: 1px solid rgba(26,26,26,0.1);
  background: transparent;
  color: ${RED};
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  transition: background 0.2s;
  &:hover { background: rgba(196,30,58,0.08); }
  svg { width: 0.85rem; height: 0.85rem; }
`;

const BtnRow = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const CancelBtn = styled.button`
  padding: 0.35rem 0.75rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  background: transparent;
  color: rgba(26,26,26,0.55);
  transition: color 0.2s, border-color 0.2s;
  &:hover { color: ${INK}; border-color: rgba(26,26,26,0.3); }
`;

const ConfirmOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(244,240,232,0.85);
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const ConfirmBox = styled.div`
  background: #ffffff;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.1);
  padding: 1.5rem;
  text-align: center;
  max-width: 300px;
  color: ${INK};
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  p { margin: 0 0 1rem; font-size: 0.95rem; font-family: 'Montserrat', sans-serif; }
`;
