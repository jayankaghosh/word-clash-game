import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { SOCKET_URL } from '@env';

class SoundManager {
  constructor() {
    this.muted = false;
    this.sounds = {};
    this.bgMusic = null;
    this.baseUrl = SOCKET_URL || 'http://localhost:3001';
    this.initAudio();
  }

  async initAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      // Preload all sounds
      await this.loadSounds();
      await this.loadBackgroundMusic();
    } catch (error) {
      console.log('Error initializing audio:', error);
    }
  }

  async loadSounds() {
    // Map sound names to actual files (some are reused)
    const soundFileMap = {
      'click': 'click.wav',
      'success': 'success.wav',
      'join': 'join.wav',
      'start': 'start.wav',
      'roundStart': 'start.wav',  // Reused
      'tick': 'tick.wav',
      'submit': 'click.wav',  // Reused
      'reveal': 'reveal.wav',
      'win': 'win.wav',
      'lose': 'lose.wav',
      'gameWin': 'gameWin.wav',
      'gameLose': 'gameLose.wav',
      'error': 'error.wav'
    };

    for (const [name, fileName] of Object.entries(soundFileMap)) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: `${this.baseUrl}/assets/sounds/${fileName}` },
          { shouldPlay: false, volume: 0.5 }
        );
        this.sounds[name] = sound;
      } catch (error) {
        console.log(`Error loading ${fileName}:`, error);
      }
    }
  }

  async loadBackgroundMusic() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: `${this.baseUrl}/assets/sounds/bg.mp3` },
        { 
          shouldPlay: false, 
          volume: 0.2,  // Lower volume for background music
          isLooping: true 
        }
      );
      this.bgMusic = sound;
    } catch (error) {
      console.log('Error loading background music:', error);
    }
  }

  async startBackgroundMusic() {
    if (this.bgMusic && !this.muted) {
      try {
        await this.bgMusic.playAsync();
      } catch (error) {
        console.log('Error starting background music:', error);
      }
    }
  }

  async stopBackgroundMusic() {
    if (this.bgMusic) {
      try {
        await this.bgMusic.stopAsync();
      } catch (error) {
        console.log('Error stopping background music:', error);
      }
    }
  }

  async setMuted(muted) {
    this.muted = muted;
    
    if (this.bgMusic) {
      try {
        if (muted) {
          await this.bgMusic.pauseAsync();
        } else {
          await this.bgMusic.playAsync();
        }
      } catch (error) {
        console.log('Error toggling background music:', error);
      }
    }
  }

  async play(soundName) {
    if (this.muted) return;

    try {
      // Play haptic feedback along with sound
      this.playHaptic(soundName);

      // Play audio
      const sound = this.sounds[soundName];
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log(`Error playing ${soundName}:`, error);
    }
  }

  async playHaptic(soundName) {
    // Subtle haptic feedback to accompany sounds
    switch (soundName) {
      case 'click':
      case 'tick':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'success':
      case 'join':
      case 'win':
      case 'gameWin':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
      case 'lose':
      case 'gameLose':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'submit':
      case 'start':
      case 'roundStart':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }
}

export default SoundManager;
