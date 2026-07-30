import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { UsersIcon } from '../common/icons';
import ConfirmModal from '../modals/ConfirmModal';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const AdminUsers = () => {
  const [users,      setUsers]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [busyId,     setBusyId]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = useCallback(async (targetPage, targetSearch) => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/users', { params: { page: targetPage, search: targetSearch } });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(1, ''); }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search);
  };

  const goToPage = (p) => {
    setPage(p);
    fetchUsers(p, search);
  };

  const toggleSuspend = async (user) => {
    setBusyId(user.id);
    try {
      await api.put(`/admin/users/${user.id}/suspend`, { suspended: !user.suspended });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, suspended: !u.suspended } : u));
    } catch {
      setError('Failed to update account.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    setBusyId(target.id);
    try {
      await api.delete(`/admin/users/${target.id}`);
      fetchUsers(page, search);
    } catch {
      setError('Failed to delete account.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FormCard>
      <PanelTitle><UsersIcon width={20} height={20} /> Customer Accounts</PanelTitle>
      <InfoBox>
        Showing signed-up customer accounts only — staff/admin accounts are managed under Create Staff / Create Admin.
        "Delete" scrubs personal details (name, email, etc.) and blocks login, but keeps order/booking history for accounting purposes — it does not erase everything.
      </InfoBox>

      <SearchRow onSubmit={handleSearchSubmit}>
        <SearchInput
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <SearchBtn type="submit">Search</SearchBtn>
      </SearchRow>

      {error && <StatusMsg>{error}</StatusMsg>}

      {loading ? (
        <Loading>Loading…</Loading>
      ) : users.length === 0 ? (
        <EmptyText>No accounts found.</EmptyText>
      ) : (
        <>
          <ResultCount>{total} account{total !== 1 ? 's' : ''}</ResultCount>
          <UserList>
            {users.map(u => (
              <UserRow key={u.id}>
                <UserInfo>
                  <UserNameRow>
                    <UserName>{u.name}</UserName>
                    {u.deletedAt && <Badge $tone="del">Deleted</Badge>}
                    {u.suspended && !u.deletedAt && <Badge $tone="warn">Suspended</Badge>}
                    {!u.emailVerified && !u.deletedAt && <Badge $tone="dim">Unverified</Badge>}
                  </UserNameRow>
                  <UserEmail>{u.email}</UserEmail>
                  <UserMeta>{u.tier} · Joined {new Date(u.createdAt).toLocaleDateString('en-GB')}</UserMeta>
                </UserInfo>
                {!u.deletedAt && (
                  <UserActions>
                    <SmallBtn
                      $warn={!u.suspended}
                      disabled={busyId === u.id}
                      onClick={() => toggleSuspend(u)}
                    >
                      {u.suspended ? 'Reinstate' : 'Suspend'}
                    </SmallBtn>
                    <SmallBtn $del disabled={busyId === u.id} onClick={() => setDeleteTarget(u)}>
                      Delete
                    </SmallBtn>
                  </UserActions>
                )}
              </UserRow>
            ))}
          </UserList>

          {totalPages > 1 && (
            <PaginationRow>
              <PageBtn disabled={page <= 1} onClick={() => goToPage(page - 1)}>← Prev</PageBtn>
              <PageLabel>Page {page} of {totalPages}</PageLabel>
              <PageBtn disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>Next →</PageBtn>
            </PaginationRow>
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.name}"'s account? Their personal details will be scrubbed and login blocked. Order/booking history is kept.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </FormCard>
  );
};

export default AdminUsers;

/* ─────────── Styles ─────────── */

const FormCard = styled.div`
  background: rgba(255,255,255,0.55);
  padding: 2rem;
  border-radius: 0;
  border: 1px solid rgba(26,26,26,0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  width: 100%;
  max-width: 680px;
  margin: 0 auto 2rem;
`;

const PanelTitle = styled.h2`
  display: flex; align-items: center; justify-content: center; gap: 0.6rem;
  text-align: center;
  margin-bottom: 0.9rem;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${INK};
`;

const InfoBox = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(26,26,26,0.6);
  background: rgba(255,255,255,0.5);
  border-left: 2px solid ${RED};
  padding: 0.65rem 0.9rem;
  line-height: 1.55;
  margin-bottom: 1.2rem;
`;

const SearchRow = styled.form`
  display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1; min-width: 160px;
  padding: 0.6rem 0.8rem; border-radius: 0;
  border: 1px solid rgba(26,26,26,0.15); background: #ffffff;
  font-family: 'Montserrat', sans-serif; font-size: 0.86rem;
  color: ${INK}; outline: none;
  &::placeholder { color: rgba(26,26,26,0.35); }
  &:focus { border-color: ${RED}; }
`;

const SearchBtn = styled.button`
  padding: 0.6rem 1.1rem; border-radius: 0; border: none;
  background: ${INK}; color: #fff;
  font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; text-transform: uppercase;
  font-size: 0.85rem; cursor: pointer;
  &:hover { opacity: 0.85; }
`;

const ResultCount = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.75rem; font-weight: 600;
  color: rgba(26,26,26,0.5); margin: 0 0 0.6rem;
`;

const Loading = styled.p`
  text-align: center; color: rgba(26,26,26,0.6);
  font-family: 'Montserrat', sans-serif; font-weight: 600; padding: 2rem 0;
`;

const EmptyText = styled.p`
  text-align: center; font-style: italic;
  font-family: 'Montserrat', sans-serif; font-size: 0.85rem;
  color: rgba(26,26,26,0.55); padding: 2rem 0;
`;

const UserList = styled.div`
  display: flex; flex-direction: column; gap: 0.5rem;
`;

const UserRow = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 0.8rem;
  background: rgba(255,255,255,0.5); border: 1px solid rgba(26,26,26,0.08);
  padding: 0.7rem 0.9rem; border-radius: 0;
  flex-wrap: wrap;
`;

const UserInfo = styled.div`min-width: 0; flex: 1;`;

const UserNameRow = styled.div`
  display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;
`;

const UserName = styled.span`
  font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.9rem; color: ${INK};
`;

const UserEmail = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.78rem;
  color: rgba(26,26,26,0.6); margin: 0.15rem 0 0;
`;

const UserMeta = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.72rem;
  color: rgba(26,26,26,0.45); margin: 0.15rem 0 0;
`;

const Badge = styled.span`
  font-family: 'Montserrat', sans-serif; font-size: 0.62rem; font-weight: 800;
  letter-spacing: 0.5px; text-transform: uppercase;
  padding: 2px 7px; border-radius: 999px;
  color: ${({ $tone }) => $tone === 'del' ? '#fff' : $tone === 'warn' ? RED : 'rgba(26,26,26,0.55)'};
  background: ${({ $tone }) => $tone === 'del' ? INK : $tone === 'warn' ? 'rgba(196,30,58,0.1)' : 'rgba(26,26,26,0.08)'};
`;

const UserActions = styled.div`
  display: flex; gap: 0.4rem; flex-shrink: 0;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const SmallBtn = styled.button`
  padding: 5px 12px; border-radius: 0; font-size: 0.75rem;
  font-family: 'Montserrat', sans-serif; font-weight: 700; cursor: pointer;
  border: 1px solid ${({ $del, $warn }) => $del ? RED : $warn ? 'rgba(26,26,26,0.2)' : '#2e7d32'};
  color: ${({ $del, $warn }) => $del ? RED : $warn ? INK : '#2e7d32'};
  background: transparent;
  transition: background 0.18s;
  &:hover:not(:disabled) { background: ${({ $del }) => $del ? 'rgba(196,30,58,0.08)' : 'rgba(26,26,26,0.05)'}; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const PaginationRow = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 1rem;
  margin-top: 1.2rem;
`;

const PageBtn = styled.button`
  padding: 0.4rem 0.9rem; border-radius: 0; border: 1px solid rgba(26,26,26,0.15);
  background: transparent; color: ${INK};
  font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 0.8rem; cursor: pointer;
  &:hover:not(:disabled) { border-color: ${INK}; }
  &:disabled { opacity: 0.35; cursor: default; }
`;

const PageLabel = styled.span`
  font-family: 'Montserrat', sans-serif; font-size: 0.78rem; color: rgba(26,26,26,0.6);
`;

const StatusMsg = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.82rem; font-weight: 600;
  color: #c62828; margin: 0 0 0.8rem; text-align: center;
`;
