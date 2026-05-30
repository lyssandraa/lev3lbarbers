import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import styled from 'styled-components';
import QRCode from 'react-qr-code';
import background from '../assets/profileBackground.png';
import QRCodeModal from '../modals/QRCodeModal';
import MysteryBoxModal from '../modals/MysteryBoxModal';
import ConfirmModal from '../modals/ConfirmModal';
import MessagePopup from '../modals/MessagePopup';
import LoyaltyCard from '../components/LoyaltyCard';

const isMysteryBox = (reward) =>
  reward.rewardType?.toLowerCase().includes('mystery');

const UserProfile = () => {
  const navigate = useNavigate();
  const [role, setRole]                     = useState(localStorage.getItem('role'));
  const [profile, setProfile]               = useState(null);
  const [rewards, setRewards]               = useState([]);
  const [stampData, setStampData]           = useState(null);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [message, setMessage]               = useState('');
  const [qrCode, setQrCode]                 = useState(null);
  const [showQRModal, setShowQRModal]       = useState(false);
  const [activeRewardId, setActiveRewardId] = useState(null);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [claimError, setClaimError]         = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup]     = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const fetchUserProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        const user = res.data.user;
        setProfile(user);
        // Trust the API for role — localStorage can be stale from a previous session
        const apiRole = user.role ?? null;
        setRole(apiRole);
        if (apiRole) localStorage.setItem('role', apiRole);
        else localStorage.removeItem('role');
      } catch {
        navigate('/login');
      }
    };

    const fetchAllRewards = async () => {
      try {
        const res = await api.get('/rewards/user-rewards');
        setRewards(res.data.rewards);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRewards(false);
      }
    };

    const fetchStamps = async () => {
      try {
        const res = await api.get('/stamps/me');
        setStampData(res.data);
      } catch {
        // Stamp data is optional — fail silently
      }
    };

    fetchUserProfile();
    fetchAllRewards();
    if (role !== 'ADMIN') fetchStamps();
  }, [navigate, role]);

  const claimReward = async (id) => {
    try {
      const res = await api.post(`/rewards/${id}/claim`);
      setQrCode(res.data.qrCode);
      setActiveRewardId(id);
      setShowQRModal(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not generate QR code. Please try again.';
      setClaimError(msg);
      setTimeout(() => setClaimError(''), 4000);
    }
  };

  const handleClaimClick = (reward) => {
    if (isMysteryBox(reward)) {
      setShowMysteryBox(true);
    } else {
      claimReward(reward.id);
    }
  };

  const refreshRewards = async () => {
    try {
      const res = await api.get('/rewards/user-rewards');
      setRewards(res.data.rewards);
    } catch (err) {
      console.error('Failed to refresh rewards:', err);
    }
  };

  // Poll while QR modal is open to auto-close once barber redeems
  useEffect(() => {
    let interval;
    if (showQRModal && activeRewardId) {
      interval = setInterval(async () => {
        try {
          const res = await api.get('/rewards/user-rewards');
          const updated = res.data.rewards.find((r) => r.id === activeRewardId);
          if (updated?.status === 'CLAIMED') {
            setRewards(res.data.rewards);
            setShowQRModal(false);
            setQrCode(null);
            setActiveRewardId(null);
            clearInterval(interval);
          }
        } catch {
          // ignore
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [showQRModal, activeRewardId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.dispatchEvent(new Event('auth-changed'));
    setShowLogoutPopup(true);
    setTimeout(() => { window.location.href = '/login'; }, 2500);
  };

  const handleChangePassword = () => navigate('/change-password');

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/auth/delete');
      localStorage.removeItem('token');
      navigate('/');
    } catch {
      alert('Failed to delete account.');
    }
  };

  if (!profile) return <Loading>Loading...</Loading>;

  return (
    <Container>
      {/* Profile card */}
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

      {role !== 'ADMIN' && (
        <>
          {/* Loyalty card */}
          {stampData && (
            <StampSection>
              <SectionTitle>Loyalty Card</SectionTitle>
              <LoyaltyCard data={stampData} />
            </StampSection>
          )}

          {/* Customer barber QR */}
          <BarberQRSection>
            <SectionTitle>My Barber QR</SectionTitle>
            <QRWrapper>
              <QRCode
                value={profile.email}
                size={180}
                bgColor="#ffffff"
                fgColor="#121214"
              />
            </QRWrapper>
            <QRHint>Show this to your barber when you visit to collect stamps</QRHint>
          </BarberQRSection>

          {/* Rewards */}
          <RewardsSection>
            <SectionTitle>My Rewards</SectionTitle>
            {message    && <Message>{message}</Message>}
            {claimError && <ErrorMsg>{claimError}</ErrorMsg>}
            {loadingRewards ? (
              <Loading>Loading rewards...</Loading>
            ) : rewards.length === 0 ? (
              <EmptyText>No rewards yet.</EmptyText>
            ) : (
              <RewardsList>
                {rewards.map((reward) => (
                  <RewardCard key={reward.id}>
                    <RewardInfo>
                      <RewardType>{reward.rewardValue || reward.rewardType}</RewardType>
                      <RewardStatus $status={reward.status}>
                        {reward.status === 'LOCKED'
                          ? '🔒 Verify email to unlock'
                          : reward.status === 'UNCLAIMED'
                          ? '✓ Ready to claim'
                          : '✓ Claimed'}
                      </RewardStatus>
                    </RewardInfo>

                    {reward.status === 'UNCLAIMED' && (
                      <RewardButton onClick={() => handleClaimClick(reward)}>
                        Claim
                      </RewardButton>
                    )}
                    {reward.status === 'LOCKED' && (
                      <RewardButton $locked onClick={() => alert('Please verify your email to claim this reward.')}>
                        Locked
                      </RewardButton>
                    )}
                    {reward.status === 'CLAIMED' && (
                      <RewardButton disabled>Claimed</RewardButton>
                    )}
                  </RewardCard>
                ))}
              </RewardsList>
            )}
          </RewardsSection>
        </>
      )}

      {/* Settings */}
      <SettingsSection>
        <SectionTitle>Settings</SectionTitle>
        <SettingButton onClick={handleChangePassword}>Change Password</SettingButton>
        <DeleteButton onClick={() => setShowDeleteConfirm(true)}>Delete Account</DeleteButton>
      </SettingsSection>

      {/* Modals */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrCode={qrCode}
        rewardId={activeRewardId}
      />

      <MysteryBoxModal
        isOpen={showMysteryBox}
        onClose={() => {
          setShowMysteryBox(false);
          refreshRewards();
        }}
      />

      {showDeleteConfirm && (
        <ConfirmModal
          message="Are you sure you want to delete your account? This action is permanent."
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
        />
      )}

      {showLogoutPopup && (
        <MessagePopup show={showLogoutPopup} message="See you later!" type="logout" />
      )}
    </Container>
  );
};

export default UserProfile;


const Container = styled.div`
  min-height: 100vh;
  background-image: url(${background});
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  font-family: 'Arial', sans-serif;
`;

const Field = styled.div`
  margin-bottom: 1.5rem;
`;

const Card = styled.div`
  background: rgba(255,255,255,0.01);
  padding: 1rem 2rem 2rem 2rem;
  border-radius: 14px;
  box-shadow: 0 0 12px rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  width: 85%;
  max-width: 450px;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  color: #f5f2ed;
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
  text-align: center;
  text-shadow: 0 0 6px rgba(0,0,0,0.6);
`;

const Label = styled.div`
  font-size: 0.9rem;
  color: #c8b88a;
  margin-bottom: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Value = styled.div`
  font-size: 1.2rem;
  color: #ffffff;
  font-weight: 500;
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: #c8b88a;
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 10px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.1s ease;

  &:hover {
    background: #b2a072;
    transform: scale(1.02);
  }
`;

const StampSection = styled(Card)`
  margin-top: 0;
  margin-bottom: 2rem;
  padding: 1rem 1.2rem 1.4rem 1.2rem;
`;

const SettingsSection = styled(Card)`
  margin-top: 1rem;
`;

const SettingButton = styled(Button)`
  background: #f5f2ed;
  color: #000;
  &:hover { background: #e0ddd8; }
`;

const DeleteButton = styled(Button)`
  background: #b23b3b;
  color: #fff;
  &:hover { background: #922e2e; }
`;

const Loading = styled.p`
  text-align: center;
  color: #f5f2ed;
  font-size: 1.2rem;
  margin-top: 3rem;
`;

const RewardsSection = styled(Card)`
  margin-top: 0;
  margin-bottom: 2rem;
`;

const RewardsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RewardCard = styled.li`
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.02);
`;

const RewardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const RewardType = styled.p`
  font-weight: bold;
  font-size: 1rem;
  color: #fff;
  margin-bottom: 0.2rem;
`;

const RewardStatus = styled.p`
  font-size: 0.82rem;
  color: ${({ $status }) =>
    $status === 'LOCKED'    ? '#888' :
    $status === 'UNCLAIMED' ? '#66bb6a' :
    '#aaa'};
`;

const EmptyText = styled.p`
  color: rgba(255,255,255,0.5);
  text-align: center;
`;

const RewardButton = styled.button`
  flex-shrink: 0;
  margin-left: 0.75rem;
  padding: 8px 14px;
  font-size: 0.88rem;
  border: none;
  border-radius: 8px;
  cursor: ${({ disabled, $locked }) => (disabled || $locked) ? 'default' : 'pointer'};
  background: ${({ disabled, $locked }) =>
    disabled  ? 'rgba(255,255,255,0.1)' :
    $locked   ? 'rgba(255,255,255,0.12)' :
    '#22c55e'};
  color: ${({ disabled }) => disabled ? '#666' : '#fff'};
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: ${({ $locked }) => $locked ? 'rgba(255,255,255,0.12)' : '#16a34a'};
  }
`;

const BarberQRSection = styled(Card)`
  margin-top: 0;
  margin-bottom: 2rem;
  padding: 1rem 1.5rem 1.5rem;
  text-align: center;
`;

const QRWrapper = styled.div`
  display: inline-block;
  background: #fff;
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 0.9rem;
`;

const QRHint = styled.p`
  color: rgba(255,255,255,0.55);
  font-size: 0.82rem;
  line-height: 1.4;
`;

const Message = styled.p`
  color: #22c55e;
  margin-bottom: 1rem;
  font-weight: 500;
  text-align: center;
`;

const ErrorMsg = styled.p`
  color: #e57373;
  margin-bottom: 0.75rem;
  font-size: 0.88rem;
  text-align: center;
`;
