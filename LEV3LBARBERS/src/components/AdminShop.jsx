import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';

import { resolveImageUrl } from '../config';
import { BoxIcon, LockIcon, StoreIcon, GlobeIcon, PencilIcon, TrashIcon, PlusIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const EMPTY_FORM = { name: '', description: '', price: '', priceHidden: false, priceUnit: 'item', category: 'online', trackStock: false, stock: '' };

const AdminShop = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [section, setSection] = useState('all');
  const fileRef = useRef();
  const editFileRef = useRef();

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/shop-products/all');
      setProducts(res.data.products || []);
    } catch {
      // silently fail
    }
  };

  /* ── Add form ── */
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return alert('Product name is required.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      if (form.description.trim()) fd.append('description', form.description.trim());
      if (form.price !== '') fd.append('price', form.price);
      fd.append('priceHidden', String(form.priceHidden));
      fd.append('priceUnit', form.priceUnit);
      fd.append('category', form.category);
      fd.append('trackStock', String(form.trackStock));
      if (form.trackStock && form.stock !== '') fd.append('stock', form.stock);
      if (file) fd.append('image', file);

      await api.post('/shop-products/create', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setForm(EMPTY_FORM);
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchProducts();
    } catch {
      alert('Failed to add product.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Edit ── */
  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({
      name:        p.name,
      description: p.description || '',
      price:       p.price !== null && p.price !== undefined ? String(p.price) : '',
      priceHidden: p.priceHidden,
      priceUnit:   p.priceUnit || 'item',
      category:    p.category,
      active:      p.active,
      trackStock:  p.trackStock  || false,
      stock:       p.stock !== null && p.stock !== undefined ? String(p.stock) : '',
    });
    setEditFile(null);
    setEditPreview(p.imageUrl ? resolveImageUrl(p.imageUrl) : null);
  };

  const handleEditFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setEditFile(f);
    setEditPreview(URL.createObjectURL(f));
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) return alert('Product name is required.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', editForm.name.trim());
      if (editForm.description.trim()) fd.append('description', editForm.description.trim());
      if (editForm.price !== '') fd.append('price', editForm.price);
      fd.append('priceHidden', String(editForm.priceHidden));
      fd.append('priceUnit', editForm.priceUnit);
      fd.append('category', editForm.category);
      fd.append('active', String(editForm.active));
      fd.append('trackStock', String(editForm.trackStock));
      if (editForm.trackStock && editForm.stock !== '') fd.append('stock', editForm.stock);
      if (editFile) fd.append('image', editFile);

      await api.put(`/shop-products/update/${editingId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEditingId(null);
      setEditFile(null);
      setEditPreview(null);
      fetchProducts();
    } catch {
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    try {
      await api.delete(`/shop-products/delete/${deleteTarget}`);
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      alert('Delete failed.');
    }
  };

  /* ── Filter ── */
  const visible = section === 'all'
    ? products
    : products.filter(p => p.category === section);

  return (
    <Card>
      <PanelTitle>Shop Manager</PanelTitle>

      {/* Add product form */}
      <Section>
        <SectionTitle>Add Product</SectionTitle>

        <ImageLabel>
          {preview ? (
            <PreviewImg src={preview} alt="preview" />
          ) : (
            <ImagePlaceholder>
              <span><BoxIcon size={28} /></span>
              <span>Tap to add photo</span>
            </ImagePlaceholder>
          )}
          <HiddenInput
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </ImageLabel>

        <Field>
          <FieldLabel>Name *</FieldLabel>
          <Input placeholder="e.g. LEV3L Cap" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>

        <Field>
          <FieldLabel>Description</FieldLabel>
          <Input placeholder="Short product description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </Field>

        <Row>
          <Field style={{ flex: '0 0 110px' }}>
            <FieldLabel>Price (£)</FieldLabel>
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </Field>
          <Field style={{ flex: '0 0 150px' }}>
            <FieldLabel>Price is per</FieldLabel>
            <Select value={form.priceUnit} onChange={e => setForm({ ...form, priceUnit: e.target.value })}>
              <option value="item">Single item</option>
              <option value="bundle">Bundle shown in photo</option>
            </Select>
          </Field>
        </Row>

        <Row>
          <Field>
            <FieldLabel>Category</FieldLabel>
            <Select
              value={form.category}
              onChange={e => setForm({
                ...form,
                category: e.target.value,
                ...(e.target.value === 'in-shop' ? { trackStock: false, stock: '' } : {}),
              })}
            >
              <option value="online">Online</option>
              <option value="in-shop">In Shop</option>
            </Select>
          </Field>
          <CheckField>
            <CheckLabel>
              <input type="checkbox" checked={form.priceHidden} onChange={e => setForm({ ...form, priceHidden: e.target.checked })} />
              Hide price from non-members
            </CheckLabel>
          </CheckField>
        </Row>

        {form.category === 'online' && (
          <Row>
            <CheckField>
              <CheckLabel>
                <input type="checkbox" checked={form.trackStock} onChange={e => setForm({ ...form, trackStock: e.target.checked, stock: e.target.checked ? form.stock : '' })} />
                Track stock
              </CheckLabel>
            </CheckField>
            {form.trackStock && (
              <Field style={{ flex: '0 0 110px' }}>
                <FieldLabel>Stock qty</FieldLabel>
                <Input type="number" min="0" step="1" placeholder="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
              </Field>
            )}
          </Row>
        )}

        <AddBtn onClick={handleAdd} disabled={saving}>
          {saving ? 'Saving…' : (<><PlusIcon size={16} /> Add Product</>)}
        </AddBtn>
      </Section>

      {/* Products list */}
      <Section>
        <SectionTitleRow>
          <SectionTitle>Products ({products.length})</SectionTitle>
          <FilterRow>
            {['all', 'online', 'in-shop'].map(s => (
              <FilterBtn key={s} $active={section === s} onClick={() => setSection(s)}>
                {s === 'all' ? 'All' : s === 'online' ? 'Online' : 'In Shop'}
              </FilterBtn>
            ))}
          </FilterRow>
        </SectionTitleRow>

        {visible.length === 0 ? (
          <EmptyText>No products here yet.</EmptyText>
        ) : (
          <ProductList>
            {visible.map(p => (
              <ProductRow key={p.id} $inactive={!p.active}>
                <Thumb
                  src={p.imageUrl ? resolveImageUrl(p.imageUrl) : undefined}
                  $hasImg={Boolean(p.imageUrl)}
                >
                  {!p.imageUrl && <BoxIcon size={22} />}
                </Thumb>

                {editingId === p.id ? (
                  <EditBlock>
                    <EditImageLabel>
                      {editPreview ? (
                        <EditPreviewImg src={editPreview} alt="preview" />
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'rgba(26,26,26,0.5)' }}>Tap to change image</span>
                      )}
                      <HiddenInput
                        ref={editFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEditFileChange}
                      />
                    </EditImageLabel>

                    <Input placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                    <Input placeholder="Description" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                    <Row>
                      <Field style={{ flex: '0 0 100px' }}>
                        <Input type="number" min="0" step="0.01" placeholder="Price" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
                      </Field>
                      <Field style={{ flex: '0 0 130px' }}>
                        <Select value={editForm.priceUnit || 'item'} onChange={e => setEditForm({ ...editForm, priceUnit: e.target.value })}>
                          <option value="item">Single item</option>
                          <option value="bundle">Bundle in photo</option>
                        </Select>
                      </Field>
                    </Row>
                    <Row>
                      <Select
                        value={editForm.category}
                        onChange={e => setEditForm({
                          ...editForm,
                          category: e.target.value,
                          ...(e.target.value === 'in-shop' ? { trackStock: false, stock: '' } : {}),
                        })}
                      >
                        <option value="online">Online</option>
                        <option value="in-shop">In Shop</option>
                      </Select>
                      <CheckLabel style={{ fontSize: '0.8rem' }}>
                        <input type="checkbox" checked={editForm.priceHidden} onChange={e => setEditForm({ ...editForm, priceHidden: e.target.checked })} />
                        Hide price
                      </CheckLabel>
                      <CheckLabel style={{ fontSize: '0.8rem' }}>
                        <input type="checkbox" checked={editForm.active} onChange={e => setEditForm({ ...editForm, active: e.target.checked })} />
                        Active
                      </CheckLabel>
                      {editForm.category === 'online' && (
                        <CheckLabel style={{ fontSize: '0.8rem' }}>
                          <input type="checkbox" checked={editForm.trackStock||false} onChange={e => setEditForm({ ...editForm, trackStock: e.target.checked })} />
                          Track stock
                        </CheckLabel>
                      )}
                      {editForm.category === 'online' && editForm.trackStock && (
                        <Input type="number" min="0" step="1" placeholder="Qty" style={{ width: '70px' }} value={editForm.stock||''} onChange={e => setEditForm({ ...editForm, stock: e.target.value })} />
                      )}
                    </Row>
                    <BtnRow>
                      <SaveBtn onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</SaveBtn>
                      <CancelBtn onClick={() => setEditingId(null)}>Cancel</CancelBtn>
                    </BtnRow>
                  </EditBlock>
                ) : (
                  <ProductInfo>
                    <ProductName>{p.name} {!p.active && <InactiveTag>Hidden</InactiveTag>}</ProductName>
                    <ProductMeta>
                      <span>{p.category === 'online' ? (<><GlobeIcon size={13} /> Online</>) : (<><StoreIcon size={13} /> In Shop</>)}</span>
                      {p.price !== null && p.price !== undefined && (
                        <span>
                          £{Number(p.price).toFixed(2)}{p.priceUnit === 'bundle' ? ' /bundle' : ' /item'}
                          {p.priceHidden && (<> <LockIcon size={12} /></>)}
                        </span>
                      )}
                    </ProductMeta>
                    {p.description && <ProductDesc>{p.description}</ProductDesc>}
                    <BtnRow>
                      <EditBtn onClick={() => startEdit(p)}><PencilIcon size={13} /> Edit</EditBtn>
                      <DeleteBtn onClick={() => setDeleteTarget(p.id)}><TrashIcon size={13} /> Delete</DeleteBtn>
                    </BtnRow>
                  </ProductInfo>
                )}
              </ProductRow>
            ))}
          </ProductList>
        )}
      </Section>

      {deleteTarget && (
        <ConfirmOverlay>
          <ConfirmBox>
            <p>Delete this product permanently?</p>
            <BtnRow>
              <DeleteBtn onClick={confirmDelete}>Yes, delete</DeleteBtn>
              <CancelBtn onClick={() => setDeleteTarget(null)}>Cancel</CancelBtn>
            </BtnRow>
          </ConfirmBox>
        </ConfirmOverlay>
      )}
    </Card>
  );
};

export default AdminShop;

/* ─── Styled Components ─── */

const Card = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(26,26,26,0.1);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 640px;
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

const Section = styled.div`
  margin-bottom: 2rem;
  &:last-child { margin-bottom: 0; }
`;

const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const SectionTitle = styled.h3`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${RED};
  margin: 0 0 0.75rem;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const FilterBtn = styled.button`
  padding: 0.25rem 0.65rem;
  border-radius: 0;
  border: 1px solid ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.15)'};
  background: ${({ $active }) => $active ? 'rgba(196,30,58,0.1)' : 'transparent'};
  color: ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.55)'};
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
`;

const ImageLabel = styled.label`
  display: block;
  cursor: pointer;
  border: 2px dashed rgba(26,26,26,0.2);
  border-radius: 0;
  overflow: hidden;
  margin-bottom: 0.9rem;
  transition: border-color 0.2s;
  &:hover { border-color: ${RED}; }
`;

const ImagePlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.5rem;
  color: rgba(26,26,26,0.5);
  font-weight: 600;
  font-size: 0.85rem;
  font-family: 'Montserrat', sans-serif;
  span:first-child { display: flex; }
`;

const PreviewImg = styled.img`
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
`;

const HiddenInput = styled.input`
  display: none;
`;

const Row = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 0;
  margin-bottom: 0.75rem;
`;

const FieldLabel = styled.label`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${RED};
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
  color: ${INK};
  outline: none;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  width: 100%;
  box-sizing: border-box;
  &:focus { border-color: ${RED}; }
  &::placeholder { color: rgba(26,26,26,0.35); }
`;

const Select = styled.select`
  padding: 0.5rem 0.75rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
  color: ${INK};
  outline: none;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  flex: 1;
  &:focus { border-color: ${RED}; }
`;

const CheckField = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 0.1rem;
`;

const CheckLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(26,26,26,0.6);
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  input { cursor: pointer; accent-color: ${RED}; }
`;

const AddBtn = styled.button`
  width: 100%;
  padding: 0.65rem;
  border-radius: 0;
  border: none;
  background: ${RED};
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: background 0.2s, transform 0.1s;
  &:hover:not(:disabled) { background: #a8182f; transform: scale(1.01); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const EmptyText = styled.p`
  color: rgba(26,26,26,0.5);
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  font-style: italic;
  font-size: 0.88rem;
`;

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const ProductRow = styled.div`
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  background: rgba(255,255,255,${({ $inactive }) => $inactive ? '0.35' : '0.6'});
  border: 1px solid rgba(26,26,26,0.1);
  border-radius: 0;
  padding: 0.75rem;
  opacity: ${({ $inactive }) => $inactive ? 0.6 : 1};
`;

const Thumb = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 0;
  flex-shrink: 0;
  overflow: hidden;
  background: rgba(26,26,26,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(26,26,26,0.4);
  font-size: 1.6rem;
  background-image: ${({ $hasImg, src }) => $hasImg ? `url(${src})` : 'none'};
  background-size: cover;
  background-position: center;
`;

const ProductInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProductName = styled.p`
  font-weight: 700;
  color: ${INK};
  margin: 0 0 0.2rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.92rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InactiveTag = styled.span`
  font-size: 0.68rem;
  background: rgba(26,26,26,0.08);
  color: rgba(26,26,26,0.55);
  padding: 1px 6px;
  border-radius: 0;
  font-weight: 600;
`;

const ProductMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.78rem;
  color: ${RED};
  margin-bottom: 0.2rem;
  span { display: flex; align-items: center; gap: 0.3rem; }
`;

const ProductDesc = styled.p`
  font-size: 0.78rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: rgba(26,26,26,0.55);
  margin: 0 0 0.4rem;
`;

const EditBlock = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EditImageLabel = styled.label`
  display: block;
  cursor: pointer;
  border: 1px dashed rgba(26,26,26,0.2);
  border-radius: 0;
  overflow: hidden;
  padding: 0.4rem;
  text-align: center;
  &:hover { border-color: ${RED}; }
`;

const EditPreviewImg = styled.img`
  width: 100%;
  max-height: 120px;
  object-fit: cover;
  border-radius: 0;
  display: block;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
`;

const BtnBase = styled.button`
  padding: 0.3rem 0.7rem;
  border-radius: 0;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: background 0.2s, transform 0.1s, color 0.2s, border-color 0.2s;
  &:hover:not(:disabled) { transform: scale(1.03); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SaveBtn = styled(BtnBase)`
  border: none;
  background: ${RED};
  color: #fff;
  &:hover:not(:disabled) { background: #a8182f; }
`;

const EditBtn = styled(BtnBase)`
  border: 1px solid rgba(26,26,26,0.15);
  background: transparent;
  color: rgba(26,26,26,0.55);
  &:hover { border-color: ${INK}; color: ${INK}; }
`;

const DeleteBtn = styled(BtnBase)`
  border: 1px solid ${RED};
  background: transparent;
  color: ${RED};
  &:hover { background: rgba(196,30,58,0.08); }
`;

const CancelBtn = styled(BtnBase)`
  border: 1px solid rgba(26,26,26,0.15);
  background: transparent;
  color: rgba(26,26,26,0.55);
  &:hover { border-color: ${INK}; color: ${INK}; }
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
  border: 1px solid rgba(26,26,26,0.1);
  border-radius: 0;
  padding: 1.5rem;
  text-align: center;
  max-width: 280px;
  color: ${INK};
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  p { margin: 0 0 1rem; font-size: 0.92rem; font-family: 'Montserrat', sans-serif; font-weight: 600; }
`;
