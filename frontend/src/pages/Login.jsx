import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block font-mono text-green-400 text-xs mb-3 border border-green-500/30 px-3 py-1 rounded-full">
            $ access_terminal
          </div>
          <h1 className="text-3xl font-bold text-white font-display">Welcome back</h1>
          <p className="text-gray-500 mt-2 text-sm">Log in to challenge and get challenged</p>
        </div>

        {/* Form */}
        <div className="card border-white/8 shadow-2xl">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-mono">
              ✗ {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 font-mono mb-1.5">EMAIL</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-mono mb-1.5">PASSWORD</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Authenticating...' : '→ Login'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-gray-500 text-sm">
          No account?{' '}
          <Link to="/register" className="text-green-400 hover:text-green-300 font-mono">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
