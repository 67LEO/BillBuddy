import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GroupView from './pages/GroupView';
import Settlement from './pages/Settlement';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import './index.css';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { isAuthenticated, user, logout } = useAuth();
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
              <div className="hidden md:flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full bg-[var(--ink)] flex items-center justify-center"
                >
                  <span className="text-[var(--cream)] text-[10px] font-bold">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                </div>
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
    ...(state.activeGroupId
      ? [
          { path: `/group/${state.activeGroupId}`, icon: 'ti ti-users', label: 'Group' },
          { path: `/analytics/${state.activeGroupId}`, icon: 'ti ti-chart-pie', label: 'Analytics' },
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
