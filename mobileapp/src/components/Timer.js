import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Timer({ duration, soundManager }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        
        if (prev <= 5) {
          soundManager.play('tick');
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, soundManager]);

  const isUrgent = timeLeft <= 5;
  const percentage = (timeLeft / duration) * 100;

  return (
    <View style={styles.container}>
      <Text style={[styles.time, isUrgent && styles.timeUrgent]}>
        ⏰ {timeLeft}s
      </Text>
      
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progress,
            { width: `${percentage}%` },
            isUrgent ? styles.progressUrgent : styles.progressNormal
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  time: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  timeUrgent: {
    color: '#ef4444',
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
  },
  progressNormal: {
    backgroundColor: '#10b981',
  },
  progressUrgent: {
    backgroundColor: '#ef4444',
  },
});
