import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const DEFAULT_HOURS = {
  0: { closed: true,  open: '10:00', close: '16:00' },
  1: { closed: false, open: '09:00', close: '18:00' },
  2: { closed: false, open: '09:00', close: '18:00' },
  3: { closed: false, open: '09:00', close: '18:00' },
  4: { closed: false, open: '09:00', close: '18:00' },
  5: { closed: false, open: '09:00', close: '19:00' },
  6: { closed: false, open: '09:00', close: '19:00' },
};

function computeIsOpen(openingHours) {
  const hours = openingHours || DEFAULT_HOURS;
  const now   = new Date();
  const day   = String(now.getDay());
  const dh    = hours[day];

  if (!dh || dh.closed) return false;

  const [openH, openM]   = (dh.open  || '00:00').split(':').map(Number);
  const [closeH, closeM] = (dh.close || '00:00').split(':').map(Number);
  const nowMins   = now.getHours() * 60 + now.getMinutes();
  const openMins  = openH  * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  return nowMins >= openMins && nowMins < closeMins;
}

const shopOpen = () => {
  const [status, setStatus] = useState({
    isOpen: false, barbers: [], override: false, waitTime: 0, openingHours: null,
  });

  const checkShopStatus = useCallback(async () => {
    try {
      const res = await api.get('/shop-status');
      const { isOpen, override, barbers, waitTime, openingHours } = res.data;

      setStatus({
        barbers:      barbers      || [],
        waitTime:     waitTime     || 0,
        override,
        openingHours: openingHours || null,
        isOpen:       override ? isOpen : computeIsOpen(openingHours),
      });
    } catch {
      setStatus(prev => ({ ...prev, isOpen: computeIsOpen(prev.openingHours) }));
    }
  }, []);

  useEffect(() => {
    checkShopStatus();
    const id = setInterval(checkShopStatus, 10000);
    return () => clearInterval(id);
  }, [checkShopStatus]);

  return { ...status, refresh: checkShopStatus };
};

export default shopOpen;
