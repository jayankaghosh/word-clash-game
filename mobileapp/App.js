import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { SOCKET_URL } from '@env';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import GameScreen from './src/screens/GameScreen';
import SoundManager from './src/utils/SoundManager';
import MuteButton from './src/components/MuteButton';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [screen, setScreen] = useState('welcome');
  const [playerName, setPlayerName] = useState('');
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState('');
  const [soundManager] = useState(() => new SoundManager());
  const [savedName, setSavedName] = useState('');
  const [gameConfig, setGameConfig] = useState(null);

  useEffect(() => {
    const loadSavedName = async () => {
      try {
        const stored = await AsyncStorage.getItem('wordClashPlayerName');
        if (stored) {
          setSavedName(stored);
        }
      } catch (e) {
        console.log('Error loading saved name:', e);
      }
    };
    loadSavedName();
  }, []);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true
    });
    
    setSocket(newSocket);

    // Start background music
    soundManager.startBackgroundMusic();

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

  const handleCreateGame = async (name, rounds, letterTime, wordTime) => {
    console.log('Create game clicked:', { name, rounds, letterTime, wordTime });
    console.log('Socket connected:', socket?.connected);
    console.log('Socket URL:', SOCKET_URL);
    
    if (!socket || !socket.connected) {
      setError('Not connected to server. Please check your network.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setPlayerName(name);
    try {
      await AsyncStorage.setItem('wordClashPlayerName', name);
    } catch (e) {
      console.log('Error saving name:', e);
    }
    
    console.log('Emitting create-game event');
    socket.emit('create-game', { playerName: name, roundsToWin: rounds, letterTime, wordTime, gameType });
  };

  const handleJoinGame = async (name, gameId) => {
    console.log('Attempting to join game:', gameId.toUpperCase());
    setPlayerName(name);
    try {
      await AsyncStorage.setItem('wordClashPlayerName', name);
    } catch (e) {
      console.log('Error saving name:', e);
    }
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
    <>
      <StatusBar style="light" />
      <MuteButton soundManager={soundManager} />
      
      {screen === 'welcome' && (
        <WelcomeScreen 
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          error={error}
          savedName={savedName}
          gameConfig={gameConfig}
          soundManager={soundManager}
        />
      )}

      {screen === 'lobby' && (
        <LobbyScreen 
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
        <GameScreen 
          gameData={gameData}
          playerName={playerName}
          socket={socket}
          soundManager={soundManager}
          onGameEnd={() => setScreen('welcome')}
        />
      )}
    </>
  );
}
