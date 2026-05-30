import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import ConfirmModal from '../modals/ConfirmModal';

const AdminRewards = () => {
  const [rewardCategories, setRewardCategories] = useState([]);
  const [rewardPool, setRewardPool] = useState([]);
  const [expanded, setExpanded] = useState(null); 
  const [newReward, setNewReward] = useState({ reward: '', weight: 50, type: '' });
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ reward: '', weight: 50 });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const res = await api.get('/reward-pool/get-reward-pool');
      setRewardPool(res.data);
      const cats = [...new Set(res.data.map(r => r.type))];
      setRewardCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = () => {
    const newCat = prompt("Enter new reward category/type:");
    if (newCat && !rewardCategories.includes(newCat)) {
      setRewardCategories(prev => [...prev, newCat]);
      setExpanded(newCat);
      setNewReward({ reward: '', weight: 50, type: newCat });
    }
  };

  const handleAddReward = async () => {
    if (!newReward.reward || !newReward.type) return alert("Select a category and enter reward name");
    try {
      await api.post('/reward-pool/create-reward-pool', newReward);
      await fetchRewards();
      setNewReward({ reward: '', weight: 50, type: newReward.type });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReward = async (id) => {
    try {
      await api.delete(`/reward-pool/delete-reward/${id}`);
      setRewardPool(prev => prev.filter(r => r.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (reward) => {
    setEditingId(reward.id);
    setEditValues({ reward: reward.reward, weight: reward.weight });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({ reward: '', weight: 50 });
  };

  const saveEdit = async (id, type) => {
    try {
      await api.put(`/reward-pool/update-reward/${id}`, { ...editValues, type });
      await fetchRewards();
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <FormCard>
      <PanelTitle>Reward Pool</PanelTitle>

      <AddButton onClick={handleAddCategory}>+ Add Category</AddButton>

      {rewardCategories.map(category => {
        const rewards = rewardPool.filter(r => r.type === category);
        const isOpen = expanded === category;

        return (
          <CategoryBlock key={category}>
            <CategoryHeader onClick={() => setExpanded(isOpen ? null : category)}>
              <span>{category}</span>
              <ToggleIcon>{isOpen ? '−' : '+'}</ToggleIcon>
            </CategoryHeader>

            {isOpen && (
              <CategoryContent>
                <Label>New Reward
                  <Input 
                    placeholder="Reward (e.g. 10% off)" 
                    value={newReward.reward} 
                    onChange={e => setNewReward({ ...newReward, reward: e.target.value, type: category })} 
                  />
                </Label>

                <Label>Weight
                  <Input 
                    type="number" 
                    value={newReward.weight} 
                    onChange={e => setNewReward({ ...newReward, weight: Number(e.target.value), type: category })} 
                  />
                </Label>

                <SaveButton onClick={handleAddReward}>Add Reward</SaveButton>

                <RewardList>
                  {rewards.map(r => (
                    <RewardItem key={r.id}>
                      {editingId === r.id ? (
                        <>
                          <Input 
                            value={editValues.reward}
                            onChange={e => setEditValues({...editValues, reward: e.target.value})}
                          />
                          <Input 
                            type="number"
                            value={editValues.weight}
                            onChange={e => setEditValues({...editValues, weight: Number(e.target.value)})}
                          />
                            <SaveButtonSmall onClick={() => saveEdit(r.id, r.type)}>Save</SaveButtonSmall>
                            <CancelButton onClick={cancelEditing}>Cancel</CancelButton>
                        </>
                      ) : (
                        <>
                          <span>{r.reward} (Weight: {r.weight})</span>
                          <div>
                            <EditButton onClick={() => startEditing(r)}>Edit</EditButton>
                            <DeleteButton onClick={() => setDeleteTarget(r)}>Delete</DeleteButton>
                          </div>
                        </>
                      )}
                    </RewardItem>
                  ))}
                  {rewards.length === 0 && <EmptyText>No rewards yet.</EmptyText>}
                </RewardList>
              </CategoryContent>
            )}
          </CategoryBlock>
        );
      })}

      {deleteTarget && (
        <ConfirmModal
          message={`Are you sure you want to delete "${deleteTarget.reward}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDeleteReward(deleteTarget.id)}
        />
        )}
    </FormCard>
  );
};

export default AdminRewards;

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

const CategoryBlock = styled.div`
  margin-top: 1rem;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255,255,255,0.08);
`;

const CategoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  background: rgba(255,255,255,0.12);
  font-weight: bold;
`;

const ToggleIcon = styled.span`
  font-size: 1.5rem;
`;

const CategoryContent = styled.div`
  padding: 1rem;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  font-weight: bold;
  color: #c8b88a;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const Input = styled.input`
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.1);
  color: white;
  outline: none;

  &:focus {
    border-color: #4cafef;
  }
`;

const RewardList = styled.div`
  margin-top: 1rem;
`;

const RewardItem = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.05);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
`;

const ButtonBase = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1.2;
  min-width: 90px;
  text-align: center;
  transition: background 0.3s ease, transform 0.1s ease;

  &:hover {
    transform: scale(1.03);
  }
`;

const SaveButton = styled(ButtonBase)`
  background: #c8b88a;
  color: #000;

  &:hover { background: #b2a072; }
`;

const AddButton = styled(ButtonBase)`
  background: #c8b88a;
  color: #000;

  &:hover { background: #b2a072; }
`;

const EditButton = styled(ButtonBase)`
  background: #fbc02d;
  color: #000;

  &:hover { background: #f9a825; }
`;

const DeleteButton = styled(ButtonBase)`
  background: #e57373;
  color: #fff;

  &:hover { background: #d15f5f; }
`;

const CancelButton = styled(ButtonBase)`
  background: #9e9e9e;
  color: #fff;

  &:hover { background: #7e7e7e; }
`;

const SaveButtonSmall = styled(SaveButton)`
  min-width: auto;   
  padding: 0.5rem 0.75rem;
`;

const EmptyText = styled.div`
  text-align: center;
  color: rgba(255,255,255,0.6);
  font-style: italic;
  margin-top: 0.5rem;
`;