import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ChatsProvider } from './context/ChatsContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Chat from './pages/Chat.jsx';
import History from './pages/History.jsx';
import Knowledge from './pages/Knowledge.jsx';
import Admin from './pages/Admin.jsx';
import Settings from './pages/Settings.jsx';
import HRDashboard from './pages/HRDashboard.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import RoleRoute from './components/RoleRoute.jsx';

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}><Loader2 className="spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <ChatsProvider>
      <Outlet />
    </ChatsProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Protected />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Chat />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/history" element={<History />} />
                <Route path="/knowledge" element={<Knowledge />} />
                <Route element={<RoleRoute roles={['ADMIN']} />}>
                  <Route path="/admin" element={<Admin />} />
                </Route>
                <Route element={<RoleRoute roles={['HR', 'ADMIN']} />}>
                  <Route path="/hr" element={<HRDashboard />} />
                </Route>
                <Route element={<RoleRoute roles={['EMPLOYEE', 'HR', 'FINANCE', 'ADMIN']} />}>
                  <Route path="/employee" element={<EmployeeDashboard />} />
                </Route>
                <Route path="/settings/*" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
