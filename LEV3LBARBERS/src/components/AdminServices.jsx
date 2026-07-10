import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import ConfirmModal from '../modals/ConfirmModal';
import ServicePreviewModal from '../modals/ServicePreviewModal';

import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, } from '@dnd-kit/sortable';
import SortableItem from '../common/SortableItem';
import { EyeIcon, PencilIcon, TrashIcon, PlusIcon } from '../common/icons.jsx';

const CREAM = '#f4f0e8';
const INK = '#1a1a1a';
const RED = '#C41E3A';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [newService, setNewService] = useState({
    type: 'public',
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    order: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    order: ''
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services/all-services');
      setServices(res.data.allServices || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddService = async (type) => {
    if (!newService.name) return alert("Service name is required");
    try {
      await api.post('/services/add-service', { ...newService, type });
      await fetchServices();
      setNewService({ type: 'public', name: '', description: '', price: '', imageUrl: '', order: '' });
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || 'Failed to add service';
      alert(message);
    }
  };

  const handleDeleteService = async (id) => {
    try {
      await api.delete(`/services/delete-service/${id}`);
      await fetchServices();
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (service) => {
    setEditingId(service.id);
    setEditValues({
      name: service.name,
      description: service.description || '',
      price: service.price || '',
      imageUrl: service.imageUrl || '',
      order: service.order || ''
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({ name: '', description: '', price: '', imageUrl: '', order: '' });
  };

  const saveEdit = async (id, type) => {
    try {
      await api.put(`/services/edit-service/${id}`, { ...editValues, type });
      await fetchServices();
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Group by type
  const grouped = services.reduce((acc, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s);
    return acc;
  }, { public: [], member: [] });

  const serviceTypes = Object.keys(grouped);

  // Handle drag & drop reordering
  const handleDragEnd = async (event, type) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = grouped[type];
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);

    // Update state
    const newServices = {
      ...grouped,
      [type]: newItems,
    };

    setServices([...newServices.public, ...newServices.member]);

    // Update backend
    try {
      await api.put('/services/reorder-services', {
        services: newItems.map((s, idx) => ({ id: s.id, order: idx }))
      });
    } catch (err) {
      console.error("Failed to update order", err);
    }
  };

  return (
    <FormCard>
      <PanelTitle>Manage Services</PanelTitle>
      <PreviewButton onClick={() => setPreviewMode(true)}>
        <EyeIcon width={16} height={16} /> Preview Service Menu
      </PreviewButton>

      {previewMode && (
        <ServicePreviewModal
          services={services}
          onCancel={() => setPreviewMode(false)}
        />
      )}
      {/* {previewMode && (
        <Overlay>
          <ModalContent>
            <CloseButton onClick={() => setPreviewMode(false)}>×</CloseButton>
            <ServiceMenu />
          </ModalContent>
        </Overlay>
      )} */}

      {serviceTypes.map(type => {
        const items = grouped[type];
        const isOpen = expanded === type;

        return (
          <CategoryBlock key={type}>
            <CategoryHeader onClick={() => setExpanded(isOpen ? null : type)}>
              <span>{type.toUpperCase()}</span>
              <ToggleIcon>{isOpen ? '−' : '+'}</ToggleIcon>
            </CategoryHeader>

            {isOpen && (
              <CategoryContent>
                <Label>Service Name
                  <Input
                    placeholder="e.g. Haircut"
                    value={newService.name}
                    onChange={e => setNewService({ ...newService, name: e.target.value, type })}
                  />
                </Label>
                <Label>Description
                  <Input
                    placeholder="Optional description"
                    value={newService.description}
                    onChange={e => setNewService({ ...newService, description: e.target.value, type })}
                  />
                </Label>
                <Label>Price
                  <Input
                    type="number"
                    placeholder="e.g. 15"
                    value={newService.price}
                    onChange={e => setNewService({ ...newService, price: e.target.value, type })}
                  />
                </Label>
                <Label>Image URL
                  <Input
                    placeholder="Optional image link"
                    value={newService.imageUrl}
                    onChange={e => setNewService({ ...newService, imageUrl: e.target.value, type })}
                  />
                </Label>
                <SaveButton onClick={() => handleAddService(type)}>
                  <PlusIcon width={14} height={14} /> Add Service
                </SaveButton>
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, type)}
                >
                  <SortableContext
                    items={items.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ServiceList>
                      {items.map(s => (
                        <SortableItem key={s.id} id={s.id}>
                          <ServiceItem>
                            {editingId === s.id ? (
                              <>
                              <Input
                                value={editValues.name}
                                onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                                placeholder="Service name"
                              />
                              {s.price !== undefined && (
                                <Input
                                  type="number"
                                  value={editValues.price}
                                  onChange={e => setEditValues({ ...editValues, price: Number(e.target.value) })}
                                  placeholder="Price"
                                />
                              )}
                                <SaveButtonSmall onClick={() => saveEdit(s.id, type)}>Save</SaveButtonSmall>
                                <CancelButton onClick={cancelEditing}>Cancel</CancelButton>
                            </>
                          ) : (
                            <>
                              <span>{s.name} {s.price && `(£${s.price})`}</span>
                              <div>
                                <EditButton onClick={() => startEditing(s)}>
                                  <PencilIcon width={14} height={14} /> Edit
                                </EditButton>
                                <DeleteButton onClick={() => setDeleteTarget(s)}>
                                  <TrashIcon width={14} height={14} /> Delete
                                </DeleteButton>
                              </div>
                            </>
                          )}
                          </ServiceItem>
                        </SortableItem>
                      ))}
                      {items.length === 0 && <EmptyText>No services yet.</EmptyText>}
                    </ServiceList>
                  </SortableContext>
                </DndContext>
              </CategoryContent>
            )}
          </CategoryBlock>
        );
      })}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.name}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDeleteService(deleteTarget.id)}
        />
      )}
    </FormCard>
  );
};

export default AdminServices;

const FormCard = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(26,26,26,0.1);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 700px;
  margin: 0 auto 2rem auto;
`;

const PanelTitle = styled.h2`
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.6rem;
  color: ${INK};
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
`;


const PreviewButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  color: ${INK};
  border: 1px solid rgba(26,26,26,0.15);
  border-radius: 0;
  padding: 0.6rem 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  transition: border-color 0.2s ease, color 0.2s ease;
  &:hover { border-color: ${INK}; color: ${INK}; }
`;


const CategoryBlock = styled.div`
  margin-top: 1rem;
  border-radius: 0;
  overflow: hidden;
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(26,26,26,0.1);
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  background: rgba(26,26,26,0.04);
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 1px;
  color: ${INK};
  font-weight: normal;
`;

const ToggleIcon = styled.span`
  font-size: 1.5rem;
  color: ${RED};
`;

const CategoryContent = styled.div`
  padding: 1rem;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  font-family: 'Bebas Neue', sans-serif;
  color: ${RED};
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const Input = styled.input`
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  outline: none;

  &:focus {
    border-color: ${RED};
  }

  &::placeholder {
    color: rgba(26,26,26,0.35);
  }
`;

const ServiceList = styled.div`
  margin-top: 1rem;
`;

const ServiceItem = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.55);
  padding: 0.75rem 1rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.08);
  margin-bottom: 0.5rem;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
`;

const ButtonBase = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 0;
  border: none;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.2;
  min-width: 90px;
  text-align: center;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
`;

const SaveButton = styled(ButtonBase)`
  background: ${RED};
  color: #fff;
  &:hover { background: #a91830; }
`;

const EditButton = styled(ButtonBase)`
  background: transparent;
  border: 1px solid rgba(26,26,26,0.15);
  color: rgba(26,26,26,0.55);
  margin-right: 0.5rem;
  &:hover { border-color: ${INK}; color: ${INK}; }
`;

const DeleteButton = styled(ButtonBase)`
  background: rgba(196,30,58,0.04);
  border: 1px solid ${RED};
  color: ${RED};
  &:hover { background: rgba(196,30,58,0.08); }
`;

const CancelButton = styled(ButtonBase)`
  background: transparent;
  border: 1px solid rgba(26,26,26,0.15);
  color: rgba(26,26,26,0.55);
  &:hover { border-color: ${INK}; color: ${INK}; }
`;

const SaveButtonSmall = styled(SaveButton)`
  min-width: auto;
  padding: 0.5rem 0.75rem;
`;

const EmptyText = styled.div`
  text-align: center;
  color: rgba(26,26,26,0.55);
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  font-style: italic;
  margin-top: 0.5rem;
`;
