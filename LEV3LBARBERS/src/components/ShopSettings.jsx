// src/components/admin/ShopSettings.js
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';

const waitLevels = [
  { label: "Level 1 - Smooth Sailing", value: 10 },
  { label: "Level 2 - Buzzin' a Little", value: 25 },
  { label: "Level 3 - Packed House", value: 999 },
];

const ShopSettings = ({ refreshShopStatus }) => {
  const [formData, setFormData] = useState({ isOpen: false, barbers: [], waitTime: 0, override: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/shop-status');
        setFormData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) return <Loading>Loading...</Loading>;

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'barbers') value = value.split(',').map(n => n.trim());
    if (field === 'waitTime') value = Number(value);
    if (field === 'isOpen') value = e.target.value === 'open';
    if (field === 'override') value = e.target.checked;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.put('/shop-status', formData);
      alert('Shop status updated.');
      refreshShopStatus?.();
    } catch (err) {
      console.error(err);
      alert('Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormCard>
      <PanelTitle>Shop Settings</PanelTitle>

      <FormGroup>
        <Label>Shop Status</Label>
        <Select value={formData.isOpen ? 'open' : 'closed'} onChange={handleChange('isOpen')}>
          <option value="open">OPEN</option>
          <option value="closed">CLOSED</option>
        </Select>
      </FormGroup>

      <FormGroup>
        <Label>Override Shop Hours</Label>
        <CheckboxWrapper>
          <Checkbox type="checkbox" checked={formData.override} onChange={handleChange('override')} />
          <span>Force shop open/closed regardless of hours</span>
        </CheckboxWrapper>
      </FormGroup>

      <FormGroup>
        <Label>Barbers</Label>
        <Input
          placeholder="Enter barbers separated by commas"
          value={formData.barbers.join(', ')}
          onChange={handleChange('barbers')}
        />
      </FormGroup>

      <FormGroup>
        <Label>Waiting Level</Label>
        <Select value={formData.waitTime} onChange={handleChange('waitTime')}>
          {waitLevels.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </Select>
      </FormGroup>

      <SaveButton onClick={handleSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </SaveButton>
    </FormCard>
  );
};

export default ShopSettings;


const FormCard = styled.div`
  background: rgba(255,255,255,0.05);
  padding: 2rem;
  border-radius: 14px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem auto;
`;

const PanelTitle = styled.h2` 
  text-align: center; 
  margin-bottom: 1.5rem;
  font-size: 1.6rem;
  color: #f5f2ed;
  text-shadow: 0 0 6px rgba(0,0,0,0.6);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: #c8b88a;
  margin-bottom: 0.5rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Input = styled.input`
  padding: 0.7rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: #fff;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #c8b88a;
  }
`;

const Select = styled.select`
  padding: 0.7rem;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.05);
  color: #fff;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #c8b88a;
  }
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ddd;
  font-size: 0.9rem;
`;

const Checkbox = styled.input`
  transform: scale(1.3);
  cursor: pointer;
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 0.85rem;
  border-radius: 8px;
  background: #c8b88a;
  color: #000;
  font-weight: bold;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
  transition: background 0.3s ease, transform 0.1s ease;

  &:hover { 
    background: #b2a072; 
    transform: scale(1.02); 
  }
`;

const Loading = styled.p`
  text-align: center;
  color: #f5f2ed;
  font-size: 1.2rem;
  margin-top: 3rem;
`;
