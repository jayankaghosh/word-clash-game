import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import WelcomeScreen from './components/WelcomeScreen';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import MuteButton from './components/MuteButton';
import SoundManager from './utils/SoundManager';

// Use environment variable or default to localhost
// To use local IP: Create .env.local file with REACT_APP_SOCKET_URL=http://192.168.x.x:3001
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [screen, setScreen] = useState('welcome'); // welcome, lobby, game
  const [playerName, setPlayerName] = useState('');
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState('');
  const [soundManager] = useState(() => new SoundManager());
  const [savedName, setSavedName] = useState('');
  const [gameConfig, setGameConfig] = useState(null);

  // Load saved name from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('wordClashPlayerName');
    if (stored) {
      setSavedName(stored);
    }
  }, []);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
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

    newSocket.on('player-disconnected', ({ message }) => {
      setError(message);
      soundManager.play('error');
      setTimeout(() => {
        setError('');
        setScreen('welcome');
        setGameData(null);
      }, 3000);
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
    </div>
  );
}

export default App;
