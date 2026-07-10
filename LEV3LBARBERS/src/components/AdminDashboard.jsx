import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { BoxIcon, GiftIcon, UsersIcon, TrophyIcon, TagIcon } from '../common/icons';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (s) => { const d = new Date(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; };

const STATUS_COLOR = {
  PENDING:    '#9e9e9e',
  PAID:       '#2e7d32',
  PROCESSING: '#0288d1',
  FULFILLED:  RED,
  CANCELLED:  '#c0392b',
  REFUNDED:   '#8e44ad',
};

const AdminDashboard = ({ onNavigate }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin-dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Card><LoadingText>Loading dashboard...</LoadingText></Card>;
  if (!data)   return <Card><LoadingText>Failed to load dashboard.</LoadingText></Card>;

  const { revenue, orders, giftCards, members, rewards, promos, recentOrders } = data;

  return (
    <Wrap>
      {/* Stat cards */}
      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          onClick={() => onNavigate?.('orders')}
          $clickable
        >
          <StatIcon>£</StatIcon>
          <StatValue>£{revenue.allTime.toFixed(2)}</StatValue>
          <StatLabel>Total Revenue</StatLabel>
          <StatSub>£{revenue.today.toFixed(2)} today · £{revenue.week.toFixed(2)} this week</StatSub>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => onNavigate?.('orders')}
          $clickable
          $alert={orders.pending > 0}
        >
          <StatIcon><BoxIcon width={20} height={20} /></StatIcon>
          <StatValue>{orders.paid}</StatValue>
          <StatLabel>Orders Paid</StatLabel>
          <StatSub $alert={orders.pending > 0}>
            {orders.pending > 0 ? `${orders.pending} pending action` : 'No pending orders'}
          </StatSub>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onNavigate?.('giftCards')}
          $clickable
        >
          <StatIcon><GiftIcon width={20} height={20} /></StatIcon>
          <StatValue>£{giftCards.totalBalance.toFixed(2)}</StatValue>
          <StatLabel>Gift Card Balance</StatLabel>
          <StatSub>{giftCards.active} active card{giftCards.active !== 1 ? 's' : ''}</StatSub>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <StatIcon><UsersIcon width={20} height={20} /></StatIcon>
          <StatValue>{members.total}</StatValue>
          <StatLabel>Members</StatLabel>
          <StatSub>+{members.newWeek} this week</StatSub>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onNavigate?.('rewardPool')}
          $clickable
          $alert={rewards.unclaimed > 10}
        >
          <StatIcon><TrophyIcon width={20} height={20} /></StatIcon>
          <StatValue>{rewards.unclaimed}</StatValue>
          <StatLabel>Unclaimed Rewards</StatLabel>
          <StatSub>Waiting to be collected</StatSub>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => onNavigate?.('promos')}
          $clickable
        >
          <StatIcon><TagIcon width={20} height={20} /></StatIcon>
          <StatValue>{promos.active}</StatValue>
          <StatLabel>Active Promo Codes</StatLabel>
          <StatSub>Currently live</StatSub>
        </StatCard>
      </StatsGrid>

      {/* Recent orders */}
      {recentOrders?.length > 0 && (
        <Card
          as={motion.div}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SectionTitle>Recent Orders</SectionTitle>
          <OrderList>
            {recentOrders.map(order => (
              <OrderRow key={order.id}>
                <OrderLeft>
                  <OrderNum>#{order.id}</OrderNum>
                  <OrderName>{order.customerName}</OrderName>
                  <OrderDate>{fmtDate(order.createdAt)}</OrderDate>
                </OrderLeft>
                <OrderRight>
                  <OrderTotal>£{order.total.toFixed(2)}</OrderTotal>
                  <StatusDot $color={STATUS_COLOR[order.status]}>{order.status}</StatusDot>
                </OrderRight>
              </OrderRow>
            ))}
          </OrderList>
          <ViewAllBtn onClick={() => onNavigate?.('orders')}>View All Orders →</ViewAllBtn>
        </Card>
      )}
    </Wrap>
  );
};

export default AdminDashboard;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const Wrap = styled.div`
  width: 100%; max-width: 760px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 1.2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;

  @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 380px) { grid-template-columns: 1fr; }
`;

const StatCard = styled(motion.div)`
  background: rgba(255,255,255,0.55);
  border: 1px solid ${({ $alert }) => $alert ? 'rgba(196,30,58,0.4)' : 'rgba(26,26,26,0.1)'};
  padding: 1.1rem 1rem 0.9rem;
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  transition: background 0.18s, border-color 0.18s, transform 0.15s;
  &:hover {
    background: ${({ $clickable }) => $clickable ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)'};
    transform: ${({ $clickable }) => $clickable ? 'translateY(-2px)' : 'none'};
  }
`;

const StatIcon = styled.div`color: ${RED}; margin-bottom: 0.45rem; line-height: 1; display: flex;`;
const StatValue = styled.div`
  font-family: 'Bebas Neue', sans-serif; font-size: 1.9rem; letter-spacing: 1px;
  color: ${INK}; line-height: 1; margin-bottom: 0.15rem;
`;
const StatLabel = styled.div`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  color: rgba(26,26,26,0.6); margin-bottom: 0.25rem;
`;
const StatSub   = styled.div`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem; font-weight: 600; color: ${({ $alert }) => $alert ? RED : 'rgba(26,26,26,0.5)'};
  line-height: 1.3;
`;

const Card = styled.div`
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(26,26,26,0.1);
  padding: 1.4rem;
`;
const SectionTitle = styled.p`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem; letter-spacing: 2px;
  color: ${INK}; margin: 0 0 0.9rem;
`;

const OrderList = styled.div`display: flex; flex-direction: column; gap: 0;`;
const OrderRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6rem 0; border-bottom: 1px solid rgba(26,26,26,0.08);
  &:last-child { border-bottom: none; }
`;
const OrderLeft = styled.div`display: flex; align-items: center; gap: 0.65rem; min-width: 0;`;
const OrderNum = styled.span`font-family: monospace; font-size: 0.78rem; color: ${RED}; flex-shrink: 0;`;
const OrderName = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem; color: ${INK}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;
`;
const OrderDate = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem; color: rgba(26,26,26,0.4); flex-shrink: 0; display: none; @media(min-width:500px){display:inline;}
`;
const OrderRight = styled.div`display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0;`;
const OrderTotal = styled.span`font-family: 'Montserrat', sans-serif; font-size: 0.85rem; color: ${INK}; font-weight: 700;`;
const StatusDot = styled.span`
  font-family: 'Montserrat', sans-serif;
  font-size: 0.62rem; font-weight: 700; letter-spacing: 1.5px; padding: 2px 7px;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}1a;
  border: 1px solid ${({ $color }) => $color}40;
`;
const ViewAllBtn = styled.button`
  margin-top: 0.9rem; background: none; border: 1px solid rgba(26,26,26,0.15);
  color: rgba(26,26,26,0.55); padding: 0.5rem 1rem; cursor: pointer;
  font-family: 'Montserrat', sans-serif; font-weight: 600;
  font-size: 0.8rem; transition: all 0.18s; width: 100%;
  &:hover { border-color: ${RED}; color: ${RED}; }
`;
const LoadingText = styled.p`
  font-family: 'Montserrat', sans-serif;
  color: rgba(26,26,26,0.45); text-align: center; padding: 2rem 0; font-size: 0.9rem;
`;
