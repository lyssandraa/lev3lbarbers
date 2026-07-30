import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import QRCodeModal from '../modals/QRCodeModal';
import MysteryBoxModal from '../modals/MysteryBoxModal';
import ConfirmModal from '../modals/ConfirmModal';
import MessagePopup from '../modals/MessagePopup';
import LoyaltyCard from '../components/LoyaltyCard';
import { LockIcon, GiftIcon, ClockIcon, CakeIcon } from '../common/icons';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CARD_STYLE = {
  style: {
    base: {
      color: INK,
      fontFamily: "'Montserrat', sans-serif",
      fontSize: '15px',
      '::placeholder': { color: 'rgba(26,26,26,0.35)' },
    },
    invalid: { color: RED },
  },
};

const isMysteryBox = (reward) =>
  reward.rewardType?.toLowerCase().includes('mystery');

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings',  label: 'Bookings' },
  { id: 'rewards',   label: 'Rewards' },
  { id: 'wallet',    label: 'Wallet' },
  { id: 'settings',  label: 'Settings' },
];

const tabContentVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

const UserProfile = () => {
  const navigate = useNavigate();
  const { role, isShopUser, logout: authLogout, syncAuth } = useAuth();
  const [activeTab, setActiveTab]           = useState('overview');
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
  const [resendingVerification, setResendingVerification] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup]     = useState(false);
  const [referralSettings, setReferralSettings]   = useState(null);
  const [referralData, setReferralData]           = useState(null);
  const [referralCodeCopied, setReferralCodeCopied] = useState(false);
  const [generatingCode, setGeneratingCode]       = useState(false);
  const [birthday, setBirthday]                   = useState({ month: '', day: '' });
  const [birthdaySaved, setBirthdaySaved]         = useState(false);
  const [birthdaySaving, setBirthdaySaving]       = useState(false);
  const [birthdayMsg, setBirthdayMsg]             = useState('');

  // Quick-login PIN (barbers only)
  const [pinForm, setPinForm]                     = useState('');
  const [pinSaving, setPinSaving]                 = useState(false);
  const [pinMsg, setPinMsg]                       = useState('');

  // Bookings
  const [myBookings,    setMyBookings]    = useState([]);

  // Tier benefits
  const [tierBenefits, setTierBenefits] = useState(null);

  // Wallet
  const [wallet,        setWallet]        = useState({ balance: 0, transactions: [] });
  const [walletLoading, setWalletLoading] = useState(true);
  const [showTopup,     setShowTopup]     = useState(false);
  const [gcInput,       setGcInput]       = useState('');
  const [gcLoading,     setGcLoading]     = useState(false);
  const [gcMsg,         setGcMsg]         = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const fetchUserProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        const user = res.data.user;
        setProfile(user);
        if (user.birthdayMonth) {
          setBirthday({ month: String(user.birthdayMonth), day: String(user.birthdayDay) });
          setBirthdaySaved(true);
        }
        // Sync role from API into localStorage so AuthContext picks it up
        const apiRole = user.role ?? null;
        if (apiRole) localStorage.setItem('role', apiRole);
        else localStorage.removeItem('role');
        syncAuth();
      } catch (err) {
        // Only redirect on actual auth failures — not network blips or rate limits
        const status = err?.response?.status;
        if (status === 401 || status === 403) navigate('/login');
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

    const fetchReferralData = async () => {
      try {
        const [settingsRes, dataRes] = await Promise.all([
          api.get('/referrals/settings'),
          api.get('/referrals/my-referrals'),
        ]);
        setReferralSettings(settingsRes.data.settings);
        setReferralData(dataRes.data);
      } catch {
        // fail silently
      }
    };

    const fetchTierBenefits = async () => {
      try {
        const res = await api.get('/loyalty-settings/settings');
        setTierBenefits(res.data.settings);
      } catch { /* silent */ }
    };

    const fetchWallet = async () => {
      try {
        const res = await api.get('/wallet/me');
        setWallet({ balance: res.data.balance, transactions: res.data.transactions });
      } catch { /* silent */ }
      finally { setWalletLoading(false); }
    };

    const fetchMyBookings = async () => {
      try {
        const res = await api.get('/bookings/mine');
        setMyBookings(res.data);
      } catch { /* silent */ }
    };

    fetchUserProfile();
    fetchAllRewards();
    fetchMyBookings();
    fetchTierBenefits();
    if (!isShopUser) {
      fetchStamps();
      fetchReferralData();
      fetchWallet();
    }
  }, [navigate, isShopUser]);

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

  const resendVerificationEmail = async () => {
    setResendingVerification(true);
    try {
      const res = await api.post('/auth/resend-verification');
      setMessage(res.data.message || 'Verification email resent — check your inbox.');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not resend verification email. Please try again.';
      setClaimError(msg);
      setTimeout(() => setClaimError(''), 4000);
    } finally {
      setResendingVerification(false);
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
    authLogout();
    setShowLogoutPopup(true);
    setTimeout(() => { navigate('/login'); }, 2500);
  };

  const handleChangePassword = () => navigate('/change-password');

  const handleSavePin = async () => {
    setPinSaving(true); setPinMsg('');
    try {
      await api.put('/auth/set-pin', { pin: pinForm });
      setPinMsg('PIN saved');
      setPinForm('');
      setTimeout(() => setPinMsg(''), 3000);
    } catch (err) {
      setPinMsg(err.response?.data?.message || 'Failed to save PIN.');
    } finally {
      setPinSaving(false);
    }
  };

  const handleSaveBirthday = async () => {
    setBirthdaySaving(true);
    setBirthdayMsg('');
    try {
      await api.put('/auth/birthday', {
        birthdayMonth: birthday.month ? parseInt(birthday.month) : null,
        birthdayDay:   birthday.day   ? parseInt(birthday.day)   : null,
      });
      setBirthdayMsg('Saved!');
      if (birthday.month && birthday.day) setBirthdaySaved(true);
      setTimeout(() => setBirthdayMsg(''), 3000);
    } catch {
      setBirthdayMsg('Failed to save.');
    } finally {
      setBirthdaySaving(false);
    }
  };

  const handleGenerateReferralCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await api.post('/referrals/generate-code');
      setReferralData(prev => ({ ...prev, referralCode: res.data.referralCode }));
    } catch {
      // fail silently
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCode = useCallback(() => {
    if (!referralData?.referralCode) return;
    navigator.clipboard.writeText(referralData.referralCode);
    setReferralCodeCopied(true);
    setTimeout(() => setReferralCodeCopied(false), 2000);
  }, [referralData?.referralCode]);

  const handleRedeemGiftCard = async () => {
    if (!gcInput.trim()) return;
    setGcLoading(true); setGcMsg('');
    try {
      const res = await api.post('/wallet/redeem-gift-card', { code: gcInput.trim() });
      setWallet(w => ({ ...w, balance: res.data.balance }));
      setGcMsg(`✓ £${res.data.amountAdded.toFixed(2)} added to your wallet.`);
      setGcInput('');
      // Refresh full wallet data
      const walletRes = await api.get('/wallet/me');
      setWallet({ balance: walletRes.data.balance, transactions: walletRes.data.transactions });
    } catch (err) {
      setGcMsg(err.response?.data?.message || 'Failed to redeem gift card.');
    } finally { setGcLoading(false); }
  };

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

  const visibleTabs = TABS.filter(t => !isShopUser || ['overview', 'bookings', 'settings'].includes(t.id));

  return (
    <Page>
      <PageHeader
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
      >
        <Eyebrow>My Account</Eyebrow>
        <PageTitle>{profile.name}</PageTitle>
      </PageHeader>

      <TabBar>
        {visibleTabs.map(t => (
          <TabBtn key={t.id} $active={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
            {t.label}
            {activeTab === t.id && <TabLine layoutId="profile-tab-underline" />}
          </TabBtn>
        ))}
      </TabBar>

      <Content>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            {/* ── Overview ── */}
            {activeTab === 'overview' && (
              <>
                <Card>
                  <Field>
                    <Label>Name</Label>
                    <Value>{profile.name}</Value>
                  </Field>
                  <Field>
                    <Label>Email</Label>
                    <Value>{profile.email}</Value>
                  </Field>
                  {!isShopUser && profile.tier && (() => {
                    const tierColor = { BRONZE: '#b5722d', SILVER: '#8a8f99', GOLD: '#C4922A', PLATINUM: '#6b7280' }[profile.tier] || RED;
                    const discountPct = tierBenefits
                      ? ({ SILVER: tierBenefits.silverDiscount, GOLD: tierBenefits.goldDiscount, PLATINUM: tierBenefits.platinumDiscount }[profile.tier] || 0)
                      : 0;
                    return (
                      <Field>
                        <Label>Member Tier</Label>
                        <TierRow>
                          <TierBadge $color={tierColor}>{profile.tier}</TierBadge>
                          {discountPct > 0 && (
                            <TierPerk>{discountPct}% off shop purchases — applied automatically at checkout</TierPerk>
                          )}
                          {discountPct === 0 && profile.tier === 'BRONZE' && (
                            <TierPerk>Earn stamps to unlock Silver and above for shop discounts</TierPerk>
                          )}
                        </TierRow>
                      </Field>
                    );
                  })()}
                  <LogoutBtn onClick={handleLogout}>Log Out</LogoutBtn>
                </Card>

                {!isShopUser && stampData && (
                  <Card $pad="loose">
                    <SectionTitle>Loyalty Card</SectionTitle>
                    <LoyaltyCard data={stampData} email={profile.email} walletQrCode={profile.qrCode} />
                  </Card>
                )}
              </>
            )}

            {/* ── Bookings ── */}
            {activeTab === 'bookings' && (
              <Card>
                <SectionTitle>My Bookings</SectionTitle>
                {myBookings.length === 0 ? (
                  <EmptyText>No bookings yet.</EmptyText>
                ) : myBookings.map(b => {
                  const apptDate = new Date(b.appointmentAt);
                  const dateStr  = apptDate.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
                  const timeStr  = apptDate.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
                  return (
                    <BookingRow key={b.id}>
                      <BookingInfo>
                        <BookingService>{b.serviceName}</BookingService>
                        <BookingMeta>{dateStr} at {timeStr} · {b.barber?.displayName || 'Barber'}</BookingMeta>
                        {b.depositAmount > 0 && (
                          <BookingMeta $color={b.depositPaid ? '#2e7d32' : '#b45309'}>
                            Deposit: £{b.depositAmount.toFixed(2)} {b.depositPaid ? '✓ Paid' : 'Pending'}
                          </BookingMeta>
                        )}
                      </BookingInfo>
                      <BookingStatusBadge $status={b.status}>{b.status}</BookingStatusBadge>
                    </BookingRow>
                  );
                })}
              </Card>
            )}

            {/* ── Rewards ── */}
            {activeTab === 'rewards' && !isShopUser && (
              <>
                <Card>
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
                              {reward.status === 'LOCKED'    && (
                                <>
                                  <LockIcon width={11} height={11} /> Verify your email to unlock —{' '}
                                  <ResendLink type="button" onClick={resendVerificationEmail} disabled={resendingVerification}>
                                    {resendingVerification ? 'sending…' : 'resend email'}
                                  </ResendLink>
                                </>
                              )}
                              {reward.status === 'UNCLAIMED' && (<><GiftIcon width={11} height={11} /> Bring this to your next visit</>)}
                              {reward.status === 'CLAIMED'   && '✓ Collected'}
                              {reward.status === 'EXPIRED'   && (<><ClockIcon width={11} height={11} /> Expired</>)}
                            </RewardStatus>
                            {reward.expiresAt && reward.status === 'UNCLAIMED' && (() => {
                              const days = Math.ceil((new Date(reward.expiresAt) - Date.now()) / 86400000);
                              return days <= 14 && days > 0
                                ? <ExpiryWarnInline>Expires in {days} day{days !== 1 ? 's' : ''}</ExpiryWarnInline>
                                : null;
                            })()}
                          </RewardInfo>

                          {reward.status === 'UNCLAIMED' && isMysteryBox(reward) && (
                            <RewardButton onClick={() => setShowMysteryBox(true)}>Reveal</RewardButton>
                          )}
                          {reward.status === 'UNCLAIMED' && !isMysteryBox(reward) && (
                            <RewardButton onClick={() => claimReward(reward.id)}>Claim</RewardButton>
                          )}
                          {reward.status === 'LOCKED' && (
                            <RewardButton $locked disabled>Locked</RewardButton>
                          )}
                          {reward.status === 'CLAIMED' && (
                            <RewardButton disabled>Collected</RewardButton>
                          )}
                          {reward.status === 'EXPIRED' && (
                            <RewardButton $expired disabled>Expired</RewardButton>
                          )}
                        </RewardCard>
                      ))}
                    </RewardsList>
                  )}
                </Card>

                {referralSettings && (
                  <Card>
                    <SectionTitle>Refer a Friend</SectionTitle>
                    {!referralSettings.isActive ? (
                      <EmptyText>Referral program is currently inactive.</EmptyText>
                    ) : referralData?.referralCode ? (
                      <>
                        <ReferralCodeRow>
                          <ReferralCode>{referralData.referralCode}</ReferralCode>
                          <CopyBtn onClick={handleCopyCode}>
                            {referralCodeCopied ? 'Copied!' : 'Copy'}
                          </CopyBtn>
                        </ReferralCodeRow>
                        <ReferralHint>
                          Share this code with friends. When they sign up and verify their email + claim their mystery box, you unlock a reward.
                        </ReferralHint>

                        {referralData?.cyclePosition !== undefined && (
                          <ProgressArea>
                            <ProgressLabel>
                              Progress this cycle: <strong>{referralData.cyclePosition} / 5</strong>
                            </ProgressLabel>
                            <ProgressBar>
                              <ProgressFill
                                as={motion.div}
                                initial={{ width: 0 }}
                                animate={{ width: `${(referralData.cyclePosition / 5) * 100}%` }}
                                transition={{ duration: 0.6, ease: EASE }}
                              />
                            </ProgressBar>
                            <MilestoneRow>
                              {[1, 3, 5].map(m => (
                                <MilestonePip key={m} $reached={referralData.cyclePosition >= m}>{m}</MilestonePip>
                              ))}
                            </MilestoneRow>
                          </ProgressArea>
                        )}

                        {referralData?.referrals?.length > 0 && (
                          <ReferralList>
                            {referralData.referrals.map(r => (
                              <ReferralItem key={r.id}>
                                <ReferralEmail>{r.refereeEmail}</ReferralEmail>
                                <ReferralBadge $done={r.status === 'COMPLETED'}>
                                  {r.status === 'COMPLETED' ? '✓ Complete' : 'Pending'}
                                </ReferralBadge>
                              </ReferralItem>
                            ))}
                          </ReferralList>
                        )}
                      </>
                    ) : (
                      <>
                        <EmptyText>You don't have a referral code yet.</EmptyText>
                        <GenerateBtn onClick={handleGenerateReferralCode} disabled={generatingCode}>
                          {generatingCode ? 'Generating…' : 'Generate My Code'}
                        </GenerateBtn>
                      </>
                    )}
                  </Card>
                )}

                <Card>
                  <SectionTitle>Birthday</SectionTitle>
                  {birthdaySaved ? (
                    <>
                      <BirthdayHint>
                        Your birthday is locked. Visit within a week of it to earn a bonus stamp and a special reward. Contact the shop to update it.
                      </BirthdayHint>
                      <BirthdayLocked>
                        <CakeIcon width={20} height={20} />
                        {['January','February','March','April','May','June','July','August','September','October','November','December'][parseInt(birthday.month) - 1]} {birthday.day}
                        <LockIcon width={14} height={14} style={{ opacity: 0.5 }} />
                      </BirthdayLocked>
                    </>
                  ) : (
                    <>
                      <BirthdayHint>
                        Optional — set once. Visit within a week of your birthday to earn a bonus stamp and a special reward.
                      </BirthdayHint>
                      <BirthdayRow>
                        <BirthdayField>
                          <BirthdayLabel htmlFor="bdMonth">Month</BirthdayLabel>
                          <BirthdaySelect
                            id="bdMonth"
                            value={birthday.month}
                            onChange={e => setBirthday(b => ({ ...b, month: e.target.value }))}
                          >
                            <option value="">—</option>
                            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                              <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                          </BirthdaySelect>
                        </BirthdayField>
                        <BirthdayField>
                          <BirthdayLabel htmlFor="bdDay">Day</BirthdayLabel>
                          <BirthdayInput
                            id="bdDay"
                            type="number"
                            min="1"
                            max="31"
                            placeholder="e.g. 15"
                            value={birthday.day}
                            onChange={e => setBirthday(b => ({ ...b, day: e.target.value }))}
                          />
                        </BirthdayField>
                        <BirthdaySaveBtn onClick={handleSaveBirthday} disabled={birthdaySaving}>
                          {birthdaySaving ? '…' : 'Save'}
                        </BirthdaySaveBtn>
                      </BirthdayRow>
                      {birthdayMsg && (
                        <BirthdayMsg $ok={birthdayMsg === 'Saved!'}>{birthdayMsg}</BirthdayMsg>
                      )}
                    </>
                  )}
                </Card>
              </>
            )}

            {/* ── Wallet ── */}
            {activeTab === 'wallet' && !isShopUser && (
              <Card>
                <SectionTitle>My Wallet</SectionTitle>

                <WalletBalance>
                  <WalBalLabel>Credit Balance</WalBalLabel>
                  <WalBalAmt>£{wallet.balance.toFixed(2)}</WalBalAmt>
                </WalletBalance>

                <Elements stripe={stripePromise}>
                  <TopupBlock
                    balance={wallet.balance}
                    onTopupSuccess={(newBalance, txns) => {
                      setWallet({ balance: newBalance, transactions: txns || wallet.transactions });
                      setShowTopup(false);
                    }}
                    showTopup={showTopup}
                    setShowTopup={setShowTopup}
                  />
                </Elements>

                <GCRedeemBlock>
                  <GCLabel>Load Gift Card</GCLabel>
                  <GCRow>
                    <GCInput
                      value={gcInput}
                      onChange={e => setGcInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleRedeemGiftCard()}
                      placeholder="LEV3L-XXXX-XXXX-XXXX"
                      spellCheck={false}
                    />
                    <GCBtn onClick={handleRedeemGiftCard} disabled={gcLoading || !gcInput.trim()}>
                      {gcLoading ? '…' : 'Load'}
                    </GCBtn>
                  </GCRow>
                  {gcMsg && <GCMsg $ok={gcMsg.startsWith('✓')}>{gcMsg}</GCMsg>}
                </GCRedeemBlock>

                {wallet.transactions.length > 0 && (
                  <TxnSection>
                    <TxnLabel>Recent Activity</TxnLabel>
                    {wallet.transactions.slice(0, 10).map(t => (
                      <TxnRow key={t.id}>
                        <TxnDesc>{t.description || t.type}</TxnDesc>
                        <TxnAmt $positive={t.amount > 0}>
                          {t.amount > 0 ? '+' : ''}£{Math.abs(t.amount).toFixed(2)}
                        </TxnAmt>
                      </TxnRow>
                    ))}
                  </TxnSection>
                )}
              </Card>
            )}

            {/* ── Settings ── */}
            {activeTab === 'settings' && (
              <Card>
                <SectionTitle>Settings</SectionTitle>
                <SettingButton onClick={handleChangePassword}>Change Password</SettingButton>

                {isShopUser && (
                  <PinSection>
                    <Label>Quick-Login PIN</Label>
                    <PinHint>Set a 6-digit PIN to log in fast on the shop device instead of typing your password each time.</PinHint>
                    <PinRow>
                      <PinInput
                        type="password"
                        inputMode="numeric"
                        placeholder="••••••"
                        value={pinForm}
                        onChange={e => setPinForm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                      <PinSaveBtn onClick={handleSavePin} disabled={pinSaving || pinForm.length !== 6}>
                        {pinSaving ? '…' : 'Save'}
                      </PinSaveBtn>
                    </PinRow>
                    {pinMsg && <BirthdayMsg $ok={pinMsg === 'PIN saved'}>{pinMsg}</BirthdayMsg>}
                  </PinSection>
                )}

                <DeleteButton onClick={() => setShowDeleteConfirm(true)}>Delete Account</DeleteButton>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </Content>

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
    </Page>
  );
};

export default UserProfile;

/* ─────────── Layout ─────────── */

const Page = styled.div`
  min-height: 100vh;
  background: ${CREAM};
  color: ${INK};
  font-family: 'Bebas Neue', sans-serif;
  padding: 6rem 5% 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PageHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: 2rem;
`;

const Eyebrow = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 10px; font-weight: 900;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: ${RED};
  margin: 0 0 0.5rem;
`;

const PageTitle = styled.h1`
  font-size: clamp(2.2rem, 5vw, 3.2rem);
  letter-spacing: 3px;
  margin: 0;
  color: ${INK};
  line-height: 1;
`;

const TabBar = styled.div`
  display: flex;
  gap: 0.2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;
  border-bottom: 1px solid rgba(26, 26, 26, 0.1);
  width: 100%;
  max-width: 600px;
`;

const TabBtn = styled.button`
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.6rem 1rem;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 2px;
  color: ${({ $active }) => $active ? INK : 'rgba(26, 26, 26, 0.4)'};
  transition: color 0.2s;
  &:hover { color: ${INK}; }
`;

const TabLine = styled(motion.div)`
  position: absolute;
  bottom: -1px;
  left: 0.4rem; right: 0.4rem;
  height: 2px;
  background: ${RED};
`;

const Content = styled.div`
  width: 100%;
  max-width: 500px;
`;

const Field = styled.div`
  margin-bottom: 1.2rem;
`;

const Card = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(26, 26, 26, 0.1);
  padding: ${({ $pad }) => $pad === 'loose' ? '1.4rem 1.2rem 1.6rem' : '1.6rem 1.6rem 1.8rem'};
  width: 100%;
  margin-bottom: 1.6rem;
  box-sizing: border-box;
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  letter-spacing: 2px;
  margin: 0 0 1.4rem;
  text-align: center;
  color: ${INK};
`;

const Label = styled.div`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.65rem;
  color: ${RED};
  margin-bottom: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 700;
`;

const Value = styled.div`
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  color: ${INK};
`;

const LogoutBtn = styled.button`
  width: 100%;
  padding: 12px;
  background: ${RED};
  color: #fff;
  border: none;
  cursor: pointer;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 10px;
  transition: opacity 0.22s;
  &:hover { opacity: 0.85; }
`;

const SettingButton = styled.button`
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid rgba(26, 26, 26, 0.15);
  color: rgba(26, 26, 26, 0.6);
  cursor: pointer;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 0.8rem;
  transition: border-color 0.2s, color 0.2s;
  &:hover { border-color: rgba(26, 26, 26, 0.35); color: ${INK}; }
`;

const PinSection = styled.div`
  border-top: 1px solid rgba(26, 26, 26, 0.1);
  padding-top: 1rem;
  margin-bottom: 1rem;
`;

const PinHint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  color: rgba(26, 26, 26, 0.55);
  line-height: 1.5;
  margin: 0 0 0.7rem;
`;

const PinRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PinInput = styled.input`
  flex: 1;
  padding: 10px;
  background: #ffffff;
  border: 1px solid rgba(26, 26, 26, 0.15);
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  letter-spacing: 4px;
  outline: none;
  box-sizing: border-box;
  &::placeholder { color: rgba(26, 26, 26, 0.3); letter-spacing: 4px; }
  &:focus { border-color: ${RED}; }
`;

const PinSaveBtn = styled.button`
  padding: 10px 18px;
  background: ${RED};
  color: #fff;
  border: none;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 2px;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const DeleteButton = styled(SettingButton)`
  border-color: rgba(196, 30, 58, 0.35);
  color: ${RED};
  margin-bottom: 0;
  &:hover { background: rgba(196,30,58,0.06); border-color: ${RED}; color: ${RED}; }
`;

const Loading = styled.p`
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  color: rgba(26, 26, 26, 0.5);
  font-size: 1rem;
  margin-top: 3rem;
`;

const RewardsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RewardCard = styled.li`
  border: 1px solid rgba(26, 26, 26, 0.1);
  padding: 0.9rem 1rem;
  margin-bottom: 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
`;

const RewardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const RewardType = styled.p`
  font-size: 1rem;
  letter-spacing: 1px;
  color: ${INK};
  margin: 0 0 0.2rem;
`;

const RewardStatus = styled.p`
  display: flex; align-items: center; gap: 5px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  margin: 0;
  color: ${({ $status }) =>
    $status === 'LOCKED'    ? 'rgba(26,26,26,0.4)' :
    $status === 'UNCLAIMED' ? RED :
    $status === 'EXPIRED'   ? RED :
    '#2e7d32'};
`;

const ResendLink = styled.button`
  background: none; border: none; padding: 0; margin: 0;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem; font-weight: 700;
  color: ${RED}; text-decoration: underline;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: default; }
`;

const ExpiryWarnInline = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  color: #b45309;
  margin: 0.2rem 0 0;
`;

const EmptyText = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: rgba(26, 26, 26, 0.45);
  text-align: center;
  font-size: 0.88rem;
`;

const RewardButton = styled.button`
  flex-shrink: 0;
  margin-left: 0.75rem;
  padding: 7px 14px;
  font-size: 0.8rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 2px;
  border: 1px solid;
  border-color: ${({ disabled, $locked, $expired }) =>
    $expired ? RED :
    $locked  ? 'rgba(26,26,26,0.15)' :
    disabled ? 'rgba(26,26,26,0.15)' :
    RED};
  background: transparent;
  cursor: ${({ disabled, $locked, $expired }) =>
    (disabled || $locked || $expired) ? 'default' : 'pointer'};
  color: ${({ disabled, $locked, $expired }) =>
    $expired ? RED :
    $locked  ? 'rgba(26,26,26,0.35)' :
    disabled ? 'rgba(26,26,26,0.35)' :
    RED};
  transition: background 0.2s;
  &:hover:not(:disabled) {
    background: ${({ $locked, $expired }) => ($locked || $expired) ? 'transparent' : 'rgba(196,30,58,0.08)'};
  }
`;

const Message = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: #2e7d32;
  margin-bottom: 1rem;
  font-size: 0.88rem;
  text-align: center;
`;

const ErrorMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: ${RED};
  margin-bottom: 0.75rem;
  font-size: 0.84rem;
  text-align: center;
`;

const ReferralCodeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
`;

const ReferralCode = styled.span`
  font-size: 1.8rem;
  letter-spacing: 6px;
  color: ${RED};
`;

const CopyBtn = styled.button`
  padding: 6px 14px;
  background: transparent;
  border: 1px solid ${RED};
  color: ${RED};
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 2px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: rgba(196,30,58,0.08); }
`;

const ReferralHint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  color: rgba(26, 26, 26, 0.55);
  line-height: 1.55;
  margin-bottom: 1rem;
  text-align: center;
`;

const ProgressArea = styled.div`
  margin-bottom: 1rem;
`;

const ProgressLabel = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  color: rgba(26, 26, 26, 0.55);
  margin-bottom: 0.5rem;
  text-align: center;
  strong { color: ${INK}; }
`;

const ProgressBar = styled.div`
  height: 6px;
  background: rgba(26, 26, 26, 0.1);
  border-radius: 99px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${RED};
  border-radius: 99px;
`;

const MilestoneRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.35rem;
  padding: 0 2px;
`;

const MilestonePip = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  color: ${({ $reached }) => $reached ? RED : 'rgba(26,26,26,0.3)'};
  transition: color 0.3s;
`;

const ReferralList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ReferralItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.55rem 0.8rem;
  margin-bottom: 0.4rem;
  background: transparent;
  border: 1px solid rgba(26, 26, 26, 0.1);
`;

const ReferralEmail = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.82rem;
  color: rgba(26, 26, 26, 0.6);
`;

const ReferralBadge = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.72rem;
  color: ${({ $done }) => $done ? '#2e7d32' : RED};
`;

const GenerateBtn = styled.button`
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid ${RED};
  color: ${RED};
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
  &:hover { background: rgba(196,30,58,0.08); }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const BirthdayHint = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  color: rgba(26, 26, 26, 0.55);
  line-height: 1.5;
  margin-bottom: 1rem;
  text-align: center;
`;

const BirthdayRow = styled.div`
  display: flex;
  gap: 0.7rem;
  align-items: flex-end;
`;

const BirthdayField = styled.div`flex: 1;`;

const BirthdayLabel = styled.label`
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.62rem;
  letter-spacing: 2px;
  color: rgba(26, 26, 26, 0.45);
  margin-bottom: 0.4rem;
`;

const BirthdaySelect = styled.select`
  width: 100%;
  padding: 10px 10px;
  background: #ffffff;
  border: 1px solid rgba(26, 26, 26, 0.15);
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.88rem;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
  &:focus { border-color: ${RED}; }
`;

const BirthdayInput = styled.input`
  width: 100%;
  padding: 10px 10px;
  background: #ffffff;
  border: 1px solid rgba(26, 26, 26, 0.15);
  color: ${INK};
  font-family: 'Montserrat', sans-serif;
  font-size: 0.88rem;
  outline: none;
  box-sizing: border-box;
  &::placeholder { color: rgba(26, 26, 26, 0.3); }
  &:focus { border-color: ${RED}; }
`;

const BirthdaySaveBtn = styled.button`
  padding: 10px 18px;
  background: ${RED};
  color: #fff;
  border: none;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 2px;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const BirthdayMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem;
  color: ${({ $ok }) => $ok ? '#2e7d32' : RED};
  margin-top: 0.6rem;
  text-align: center;
`;

const BirthdayLocked = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  font-size: 1.2rem;
  letter-spacing: 1px;
  color: ${INK};
  padding: 0.6rem 0;
`;

const TierRow = styled.div`display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;`;

const TierBadge = styled.span`
  font-size: 0.85rem; letter-spacing: 2px;
  padding: 3px 10px;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}18;
  border: 1px solid ${({ $color }) => $color}44;
`;

const TierPerk = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  color: rgba(26, 26, 26, 0.55);
  line-height: 1.4;
`;

/* ─── TopupBlock ──────────────────────────────────────────────────────────── */

const TopupBlock = ({ balance, onTopupSuccess, showTopup, setShowTopup }) => {
  const stripe   = useStripe();
  const elements = useElements();
  const [amount,  setAmount]  = useState('');
  const [paying,  setPaying]  = useState(false);
  const [err,     setErr]     = useState('');

  const handlePay = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 1) return setErr('Minimum top-up is £1.00');
    if (!stripe || !elements) return;
    setErr(''); setPaying(true);
    try {
      const { data } = await api.post('/wallet/topup/create-intent', { amount: amt });
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) { setErr(result.error.message); setPaying(false); return; }
      const confirm = await api.post('/wallet/topup/confirm', { paymentIntentId: data.paymentIntentId });
      const txns = await api.get('/wallet/me');
      onTopupSuccess(confirm.data.balance, txns.data.transactions);
      setAmount('');
    } catch (e) {
      setErr(e.response?.data?.message || 'Payment failed.');
      setPaying(false);
    }
  };

  const QUICK = [10, 20, 50];

  return (
    <TopupWrap>
      {!showTopup ? (
        <TopupOpenBtn onClick={() => setShowTopup(true)}>+ Top Up Wallet</TopupOpenBtn>
      ) : (
        <TopupForm>
          <TopupFormLabel>Top Up Amount</TopupFormLabel>
          <QuickAmts>
            {QUICK.map(v => (
              <QuickBtn key={v} $active={amount === String(v)} onClick={() => setAmount(String(v))}>
                £{v}
              </QuickBtn>
            ))}
          </QuickAmts>
          <WalInput
            type="number" min="1" step="1" placeholder="Or enter custom amount..."
            value={amount} onChange={e => setAmount(e.target.value)}
          />
          <CardWrap><CardElement options={CARD_STYLE} /></CardWrap>
          {err && <TopupErr>{err}</TopupErr>}
          <TopupBtnRow>
            <TopupPayBtn onClick={handlePay} disabled={paying || !amount}>
              {paying ? '…' : `Pay £${parseFloat(amount || 0).toFixed(2)}`}
            </TopupPayBtn>
            <CancelTopupBtn onClick={() => { setShowTopup(false); setErr(''); setAmount(''); }}>
              Cancel
            </CancelTopupBtn>
          </TopupBtnRow>
        </TopupForm>
      )}
    </TopupWrap>
  );
};

/* ─── Wallet styles ──────────────────────────────────────────────────────── */

const WalletBalance = styled.div`
  text-align: center; margin-bottom: 1.2rem;
`;
const WalBalLabel = styled.p`
  font-family: 'Montserrat', sans-serif; font-weight: 700;
  font-size: 0.65rem; letter-spacing: 3px; text-transform: uppercase;
  color: rgba(26, 26, 26, 0.45); margin: 0 0 0.3rem;
`;
const WalBalAmt = styled.p`
  font-size: 3rem; letter-spacing: 2px;
  color: ${INK}; margin: 0;
`;

const TopupWrap = styled.div`margin-bottom: 1rem;`;
const TopupOpenBtn = styled.button`
  width: 100%; padding: 12px;
  background: transparent; border: 1px solid ${RED}; color: ${RED};
  font-family: 'Bebas Neue', sans-serif; font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase;
  cursor: pointer; transition: background 0.2s;
  &:hover { background: rgba(196,30,58,0.08); }
`;
const TopupForm = styled.div`display: flex; flex-direction: column; gap: 0.65rem;`;
const TopupFormLabel = styled.p`
  font-family: 'Montserrat', sans-serif; font-weight: 700;
  font-size: 0.65rem; letter-spacing: 3px; text-transform: uppercase;
  color: ${RED}; margin: 0;
`;
const QuickAmts = styled.div`display: flex; gap: 0.5rem;`;
const QuickBtn = styled.button`
  flex: 1; padding: 0.45rem 0;
  background: ${({ $active }) => $active ? 'rgba(196,30,58,0.08)' : 'transparent'};
  border: 1px solid ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.15)'};
  color: ${({ $active }) => $active ? RED : 'rgba(26,26,26,0.55)'};
  font-family: 'Bebas Neue', sans-serif; font-size: 0.95rem; letter-spacing: 2px;
  cursor: pointer; transition: all 0.18s;
  &:hover { border-color: ${RED}; color: ${RED}; }
`;
const WalInput = styled.input`
  padding: 10px; background: #ffffff; border: 1px solid rgba(26,26,26,0.15);
  color: ${INK}; font-family: 'Montserrat', sans-serif; font-size: 0.9rem;
  outline: none; box-sizing: border-box; width: 100%;
  &::placeholder { color: rgba(26,26,26,0.3); }
  &:focus { border-color: ${RED}; }
`;
const CardWrap = styled.div`
  padding: 10px; background: #ffffff; border: 1px solid rgba(26,26,26,0.15);
  transition: border-color 0.2s;
  &:focus-within { border-color: ${RED}; }
`;
const TopupErr = styled.p`font-family: 'Montserrat', sans-serif; font-size: 0.8rem; color: ${RED}; margin: 0;`;
const TopupBtnRow = styled.div`display: flex; gap: 0.5rem;`;
const TopupPayBtn = styled.button`
  flex: 1; padding: 10px;
  background: ${RED}; color: #fff; border: none;
  font-family: 'Bebas Neue', sans-serif; font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase;
  cursor: pointer; transition: opacity 0.2s;
  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: default; }
`;
const CancelTopupBtn = styled.button`
  flex: 0 0 auto; padding: 10px 14px;
  background: transparent; border: 1px solid rgba(26,26,26,0.15); color: rgba(26,26,26,0.55);
  font-family: 'Bebas Neue', sans-serif; font-size: 0.85rem; letter-spacing: 2px; text-transform: uppercase;
  cursor: pointer; transition: color 0.2s, border-color 0.2s;
  &:hover { border-color: rgba(26,26,26,0.35); color: ${INK}; }
`;

const GCRedeemBlock = styled.div`
  border-top: 1px solid rgba(26,26,26,0.1); padding-top: 1rem; margin-top: 0.5rem;
`;
const GCLabel = styled.p`
  font-family: 'Montserrat', sans-serif; font-weight: 700;
  font-size: 0.65rem; letter-spacing: 3px; text-transform: uppercase;
  color: ${RED}; margin: 0 0 0.6rem;
`;
const GCRow = styled.div`display: flex; gap: 0.5rem;`;
const GCInput = styled.input`
  flex: 1; padding: 9px 10px; background: #ffffff; border: 1px solid rgba(26,26,26,0.15);
  color: ${INK}; font-family: monospace; font-size: 0.85rem; letter-spacing: 2px;
  outline: none; text-transform: uppercase;
  &::placeholder { color: rgba(26,26,26,0.3); letter-spacing: 1px; }
  &:focus { border-color: ${RED}; }
`;
const GCBtn = styled.button`
  padding: 9px 16px; background: transparent; border: 1px solid ${RED};
  color: ${RED}; font-family: 'Bebas Neue', sans-serif; font-size: 0.85rem; letter-spacing: 2px;
  cursor: pointer; white-space: nowrap; transition: background 0.18s;
  &:hover:not(:disabled) { background: rgba(196,30,58,0.08); }
  &:disabled { opacity: 0.45; cursor: default; }
`;
const GCMsg = styled.p`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem; margin: 0.5rem 0 0;
  color: ${({ $ok }) => $ok ? '#2e7d32' : RED};
`;

const TxnSection = styled.div`
  border-top: 1px solid rgba(26,26,26,0.1); padding-top: 1rem; margin-top: 0.8rem;
`;
const TxnLabel = styled.p`
  font-family: 'Montserrat', sans-serif; font-weight: 700;
  font-size: 0.62rem; letter-spacing: 3px; text-transform: uppercase;
  color: rgba(26,26,26,0.4); margin: 0 0 0.6rem;
`;
const TxnRow = styled.div`
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 0.38rem 0; border-bottom: 1px solid rgba(26,26,26,0.1);
  &:last-child { border-bottom: none; }
`;
const TxnDesc = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem; color: rgba(26,26,26,0.55); flex: 1; min-width: 0; margin-right: 0.75rem;
`;
const TxnAmt = styled.span`
  font-size: 0.92rem; letter-spacing: 1px; flex-shrink: 0;
  color: ${({ $positive }) => $positive ? '#2e7d32' : RED};
`;

const STATUS_COLORS = {
  PENDING:   '#b45309',
  CONFIRMED: '#2e7d32',
  COMPLETED: '#4f46e5',
  CANCELLED: '#C41E3A',
  NO_SHOW:   '#6b7280',
};

const BookingRow = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(26,26,26,0.1);
  &:last-child { border-bottom: none; }
`;

const BookingInfo = styled.div`
  display: flex; flex-direction: column; gap: 3px;
`;

const BookingService = styled.span`
  letter-spacing: 1.5px; font-size: 0.95rem; color: ${INK};
`;

const BookingMeta = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.78rem; color: ${({ $color }) => $color || 'rgba(26,26,26,0.55)'};
`;

const BookingStatusBadge = styled.span`
  flex-shrink: 0;
  font-family: 'Bebas Neue', sans-serif;
  background: ${({ $status }) => (STATUS_COLORS[$status] || '#6b7280') + '18'};
  color: ${({ $status }) => STATUS_COLORS[$status] || '#6b7280'};
  border: 1px solid ${({ $status }) => (STATUS_COLORS[$status] || '#6b7280') + '44'};
  padding: 3px 10px;
  font-size: 0.68rem; letter-spacing: 1px;
`;
