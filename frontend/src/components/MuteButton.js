import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

function MuteButton({ soundManager }) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const savedMute = localStorage.getItem('wordClashMuted') === 'true';
    setIsMuted(savedMute);
    soundManager.setMuted(savedMute);
  }, [soundManager]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundManager.setMuted(newMuted);
    localStorage.setItem('wordClashMuted', newMuted.toString());
  };

  return (
    <button
      onClick={toggleMute}
      className="fixed top-4 right-4 z-50 p-3 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 hover:bg-white/20 transition-all transform hover:scale-110"
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? (
        <VolumeX className="w-6 h-6 text-white" />
      ) : (
        <Volume2 className="w-6 h-6 text-white" />
      )}
    </button>
  );
}

export default MuteButton;
