import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Timer from './Timer';

export default function LetterInput({ role, socket, soundManager, letterTime }) {
  const [letter, setLetter] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleTextChange = (text) => {
    const upperText = text.toUpperCase();
    if (/^[A-Z]?$/.test(upperText) && !submitted) {
      setLetter(upperText);
      if (upperText.length === 1) {
        socket.emit('submit-letter', { letter: upperText });
        setSubmitted(true);
        soundManager.play('submit');
      }
    }
  };

  const roleColor = role === 'start' ? '#10b981' : '#3b82f6';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        You are the <Text style={[styles.roleText, { color: roleColor }]}>{role}</Text> player
      </Text>
      <Text style={styles.subtitle}>Type ONE letter (A-Z)</Text>
      
      <Timer duration={letterTime || 5} soundManager={soundManager} />

      <TextInput
        ref={inputRef}
        style={[styles.input, submitted && styles.inputDisabled]}
        value={letter}
        onChangeText={handleTextChange}
        maxLength={1}
        autoCapitalize="characters"
        placeholder="?"
        placeholderTextColor="rgba(255, 255, 255, 0.3)"
        editable={!submitted}
      />

      {submitted && (
        <View style={styles.submittedContainer}>
          <Text style={styles.submittedText}>✓ Letter submitted: {letter}</Text>
        </View>
      )}
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
    marginBottom: 10,
  },
  roleText: {
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#93c5fd',
    textAlign: 'center',
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    padding: 20,
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  inputDisabled: {
    opacity: 0.6,
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
