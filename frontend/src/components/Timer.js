import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

function Timer({ duration, soundManager }) {
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
    <div className="mb-6">
      <div className="flex items-center justify-center gap-3 mb-3">
        <Clock className={`w-6 h-6 text-white ${isUrgent ? 'animate-pulse-fast' : ''}`} />
        <span className={`text-4xl font-bold ${isUrgent ? 'text-red-400 animate-pulse-fast' : 'text-white'}`}>
          {timeLeft}s
        </span>
      </div>
      
      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isUrgent ? 'bg-red-500' : 'bg-gradient-to-r from-green-500 to-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

export default Timer;
