import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import background from '../assets/blackWall.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ error: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', message: '' });

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setStatus({ message: res.data.message });
    } catch (err) {
      setStatus({ error: err.response?.data?.message || 'Error sending reset email' });
    }
  };

  return (
    <Container>
      <FormWrapper>
        <h2>Forgot Password</h2>
        {status.error && <ErrorMsg>{status.error}</ErrorMsg>}
        {status.message && <SuccessMsg>{status.message}</SuccessMsg>}
        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit">Send Reset Link</Button>
        </form>
      </FormWrapper>
    </Container>
  );
};

export default ForgotPassword;

const Container = styled.div`
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background-image: url(${background});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const FormWrapper = styled.div`
  margin-top: 15rem;
  padding: 3rem 4rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
  max-width: 420px;
  width: 100%;

  h2 {
    text-align: center;
    color: #F5F2ED;
    margin-bottom: 1rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  margin: 1rem 0 20px 0;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  background: #EDE9E3;
  color: #121214;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.25);

  &:focus {
    outline: none;
    border: 1px solid #8C857B;
    background: #fff;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: #C8A860;
  color: #000;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  margin: 10px 0;
  cursor: pointer;
  font-weight: 700;
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
