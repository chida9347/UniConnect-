import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  BriefcaseBusiness,
  CircleHelp,
  ContactRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import Logo from '../components/Logo';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/posts', label: 'Student Posts', icon: MessagesSquare },
  { to: '/notes', label: 'Study Notes', icon: BookOpen },
  { to: '/questions', label: 'Questions', icon: CircleHelp },
  { to: '/faculty', label: 'Faculty Information', icon: ContactRound },
  { to: '/opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
  { to: '/profile', label: 'My Profile', icon: UserRound },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <Logo />
          <button
            type="button"
            className="icon-button sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="sidebar-label">Workspace</p>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.9} />
              <span>{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <p className="sidebar-label sidebar-label-spaced">Administration</p>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <ShieldCheck size={18} strokeWidth={1.9} />
                <span>Registered Users</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar name={user?.fullName} size="sm" />
            <div className="sidebar-user-copy">
              <strong>{user?.fullName}</strong>
              <span>{user?.universityId}</span>
            </div>
          </div>
          <div className="sidebar-user-meta">
            <Badge variant={isAdmin ? 'warning' : 'primary'}>{user?.role}</Badge>
            <span>{user?.department}</span>
          </div>
          <button type="button" className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="mobile-header">
          <button
            type="button"
            className="icon-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
          <Logo />
          <Avatar name={user?.fullName} size="sm" />
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
