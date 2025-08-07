import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import background from '../assets/logSignImg.jpg';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../utils/api';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
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
      const res = await api.post('/auth/login', form);
      console.log("Login response:", res.data); 

      const { token, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      setMessage('Login successful!');
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <Container>
      <FormWrapper>
        <h2>Log In</h2>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        {message && <SuccessMsg>{message}</SuccessMsg>}
        <SwitchText>
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </SwitchText>
        <form onSubmit={handleSubmit}>
          <InputGroup>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type="email"
            name="email"
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
              type={showPassword ? 'text' : 'password'}
              name="password"
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
          <p style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a href="/forgot-password" style={{ color: '#1d2b53', textDecoration: 'none' }}>
                Forgot Password?
            </a>
            </p>

          <Button type="submit">Log in</Button>
        </form>
      </FormWrapper>
    </Container>
  );
};

export default Login;

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
    color: white;
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
  color: white;
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
  color: white;

  &:hover {
    color: #1d2b53;
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
`;

const ErrorMsg = styled.p`
  color: white;
  text-align: center;
  font-size: 0.95rem;
  margin-bottom: 12px;
`;

const SuccessMsg = styled.p`
  color: white;
  text-align: center;
  font-size: 0.95rem;
  margin-bottom: 12px;
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 20px;
  font-size: 0.95rem;

  a {
    color: white;
    text-decoration: underline;

    &:hover {
      color: #0f1c3e;
    }
  }
`;