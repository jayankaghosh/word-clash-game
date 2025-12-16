import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import WelcomeScreen from './components/WelcomeScreen';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import OfflineGameRoom from './components/OfflineGameRoom';
import MuteButton from './components/MuteButton';
import SoundManager from './utils/SoundManager';

// Use environment variable or default to localhost
// To use local IP: Create .env.local file with REACT_APP_SOCKET_URL=http://192.168.x.x:3001
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [screen, setScreen] = useState('welcome'); // welcome, lobby, game, offline-game
  const [playerName, setPlayerName] = useState('');
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState('');
  const [soundManager] = useState(() => new SoundManager());
  const [savedName, setSavedName] = useState('');
  const [gameConfig, setGameConfig] = useState(null);
  const [offlineConfig, setOfflineConfig] = useState(null);

  // Load saved name from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('wordClashPlayerName');
    if (stored) {
      setSavedName(stored);
    }
  }, []);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    setSocket(newSocket);

    // Start background music on first user interaction
    const startMusic = () => {
      soundManager.startBackgroundMusic();
      document.removeEventListener('click', startMusic);
    };
    document.addEventListener('click', startMusic);

    // Fetch game configuration
    fetch(`${SOCKET_URL}/api/config`)
      .then(res => res.json())
      .then(config => setGameConfig(config))
      .catch(err => console.log('Error fetching config:', err));

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      // If we're in a game, try to rejoin
      if (gameData && playerName) {
        console.log('Attempting to rejoin game:', gameData.gameId);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      // Don't redirect on transport close or ping timeout (temporary)
      if (reason === 'io server disconnect') {
        // Server intentionally disconnected, redirect to welcome
        setError('Disconnected from server');
        setTimeout(() => {
          setError('');
          setScreen('welcome');
          setGameData(null);
        }, 2000);
      }
      // For other reasons (transport close, ping timeout), let reconnection handle it
    });

    newSocket.on('game-config', (config) => {
      setGameConfig(config);
      console.log('Received game config:', config);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    newSocket.on('game-created', ({ gameId, game }) => {
      setGameData(game);
      setScreen('lobby');
      soundManager.play('success');
    });

    newSocket.on('player-joined', ({ game }) => {
      console.log('Player joined event received:', game);
      setGameData(game);
      setScreen('lobby');
      soundManager.play('join');
    });

    newSocket.on('player-disconnected', ({ message, permanent }) => {
      setError(message);
      soundManager.play('error');
      // Only redirect if it's a permanent disconnection
      if (permanent) {
        setTimeout(() => {
          setError('');
          setScreen('welcome');
          setGameData(null);
        }, 3000);
      } else {
        // Clear error after showing temporary disconnection
        setTimeout(() => setError(''), 5000);
      }
    });

    newSocket.on('player-reconnected', ({ message }) => {
      setError(message);
      soundManager.play('join');
      setTimeout(() => setError(''), 2000);
    });

    newSocket.on('player-left-lobby', ({ message }) => {
      setError(message);
      soundManager.play('error');
      setTimeout(() => {
        setError('');
        setScreen('welcome');
        setGameData(null);
      }, 3000);
    });

    newSocket.on('game-exited', ({ message }) => {
      setError(message);
      soundManager.play('error');
      setTimeout(() => {
        setError('');
        setScreen('welcome');
        setGameData(null);
      }, 3000);
    });

    return () => newSocket.close();
  }, [soundManager]);

  const handleCreateGame = (name, rounds, letterTime, wordTime, gameType) => {
    setPlayerName(name);
    localStorage.setItem('wordClashPlayerName', name);
    socket.emit('create-game', { playerName: name, roundsToWin: rounds, letterTime, wordTime, gameType });
  };

  const handleJoinGame = (name, gameId) => {
    console.log('Attempting to join game:', gameId.toUpperCase());
    setPlayerName(name);
    localStorage.setItem('wordClashPlayerName', name);
    socket.emit('join-game', { playerName: name, gameId: gameId.toUpperCase() });
    
    // Set a timeout to show error if no response after 5 seconds
    const timeoutId = setTimeout(() => {
      if (screen === 'welcome') {
        console.error('Join game timeout - no response from server');
        setError('Failed to join game. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
    }, 5000);
    
    // Store timeout ID to clear it if join succeeds
    socket.once('player-joined', () => {
      clearTimeout(timeoutId);
    });
  };

  const handleStartGame = () => {
    socket.emit('start-game');
  };

  const handleLeaveLobby = () => {
    setScreen('welcome');
    setGameData(null);
  };

  const handlePlayOffline = (name, difficulty, rounds, letterTime, wordTime, gameType) => {
    setPlayerName(name);
    localStorage.setItem('wordClashPlayerName', name);
    setOfflineConfig({
      difficulty,
      roundsToWin: rounds,
      letterTime,
      wordTime,
      gameType: gameType || 'normal'
    });
    setScreen('offline-game');
    soundManager.play('success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <MuteButton soundManager={soundManager} />
      
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg slide-in z-50">
          {error}
        </div>
      )}

      {screen === 'welcome' && (
        <WelcomeScreen 
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          onPlayOffline={handlePlayOffline}
          savedName={savedName}
          gameConfig={gameConfig}
        />
      )}

      {screen === 'lobby' && (
        <Lobby 
          gameData={gameData}
          playerName={playerName}
          onStartGame={handleStartGame}
          socket={socket}
          soundManager={soundManager}
          onGameStart={() => setScreen('game')}
          onLeaveLobby={handleLeaveLobby}
        />
      )}

      {screen === 'game' && (
        <GameRoom 
          gameData={gameData}
          playerName={playerName}
          socket={socket}
          soundManager={soundManager}
          onGameEnd={() => setScreen('welcome')}
        />
      )}

      {screen === 'offline-game' && offlineConfig && (
        <OfflineGameRoom
          playerName={playerName}
          difficulty={offlineConfig.difficulty}
          config={offlineConfig}
          soundManager={soundManager}
          onGameEnd={() => {
            setScreen('welcome');
            setOfflineConfig(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
