import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function MuteButton({ soundManager }) {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundManager.setMuted(newMuted);
    if (!newMuted) {
      soundManager.play('click');
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={toggleMute}
    >
      <Text style={styles.icon}>{isMuted ? '🔇' : '📳'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1000,
  },
  icon: {
    fontSize: 24,
  },
});
