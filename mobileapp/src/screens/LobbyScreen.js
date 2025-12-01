import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Share, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

export default function LobbyScreen({ gameData, playerName, onStartGame, socket, soundManager, onGameStart, onLeaveLobby }) {
  useEffect(() => {
    if (!socket) return;

    socket.on('player-joined', ({ game }) => {
      soundManager.play('join');
    });

    socket.on('game-started', () => {
      onGameStart();
      soundManager.play('start');
    });

    return () => {
      socket.off('player-joined');
      socket.off('game-started');
    };
  }, [socket, soundManager, onGameStart]);

  const copyGameCode = async () => {
    await Clipboard.setStringAsync(gameData.gameId);
    soundManager.play('click');
  };

  const shareGameCode = async () => {
    try {
      await Share.share({
        message: `Join my Word Clash game! Code: ${gameData.gameId}`,
      });
      soundManager.play('click');
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const isCreator = socket?.id === gameData.creator;
  const canStart = gameData.players.length === 2 && isCreator;

  const handleLeaveLobby = () => {
    Alert.alert(
      'Leave Lobby',
      'Are you sure you want to leave the lobby?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => soundManager.play('click')
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            socket.emit('leave-lobby');
            soundManager.play('error');
            onLeaveLobby();
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
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleLeaveLobby}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.icon}>👥</Text>
          <Text style={styles.title}>Game Lobby</Text>
          <Text style={styles.subtitle}>Waiting for players...</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.codeHeader}>
            <Text style={styles.codeLabel}>Game Code</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={copyGameCode} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>📋 Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={shareGameCode} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>📤 Share</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.gameCode}>{gameData.gameId}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🏆 Game Settings</Text>
          </View>
          <Text style={styles.infoValue}>
            First to <Text style={styles.highlight}>{gameData.roundsToWin}</Text> wins
          </Text>
          <Text style={[styles.infoValue, { marginTop: 8, fontSize: 12 }]}>
            ⏱️ Letter: <Text style={styles.highlight}>{gameData.letterTime || 5}s</Text> | 
            Word: <Text style={styles.highlight}>{gameData.wordTime || 30}s</Text>
          </Text>
        </View>

        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>Players ({gameData.players.length}/2)</Text>
          
          {gameData.players.map((player, index) => (
            <View key={player.id} style={styles.playerCard}>
              <View style={[
                styles.playerDot,
                { backgroundColor: player.name === playerName ? '#10b981' : '#3b82f6' }
              ]} />
              <Text style={styles.playerName}>
                {player.name} {player.name === playerName && '(You)'}
              </Text>
            </View>
          ))}
        </View>

        {canStart && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={onStartGame}
          >
            <Text style={styles.startButtonText}>🎮 Start Game</Text>
          </TouchableOpacity>
        )}

        {!canStart && gameData.players.length < 2 && (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingText}>
              Waiting for another player to join...
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 64,
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#93c5fd',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  codeHeader: {
    marginBottom: 15,
  },
  codeLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  gameCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
    letterSpacing: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoValue: {
    color: '#9ca3af',
    fontSize: 14,
  },
  highlight: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  playersSection: {
    marginTop: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  waitingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  waitingText: {
    color: '#93c5fd',
    fontSize: 14,
    textAlign: 'center',
  },
});
