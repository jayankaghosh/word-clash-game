import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function GameOver({ result, playerName, onPlayAgain }) {
  const isWinner = result.winner === playerName;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{isWinner ? '🏆' : '🎮'}</Text>
      
      <Text style={[styles.title, isWinner ? styles.titleWin : styles.titleLose]}>
        {isWinner ? 'Victory!' : 'Good Game!'}
      </Text>

      <Text style={styles.subtitle}>
        <Text style={styles.winnerName}>{result.winner}</Text> wins the game!
      </Text>

      <View style={styles.scoresCard}>
        <View style={styles.scoresHeader}>
          <Text style={styles.scoresIcon}>🏆</Text>
          <Text style={styles.scoresTitle}>Final Scores</Text>
        </View>
        
        {result.scores.map((player, index) => (
          <View
            key={index}
            style={[
              styles.scoreRow,
              player.name === result.winner && styles.scoreRowWinner
            ]}
          >
            <Text style={[
              styles.playerName,
              player.name === result.winner && styles.playerNameWinner
            ]}>
              {player.name}{player.name === playerName && ' (You)'}
            </Text>
            <Text style={[
              styles.playerScore,
              player.name === result.winner && styles.playerScoreWinner
            ]}>
              {player.score}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={onPlayAgain}
      >
        <Text style={styles.homeButtonText}>🏠 Back to Home</Text>
      </TouchableOpacity>
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
    fontSize: 72,
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  titleWin: {
    color: '#fbbf24',
  },
  titleLose: {
    color: '#3b82f6',
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 30,
  },
  winnerName: {
    fontWeight: 'bold',
  },
  scoresCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 8,
  },
  scoresIcon: {
    fontSize: 20,
  },
  scoresTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoreRowWinner: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  playerNameWinner: {
    color: '#fbbf24',
  },
  playerScore: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  playerScoreWinner: {
    color: '#fbbf24',
  },
  homeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
