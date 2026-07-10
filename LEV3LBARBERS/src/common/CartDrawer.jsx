import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { GiftIcon, BagIcon } from './icons';

import { BACKEND } from '../config';

const CREAM = '#f4f0e8';
const INK   = '#1a1a1a';
const RED   = '#C41E3A';
const EASE  = [0.22, 1, 0.36, 1];

const CartDrawer = ({ open, onClose }) => {
  const { items, removeItem, setQty, total, count } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <Drawer
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <DrawerHead>
              <DrawerTitle>
                Your Cart
                {count > 0 && <ItemCount>{count}</ItemCount>}
              </DrawerTitle>
              <CloseBtn onClick={onClose} aria-label="Close cart">✕</CloseBtn>
            </DrawerHead>

            {/* Items */}
            <ItemsArea>
              {items.length === 0 ? (
                <Empty>
                  <EmptyIcon
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <BagIcon width={44} height={44} />
                  </EmptyIcon>
                  <EmptyText>Your cart is empty.</EmptyText>
                  <BrowseBtn onClick={() => { onClose(); navigate('/shop'); }}>
                    Browse the Shop →
                  </BrowseBtn>
                </Empty>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map(item => (
                    <CartItem
                      key={item.cartId}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 60, transition: { duration: 0.25, ease: EASE } }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      <ItemThumb>
                        {item.imageUrl
                          ? <img src={`${BACKEND}${item.imageUrl}`} alt={item.name} />
                          : <ThumbPlaceholder>
                              {item.type === 'gift-card' ? <GiftIcon width={22} height={22} /> : '✦'}
                            </ThumbPlaceholder>
                        }
                      </ItemThumb>

                      <ItemInfo>
                        <ItemName>{item.name}</ItemName>
                        {item.type === 'gift-card' && (
                          <ItemSub>Gift Card · £{item.giftCardValue} value</ItemSub>
                        )}
                        <ItemPriceRow>
                          <QtyControl>
                            <QtyBtn whileTap={{ scale: 0.82 }} onClick={() => setQty(item.cartId, item.quantity - 1)}>−</QtyBtn>
                            <QtyNum>{item.quantity}</QtyNum>
                            <QtyBtn whileTap={{ scale: 0.82 }} onClick={() => setQty(item.cartId, item.quantity + 1)}>+</QtyBtn>
                          </QtyControl>
                          <ItemPrice>£{(item.price * item.quantity).toFixed(2)}</ItemPrice>
                        </ItemPriceRow>
                      </ItemInfo>

                      <RemoveBtn onClick={() => removeItem(item.cartId)} aria-label="Remove">✕</RemoveBtn>
                    </CartItem>
                  ))}
                </AnimatePresence>
              )}
            </ItemsArea>

            {/* Footer */}
            {items.length > 0 && (
              <DrawerFoot>
                <TotalRow>
                  <TotalLabel>Subtotal</TotalLabel>
                  <TotalAmount>£{total.toFixed(2)}</TotalAmount>
                </TotalRow>
                <TotalNote>Shipping &amp; taxes calculated at checkout</TotalNote>
                <CheckoutBtn onClick={handleCheckout}>
                  Checkout →
                </CheckoutBtn>
              </DrawerFoot>
            )}
          </Drawer>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const Backdrop = styled(motion.div)`
  position: fixed; inset: 0;
  background: rgba(10,10,10,0.55);
  z-index: 8000;
`;

const Drawer = styled(motion.div)`
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: min(420px, 100vw);
  background: ${CREAM};
  border-left: 1px solid rgba(26, 26, 26, 0.1);
  z-index: 8001;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(26, 26, 26, 0.18);
`;

const DrawerHead = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.5rem 1.4rem 1.2rem;
  border-bottom: 1px solid rgba(26, 26, 26, 0.1);
  flex-shrink: 0;
`;

const DrawerTitle = styled.h2`
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3rem; letter-spacing: 3px; margin: 0;
  color: ${INK};
  display: flex; align-items: center; gap: 0.6rem;
`;

const ItemCount = styled.span`
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: ${RED}; color: #fff;
  font-size: 0.7rem; font-family: 'Montserrat', sans-serif; font-weight: 700;
`;

const CloseBtn = styled.button`
  background: none; border: none; cursor: pointer;
  color: rgba(26, 26, 26, 0.5); font-size: 1.1rem; padding: 4px;
  transition: color 0.2s; line-height: 1;
  &:hover { color: ${INK}; }
`;

const ItemsArea = styled.div`
  flex: 1; overflow-y: auto; padding: 0.5rem 0;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(26, 26, 26, 0.15); }
`;

const Empty = styled.div`
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 4rem 2rem; text-align: center; height: 100%;
`;
const EmptyIcon = styled(motion.div)`
  display: flex; justify-content: center;
  color: ${INK}; margin-bottom: 1rem; opacity: 0.4;
`;
const EmptyText = styled.p`
  font-family: 'Montserrat', sans-serif; color: rgba(26, 26, 26, 0.5);
  font-size: 0.9rem; margin: 0 0 1.5rem;
`;
const BrowseBtn = styled.button`
  background: none; border: 1px solid rgba(26, 26, 26, 0.15);
  color: rgba(26, 26, 26, 0.6); padding: 0.55rem 1.2rem;
  cursor: pointer; font-family: 'Bebas Neue', sans-serif; font-size: 0.88rem; letter-spacing: 2px;
  transition: all 0.2s;
  &:hover { border-color: rgba(26, 26, 26, 0.4); color: ${INK}; }
`;

const CartItem = styled(motion.div)`
  display: flex; gap: 0.85rem; align-items: flex-start;
  padding: 1rem 1.4rem;
  border-bottom: 1px solid rgba(26, 26, 26, 0.1);
  position: relative;
`;

const ItemThumb = styled.div`
  width: 64px; height: 64px; flex-shrink: 0;
  overflow: hidden;
  background: transparent; border: 1px solid rgba(26, 26, 26, 0.1);
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const ThumbPlaceholder = styled.div`
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; color: rgba(26, 26, 26, 0.25);
`;

const ItemInfo = styled.div`flex: 1; min-width: 0;`;
const ItemName = styled.p`
  font-family: 'Bebas Neue', sans-serif; font-size: 0.95rem; letter-spacing: 1.5px;
  color: ${INK}; margin: 0 0 0.2rem;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  padding-right: 1.5rem;
`;
const ItemSub = styled.p`
  font-family: 'Montserrat', sans-serif; font-weight: 600;
  font-size: 0.73rem; color: ${RED}; margin: 0 0 0.5rem; letter-spacing: 0.5px;
`;
const ItemPriceRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 0.5rem;
`;
const QtyControl = styled.div`
  display: flex; align-items: center; gap: 0;
  border: 1px solid rgba(26, 26, 26, 0.15); overflow: hidden;
`;
const QtyBtn = styled(motion.button)`
  background: none; border: none; cursor: pointer;
  color: rgba(26, 26, 26, 0.5); width: 28px; height: 28px;
  font-size: 1rem; line-height: 1; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
  &:hover { background: rgba(26, 26, 26, 0.05); color: ${INK}; }
`;
const QtyNum = styled.span`
  font-family: 'Montserrat', sans-serif; font-size: 0.82rem; font-weight: 600;
  color: ${INK}; width: 28px; text-align: center;
`;
const ItemPrice = styled.span`
  font-family: 'Bebas Neue', sans-serif; font-size: 1rem; letter-spacing: 1px;
  color: ${INK};
`;

const RemoveBtn = styled.button`
  position: absolute; top: 0.9rem; right: 1.4rem;
  background: none; border: none; cursor: pointer;
  color: rgba(26, 26, 26, 0.3); font-size: 0.75rem; padding: 2px; line-height: 1;
  transition: color 0.15s;
  &:hover { color: ${RED}; }
`;

const DrawerFoot = styled.div`
  padding: 1.2rem 1.4rem 1.6rem;
  border-top: 1px solid rgba(26, 26, 26, 0.1);
  flex-shrink: 0;
  background: ${CREAM};
`;
const TotalRow = styled.div`
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 0.3rem;
`;
const TotalLabel = styled.span`
  font-family: 'Bebas Neue', sans-serif; font-size: 0.8rem; letter-spacing: 3px; color: rgba(26, 26, 26, 0.5);
`;
const TotalAmount = styled.span`
  font-family: 'Bebas Neue', sans-serif; font-size: 1.6rem; letter-spacing: 2px; color: ${INK};
`;
const TotalNote = styled.p`
  font-family: 'Montserrat', sans-serif; font-size: 0.72rem; font-weight: 500;
  color: rgba(26, 26, 26, 0.4); margin: 0 0 1.1rem; letter-spacing: 0.5px;
`;
const CheckoutBtn = styled.button`
  width: 100%; padding: 1rem;
  background: ${RED}; border: none;
  color: #fff; font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem; letter-spacing: 4px; cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  &:hover { background: #a51830; transform: scale(1.01); }
`;
