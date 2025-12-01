import React, { useState, useEffect } from 'react';
import { Swords, Users } from 'lucide-react';

function WelcomeScreen({ onCreateGame, onJoinGame, savedName, gameConfig }) {
  const [name, setName] = useState(savedName || '');
  const [mode, setMode] = useState(''); // 'create' or 'join'
  const [gameCode, setGameCode] = useState('');
  const [rounds, setRounds] = useState(gameConfig?.defaultRounds || 5);
  const [letterTime, setLetterTime] = useState(gameConfig?.defaultLetterTime || 5);
  const [wordTime, setWordTime] = useState(gameConfig?.defaultWordTime || 30);

  // Update name when savedName changes
  useEffect(() => {
    if (savedName && !name) {
      setName(savedName);
    }
  }, [savedName, name]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (mode === 'create') {
      onCreateGame(name.trim(), rounds, letterTime, wordTime);
    } else if (mode === 'join') {
      if (!gameCode.trim()) return;
      onJoinGame(name.trim(), gameCode.trim());
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full border border-white/20">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Swords className="w-16 h-16 text-yellow-400" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-2">Word Clash</h1>
        <p className="text-blue-200">Battle of wits and words!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white mb-2 font-medium">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Enter your name"
            maxLength={20}
            required
          />
        </div>

        {!mode && (
          <div className="space-y-3 pt-4">
            <button
              type="button"
              onClick={() => setMode('create')}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Create New Game
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" />
              Join Game
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4 slide-in">
            <div>
              <label className="block text-white mb-2 font-medium">Rounds to Win</label>
              <select
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {(gameConfig?.roundsOptions || [3, 5, 7, 10]).map(num => (
                  <option key={num} value={num} className="bg-gray-800">Best of {num}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Letter Time (seconds)</label>
              <select
                value={letterTime}
                onChange={(e) => setLetterTime(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {(gameConfig?.letterTimeOptions || [3, 5, 7, 10, 15]).map(num => (
                  <option key={num} value={num} className="bg-gray-800">{num} seconds</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Word Time (seconds)</label>
              <select
                value={wordTime}
                onChange={(e) => setWordTime(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {(gameConfig?.wordTimeOptions || [15, 20, 30, 45, 60, 90, 120]).map(num => (
                  <option key={num} value={num} className="bg-gray-800">{num} seconds</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('')}
                className="flex-1 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4 slide-in">
            <div>
              <label className="block text-white mb-2 font-medium">Game Code</label>
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase text-center text-2xl tracking-widest font-bold"
                placeholder="XXXXXX"
                maxLength={6}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('')}
                className="flex-1 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                Join
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default WelcomeScreen;
