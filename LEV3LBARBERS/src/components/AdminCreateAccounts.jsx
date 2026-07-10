import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeOffIcon, UsersIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const emptyForm = { name: '', email: '', password: '' };

const CreateForm = ({ title, description, endpoint, role }) => {
  const [form, setForm]           = useState(emptyForm);
  const [showPass, setShowPass]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [error, setError]         = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(''); setError('');
    try {
      await api.post(endpoint, form);
      setMsg(`${role} account created for ${form.email}.`);
      setForm(emptyForm);
      setTimeout(() => setMsg(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account.');
    } finally { setSaving(false); }
  };

  return (
    <Section>
      <SectionTitle>{title}</SectionTitle>
      <SectionDesc>{description}</SectionDesc>
      <form onSubmit={handleSubmit}>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <FieldInput name="name" placeholder="Display name" value={form.name} onChange={handleChange} required />
        </Field>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <FieldInput name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
        </Field>
        <Field>
          <FieldLabel>Password</FieldLabel>
          <PassWrap>
            <FieldInput
              name="password"
              type={showPass ? 'text' : 'password'}
              placeholder="Strong password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <EyeBtn type="button" onClick={() => setShowPass(p => !p)}>
              {showPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </EyeBtn>
          </PassWrap>
          <Hint>8+ chars, uppercase, lowercase, number, and special character</Hint>
        </Field>
        {msg   && <StatusMsg $ok>{msg}</StatusMsg>}
        {error && <StatusMsg>{error}</StatusMsg>}
        <SubmitBtn type="submit" disabled={saving}>
          {saving ? 'Creating…' : `Create ${role} Account`}
        </SubmitBtn>
      </form>
    </Section>
  );
};

const AdminCreateAccounts = ({ view }) => {
  const { isDeveloper } = useAuth();

  return (
    <FormCard>
      <PanelTitle><UsersIcon size={20} /> Account Management</PanelTitle>

      {(view === 'createStaff' || isDeveloper) && (
        <CreateForm
          title="Create Staff Account"
          description="Staff can scan QR codes, add stamps, and handle daily in-shop operations."
          endpoint="/auth/admin/create-staff"
          role="Staff"
        />
      )}

      {view === 'createAdmin' && isDeveloper && (
        <>
          <Divider />
          <CreateForm
            title="Create Admin Account"
            description="Admins manage the full reward system, products, settings, and can create staff accounts."
            endpoint="/auth/admin/create-admin"
            role="Admin"
          />
        </>
      )}
    </FormCard>
  );
};

export default AdminCreateAccounts;

/* ─────────── Styles ─────────── */

const FormCard = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.1);
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 520px;
  margin: 0 auto 2rem;
`;

const PanelTitle = styled.h2`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  text-align: center;
  margin-bottom: 1.5rem;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.6rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${INK};
`;

const Section = styled.div``;

const SectionTitle = styled.h3`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem;
  font-weight: 400;
  color: ${RED};
  margin-bottom: 0.3rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
`;

const SectionDesc = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(26,26,26,0.55);
  margin-bottom: 1.1rem;
  line-height: 1.5;
`;

const Field = styled.div`margin-bottom: 1rem;`;

const FieldLabel = styled.label`
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  color: rgba(26,26,26,0.6);
  font-weight: 700;
  margin-bottom: 0.35rem;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 0.6rem 0.85rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15);
  background: #ffffff;
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.92rem;
  outline: none;
  box-sizing: border-box;
  &::placeholder { color: rgba(26,26,26,0.35); }
  &:focus { border-color: ${RED}; }
`;

const PassWrap = styled.div`position: relative;`;

const EyeBtn = styled.button`
  position: absolute;
  top: 50%; right: 12px;
  transform: translateY(-50%);
  background: none; border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: rgba(26,26,26,0.45);
  &:hover { color: ${INK}; }
`;

const Hint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  color: rgba(26,26,26,0.5);
  font-weight: 600;
  margin-top: 0.25rem;
  font-style: italic;
`;

const StatusMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ $ok }) => $ok ? '#2e7d32' : RED};
  margin: 0.5rem 0;
  text-align: center;
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 0.72rem;
  border-radius: 0;
  border: none;
  cursor: pointer;
  background: ${RED};
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  font-weight: 400;
  font-size: 0.95rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: background 0.2s;
  margin-top: 0.4rem;
  &:hover:not(:disabled) { background: #a81830; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(26,26,26,0.1);
  margin: 1.8rem 0;
`;
