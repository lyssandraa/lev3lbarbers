import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import api from '../utils/api';

const INK = '#1a1a1a';
const RED = '#C41E3A';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (s) => { const d = new Date(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; };

const STATUS_OPTS = ['PENDING','PAID','PROCESSING','FULFILLED','CANCELLED','REFUNDED'];
const STATUS_COLOR = {
  PENDING:    '#9e9e9e',
  PAID:       '#4caf50',
  PROCESSING: '#29b6f6',
  FULFILLED:  RED,
  CANCELLED:  '#ef5350',
  REFUNDED:   '#ab47bc',
};

const AdminOrders = () => {
  const [orders,      setOrders]      = useState([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [filter,      setFilter]      = useState('ALL');
  const [expanded,    setExpanded]    = useState(null);
  const [updating,    setUpdating]    = useState(null);
  const [refunding,   setRefunding]   = useState(null);
  const [confirmRef,  setConfirmRef]  = useState(null);

  useEffect(() => { loadOrders(page, filter); }, [page, filter]);

  const loadOrders = async (pg = page, flt = filter) => {
    try {
      const status = flt !== 'ALL' ? `&status=${flt}` : '';
      const res = await api.get(`/orders?page=${pg}&limit=20${status}`);
      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch { /* silent */ }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/orders/${id}/status`, { status });
      loadOrders();
    } catch { alert('Failed to update status.'); }
    finally { setUpdating(null); }
  };

  const issueRefund = async (id) => {
    setRefunding(id);
    try {
      await api.post(`/orders/${id}/refund`);
      setConfirmRef(null);
      loadOrders();
    } catch (err) { alert(err.response?.data?.message || 'Refund failed.'); }
    finally { setRefunding(null); }
  };

  const changeFilter = (f) => { setFilter(f); setPage(1); };

  return (
    <Card>
      <TitleRow>
        <PanelTitle>Orders</PanelTitle>
        <CountBadge>{total} total</CountBadge>
      </TitleRow>

      <FilterRow>
        {['ALL', ...STATUS_OPTS].map(s => (
          <FilterBtn key={s} $active={filter === s} $color={STATUS_COLOR[s]} onClick={() => changeFilter(s)}>
            {s}
          </FilterBtn>
        ))}
      </FilterRow>

      {orders.length === 0 ? (
        <EmptyMsg>No orders{filter !== 'ALL' ? ` with status "${filter}"` : ''} yet.</EmptyMsg>
      ) : (
        <OrderList>
          {orders.map(order => (
            <OrderRow key={order.id} $expanded={expanded === order.id}>
              <OrderHeader onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <OrderLeft>
                  <OrderNum>#{order.id}</OrderNum>
                  <OrderCustomer>{order.customerName}</OrderCustomer>
                  <OrderEmail>{order.customerEmail}</OrderEmail>
                </OrderLeft>
                <OrderRight>
                  <OrderTotal>£{order.total.toFixed(2)}</OrderTotal>
                  <StatusBadge $color={STATUS_COLOR[order.status]}>{order.status}</StatusBadge>
                  <OrderDate>{fmtDate(order.createdAt)}</OrderDate>
                  <ChevronIcon $open={expanded === order.id}>›</ChevronIcon>
                </OrderRight>
              </OrderHeader>

              {expanded === order.id && (
                <OrderDetail>
                  <DetailSection>
                    <DetailLabel>Items</DetailLabel>
                    <ItemTable>
                      {order.items?.map(item => (
                        <ItemRow key={item.id}>
                          <ItemName>
                            {item.name}
                            {item.itemType === 'gift-card' && <GCTag>Gift Card £{item.giftCardValue}</GCTag>}
                          </ItemName>
                          <ItemQty>×{item.quantity}</ItemQty>
                          <ItemPrice>£{(item.price * item.quantity).toFixed(2)}</ItemPrice>
                        </ItemRow>
                      ))}
                    </ItemTable>
                  </DetailSection>

                  {order.giftCodes?.length > 0 && (
                    <DetailSection>
                      <DetailLabel>Gift Card Codes</DetailLabel>
                      {order.giftCodes.map(gc => (
                        <GiftCodeRow key={gc.id}>
                          <GiftCode>{gc.code}</GiftCode>
                          <GiftCodeMeta>£{gc.value} · {gc.active ? '✓ Active' : '✗ Voided'}</GiftCodeMeta>
                        </GiftCodeRow>
                      ))}
                    </DetailSection>
                  )}

                  <DetailSection>
                    <DetailLabel>Update Status</DetailLabel>
                    <StatusRow>
                      {STATUS_OPTS.map(s => (
                        <StatusBtn key={s} $active={order.status === s} $color={STATUS_COLOR[s]}
                          disabled={updating === order.id} onClick={() => updateStatus(order.id, s)}>
                          {s}
                        </StatusBtn>
                      ))}
                    </StatusRow>
                  </DetailSection>

                  {order.status === 'PAID' && order.stripePaymentIntentId && (
                    <DetailSection>
                      <DetailLabel>Stripe Refund</DetailLabel>
                      {confirmRef === order.id ? (
                        <RefundConfirm>
                          <span>Issue a full refund via Stripe?</span>
                          <RefundYesBtn disabled={refunding === order.id} onClick={() => issueRefund(order.id)}>
                            {refunding === order.id ? '…' : 'Yes, refund'}
                          </RefundYesBtn>
                          <CancelRefBtn onClick={() => setConfirmRef(null)}>Cancel</CancelRefBtn>
                        </RefundConfirm>
                      ) : (
                        <RefundBtn onClick={() => setConfirmRef(order.id)}>Issue Refund</RefundBtn>
                      )}
                    </DetailSection>
                  )}
                </OrderDetail>
              )}
            </OrderRow>
          ))}
        </OrderList>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PageBtn disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</PageBtn>
          <PageInfo>Page {page} of {totalPages}</PageInfo>
          <PageBtn disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</PageBtn>
        </Pagination>
      )}
    </Card>
  );
};

export default AdminOrders;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const Card = styled.div`
  background: rgba(255,255,255,0.55); padding: 2rem; border-radius: 0;
  backdrop-filter: blur(10px); border: 1px solid rgba(26,26,26,0.1);
  width: 100%; max-width: 760px; margin: 0 auto 2rem; position: relative;
`;
const TitleRow = styled.div`display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.2rem;`;
const PanelTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; letter-spacing: 2px;
  text-transform: uppercase; color: ${INK}; margin: 0;
`;
const CountBadge = styled.span`
  font-family: 'Montserrat', sans-serif; font-size: 0.75rem; font-weight: 700; color: rgba(26,26,26,0.6);
  background: rgba(255,255,255,0.55); border: 1px solid rgba(26,26,26,0.1);
  padding: 2px 8px; border-radius: 10px;
`;
const FilterRow = styled.div`display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.2rem;`;
const FilterBtn = styled.button`
  padding: 0.25rem 0.65rem; border-radius: 0; cursor: pointer; font-size: 0.74rem; font-weight: 700;
  font-family: 'Montserrat', sans-serif; letter-spacing: 1px; transition: all 0.18s;
  border: 1px solid ${({ $active, $color }) => $active ? ($color || RED) : 'rgba(26,26,26,0.15)'};
  background: ${({ $active, $color }) => $active ? ($color || RED) + '1a' : 'transparent'};
  color: ${({ $active, $color }) => $active ? ($color || RED) : 'rgba(26,26,26,0.55)'};
`;
const EmptyMsg = styled.p`
  font-family: 'Montserrat', sans-serif; color: rgba(26,26,26,0.5); font-weight: 600;
  font-style: italic; font-size: 0.9rem; text-align: center; padding: 2rem 0;
`;
const OrderList = styled.div`display: flex; flex-direction: column; gap: 0.6rem;`;

const OrderRow = styled.div`
  background: rgba(255,255,255,${({ $expanded }) => $expanded ? '0.65' : '0.45'});
  border: 1px solid rgba(26,26,26,${({ $expanded }) => $expanded ? '0.15' : '0.1'});
  border-radius: 0; overflow: hidden; transition: border-color 0.2s;
`;
const OrderHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.85rem 1rem; cursor: pointer; gap: 1rem;
  &:hover { background: rgba(26,26,26,0.03); }
`;
const OrderLeft = styled.div`display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; min-width: 0;`;
const OrderNum = styled.span`font-family: monospace; font-size: 0.82rem; color: ${RED}; font-weight: 700; flex-shrink: 0;`;
const OrderCustomer = styled.span`font-family: 'Montserrat', sans-serif; font-size: 0.88rem; color: ${INK}; font-weight: 600;`;
const OrderEmail = styled.span`
  font-family: 'Montserrat', sans-serif; font-size: 0.75rem; font-weight: 600; color: rgba(26,26,26,0.55);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;
`;
const OrderRight = styled.div`display: flex; align-items: center; gap: 0.65rem; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end;`;
const OrderTotal = styled.span`font-family: 'Montserrat', sans-serif; font-size: 0.92rem; color: ${INK}; font-weight: 700;`;
const StatusBadge = styled.span`
  font-family: 'Montserrat', sans-serif; font-size: 0.67rem; font-weight: 700; letter-spacing: 1.5px;
  padding: 2px 8px; border-radius: 10px;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}1a;
  border: 1px solid ${({ $color }) => $color}40;
`;
const OrderDate = styled.span`font-family: 'Montserrat', sans-serif; font-size: 0.72rem; font-weight: 600; color: rgba(26,26,26,0.5);`;
const ChevronIcon = styled.span`
  color: rgba(26,26,26,0.45); font-size: 1.1rem; transition: transform 0.2s;
  transform: rotate(${({ $open }) => $open ? '90deg' : '0deg'});
`;

const OrderDetail = styled.div`
  padding: 1rem; border-top: 1px solid rgba(26,26,26,0.1);
  display: flex; flex-direction: column; gap: 1rem;
`;
const DetailSection = styled.div``;
const DetailLabel = styled.p`
  font-family: 'Bebas Neue', sans-serif; font-size: 0.78rem; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
  color: ${RED}; margin: 0 0 0.5rem;
`;
const ItemTable = styled.div`display: flex; flex-direction: column; gap: 0.35rem;`;
const ItemRow = styled.div`display: flex; align-items: center; gap: 0.75rem;`;
const ItemName = styled.span`
  flex: 1; font-family: 'Montserrat', sans-serif; font-size: 0.84rem; color: ${INK};
  display: flex; align-items: center; gap: 0.45rem;
`;
const ItemQty = styled.span`font-family: 'Montserrat', sans-serif; font-size: 0.78rem; font-weight: 600; color: rgba(26,26,26,0.55);`;
const ItemPrice = styled.span`font-family: 'Montserrat', sans-serif; font-size: 0.84rem; color: ${RED};`;
const GCTag = styled.span`
  font-family: 'Montserrat', sans-serif; font-size: 0.66rem; font-weight: 600; padding: 1px 6px; border-radius: 3px;
  background: rgba(196,30,58,0.12); color: ${RED}; border: 1px solid rgba(196,30,58,0.25);
`;
const GiftCodeRow = styled.div`display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.3rem;`;
const GiftCode = styled.span`font-family: monospace; font-size: 0.9rem; color: ${INK}; font-weight: 600; letter-spacing: 2px;`;
const GiftCodeMeta = styled.span`font-family: 'Montserrat', sans-serif; font-size: 0.75rem; font-weight: 600; color: rgba(26,26,26,0.55);`;
const StatusRow = styled.div`display: flex; gap: 0.4rem; flex-wrap: wrap;`;
const StatusBtn = styled.button`
  padding: 0.25rem 0.6rem; border-radius: 0; cursor: pointer; font-size: 0.73rem;
  font-family: 'Montserrat', sans-serif; font-weight: 700; letter-spacing: 1px; transition: all 0.15s;
  border: 1px solid ${({ $active, $color }) => $active ? $color : 'rgba(26,26,26,0.15)'};
  background: ${({ $active, $color }) => $active ? $color + '1a' : 'transparent'};
  color: ${({ $active, $color }) => $active ? $color : 'rgba(26,26,26,0.55)'};
  &:hover:not(:disabled) { border-color: ${({ $color }) => $color}; color: ${({ $color }) => $color}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
const RefundBtn = styled.button`
  padding: 0.28rem 0.7rem; border-radius: 0; cursor: pointer; font-size: 0.78rem; font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  border: 1px solid ${RED}; background: rgba(196,30,58,0.08); color: ${RED};
  transition: all 0.15s;
  &:hover { background: rgba(196,30,58,0.16); }
`;
const RefundConfirm = styled.div`
  display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
  font-family: 'Montserrat', sans-serif; font-size: 0.8rem; font-weight: 600; color: rgba(26,26,26,0.6);
`;
const RefundYesBtn = styled(RefundBtn)`font-weight: 700; border-color: ${RED}; &:disabled { opacity: 0.5; cursor: not-allowed; }`;
const CancelRefBtn = styled.button`
  padding: 0.28rem 0.7rem; border-radius: 0; cursor: pointer; font-size: 0.78rem;
  font-family: 'Montserrat', sans-serif; font-weight: 600;
  border: 1px solid rgba(26,26,26,0.15); background: transparent; color: rgba(26,26,26,0.55);
  &:hover { color: ${INK}; border-color: rgba(26,26,26,0.3); }
`;
const Pagination = styled.div`display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.2rem;`;
const PageBtn = styled.button`
  background: transparent; border: 1px solid rgba(26,26,26,0.15); border-radius: 0;
  color: rgba(26,26,26,0.55); padding: 0.35rem 0.9rem;
  cursor: pointer; font-size: 0.82rem; font-family: 'Montserrat', sans-serif; font-weight: 600; transition: all 0.18s;
  &:hover:not(:disabled) { border-color: ${RED}; color: ${RED}; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
`;
const PageInfo = styled.span`font-family: 'Montserrat', sans-serif; font-size: 0.78rem; font-weight: 600; color: rgba(26,26,26,0.5);`;
