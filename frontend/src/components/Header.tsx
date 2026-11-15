import { Link, NavLink } from 'react-router-dom';
import { LineChart, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <LineChart className="text-emerald-400" size={22} />
          <span>
            <span className="ltr">Stock Insights</span> <span className="ltr text-emerald-400">Hub</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `btn-ghost ${isActive ? 'bg-slate-700/60 text-emerald-300' : ''}`
              }
            >
              <ShieldCheck size={16} /> ניהול
            </NavLink>
          )}
          {user ? (
            <>
              <span className="hidden text-sm text-slate-400 sm:inline">
                <span className="ltr">@{user.username}</span>
                {user.role === 'ADMIN' && (
                  <span className="me-0 ms-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                    מנהל
                  </span>
                )}
              </span>
              <button className="btn-ghost" onClick={logout} title="התנתקות">
                <LogOut size={16} />
                <span className="hidden sm:inline">התנתקות</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                התחברות
              </Link>
              <Link to="/register" className="btn-primary">
                הרשמה
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
