import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function RoundResult({ result, playerName, gameData, socket, soundManager }) {
  const isDraw = !result.winner;
  const isWinner = result.winner === playerName;
  const isCreator = socket?.id === gameData?.creator;

  const handleStartNextRound = () => {
    socket.emit('start-next-round');
    soundManager.play('click');
  };

  return (
    <View style={styles.container}>
      {isDraw ? (
        <>
          <Text style={styles.icon}>😐</Text>
          <Text style={styles.titleDraw}>No Winner</Text>
          <Text style={styles.subtitle}>Time's up! No one submitted a valid word.</Text>
        </>
      ) : (
        <>
          <Text style={styles.icon}>{isWinner ? '🏆' : '😔'}</Text>
          <Text style={[styles.title, isWinner ? styles.titleWin : styles.titleLose]}>
            {isWinner ? 'You Won!' : 'You Lost'}
          </Text>
          
          {gameData.gameType === 'battle-royale' ? (
            <>
              <Text style={styles.subtitle}>{result.winningReason}</Text>
              {result.roundWords && result.roundWords.length > 0 && (
                <View style={styles.wordsListContainer}>
                  <Text style={styles.wordsListTitle}>Words submitted this round:</Text>
                  <View style={styles.wordsList}>
                    {result.roundWords.map((item, idx) => (
                      <View key={idx} style={styles.wordItem}>
                        <Text style={styles.wordPlayer}>{item.player}</Text>
                        <Text style={styles.wordItemText}>{item.word}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>
                <Text style={styles.winnerName}>{result.winner}</Text> won the round!
              </Text>
              <View style={styles.wordContainer}>
                <Text style={styles.subtitle}>Winning Word:</Text>
                <Text style={styles.word}>
                  {result.word || ''}
                </Text>
              </View>
            </>
          )}
        </>
      )}

      {isCreator ? (
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartNextRound}
        >
          <Text style={styles.startButtonText}>🎮 Start Next Round</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.waitingText}>Waiting for host to start next round...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  titleWin: {
    color: '#fbbf24',
  },
  titleLose: {
    color: '#ef4444',
  },
  titleDraw: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginBottom: 15,
  },
  subtitle: {
    color: '#93c5fd',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  winnerName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  wordContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  word: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  startButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  waitingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    marginTop: 30,
    textAlign: 'center',
  },
  wordsListContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  wordsListTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
    textAlign: 'center',
  },
  wordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  wordItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  wordPlayer: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  wordItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
