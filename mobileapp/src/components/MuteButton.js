import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function MuteButton({ soundManager }) {
  const [soundsMuted, setSoundsMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);

  const toggleSounds = () => {
    const newMuted = !soundsMuted;
    setSoundsMuted(newMuted);
    soundManager.setSoundsMuted(newMuted);
    if (!newMuted) {
      soundManager.play('click');
    }
  };

  const toggleMusic = () => {
    const newMuted = !musicMuted;
    setMusicMuted(newMuted);
    soundManager.setMusicMuted(newMuted);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={toggleSounds}
      >
        <Text style={styles.icon}>{soundsMuted ? '🔇' : '🔊'}</Text>
        <Text style={styles.label}>SFX</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.musicButton]}
        onPress={toggleMusic}
      >
        <Text style={styles.icon}>{musicMuted ? '🎵' : '🎵'}</Text>
        <Text style={styles.label}>{musicMuted ? 'OFF' : 'ON'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 10,
  },
  musicButton: {
    backgroundColor: 'rgba(147, 51, 234, 0.3)',
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 9,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 2,
  },
});
