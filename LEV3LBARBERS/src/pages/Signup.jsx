import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../utils/api';
import background from '../assets/blackWall.png';
import MysteryBoxModal from '../modals/MysteryBoxModal';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showBox, setShowBox] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/register', form);
      const token = res.data.token;
      localStorage.setItem('token', token);
      setShowBox(true);
      setMessage(res.data.message || 'Registration successful');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <Container>
      <FormWrapper>
        <h2>Sign Up</h2>
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
          <Button type="submit">Sign Up</Button>
        </form>
      </FormWrapper>

        <MysteryBoxModal
            isOpen={showBox}
            onClose={() => {
              setShowBox(false);
              window.location.href = '/profile';
            }}
        />


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
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);

  h2 {
    text-align: center;
    margin: 0.5rem 0 1.5rem 0;
    color: #F5F2ED;
    font-size: 2rem;
    font-weight: 700;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 5px;
`;

const Label = styled.label`
  display: block;
  margin: 0 0 10px 5px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #F5F2ED;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  margin-bottom: 20px;
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

const ToggleIcon = styled.div`
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  cursor: pointer;
  color: #8C857B;

  &:hover {
    color: #F5F2ED;
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
`;

const ForgotPassword = styled.p`
  margin-top: 1rem; 
  text-align: center;

  a{
    color: #F5F2ED; 
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover{
      color: #8C857B;
    }
  }
`;

const ErrorMsg = styled.p`
  color: #F5F2ED;
  text-align: center;
  font-size: 0.95rem;
  margin-bottom: 12px;
`;

const SuccessMsg = styled.p`
  color: #F5F2ED;
  text-align: center;
  font-size: 0.95rem;
  margin-bottom: 12px;
`;

const SwitchText = styled.p`
  text-align: center;
  margin: 0 0 1.3rem 0;
  font-size: 0.95rem;
  color: #F5F2ED;

  a {
    color: #C8A860;
    text-decoration: underline;
    transition: color 0.3s ease;

    &:hover {
      color: #F5F2ED;
    }
  }
`;