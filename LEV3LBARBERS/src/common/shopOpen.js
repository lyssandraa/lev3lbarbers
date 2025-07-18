import { useState, useEffect } from 'react';

const shopOpen = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkOpen = () => {
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
      setIsOpen(open);
    };

    checkOpen();

    const now = new Date();
    const msUntilNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();

    const timeoutId = setTimeout(() => {
      checkOpen();
      const intervalId = setInterval(checkOpen, 3600000);
      return () => clearInterval(intervalId);
    }, msUntilNextHour);

    return () => clearTimeout(timeoutId);
  }, []);

  return isOpen;
};

export default shopOpen;
