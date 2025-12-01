class SoundManager {
  constructor() {
    this.soundsMuted = false;
    this.musicMuted = false;
    this.sounds = {};
    this.bgMusic = null;
    this.baseUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    this.loadSounds();
    this.loadBackgroundMusic();
  }

  loadSounds() {
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

    Object.keys(soundFileMap).forEach(name => {
      const fileName = soundFileMap[name];
      const audio = new Audio(`${this.baseUrl}/assets/sounds/${fileName}`);
      audio.preload = 'auto';
      audio.volume = 0.5;
      this.sounds[name] = audio;
    });
  }

  loadBackgroundMusic() {
    this.bgMusic = new Audio(`${this.baseUrl}/assets/sounds/bg.mp3`);
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.2; // Lower volume for background music
    this.bgMusic.preload = 'auto';
  }

  startBackgroundMusic() {
    if (this.bgMusic && !this.musicMuted) {
      this.bgMusic.play().catch(err => {
        console.log('Background music autoplay blocked. Will play on first user interaction.');
      });
    }
  }

  stopBackgroundMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }

  setSoundsMuted(muted) {
    this.soundsMuted = muted;
  }

  setMusicMuted(muted) {
    this.musicMuted = muted;
    
    if (this.bgMusic) {
      if (muted) {
        this.bgMusic.pause();
      } else {
        this.bgMusic.play().catch(err => {
          console.log('Error resuming background music:', err);
        });
      }
    }
  }

  // Legacy method for backward compatibility
  setMuted(muted) {
    this.setSoundsMuted(muted);
    this.setMusicMuted(muted);
  }

  play(soundName) {
    if (this.soundsMuted || !this.sounds[soundName]) return;

    try {
      const sound = this.sounds[soundName].cloneNode();
      sound.volume = 0.5;
      sound.play().catch(err => {
        console.log(`Error playing ${soundName}:`, err);
      });
    } catch (error) {
      console.log(`Error playing ${soundName}:`, error);
    }
  }
}

export default SoundManager;
