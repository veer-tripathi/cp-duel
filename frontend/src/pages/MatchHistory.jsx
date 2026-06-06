import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function MatchHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/api/rooms/history')
            .then((res) => setHistory(res.data.history))
            .catch(() => setError('Failed to load match history'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
            <p className="text-green-400 font-mono animate-pulse">Loading history...</p>
        </div>
    );

    if (error) return (
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
            <p className="text-red-400 font-mono">✗ {error}</p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="mb-8">
                <p className="font-mono text-green-400 text-sm mb-1">$ match_history</p>
                <h1 className="text-3xl font-bold text-white font-display">Past Duels</h1>
                <p className="text-gray-500 text-sm mt-1">Last {history.length} matches</p>
            </div>

            {history.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-gray-600 font-mono text-sm">No matches played yet.</p>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary mt-6">
                        Play your first duel
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((match, i) => (
                        <div
                            key={match.roomId || i}
                            className={`card border transition-colors ${match.outcome === 'win'
                                    ? 'border-green-500/20 hover:border-green-500/30'
                                    : 'border-red-500/20 hover:border-red-500/30'
                                }`}
                        >
                            <div className="flex items-center justify-between flex-wrap gap-4">

                                {/* Outcome badge + opponent */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-sm ${match.outcome === 'win'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {match.outcome === 'win' ? 'W' : 'L'}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            vs <span className="text-gray-300">{match.opponent}</span>
                                            <span className="text-gray-600 font-mono text-xs ml-2">
                                                ({match.opponentHandle})
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                                            {match.finishedAt
                                                ? new Date(match.finishedAt).toLocaleString()
                                                : 'Unknown time'}
                                        </p>
                                    </div>
                                </div>

                                {/* Problem link */}
                                {/* Problem link */}
                                {match.problem && (
                                    <div className="text-right">
                                        <a
                                            href={match.problem.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-green-400 hover:text-green-300 font-mono transition-colors"
                                        >
                                            {match.problem.name} →
                                        </a>

                                        <p className="text-xs text-gray-600 font-mono mt-0.5">
                                            rating {match.problem.rating}
                                        </p>
                                    </div>
                                )}

                                {/* Rating delta */}
                                <div className="text-right min-w-[60px]">
                                    <p className={`text-xl font-bold font-mono ${match.outcome === 'win' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {match.outcome === 'win'
                                            ? `+${match.ratingDelta}`
                                            : `${match.ratingDelta}`}
                                    </p>
                                    {match.myRating && (
                                        <p className="text-xs text-gray-600 font-mono">
                                            → {match.myRating}
                                        </p>
                                    )}
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 text-center">
                <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                    ← Back to Dashboard
                </button>
            </div>
        </div>
    );
}