import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { connectSocket } from '../sockets/socket';

function useElapsed(startedAt) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function DuelPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const timerDisplay = useElapsed(status?.startedAt);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const res = await api.get(`/api/duel/status/${roomId}`);
        if (!mounted) return;
        setStatus(res.data);

        // Connect socket and listen for result
        const socket = connectSocket();
        socketRef.current = socket;

        socket.on('gameResult', (result) => {
          navigate(`/result/${roomId}`, { state: result });
        });
      } catch (err) {
        setError('Failed to load duel');
      }
    };

    init();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off('gameResult');
      }
    };
  }, [roomId]);

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <p className="text-red-400 font-mono">✗ {error}</p>
    </div>
  );

  if (!status?.currentProblem) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <p className="text-green-400 font-mono animate-pulse">Loading duel...</p>
    </div>
  );

  const { currentProblem: problem } = status;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full ping-slow" />
          <span className="text-red-400 font-mono text-sm font-bold tracking-wider">LIVE</span>
        </div>
        <div className="font-mono text-green-400 text-2xl font-bold tabular-nums">
          {timerDisplay}
        </div>
        <div className="text-xs text-gray-600 font-mono">ELAPSED</div>
      </div>

      {/* Problem card */}
      <div className="card border-green-500/20 green-glow mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-600 font-mono mb-1.5 tracking-widest">TODAY'S PROBLEM</p>
            <h1 className="text-2xl font-bold text-white font-display">{problem.name}</h1>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold font-mono text-green-400">{problem.rating}</span>
            <p className="text-xs text-gray-600 font-mono">RATING</p>
          </div>
        </div>

        {/* Tags */}
        {problem.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {problem.tags.map((tag) => (
              <span key={tag} className="tag bg-white/5 text-gray-400 border border-white/5">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Problem link */}
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg transition-all active:scale-95"
        >
          Open Problem on Codeforces →
        </a>
      </div>

      {/* Instructions */}
      <div className="card border-white/5">
        <h3 className="text-xs text-gray-600 font-mono mb-3 tracking-widest">HOW TO WIN</h3>
        <ol className="space-y-2 text-sm text-gray-400">
          <li className="flex gap-3">
            <span className="text-green-400 font-mono">01</span>
            Open the problem above on Codeforces
          </li>
          <li className="flex gap-3">
            <span className="text-green-400 font-mono">02</span>
            Solve it and submit with your registered CF handle
          </li>
          <li className="flex gap-3">
            <span className="text-green-400 font-mono">03</span>
            First player to get an <span className="text-green-400 font-mono">Accepted</span> verdict wins
          </li>
          <li className="flex gap-3">
            <span className="text-green-400 font-mono">04</span>
            We monitor submissions automatically — no manual input needed
          </li>
        </ol>
      </div>

      {/* Monitoring notice */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-700 font-mono">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full ping-slow" />
        Polling Codeforces submissions every 6 seconds...
      </div>
    </div>
  );
}
