import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { SOCKET_URL } from '@env';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import GameScreen from './src/screens/GameScreen';
import SoundManager from './src/utils/SoundManager';

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

    return () => newSocket.close();
  }, [soundManager]);

  const handleCreateGame = async (name, rounds, letterTime, wordTime) => {
    setPlayerName(name);
    try {
      await AsyncStorage.setItem('wordClashPlayerName', name);
    } catch (e) {
      console.log('Error saving name:', e);
    }
    socket.emit('create-game', { playerName: name, roundsToWin: rounds, letterTime, wordTime });
  };

  const handleJoinGame = async (name, gameId) => {
    setPlayerName(name);
    try {
      await AsyncStorage.setItem('wordClashPlayerName', name);
    } catch (e) {
      console.log('Error saving name:', e);
    }
    socket.emit('join-game', { playerName: name, gameId: gameId.toUpperCase() });
  };

  const handleStartGame = () => {
    socket.emit('start-game');
  };

  return (
    <>
      <StatusBar style="light" />
      
      {screen === 'welcome' && (
        <WelcomeScreen 
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
          error={error}
          savedName={savedName}
          gameConfig={gameConfig}
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
