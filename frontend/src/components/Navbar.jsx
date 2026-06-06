import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded border border-green-500/50 flex items-center justify-center group-hover:border-green-400 transition-colors">
            <span className="text-green-400 font-mono font-bold text-xs">{'>'}_</span>
          </div>
          <span className="font-mono font-bold text-white text-sm tracking-wider">
            CP<span className="text-green-400">DUEL</span>
          </span>
        </Link>

        {/* Right side */}
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full ping-slow" />
              <span className="text-gray-400 font-mono text-xs">{user.codeforcesHandle}</span>
            </div>
            <Link
              to="/history"
              className="text-xs text-gray-500 hover:text-green-400 font-mono transition-colors hidden sm:block"
            >
              [history]
            </Link>
            <span className="text-gray-300 font-medium text-sm">{user.username}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-400 font-mono transition-colors"
            >
              [logout]
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors font-mono">
              login
            </Link>
            <Link to="/register" className="btn-primary text-sm py-1.5 px-4">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
