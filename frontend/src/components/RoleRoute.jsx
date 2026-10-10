import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_HOME } from '../utils.js';

// Client-side guard for a dashboard. This is only for navigation: the API enforces the same rule on the server.
export default function RoleRoute({ roles }) {
  const { user } = useAuth();
  return roles.includes(user.role) ? <Outlet /> : <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
}
