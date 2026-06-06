import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../sockets/socket';

export default function RoomLobby() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef(null);

  const isHost = room && String(room.host) === String(user?._id);
  const canStart = room?.players?.length === 2 && room?.status === 'ready';

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const res = await api.get(`/api/rooms/${roomId}`);
        if (!mounted) return;
        setRoom(res.data.room);

        // Connect socket
        const socket = connectSocket();
        socketRef.current = socket;

        const myRole = String(res.data.room.host) === String(user._id) ? 'createRoom' : 'joinRoom';

        // Emit create/join socket event
        socket.emit(myRole, {
          roomId,
          username: user.username,
          players: res.data.room.players,
        });

        // Listen for another player joining
        socket.on('playerJoined', ({ players }) => {
          setRoom((prev) => ({ ...prev, players, status: 'ready' }));
        });

        // Listen for duel starting
        socket.on('duelStarted', ({ problem }) => {
          navigate(`/duel/${roomId}`);
        });

        // Also listen via gameStarting (from host click)
        socket.on('gameStarting', () => {
          // Will be followed by duelStarted from backend after problem is selected
        });

        socket.on('playerLeft', ({ username }) => {
          setRoom((prev) => ({
            ...prev,
            players: prev.players.filter((p) => p.username !== username),
            status: 'waiting',
          }));
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load room');
      }
    };

    init();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off('playerJoined');
        socketRef.current.off('duelStarted');
        socketRef.current.off('gameStarting');
        socketRef.current.off('playerLeft');
      }
    };
  }, [roomId]);

  const handleStartDuel = async () => {
    setStarting(true);
    setError('');
    try {
      // Notify all via socket
      socketRef.current?.emit('startGame', { roomId });
      // Trigger actual duel start via REST
      await api.post('/api/duel/start', { roomId });
      // Socket event 'duelStarted' will trigger navigation
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start duel');
      setStarting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <p className="text-red-400 font-mono">✗ {error}</p>
    </div>
  );
  if (!room) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <p className="text-green-400 font-mono animate-pulse">Loading room...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Room code */}
      <div className="mb-8 text-center">
        <p className="text-xs text-gray-600 font-mono mb-2">ROOM CODE</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-mono font-bold text-white tracking-[0.25em]">{roomId}</span>
          <button
            onClick={copyCode}
            className="text-xs font-mono text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50 px-3 py-1.5 rounded transition-all"
          >
            {copied ? '✓ copied' : 'copy'}
          </button>
        </div>
        <p className="text-gray-600 text-xs mt-2 font-mono">Share this code with your opponent</p>
      </div>

      {/* Status badge */}
      <div className="flex justify-center mb-8">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-mono ${
          room.status === 'ready'
            ? 'border-green-500/40 bg-green-500/10 text-green-400'
            : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${room.status === 'ready' ? 'bg-green-400' : 'bg-yellow-400'} ping-slow`} />
          {room.status === 'ready' ? 'Both players ready' : 'Waiting for opponent...'}
        </div>
      </div>

      {/* Players */}
      <div className="card mb-6">
        <h2 className="text-xs text-gray-600 font-mono mb-4 tracking-widest">PLAYERS</h2>
        <div className="space-y-3">
          {[0, 1].map((i) => {
            const player = room.players[i];
            return (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-lg border ${
                player ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 bg-white/[0.02]'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-mono ${
                  player ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-700'
                }`}>
                  {player ? player.username[0].toUpperCase() : '?'}
                </div>
                {player ? (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{player.username}</span>
                      {String(room.host) === String(player.user) && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono">HOST</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{player.codeforcesHandle}</span>
                  </div>
                ) : (
                  <span className="text-gray-700 font-mono text-sm">Waiting...</span>
                )}
                {player && (
                  <span className="text-xs text-gray-600 font-mono">{player.rating || 1200}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Start button */}
      {isHost && (
        <button
          onClick={handleStartDuel}
          disabled={!canStart || starting}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
            canStart && !starting
              ? 'bg-green-500 hover:bg-green-400 text-black green-glow animate-glow'
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          }`}
        >
          {starting ? '⚙ Selecting problem...' : canStart ? '⚔ Start Duel' : 'Waiting for opponent...'}
        </button>
      )}
      {!isHost && (
        <div className="text-center text-gray-600 font-mono text-sm py-4">
          Waiting for host to start the duel...
        </div>
      )}

      {error && (
        <p className="text-red-400 font-mono text-sm mt-4 text-center">✗ {error}</p>
      )}
    </div>
  );
}
