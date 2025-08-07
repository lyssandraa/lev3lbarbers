import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import styled from 'styled-components';

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {

  const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
  }

    const fetchUserProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setProfile(res.data.user);
      } catch (err) {
        console.error(err.response?.data || err.message);
        navigate('/login');
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete your account? This action is permanent.');
    if (!confirmDelete) return;

    try {
      await api.delete('/auth/delete'); 
      localStorage.removeItem('token');
      navigate('/');
    } catch (err) {
      alert('Failed to delete account.');
    }
  };

  if (!profile) return <Loading>Loading...</Loading>;

  return (
    <Container>
      <Card>
        <SectionTitle>Profile</SectionTitle>
        <Field>
          <Label>Name</Label>
          <Value>{profile.name}</Value>
        </Field>
        <Field>
          <Label>Email</Label>
          <Value>{profile.email}</Value>
        </Field>

        <Button onClick={handleLogout}>Log Out</Button>
      </Card>

      <SettingsSection>
        <SectionTitle>Settings</SectionTitle>
        <SettingButton onClick={handleChangePassword}>Change Password</SettingButton>
        <DeleteButton onClick={handleDeleteAccount}>Delete Account</DeleteButton>
      </SettingsSection>
    </Container>
  );
};

export default UserProfile;

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, #e3f2fd, #ffffff);
  padding: 3rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Arial', sans-serif;
`;

const Card = styled.div`
  background: #ffffff;
  padding: 2rem;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  color: #1d2b53;
  font-size: 1.4rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const Field = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.div`
  font-size: 0.85rem;
  color: #777;
  margin-bottom: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Value = styled.div`
  font-size: 1.1rem;
  color: #1d2b53;
  font-weight: 500;
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: #1d2b53;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 10px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #0f1c3e;
  }
`;

const SettingsSection = styled.div`
  background: #ffffff;
  padding: 2rem;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 450px;
`;

const SettingButton = styled(Button)`
  background: #4a90e2;

  &:hover {
    background: #397bd0;
  }
`;

const DeleteButton = styled(Button)`
  background: #e53935;
  margin-top: 10px;

  &:hover {
    background: #c62828;
  }
`;

const Loading = styled.p`
  text-align: center;
  color: #555;
  font-size: 1.2rem;
  margin-top: 3rem;
`;
