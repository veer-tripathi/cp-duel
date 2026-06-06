import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    codeforcesHandle: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block font-mono text-green-400 text-xs mb-3 border border-green-500/30 px-3 py-1 rounded-full">
            $ init_user
          </div>
          <h1 className="text-3xl font-bold text-white font-display">Create account</h1>
          <p className="text-gray-500 mt-2 text-sm">Join the arena. Connect your Codeforces handle.</p>
        </div>

        <div className="card border-white/8 shadow-2xl">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-mono">
              ✗ {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 font-mono mb-1.5">USERNAME</label>
              <input
                name="username"
                className="input-field"
                placeholder="coolcoder42"
                value={form.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={20}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-mono mb-1.5">EMAIL</label>
              <input
                name="email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-mono mb-1.5">CODEFORCES HANDLE</label>
              <input
                name="codeforcesHandle"
                className="input-field"
                placeholder="tourist"
                value={form.codeforcesHandle}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-gray-600 mt-1 font-mono">Used to fetch your submissions</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-mono mb-1.5">PASSWORD</label>
              <input
                name="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Creating account...' : '→ Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Already registered?{' '}
          <Link to="/login" className="text-green-400 hover:text-green-300 font-mono">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
