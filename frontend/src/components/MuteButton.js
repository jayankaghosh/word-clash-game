import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

function MuteButton({ soundManager }) {
  const [soundsMuted, setSoundsMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);

  useEffect(() => {
    const savedSoundsMute = localStorage.getItem('wordClashSoundsMuted') === 'true';
    const savedMusicMute = localStorage.getItem('wordClashMusicMuted') === 'true';
    setSoundsMuted(savedSoundsMute);
    setMusicMuted(savedMusicMute);
    soundManager.setSoundsMuted(savedSoundsMute);
    soundManager.setMusicMuted(savedMusicMute);
  }, [soundManager]);

  const toggleSounds = () => {
    const newMuted = !soundsMuted;
    setSoundsMuted(newMuted);
    soundManager.setSoundsMuted(newMuted);
    localStorage.setItem('wordClashSoundsMuted', newMuted.toString());
  };

  const toggleMusic = () => {
    const newMuted = !musicMuted;
    setMusicMuted(newMuted);
    soundManager.setMusicMuted(newMuted);
    localStorage.setItem('wordClashMusicMuted', newMuted.toString());
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <button
        onClick={toggleSounds}
        className="p-3 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 hover:bg-white/20 transition-all transform hover:scale-110"
        aria-label={soundsMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        title="Sound Effects"
      >
        {soundsMuted ? (
          <VolumeX className="w-6 h-6 text-white" />
        ) : (
          <Volume2 className="w-6 h-6 text-white" />
        )}
      </button>

      <button
        onClick={toggleMusic}
        className={`p-3 backdrop-blur-lg rounded-full border transition-all transform hover:scale-110 ${
          musicMuted 
            ? 'bg-red-500/20 border-red-300/30 hover:bg-red-500/30' 
            : 'bg-purple-500/20 border-purple-300/30 hover:bg-purple-500/30'
        }`}
        aria-label={musicMuted ? 'Unmute Music' : 'Mute Music'}
        title="Background Music"
      >
        <Music className={`w-6 h-6 ${musicMuted ? 'text-red-300' : 'text-white'}`} />
      </button>
    </div>
  );
}

export default MuteButton;
