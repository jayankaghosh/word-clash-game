class SoundManager {
  constructor() {
    this.muted = false;
    this.sounds = {};
    this.initSounds();
  }

  initSounds() {
    // Using Web Audio API to generate simple sounds
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  setMuted(muted) {
    this.muted = muted;
  }

  playTone(frequency, duration, type = 'sine') {
    if (this.muted) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  play(soundName) {
    if (this.muted) return;

    switch (soundName) {
      case 'click':
        this.playTone(800, 0.1, 'square');
        break;
      case 'success':
        this.playTone(523, 0.1);
        setTimeout(() => this.playTone(659, 0.15), 100);
        break;
      case 'join':
        this.playTone(440, 0.1);
        setTimeout(() => this.playTone(554, 0.15), 80);
        break;
      case 'start':
        this.playTone(523, 0.1);
        setTimeout(() => this.playTone(659, 0.1), 100);
        setTimeout(() => this.playTone(784, 0.2), 200);
        break;
      case 'roundStart':
        this.playTone(392, 0.15);
        setTimeout(() => this.playTone(523, 0.2), 150);
        break;
      case 'tick':
        this.playTone(1000, 0.05, 'square');
        break;
      case 'submit':
        this.playTone(659, 0.1);
        break;
      case 'reveal':
        this.playTone(523, 0.1);
        setTimeout(() => this.playTone(659, 0.1), 100);
        setTimeout(() => this.playTone(784, 0.15), 200);
        break;
      case 'win':
        this.playTone(523, 0.1);
        setTimeout(() => this.playTone(659, 0.1), 100);
        setTimeout(() => this.playTone(784, 0.1), 200);
        setTimeout(() => this.playTone(1047, 0.3), 300);
        break;
      case 'lose':
        this.playTone(392, 0.15);
        setTimeout(() => this.playTone(330, 0.2), 150);
        break;
      case 'gameWin':
        // Victory fanfare
        this.playTone(523, 0.1);
        setTimeout(() => this.playTone(659, 0.1), 100);
        setTimeout(() => this.playTone(784, 0.1), 200);
        setTimeout(() => this.playTone(1047, 0.15), 300);
        setTimeout(() => this.playTone(784, 0.1), 450);
        setTimeout(() => this.playTone(1047, 0.3), 550);
        break;
      case 'gameLose':
        this.playTone(392, 0.2);
        setTimeout(() => this.playTone(330, 0.25), 200);
        setTimeout(() => this.playTone(262, 0.3), 400);
        break;
      case 'error':
        this.playTone(200, 0.2, 'sawtooth');
        break;
      default:
        break;
    }
  }
}

export default SoundManager;
