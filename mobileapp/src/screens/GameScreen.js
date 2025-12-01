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
  const [currentTurn, setCurrentTurn] = useState(null); // Battle Royale: whose turn
  const [roundWords, setRoundWords] = useState([]); // Battle Royale: words in this round
  const [timerKey, setTimerKey] = useState(0); // Key to force timer reset

  useEffect(() => {
    if (!socket) return;

    socket.on('round-started', ({ role: playerRole }) => {
      setRole(playerRole);
      setPhase('letter-input');
      setRoundResult(null);
      soundManager.play('roundStart');
    });

    socket.on('letters-revealed', ({ startLetter, endLetter }) => {
      setLetters({ start: startLetter, end: endLetter });
      setPhase('letters-revealed');
      soundManager.play('reveal');
      
      // Reset timer key for new round
      setTimerKey(prev => prev + 1);
      
      // Add 2-second delay before showing word input
      setTimeout(() => {
        setPhase('word-input');
      }, 1500);
    });

    // Battle Royale events
    socket.on('turn-update', ({ currentTurn, roundWords }) => {
      setCurrentTurn(currentTurn);
      setRoundWords(roundWords || []);
    });

    socket.on('word-accepted', ({ word, player, roundWords }) => {
      setRoundWords(roundWords || []);
      soundManager.play('submit');
      
      // Reset timer by changing key
      setTimerKey(prev => prev + 1);
    });

    socket.on('combination-used', ({ startLetter, endLetter }) => {
      Alert.alert('Combination Used', `${startLetter}-${endLetter} already used! Choosing new letters...`);
      soundManager.play('error');
    });

    socket.on('round-ended', ({ winner, word, scores: newScores, roundWords, winningReason }) => {
      setRoundResult({ winner, word, roundWords, winningReason });
      setScores(newScores);
      setPhase('round-end');
      setCurrentTurn(null);
      setRoundWords([]);
      
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
        soundManager.play('gameWin');
        setShowConfetti(true);
      } else {
        soundManager.play('gameLose');
      }
    });

    socket.on('game-exited', ({ message }) => {
      soundManager.play('error');
      onGameEnd();
    });

    return () => {
      socket.off('round-started');
      socket.off('letters-revealed');
      socket.off('turn-update');
      socket.off('word-accepted');
      socket.off('combination-used');
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

          {phase === 'letters-revealed' && (
            <View style={styles.revealContainer}>
              <Text style={styles.revealTitle}>The Letters Are...</Text>
              <View style={styles.lettersRow}>
                <View style={[styles.letterCard, styles.startLetterCard]}>
                  <Text style={styles.letterLabel}>Start</Text>
                  <Text style={styles.letterText}>{letters.start}</Text>
                </View>
                <View style={[styles.letterCard, styles.endLetterCard]}>
                  <Text style={styles.letterLabel}>End</Text>
                  <Text style={styles.letterText}>{letters.end}</Text>
                </View>
              </View>
            </View>
          )}

          {phase === 'word-input' && (
            <View>
              {/* Battle Royale: Turn indicator and words list */}
              {gameData.gameType === 'battle-royale' && (
                <View style={styles.battleRoyaleInfo}>
                  <View style={styles.turnIndicator}>
                    {currentTurn === playerName ? (
                      <Text style={styles.yourTurnText}>🎯 Your Turn!</Text>
                    ) : (
                      <Text style={styles.waitingTurnText}>Waiting for {currentTurn}...</Text>
                    )}
                  </View>
                  
                  {roundWords.length > 0 && (
                    <View style={styles.wordsListContainer}>
                      <Text style={styles.wordsListTitle}>Words submitted this round:</Text>
                      <View style={styles.wordsList}>
                        {roundWords.map((item, idx) => (
                          <View key={idx} style={styles.wordItem}>
                            <Text style={styles.wordPlayer}>{item.player}</Text>
                            <Text style={styles.wordText}>{item.word}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              <WordInput 
                key={timerKey}
                startLetter={letters.start}
                endLetter={letters.end}
                socket={socket}
                soundManager={soundManager}
                wordTime={gameData.wordTime || 30}
                disabled={gameData.gameType === 'battle-royale' && currentTurn !== playerName}
              />
            </View>
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
  revealContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  revealTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  lettersRow: {
    flexDirection: 'row',
    gap: 20,
  },
  letterCard: {
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 2,
  },
  startLetterCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  endLetterCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  letterLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
  },
  letterText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
  },
  battleRoyaleInfo: {
    marginBottom: 20,
  },
  turnIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  yourTurnText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  waitingTurnText: {
    fontSize: 18,
    color: '#93c5fd',
  },
  wordsListContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  wordsListTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
  },
  wordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  wordPlayer: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  wordText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
