import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import background from '../assets/logSignImage.png';
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
          
          <PasswordReset style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a href="/forgot-password">Forgot Password?</a>
          </PasswordReset>

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
  min-height: 100vh;
  padding: 1rem 2rem;

  background-image: url(${background});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const FormWrapper = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 3rem 1rem;
  border-radius: 14px;
  background: rgba(15, 15, 16, 0.85); /* matte black glass effect */
  backdrop-filter: blur(6px);
  border: 1px solid rgba(212, 175, 55, 0.15);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);

  h2 {
    text-align: center;
    margin-top: 0;
    margin-bottom: 1.2rem;
    background: linear-gradient(
    10deg,
    #a07400 0%,
    #c89300 20%,
    #ffd700 40%,
    #fff8c0 50%,
    #ffcc00 60%,
    #c89300 80%,
    #a07400 100%
  );
  background-size: 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
    font-size: 1.8rem;
    font-weight: 700;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.6rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff0db; 
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 10px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.08);
  color: #f5f5f5;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(245, 245, 245, 0.6);
  }

  &:focus {
    outline: none;
    border-color: #d4af37;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
`;

const ToggleIcon = styled.div`
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  cursor: pointer;
  color: #d4af37;

  &:hover {
    color: #c9a84b;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background: #fff0db;
  color: #0b0b0c;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  margin-top: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: #c9a84b;
  }
`;

const ErrorMsg = styled.p`
  color: #f28c8c; 
  text-align: center;
  font-size: 0.95rem;
  margin-bottom: 12px;
`;

const SuccessMsg = styled.p`
  color: #a6e3a1; 
  text-align: center;
  font-size: 0.95rem;
  margin-bottom: 12px;
`;

const SwitchText = styled.p`
  text-align: center;
  margin-top: 20px;
  margin-bottom: 2rem;
  font-size: 0.95rem;
  color: #fff0db; 

  a {
    color: #c99a32;
    text-decoration: underline;

    &:hover {
      color: #c9a84b;
    }
  }
`;

const PasswordReset = styled.p`
  a {
    color: #fff0db;
    text-decoration: none;
  }

`;