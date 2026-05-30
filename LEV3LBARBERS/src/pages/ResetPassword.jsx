import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../utils/api';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState({ error: '', message: '' });
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (t) setToken(t);
    else setStatus({ error: 'Invalid reset token' });
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', message: '' });

    try {
      const res = await api.post('/auth/reset-password', { token, newPassword });
      setStatus({ message: res.data.message });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setStatus({ error: err.response?.data?.message || 'Password reset failed' });
    }
  };

  return (
    <Container>
      <FormWrapper>
        <h2>Reset Password</h2>
        {status.error && <ErrorMsg>{status.error}</ErrorMsg>}
        {status.message && <SuccessMsg>{status.message}</SuccessMsg>}
        <form onSubmit={handleSubmit}>
          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Button type="submit">Reset Password</Button>
        </form>
      </FormWrapper>
    </Container>
  );
};

export default ResetPassword;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #0d0d0d;
  padding: 1rem 2.5rem;
`;

const FormWrapper = styled.div`
  background: rgba(255, 255, 255, 0.03);
  padding: 3rem 2rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
  max-width: 420px;
  width: 100%;

  h2 {
    text-align: center;
    color: #f5f2ed;
    margin-bottom: 1rem;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 2rem;
    letter-spacing: 1px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  margin: 12px 0;
  border-radius: 10px;
  border: none;
  font-size: 1rem;
  background: #ede9e3;
  color: #121214;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.25);

  &:focus {
    outline: none;
    border: 1px solid #c8a860;
    background: #fff;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: #c8a860;
  color: #000;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 10px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #b09050;
  }
`;

const ErrorMsg = styled.p`
  color: #e57373;
  text-align: center;
`;

const SuccessMsg = styled.p`
  color: #66bb6a;
  text-align: center;
`;
