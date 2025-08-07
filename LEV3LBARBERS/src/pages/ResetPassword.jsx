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
  background: linear-gradient(to bottom right, #e3f2fd, #ffffff);
`;

const FormWrapper = styled.div`
  background: #fff;
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.1);
  max-width: 420px;
  width: 100%;

  h2 {
    text-align: center;
    color: #1d2b53;
    margin-bottom: 1rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  margin: 12px 0;
  border-radius: 10px;
  border: 1px solid #ccc;
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: #1d2b53;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  margin-top: 10px;
  cursor: pointer;

  &:hover {
    background: #10203c;
  }
`;

const ErrorMsg = styled.p`
  color: #d32f2f;
  text-align: center;
`;

const SuccessMsg = styled.p`
  color: #388e3c;
  text-align: center;
`;
