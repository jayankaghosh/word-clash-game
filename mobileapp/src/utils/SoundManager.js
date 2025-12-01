import * as Haptics from 'expo-haptics';

class SoundManager {
  play(soundName) {
    // Use haptic feedback instead of audio on mobile
    switch(soundName) {
      case 'click':
      case 'submit':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'success':
      case 'join':
      case 'win':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
      case 'lose':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'tick':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }
}

export default SoundManager;
