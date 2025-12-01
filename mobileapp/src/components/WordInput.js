import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Timer from './Timer';

export default function WordInput({ startLetter, endLetter, socket, soundManager, wordTime }) {
  const [word, setWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('word-validated', ({ isValid, message }) => {
      soundManager.play(isValid ? 'success' : 'error');
    });

    return () => {
      socket.off('word-validated');
    };
  }, [socket, soundManager]);

  const handleSubmit = () => {
    if (!word.trim() || submitted) return;
    socket.emit('submit-word', { word: word.trim() });
    setSubmitted(true);
    soundManager.play('submit');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Word!</Text>
      <View style={styles.lettersRow}>
        <View style={styles.letterCard}>
          <Text style={styles.letterLabel}>Starts with</Text>
          <Text style={styles.letterValue}>{startLetter}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.letterCard}>
          <Text style={styles.letterLabel}>Ends with</Text>
          <Text style={styles.letterValue}>{endLetter}</Text>
        </View>
      </View>

      <Timer duration={wordTime || 30} soundManager={soundManager} />

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[styles.input, submitted && styles.inputDisabled]}
          value={word}
          onChangeText={setWord}
          placeholder="Type your word"
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          autoCapitalize="characters"
          editable={!submitted}
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity
          style={[styles.submitButton, (!word.trim() || submitted) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!word.trim() || submitted}
        >
          <Text style={styles.submitButtonText}>➤</Text>
        </TouchableOpacity>
      </View>

      {submitted && (
        <View style={styles.submittedContainer}>
          <Text style={styles.submittedText}>✓ Word submitted! Waiting for validation...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 15,
  },
  letterCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  letterLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 5,
  },
  letterValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  arrow: {
    color: '#fff',
    fontSize: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 15,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  submitButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  submittedContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    padding: 10,
    borderRadius: 8,
  },
  submittedText: {
    color: '#10b981',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
