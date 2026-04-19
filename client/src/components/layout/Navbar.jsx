import { Link, NavLink } from 'react-router-dom';
import { Moon, Sun, LogOut, BarChart2, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-40 bg-white/90 dark:bg-surface/90 backdrop-blur-md border-b border-gray-200/80 dark:border-surface-border">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center shadow-sm group-hover:bg-accent-hover transition-colors">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">DevTrack</span>
        </Link>

        {/* Nav links */}
        {user && (
          <div className="flex items-center gap-0.5 flex-1 mx-4">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm rounded-lg transition-all duration-150 font-medium ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm rounded-lg transition-all duration-150 font-medium ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              Settings
            </NavLink>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="btn-ghost p-2 rounded-lg"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user && (
            <div className="flex items-center gap-1 ml-1">
              <div className="flex items-center gap-2 pl-2">
                <img
                  src={user.avatarUrl || `https://avatars.githubusercontent.com/u/0`}
                  alt={user.username}
                  className="w-7 h-7 rounded-full ring-2 ring-gray-200 dark:ring-surface-border"
                />
                <span className="hidden sm:block text-xs font-medium text-gray-600 dark:text-gray-300">
                  {user.username}
                </span>
              </div>
              <button
                onClick={logout}
                className="btn-ghost p-2 rounded-lg ml-1"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
