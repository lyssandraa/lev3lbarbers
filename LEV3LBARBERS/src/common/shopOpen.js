import { useState, useEffect } from 'react';
import api from '../utils/api';

const shopOpen = () => {
  const [status, setStatus] = useState({
    isOpen: false,
    barbers: [],
    override: false,
    waitTime: 0,
  });

  const calculateIsOpenByTime = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    let open = false;

    if (day >= 1 && day <= 4) {
      open = hour >= 9 && hour < 18;
    } else if (day === 5 || day === 6) {
      open = hour >= 9 && hour < 19;
    } else if (day === 0) {
      open = hour >= 10 && hour < 16;
    }

    return open;
  };

  const checkShopStatus = async () => {
    try {
      const res = await api.get('/shop-status');
      const { isOpen: apiIsOpen, override, barbers, waitTime } = res.data;

      setStatus({
        barbers: barbers || [],
        waitTime: waitTime || 0,
        override,
        isOpen: override ? apiIsOpen : calculateIsOpenByTime(),
      });
    } catch (error) {
      console.error('Failed to fetch shop status:', error);
      setStatus({
        isOpen: calculateIsOpenByTime(),
        barbers: [],
        waitTime: 0,
        override: false,
      });
    }
  };

  useEffect(() => {
    checkShopStatus();

    const interval = setInterval(() => {
      checkShopStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [checkShopStatus]);

  return { ...status, refresh: checkShopStatus };
};

export default shopOpen;
