import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ScoreBoard({ players, roundsToWin, currentScores }) {
  const scores = currentScores && currentScores.length > 0 
    ? currentScores 
    : players.map(p => ({ name: p.name, score: p.score }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.title}>First to {roundsToWin}</Text>
      </View>
      
      <View style={styles.scoresContainer}>
        {scores.map((player, index) => (
          <View key={index} style={styles.scoreCard}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.score}>{player.score}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 8,
  },
  trophy: {
    fontSize: 20,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoresContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  score: {
    color: '#fbbf24',
    fontSize: 36,
    fontWeight: 'bold',
  },
});
