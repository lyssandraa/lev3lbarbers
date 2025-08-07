import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../utils/api';
import background from '../assets/logSignImg.jpg';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/register', form);
      setMessage(res.data.message || 'Registration successful');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <Container>
      <FormWrapper>
        <h2>Register</h2>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        {message && <SuccessMsg>{message}</SuccessMsg>}
        <SwitchText>
          Already have an account? <Link to="/login">Login</Link>
        </SwitchText>
        <form onSubmit={handleSubmit}>
          <InputGroup>
          <Label htmlFor='name'>Name</Label>
          <Input
            id='name'
            name="name"
            placeholder="John Smith"
            value={form.name}
            onChange={handleChange}
            required
          />
          </InputGroup>


          <InputGroup>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            name="email"
            type="email"
            placeholder="john.smith@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
          </InputGroup>

          <InputGroup>
          <Label htmlFor='password'>Password</Label>
          <PasswordWrapper>
            <Input
              id='password'
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Your Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <ToggleIcon onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </ToggleIcon>
          </PasswordWrapper>
          </InputGroup>
          <Button type="submit">Register</Button>
        </form>
      </FormWrapper>
    </Container>
  );
};

export default Register;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 90vh;
  background-image: url(${background});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1rem 2.5rem;
`;

const FormWrapper = styled.div`
  width: 100%;
  max-width: 420px;
  height: 100%;
  font-family: 'Segoe UI', sans-serif;
  

  h2 {
    text-align: center;
    margin-bottom: 1.2rem;
    color: #1d2b53;
    font-size: 1.8rem;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 5px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0;
  font-size: 1.1rem;
  font-weight: 900;
  color: #1d2b53;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  margin: 12px 0;
  border: 1px solid #ccc;
  border-radius: 10px;
  font-size: 1rem;
  background: #F2F2F2;
  opacity: 0.5;

  &:focus {
    outline: none;
    border-color: #1d2b53;
    background: #fff;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: #484547;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  margin-top: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;

  &:hover {
    background: #121214;
  }
`;

const ToggleIcon = styled.div`
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  cursor: pointer;
  color: #888;

  &:hover {
    color: #1d2b53;
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
`;

const ErrorMsg = styled.p`
  color: #d32f2f;
  text-align: center;
  font-size: 0.95rem;
  margin-bottom: 12px;
`;

const SuccessMsg = styled.p`
  color: #388e3c;
  text-align: center;
  font-size: 0.95rem;
  margin-bottom: 12px;
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 20px;
  font-size: 0.95rem;

  a {
    color: #1d2b53;
    text-decoration: underline;

    &:hover {
      color: #0f1c3e;
    }
  }
`;