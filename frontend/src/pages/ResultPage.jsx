import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ResultPage() {
  const { roomId } = useParams();
  const { state } = useLocation(); // passed from navigate() in DuelPage
  const { user } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState(state || null);
  const [loading, setLoading] = useState(!state);

  useEffect(() => {
    if (state) return;
    // Fallback: fetch from API if no state (e.g. direct URL access)
    api.get(`/api/duel/status/${roomId}`)
      .then((res) => {
        const d = res.data;
        setResult({
          winner: d.winner,
          submissionTime: d.winnerSubmissionTime,
          problem: d.currentProblem,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId, state]);

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <p className="text-green-400 font-mono animate-pulse">Loading result...</p>
    </div>
  );

  const isWinner = result?.winner === user?.username;
  const submissionDate = result?.submissionTime ? new Date(result.submissionTime) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      {/* Outcome */}
      <div className="mb-10">
        <div className={`text-7xl mb-4 ${isWinner ? '' : 'grayscale opacity-50'}`}>
          {isWinner ? '🏆' : '💀'}
        </div>
        <h1 className={`text-5xl font-bold font-display mb-2 ${
          isWinner ? 'text-green-400' : 'text-red-400'
        }`}>
          {isWinner ? 'You Won!' : 'You Lost'}
        </h1>
        <p className="text-gray-500 font-mono text-sm">
          {isWinner
            ? 'First accepted submission. GG!'
            : `${result?.winner || 'Opponent'} got there first.`}
        </p>
      </div>

      {/* Problem info */}
      {result?.problem && (
        <div className="card text-left mb-6">
          <p className="text-xs text-gray-600 font-mono mb-3 tracking-widest">PROBLEM</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold">{result.problem.name}</p>
              <p className="text-gray-500 text-sm font-mono mt-0.5">
                CF {result.problem.contestId}{result.problem.index}
              </p>
            </div>
            <span className="text-2xl font-bold font-mono text-green-400">
              {result.problem.rating}
            </span>
          </div>
          {submissionDate && (
            <p className="text-xs text-gray-600 font-mono mt-3">
              Accepted at {submissionDate.toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* Winner callout */}
      <div className={`card mb-8 border ${
        isWinner ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
      }`}>
        <p className="text-xs text-gray-600 font-mono mb-1">WINNER</p>
        <p className={`text-2xl font-bold font-mono ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
          {result?.winner || 'Unknown'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary px-8"
        >
          ⚔ Play Again
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary px-8"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}
