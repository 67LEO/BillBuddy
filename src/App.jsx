import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GroupView from './pages/GroupView';
import Settlement from './pages/Settlement';
import Analytics from './pages/Analytics';
import Calculator from './pages/Calculator';
import Account from './pages/Account';
import AccountSettlement from './pages/AccountSettlement';
import SettledHistory from './pages/SettledHistory';
import Profile from './pages/Profile';
import Contacts from './pages/Contacts';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import './index.css';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'abhi';
  if (min < 60) return `${min} min pehle`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} ghante pehle`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'kal' : `${days} din pehle`;
}

function NotificationBell() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const notifs = state.notifications || [];
  const unreadCount = notifs.filter((n) => !n.read_at).length;

  const handleOpen = () => {
    setOpen((o) => !o);
  };

  const markAllRead = () => {
    const ids = notifs.filter((n) => !n.read_at).map((n) => n.id);
    if (ids.length > 0) dispatch({ type: 'MARK_NOTIFICATIONS_READ', payload: ids });
  };

  const handleItemClick = (n) => {
    setOpen(false);
    if (!n.read_at) {
      dispatch({ type: 'MARK_NOTIFICATIONS_READ', payload: [n.id] });
    }
    navigate(`/group/${n.group_id}`);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl text-[var(--ink)]/50 hover:text-[var(--ink)] hover:bg-[var(--ink)]/5 transition-all cursor-pointer"
        title="Notifications"
      >
        <i className="ti ti-bell text-base" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: 'var(--crimson)', color: 'var(--cream)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] ink-border rounded-2xl z-50 overflow-hidden"
            style={{ background: 'var(--cream)', boxShadow: '0 12px 40px rgba(58,44,92,0.15)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(58,44,92,0.08)' }}
            >
              <span className="text-sm font-bold font-display text-[var(--ink)]">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-[var(--crimson)] font-semibold cursor-pointer hover:underline"
                >
                  Sab padh liya
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--ink)]/40">
                  <i className="ti ti-bell-off text-xl mb-1 block" />
                  Koi notification nahi
                </div>
              ) : (
                notifs.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="w-full text-left px-4 py-3 hover:bg-[var(--cream-2)] transition-colors cursor-pointer flex items-start gap-2.5"
                    style={!n.read_at ? { background: 'rgba(224,130,68,0.06)' } : undefined}
                  >
                    <div
                      className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[var(--cream)]"
                      style={{ background: 'var(--pumpkin)' }}
                    >
                      <i className="ti ti-bell text-xs" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-[var(--ink)] leading-snug">{n.message}</div>
                      <div className="text-[9px] text-[var(--ink)]/40 mt-0.5">
                        {n.group_name} · {timeAgo(n.created_at)}
                      </div>
                    </div>
                    {!n.read_at && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--crimson)' }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';
  const activeGroup = state.groups.find((g) => g.id === state.activeGroupId);

  if (isLanding || isLogin) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ background: 'var(--cream)' }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {state.activeGroupId && location.pathname !== '/dashboard' ? (
            <button
              onClick={() => {
                if (location.pathname.startsWith('/group/')) {
                  dispatch({ type: 'SET_ACTIVE_GROUP', payload: null });
                  navigate('/dashboard');
                } else {
                  navigate(-1);
                }
              }}
              className="p-2 rounded-xl hover:bg-[var(--ink)]/5 transition-colors text-[var(--ink)]/50 hover:text-[var(--ink)]"
            >
              <i className="ti ti-arrow-left text-lg" />
            </button>
          ) : null}
          <Link to="/dashboard" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
            <div className="w-9 h-9 rounded-full bg-[var(--ink)] flex items-center justify-center">
              <span className="font-display text-[var(--cream)] text-lg italic font-bold">B</span>
            </div>
            <span className="text-lg font-bold font-display text-[var(--ink)] tracking-tight hidden sm:block">
              BillBuddy
            </span>
          </Link>
          {activeGroup && (
            <span className="text-sm text-[var(--ink)]/50 hidden md:block">/ {activeGroup.name}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`nav-link px-3 py-2 text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-[var(--ink)]' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}
            >
              Home
            </Link>
            <Link
              to="/account"
              className={`nav-link px-3 py-2 text-sm font-medium transition-colors ${location.pathname === '/account' ? 'text-[var(--ink)]' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}
            >
              Account
            </Link>
            <Link
              to="/contacts"
              className={`nav-link px-3 py-2 text-sm font-medium transition-colors ${location.pathname === '/contacts' ? 'text-[var(--ink)]' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}
            >
              Contacts
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`nav-link px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${location.pathname === '/admin' ? 'text-[var(--ink)]' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}
              >
                <i className="ti ti-shield-lock text-xs" /> Admin
              </Link>
            )}
            {state.activeGroupId && (
              <>
                <Link
                  to={`/group/${state.activeGroupId}`}
                  className={`nav-link px-3 py-2 text-sm font-medium transition-colors ${location.pathname.startsWith('/group/') ? 'text-[var(--ink)]' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}
                >
                  Group
                </Link>
                <Link
                  to={`/analytics/${state.activeGroupId}`}
                  className={`nav-link px-3 py-2 text-sm font-medium transition-colors ${location.pathname.startsWith('/analytics/') ? 'text-[var(--ink)]' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}
                >
                  Analytics
                </Link>
              </>
            )}
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-2 ml-3 pl-3" style={{ borderLeft: '1px solid rgba(58,44,92,0.12)' }}>
              <NotificationBell />
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/profile"
                  className="w-7 h-7 rounded-full bg-[var(--ink)] flex items-center justify-center hover:ring-2 hover:ring-[var(--pumpkin)] transition-all"
                >
                  <span className="text-[var(--cream)] text-[10px] font-bold">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                </Link>
                <span className="text-xs text-[var(--ink)]/50 max-w-[120px] truncate">{user?.email || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-[var(--ink)]/50 hover:text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition-all cursor-pointer"
                title="Logout"
              >
                <i className="ti ti-logout text-base" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="dotted max-w-[1280px] mx-auto" />
    </header>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useApp();
  const { isAuthenticated } = useAuth();
  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  if (isLanding || isLogin || !isAuthenticated) return null;

  const navItems = [
    { path: '/dashboard', icon: 'ti ti-home', label: 'Home' },
    { path: '/account', icon: 'ti ti-wallet', label: 'Account' },
    { path: '/contacts', icon: 'ti ti-notebook', label: 'Contacts' },
    { path: '/profile', icon: 'ti ti-user', label: 'Profile' },
    ...(state.activeGroupId
      ? [
          { path: `/group/${state.activeGroupId}`, icon: 'ti ti-users', label: 'Group' },
        ]
      : []),
  ];

  return (
    <div className="bottom-nav sm:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = item.path === '/dashboard'
            ? location.pathname === '/dashboard'
            : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <i className={`${item.icon} text-xl`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/account/settlement" element={<ProtectedRoute><AccountSettlement /></ProtectedRoute>} />
        <Route path="/account/settled-history" element={<ProtectedRoute><SettledHistory /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/group/:groupId" element={<ProtectedRoute><GroupView /></ProtectedRoute>} />
        <Route path="/settlement/:groupId" element={<ProtectedRoute><Settlement /></ProtectedRoute>} />
        <Route path="/analytics/:groupId" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
            <Navbar />
            <AnimatedRoutes />
            <MobileBottomNav />
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}
