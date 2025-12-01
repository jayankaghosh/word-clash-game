import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import ScoreBoard from '../components/ScoreBoard';
import LetterInput from '../components/LetterInput';
import WordInput from '../components/WordInput';
import RoundResult from '../components/RoundResult';
import GameOver from '../components/GameOver';

export default function GameScreen({ gameData, playerName, socket, soundManager, onGameEnd }) {
  const [phase, setPhase] = useState('waiting');
  const [role, setRole] = useState(null);
  const [letters, setLetters] = useState({ start: '', end: '' });
  const [roundResult, setRoundResult] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [scores, setScores] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('round-started', ({ role: playerRole }) => {
      setRole(playerRole);
      setPhase('letter-input');
      setRoundResult(null);
      soundManager.play('click');
    });

    socket.on('letters-revealed', ({ startLetter, endLetter }) => {
      setLetters({ start: startLetter, end: endLetter });
      setPhase('word-input');
      soundManager.play('submit');
    });

    socket.on('round-ended', ({ winner, word, scores: newScores }) => {
      setRoundResult({ winner, word });
      setScores(newScores);
      setPhase('round-end');
      
      if (winner === playerName) {
        soundManager.play('win');
        setShowConfetti(true);
      } else if (winner) {
        soundManager.play('lose');
      }
    });

    socket.on('game-ended', ({ winner, scores: finalScores }) => {
      setGameResult({ winner, scores: finalScores });
      setPhase('game-over');
      
      if (winner === playerName) {
        soundManager.play('win');
        setShowConfetti(true);
      } else {
        soundManager.play('lose');
      }
    });

    socket.on('game-exited', ({ message }) => {
      soundManager.play('error');
      onGameEnd();
    });

    return () => {
      socket.off('round-started');
      socket.off('letters-revealed');
      socket.off('round-ended');
      socket.off('game-ended');
      socket.off('game-exited');
    };
  }, [socket, playerName, soundManager, onGameEnd]);

  const handleExitGame = () => {
    Alert.alert(
      'Exit Game',
      'Are you sure you want to exit? This will end the game for all players.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => soundManager.play('click')
        },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            socket.emit('exit-game');
            soundManager.play('error');
            onGameEnd();
          }
        }
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#4c1d95', '#1e3a8a', '#312e81']}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <ScoreBoard 
          players={gameData.players}
          roundsToWin={gameData.roundsToWin}
          currentScores={scores}
        />
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={handleExitGame}
        >
          <Text style={styles.exitButtonText}>❌</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gameContent}>
          {phase === 'waiting' && (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingTitle}>Get Ready!</Text>
              <Text style={styles.waitingText}>Round starting soon...</Text>
            </View>
          )}

          {phase === 'letter-input' && (
            <LetterInput 
              role={role}
              socket={socket}
              soundManager={soundManager}
              letterTime={gameData.letterTime || 5}
            />
          )}

          {phase === 'word-input' && (
            <WordInput 
              startLetter={letters.start}
              endLetter={letters.end}
              socket={socket}
              soundManager={soundManager}
              wordTime={gameData.wordTime || 30}
            />
          )}

          {phase === 'round-end' && (
            <RoundResult 
              result={roundResult}
              playerName={playerName}
              gameData={gameData}
              socket={socket}
              soundManager={soundManager}
            />
          )}

          {phase === 'game-over' && (
            <GameOver 
              result={gameResult}
              playerName={playerName}
              onPlayAgain={onGameEnd}
            />
          )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{x: -10, y: 0}}
          autoStart={true}
          fadeOut={true}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    position: 'relative',
  },
  exitButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  exitButtonText: {
    fontSize: 20,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  gameContent: {
    flex: 1,
    justifyContent: 'center',
  },
  waitingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  waitingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  waitingText: {
    fontSize: 16,
    color: '#93c5fd',
  },
});
