import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'lev3l_cart';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function cartId(item) {
  return item.type === 'gift-card'
    ? `gc-${item.giftCardValue}`
    : `product-${item.productId}`;
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const id  = cartId(action.item);
      const idx = state.findIndex(i => i.cartId === id);
      if (idx >= 0) {
        return state.map((i, n) =>
          n === idx ? { ...i, quantity: i.quantity + (action.item.quantity || 1) } : i
        );
      }
      return [...state, { ...action.item, cartId: id, quantity: action.item.quantity || 1 }];
    }
    case 'REMOVE':
      return state.filter(i => i.cartId !== action.cartId);
    case 'SET_QTY':
      if (action.qty < 1) return state.filter(i => i.cartId !== action.cartId);
      return state.map(i => i.cartId === action.cartId ? { ...i, quantity: action.qty } : i);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export const CartProvider = ({ children }) => {
  const [items, dispatch] = useReducer(reducer, [], load);

  useEffect(() => { save(items); }, [items]);

  const addItem    = (item)          => dispatch({ type: 'ADD',     item });
  const removeItem = (cartId)        => dispatch({ type: 'REMOVE',  cartId });
  const setQty     = (cartId, qty)   => dispatch({ type: 'SET_QTY', cartId, qty });
  const clearCart  = ()              => dispatch({ type: 'CLEAR' });

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQty, clearCart, count, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
