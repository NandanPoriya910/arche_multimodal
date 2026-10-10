import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { KeyRound, User } from 'lucide-react';
import Providers from './Providers.jsx';
import Account from './Account.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';
  return (
    <div className="scroll">
      <div className="page">
        <div className="page-head"><div><h1>Settings</h1></div></div>
        <div className="settings">
          <nav className="subnav">
            {isAdmin && <NavLink to="/settings/providers" className="nav-item"><KeyRound size={19} /> LLM Providers & Keys</NavLink>}
            <NavLink to="/settings/account" className="nav-item"><User size={19} /> Account</NavLink>
          </nav>
          <div style={{ minWidth: 0 }}>
            <Routes>
              <Route path="providers" element={<Providers />} />
              <Route path="account" element={<Account />} />
              <Route path="*" element={<Navigate to={isAdmin ? 'providers' : 'account'} replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
