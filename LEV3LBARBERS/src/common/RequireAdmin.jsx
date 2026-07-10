import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BarberSwitcher from '../components/BarberSwitcher';

export default function RequireAdmin({ children }) {
  const { isLoggedIn, isShopUser } = useAuth();
  if (!isLoggedIn) return <BarberSwitcher />;
  if (!isShopUser) return <Navigate to="/" replace />;
  return children;
}
