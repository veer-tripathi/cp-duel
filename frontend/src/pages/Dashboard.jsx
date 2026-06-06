import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleCreate = async () => {
    setError('');
    setCreating(true);
    try {
      const res = await api.post('/api/rooms/create');
      navigate(`/room/${res.data.room.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setError('');
    setJoining(true);
    try {
      const res = await api.post('/api/rooms/join', { roomId: joinCode.trim().toUpperCase() });
      navigate(`/room/${res.data.room.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  const totalGames = (user?.wins || 0) + (user?.losses || 0);
  const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Welcome */}
      <div className="mb-10">
        <p className="font-mono text-green-400 text-sm mb-1">$ whoami</p>
        <h1 className="text-4xl font-bold text-white font-display">
          Hey, <span className="text-green-400">{user?.username}</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm font-mono">
          {user?.codeforcesHandle} · {user?.rating || 1200} CF rating
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'WINS', value: user?.wins || 0, color: 'text-green-400' },
          { label: 'LOSSES', value: user?.losses || 0, color: 'text-red-400' },
          { label: 'WIN RATE', value: `${winRate}%`, color: 'text-yellow-400' },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-600 font-mono mt-1 tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-mono">
          ✗ {error}
        </div>
      )}

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Room */}
        <div className="card border-green-500/10 hover:border-green-500/20 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <span className="text-green-400 text-lg">+</span>
            </div>
            <div>
              <h2 className="font-bold text-white">Create Room</h2>
              <p className="text-xs text-gray-500">Host a 1v1 duel</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Create a private room and share the code with your opponent. You control when the duel starts.
          </p>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary w-full"
          >
            {creating ? 'Creating...' : '⚔ Create Room'}
          </button>
        </div>

        {/* Join Room */}
        <div className="card border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-gray-400 text-lg">→</span>
            </div>
            <div>
              <h2 className="font-bold text-white">Join Room</h2>
              <p className="text-xs text-gray-500">Enter with a room code</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Got a room code from your opponent? Enter it below to join their duel room.
          </p>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              className="input-field uppercase tracking-widest"
              placeholder="ROOM CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
            <button
              type="submit"
              disabled={joining || !joinCode.trim()}
              className="btn-secondary w-full"
            >
              {joining ? 'Joining...' : '→ Join Room'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-10 text-center">
        <p className="text-gray-700 text-xs font-mono">
          Problems sourced from Codeforces API · Rating-matched · Never-solved filter active
        </p>
      </div>
    </div>
  );
}
