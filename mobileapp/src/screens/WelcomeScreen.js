import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen({ onCreateGame, onJoinGame, error, savedName, gameConfig }) {
  const [name, setName] = useState(savedName || '');
  const [mode, setMode] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [rounds, setRounds] = useState(gameConfig?.defaultRounds || 5);
  const [letterTime, setLetterTime] = useState(gameConfig?.defaultLetterTime || 5);
  const [wordTime, setWordTime] = useState(gameConfig?.defaultWordTime || 30);

  useEffect(() => {
    if (savedName && !name) {
      setName(savedName);
    }
  }, [savedName, name]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    if (mode === 'create') {
      onCreateGame(name.trim(), rounds, letterTime, wordTime);
    } else if (mode === 'join') {
      if (!gameCode.trim()) return;
      onJoinGame(name.trim(), gameCode.trim());
    }
  };

  return (
    <LinearGradient
      colors={['#4c1d95', '#1e3a8a', '#312e81']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>⚔️ Word Clash</Text>
            <Text style={styles.subtitle}>Battle of wits and words!</Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#9ca3af"
              maxLength={20}
              autoCapitalize="words"
            />

            {!mode && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.createButton]}
                  onPress={() => setMode('create')}
                >
                  <Text style={styles.buttonText}>🎮 Create New Game</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.joinButton]}
                  onPress={() => setMode('join')}
                >
                  <Text style={styles.buttonText}>⚔️ Join Game</Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'create' && (
              <View style={styles.modeContainer}>
                <Text style={styles.label}>Rounds to Win</Text>
                <View style={styles.roundsContainer}>
                  {(gameConfig?.roundsOptions || [3, 5, 7, 10]).map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.roundButton,
                        rounds === num && styles.roundButtonActive
                      ]}
                      onPress={() => setRounds(num)}
                    >
                      <Text style={[
                        styles.roundButtonText,
                        rounds === num && styles.roundButtonTextActive
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Letter Time (seconds)</Text>
                <View style={styles.timeContainer}>
                  {(gameConfig?.letterTimeOptions || [3, 5, 7, 10, 15]).map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.timeButton,
                        letterTime === num && styles.timeButtonActive
                      ]}
                      onPress={() => setLetterTime(num)}
                    >
                      <Text style={[
                        styles.timeButtonText,
                        letterTime === num && styles.timeButtonTextActive
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Word Time (seconds)</Text>
                <View style={styles.timeContainer}>
                  {(gameConfig?.wordTimeOptions || [15, 20, 30, 45, 60, 90, 120]).map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.timeButton,
                        wordTime === num && styles.timeButtonActive
                      ]}
                      onPress={() => setWordTime(num)}
                    >
                      <Text style={[
                        styles.timeButtonText,
                        wordTime === num && styles.timeButtonTextActive
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.backButton]}
                    onPress={() => setMode('')}
                  >
                    <Text style={styles.buttonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.buttonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {mode === 'join' && (
              <View style={styles.modeContainer}>
                <Text style={styles.label}>Game Code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={gameCode}
                  onChangeText={(text) => setGameCode(text.toUpperCase())}
                  placeholder="XXXXXX"
                  placeholderTextColor="#9ca3af"
                  maxLength={6}
                  autoCapitalize="characters"
                />
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.backButton]}
                    onPress={() => setMode('')}
                  >
                    <Text style={styles.buttonText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.buttonText}>Join</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#93c5fd',
  },
  errorContainer: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 5,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 15,
  },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#10b981',
  },
  joinButton: {
    backgroundColor: '#3b82f6',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#f59e0b',
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modeContainer: {
    marginTop: 20,
  },
  roundsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roundButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  roundButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  roundButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  roundButtonTextActive: {
    color: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  timeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 12,
    minWidth: 55,
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  timeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeButtonTextActive: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
});
