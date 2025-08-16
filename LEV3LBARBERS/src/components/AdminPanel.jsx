import React, {useEffect, useState} from 'react';
import api from '../utils/api';
import styled from 'styled-components';
import background from '../assets/adminImg.png';

const waitLevels = [
    { label: "Level 1 - Smooth Sailing", value: 10 },
    { label: "Level 2 - Buzzin' a Little", value: 25 },
    { label: "Level 3 - Packed House", value: 999 },
  ];
  

const AdminPanel = ({refreshShopStatus}) => {
    const [formData, setFormData] = useState({
        isOpen: false,
        barbers: [],
        waitTime: 0,
        override: false,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/shop-status');
                setFormData(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch shop status:', err);
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleChange = (field) => (e) => {
        let value = e.target.value;
        if(field === "barbers") {
            value = value.split(',').map(name => name.trim());
        }
        if(field === "waitTime") {
            value = Number(value); 
        }
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        setSaving(true);

        try {
            await api.put('/shop-status', formData);
            alert('Shop status updated.');

            if(refreshShopStatus) refreshShopStatus();
        } catch (err) {
            console.error('Updated failed:', err);
            alert('Failed to update.');
        }finally{
            setSaving(false);
        }
    }

    if(loading) return <p>Loading...</p>

    return (
        <PanelWrapper>
          <PanelTitle>Shop Settings</PanelTitle>

          <FormCard>
          <Label>
            Shop Status
            <Select
              value={formData.isOpen ? "open" : "closed"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isOpen: e.target.value === "open",
                }))
              }
            >
              <option value="open">OPEN</option>
              <option value="closed">CLOSED</option>
            </Select>
          </Label>
    
          <Label>
            Override Shop Hours
            <Checkbox
            type="checkbox"
            checked={formData.override}
            onChange={(e) =>
            setFormData((prev) => ({
            ...prev,
            override: e.target.checked,
            }))
            }
        />
        </Label>

          <Label>
            Barbers
            <Input
              type="text"
              value={formData.barbers.join(", ")}
              onChange={handleChange("barbers")}
            />
          </Label>
    
          <Label>
            Waiting Level
            <Select
                value={formData.waitTime}
                onChange={(e) =>
                    setFormData((prev) => ({
                    ...prev,
                    waitTime: Number(e.target.value),
                }))
                } 
                >
                {waitLevels.map((level) => (
                <option key={level.value} value={level.value}>
                {level.label}
                </option>
                ))}
            </Select>
        </Label>
    
          <SaveButton onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </SaveButton>
          </FormCard>
        </PanelWrapper>
      );
    };
    
export default AdminPanel;

const PanelWrapper = styled.div`
  height: 90vh;
  padding: 2rem;
  max-width: 500px;
  margin: auto;
  background-image: url(${background});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  font-family: "Segoe UI", sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #f2f2f2;
`;

const PanelTitle = styled.h2`
  margin-bottom: 2rem;
  text-align: center;
`;

const FormCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
`;


const Label = styled.label`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
  font-weight: bold;
  font-size: 0.95rem;
  color: #ddd;
`;

const Checkbox = styled.input`
  transform: scale(2);
  margin-top: 0.5rem;
  margin-left: 0.5rem;
`;

const Input = styled.input`
  display: block;
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  width: 100%;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #666;
  background-color: rgba(255,255,255,0.08);
  color: #fff;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);

  &:focus {
    outline: none;
    border-color: #aaa;
    background-color: rgba(255,255,255,0.15);
  }
`;

const Select = styled.select`
  display: block;
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  width: 100%;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #666;
  background-color: rgba(255,255,255,0.08);
  color: #fff;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);

  &:focus {
    outline: none;
    border-color: #aaa;
    background-color: rgba(255,255,255,0.15);
  }
`;

const SaveButton = styled.button`
  display: block;
  width: 50%;
  padding: 0.8rem;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid #888;
  border-radius: 8px;
  cursor: pointer;
  margin: 1rem auto;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: background 0.3s ease, transform 0.2s ease;

  &:hover:enabled {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.02);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.03);
    color: #999;
    border-color: #555;
    cursor: not-allowed;
  }
`;

const StatusText = styled.p`
  text-align: center;
  font-size: 1.2rem;
  margin-top: 4rem;
`;