import React, { useEffect } from 'react';
import { Copy, Users, Trophy, ArrowLeft } from 'lucide-react';
import copy from 'copy-to-clipboard';

function Lobby({ gameData, playerName, onStartGame, socket, soundManager, onGameStart, onLeaveLobby }) {
  const isCreator = gameData && socket && gameData.creator === socket.id;
  const canStart = gameData && gameData.players.length === 2;

  useEffect(() => {
    if (!socket) return;

    socket.on('game-started', () => {
      soundManager.play('start');
      onGameStart();
    });

    return () => {
      socket.off('game-started');
    };
  }, [socket, soundManager, onGameStart]);

  const copyGameCode = () => {
    copy(gameData.gameId);
    soundManager.play('click');
  };

  const handleLeaveLobby = () => {
    if (window.confirm('Are you sure you want to leave the lobby?')) {
      socket.emit('leave-lobby');
      soundManager.play('error');
      onLeaveLobby();
    }
  };

  if (!gameData) return null;

  return (
    <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full border border-white/20">
      <button
        onClick={handleLeaveLobby}
        className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full border border-white/30 transition-all"
        title="Leave Lobby"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="text-center mb-8">
        <Users className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Game Lobby</h2>
        <p className="text-blue-200">Waiting for players...</p>
      </div>

      <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/70">Game Code</span>
          <button
            onClick={copyGameCode}
            className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <Copy className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Copy</span>
          </button>
        </div>
        <div className="text-4xl font-bold text-center text-yellow-400 tracking-widest">
          {gameData.gameId}
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Game Settings</h3>
        </div>
        <p className="text-blue-200 mb-2">
          First to <span className="font-bold text-yellow-400">{gameData.roundsToWin}</span> wins
        </p>
        <p className="text-blue-200 text-sm">
          ⏱️ Letter: <span className="font-bold text-yellow-400">{gameData.letterTime || 5}s</span> | 
          Word: <span className="font-bold text-yellow-400">{gameData.wordTime || 30}s</span>
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <h3 className="text-white font-medium mb-3">Players ({gameData.players.length}/2)</h3>
        {gameData.players.map((player, index) => (
          <div
            key={player.id}
            className="bg-white/10 rounded-lg p-4 border border-white/20 flex items-center gap-3"
          >
            <div className={`w-3 h-3 rounded-full ${player.name === playerName ? 'bg-green-400' : 'bg-blue-400'} animate-pulse`}></div>
            <span className="text-white font-medium">{player.name}</span>
            {player.name === playerName && (
              <span className="ml-auto text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded">You</span>
            )}
          </div>
        ))}
        {gameData.players.length < 2 && (
          <div className="bg-white/5 rounded-lg p-4 border border-dashed border-white/20 text-center">
            <span className="text-white/50">Waiting for opponent...</span>
          </div>
        )}
      </div>

      {isCreator && canStart && (
        <button
          onClick={onStartGame}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
        >
          Start Game
        </button>
      )}

      {!isCreator && (
        <div className="text-center text-white/50 py-4">
          Waiting for host to start...
        </div>
      )}

      {isCreator && !canStart && (
        <div className="text-center text-white/50 py-4">
          Share the game code with your friend!
        </div>
      )}
    </div>
  );
}

export default Lobby;
