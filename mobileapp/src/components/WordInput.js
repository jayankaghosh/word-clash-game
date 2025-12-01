import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Timer from './Timer';

export default function WordInput({ startLetter, endLetter, socket, soundManager, wordTime, disabled }) {
  const [word, setWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef(null);

  // Auto-focus on mount and when disabled state changes
  useEffect(() => {
    if (!disabled) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [disabled]);

  useEffect(() => {
    if (!socket) return;

    // Listen for invalid word response to allow retry
    const handleInvalidWord = ({ reason }) => {
      setSubmitted(false);
      setWord('');
      setErrorMessage(reason || 'Invalid word!');
      soundManager.play('error');
      
      // Clear error after 3 seconds
      setTimeout(() => setErrorMessage(''), 3000);
      // Refocus after a short delay
      setTimeout(() => inputRef.current?.focus(), 150);
    };

    // Listen for word-accepted in battle royale to refocus if still your turn
    const handleWordAccepted = () => {
      setSubmitted(false);
      setWord('');
      // Refocus after a short delay if not disabled
      setTimeout(() => {
        if (!disabled) {
          inputRef.current?.focus();
        }
      }, 150);
    };

    socket.on('invalid-word', handleInvalidWord);
    socket.on('word-accepted', handleWordAccepted);

    return () => {
      socket.off('invalid-word', handleInvalidWord);
      socket.off('word-accepted', handleWordAccepted);
    };
  }, [socket, soundManager, disabled]);

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
          style={[styles.input, (submitted || disabled) && styles.inputDisabled]}
          value={word}
          onChangeText={(text) => setWord(text.toUpperCase())}
          placeholder={disabled ? "Not your turn..." : "Type your word"}
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          autoCapitalize="characters"
          editable={!submitted && !disabled}
          onSubmitEditing={handleSubmit}
        />
        <TouchableOpacity
          style={[styles.submitButton, (!word.trim() || submitted || disabled) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!word.trim() || submitted || disabled}
        >
          <Text style={styles.submitButtonText}>➤</Text>
        </TouchableOpacity>
      </View>

      {submitted && (
        <View style={styles.submittedContainer}>
          <Text style={styles.submittedText}>✓ Word submitted!</Text>
        </View>
      )}
      
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {errorMessage}</Text>
        </View>
      )}
      
      <Text style={styles.hintText}>First valid word wins the round!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 12,
  },
  letterCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  letterLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 5,
  },
  letterValue: {
    color: '#fff',
    fontSize: 28,
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
  hintText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
  },
  errorContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
