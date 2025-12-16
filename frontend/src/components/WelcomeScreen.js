import React, { useState, useEffect } from 'react';
import { Swords, Users, HelpCircle, X, Bot, Wifi, WifiOff } from 'lucide-react';
import OfflineManager from '../utils/OfflineManager';

function WelcomeScreen({ onCreateGame, onJoinGame, onPlayOffline, savedName, gameConfig }) {
  const [name, setName] = useState(savedName || '');
  const [menu, setMenu] = useState('main'); // 'main', 'friend', 'offline'
  const [mode, setMode] = useState(''); // 'create' or 'join'
  const [gameCode, setGameCode] = useState('');
  const [rounds, setRounds] = useState(gameConfig?.defaultRounds || 5);
  const [letterTime, setLetterTime] = useState(gameConfig?.defaultLetterTime || 5);
  const [wordTime, setWordTime] = useState(gameConfig?.defaultWordTime || 30);
  const [gameType, setGameType] = useState('normal');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [howToPlayContent, setHowToPlayContent] = useState('');
  const [isOnline, setIsOnline] = useState(OfflineManager.getOnlineStatus());
  const [dictionaryLoaded, setDictionaryLoaded] = useState(OfflineManager.isDictionaryLoaded());
  const [loadingDictionary, setLoadingDictionary] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');

  // Update name when savedName changes
  useEffect(() => {
    if (savedName && !name) {
      setName(savedName);
    }
  }, [savedName, name]);

  // Update defaults when gameConfig loads
  useEffect(() => {
    if (gameConfig) {
      setRounds(gameConfig.defaultRounds || 5);
      setLetterTime(gameConfig.defaultLetterTime || 5);
      setWordTime(gameConfig.defaultWordTime || 30);
    }
  }, [gameConfig]);

  // Listen for online/offline status changes
  useEffect(() => {
    const unsubscribeOnline = OfflineManager.onStatusChange((online) => {
      setIsOnline(online);
    });

    const unsubscribeDictionary = OfflineManager.onDictionaryChange((loaded) => {
      setDictionaryLoaded(loaded);
    });

    return () => {
      unsubscribeOnline();
      unsubscribeDictionary();
    };
  }, []);

  // Load dictionary automatically when online (for future offline use)
  useEffect(() => {
    if (isOnline && !dictionaryLoaded && !loadingDictionary) {
      // Auto-load dictionary in background when online
      loadDictionary();
    }
  }, [isOnline, dictionaryLoaded, loadingDictionary]);

  const loadDictionary = async () => {
    setLoadingDictionary(true);
    setLoadProgress(0);

    const success = await OfflineManager.loadDictionary((progress) => {
      setLoadProgress(progress);
    });

    setLoadingDictionary(false);

    if (!success) {
      console.error('Failed to load dictionary');
    }
  };

  // Fetch how-to-play content
  const fetchHowToPlay = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001'}/public/how-to-play.html`);
      const html = await response.text();
      setHowToPlayContent(html);
      setShowHowToPlay(true);
    } catch (error) {
      console.error('Error loading how-to-play:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (mode === 'create') {
      onCreateGame(name.trim(), rounds, letterTime, wordTime, gameType);
    } else if (mode === 'join') {
      if (!gameCode.trim()) return;
      onJoinGame(name.trim(), gameCode.trim());
    } else if (mode === 'offline') {
      onPlayOffline(name.trim(), difficulty, rounds, letterTime, wordTime, gameType);
    }
  };

  // Handle input focus to scroll into view on mobile
  const handleInputFocus = (e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full border border-white/20">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Swords className="w-16 h-16 text-yellow-400" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-2">Word Clash</h1>
        <p className="text-blue-200">Battle of wits and words!</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {isOnline ? (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <Wifi className="w-4 h-4" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-orange-400 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white mb-2 font-medium">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={handleInputFocus}
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Enter your name"
            maxLength={20}
            required
          />
        </div>

        {menu === 'main' && !mode && (
          <div className="space-y-3 pt-4">
            <button
              type="button"
              onClick={() => setMenu('friend')}
              disabled={!isOnline}
              className={`w-full py-4 text-white font-bold rounded-lg transition-all transform flex items-center justify-center gap-2 ${
                isOnline
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-105'
                  : 'bg-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Users className="w-5 h-5" />
              Play vs Friend
            </button>
            <button
              type="button"
              onClick={() => {
                setMenu('offline');
                setMode('offline');
              }}
              disabled={!dictionaryLoaded || loadingDictionary}
              className={`w-full py-4 text-white font-bold rounded-lg transition-all transform flex items-center justify-center gap-2 ${
                dictionaryLoaded && !loadingDictionary
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:scale-105'
                  : 'bg-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Bot className="w-5 h-5" />
              {loadingDictionary ? `Loading... ${Math.round(loadProgress)}%` : 'Play vs Computer'}
            </button>
            <button
              type="button"
              onClick={fetchHowToPlay}
              className="w-full py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/30"
            >
              <HelpCircle className="w-5 h-5" />
              How to Play
            </button>
          </div>
        )}

        {menu === 'friend' && !mode && (
          <div className="space-y-3 pt-4 slide-in">
            <button
              type="button"
              onClick={() => setMode('create')}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Create New Game
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" />
              Join Game
            </button>
            <button
              type="button"
              onClick={() => setMenu('main')}
              className="w-full py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all border border-white/30"
            >
              ← Back
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4 slide-in">
            <div>
              <label className="block text-white mb-2 font-medium">Game Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGameType('normal')}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    gameType === 'normal'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  🎮 Normal
                </button>
                <button
                  type="button"
                  onClick={() => setGameType('battle-royale')}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    gameType === 'battle-royale'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  ⚔️ Battle Royale
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Rounds to Win</label>
              <div className="grid grid-cols-4 gap-2">
                {(gameConfig?.roundsOptions || [3, 5, 7, 10]).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRounds(num)}
                    className={`py-3 rounded-lg font-bold transition-all ${
                      rounds === num
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Letter Time (seconds)</label>
              <div className="grid grid-cols-5 gap-2">
                {(gameConfig?.letterTimeOptions || [3, 5, 7, 10, 15]).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setLetterTime(num)}
                    className={`py-3 rounded-lg font-bold transition-all ${
                      letterTime === num
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Word Time (seconds)</label>
              <div className="grid grid-cols-4 gap-2">
                {(gameConfig?.wordTimeOptions || [15, 20, 30, 45, 60, 90, 120]).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setWordTime(num)}
                    className={`py-2 px-1 rounded-lg font-bold text-sm transition-all ${
                      wordTime === num
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('');
                  setMenu('friend');
                }}
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

        {mode === 'offline' && (
          <div className="space-y-4 slide-in">
            <div>
              <label className="block text-white mb-2 font-medium">Game Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGameType('normal')}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    gameType === 'normal'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  🎮 Normal
                </button>
                <button
                  type="button"
                  onClick={() => setGameType('battle-royale')}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    gameType === 'battle-royale'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  ⚔️ Battle Royale
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDifficulty('easy')}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    difficulty === 'easy'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  😊 Easy
                </button>
                <button
                  type="button"
                  onClick={() => setDifficulty('medium')}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    difficulty === 'medium'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  😐 Medium
                </button>
                <button
                  type="button"
                  onClick={() => setDifficulty('hard')}
                  className={`py-3 px-4 rounded-lg font-medium transition-all ${
                    difficulty === 'hard'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  😈 Hard
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Rounds to Win</label>
              <div className="grid grid-cols-4 gap-2">
                {(gameConfig?.roundsOptions || [3, 5, 7, 10]).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRounds(num)}
                    className={`py-3 rounded-lg font-bold transition-all ${
                      rounds === num
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Letter Time (seconds)</label>
              <div className="grid grid-cols-5 gap-2">
                {(gameConfig?.letterTimeOptions || [3, 5, 7, 10, 15]).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setLetterTime(num)}
                    className={`py-3 rounded-lg font-bold transition-all ${
                      letterTime === num
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Word Time (seconds)</label>
              <div className="grid grid-cols-4 gap-2">
                {(gameConfig?.wordTimeOptions || [15, 20, 30, 45, 60, 90, 120]).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setWordTime(num)}
                    className={`py-2 px-1 rounded-lg font-bold text-sm transition-all ${
                      wordTime === num
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('');
                  setMenu('main');
                }}
                className="flex-1 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                Start Game
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
                onFocus={handleInputFocus}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase text-center text-2xl tracking-widest font-bold"
                placeholder="XXXXXX"
                maxLength={6}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('');
                  setMenu('friend');
                }}
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

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowHowToPlay(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="sticky top-4 right-4 float-right bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <div dangerouslySetInnerHTML={{ __html: howToPlayContent }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default WelcomeScreen;
