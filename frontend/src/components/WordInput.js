import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import Timer from './Timer';

function WordInput({ startLetter, endLetter, socket, soundManager, wordTime, disabled }) {
  const [word, setWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus on mount and when disabled state changes
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  useEffect(() => {
    if (!socket) return;

    // Listen for invalid word response to allow retry
    const handleInvalidWord = () => {
      setSubmitted(false);
      setWord('');
      // Refocus after a short delay to ensure state has updated
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    };

    // Listen for word-accepted in battle royale to refocus if still your turn
    const handleWordAccepted = () => {
      setSubmitted(false);
      setWord('');
      // Refocus after a short delay
      setTimeout(() => {
        if (inputRef.current && !disabled) {
          inputRef.current.focus();
        }
      }, 100);
    };

    socket.on('invalid-word', handleInvalidWord);
    socket.on('word-accepted', handleWordAccepted);

    return () => {
      socket.off('invalid-word', handleInvalidWord);
      socket.off('word-accepted', handleWordAccepted);
    };
  }, [socket, disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!word.trim() || submitted || disabled) return;
    
    setSubmitted(true);
    socket.emit('submit-word', { word: word.trim() });
    soundManager.play('submit');
  };

  const handleSkip = () => {
    if (submitted || disabled) return;
    setSubmitted(true);
    socket.emit('skip-round');
    soundManager.play('click');
  };

  const handleInputFocus = (e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-5 md:p-12 border border-white/20">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Find a Word!</h2>
        
        <div className="flex justify-center items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl px-4 py-2 md:px-6 md:py-3 shadow-lg">
            <div className="text-xs text-white/70 mb-1">Starts with</div>
            <div className="text-3xl md:text-4xl font-bold text-white">{startLetter}</div>
          </div>
          <div className="text-white text-xl md:text-2xl">→</div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl px-4 py-2 md:px-6 md:py-3 shadow-lg">
            <div className="text-xs text-white/70 mb-1">Ends with</div>
            <div className="text-3xl md:text-4xl font-bold text-white">{endLetter}</div>
          </div>
        </div>

        <Timer duration={wordTime || 30} soundManager={soundManager} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
        {/* Input and Submit button - always side by side */}
        <div className="flex gap-2 md:gap-3">
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value.toUpperCase())}
            onFocus={handleInputFocus}
            className="flex-1 px-3 py-3 md:px-4 md:py-4 rounded-xl bg-white/20 border-2 border-white/30 text-white text-center text-lg md:text-2xl font-bold placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            placeholder={disabled ? "Not your turn..." : "Type your word..."}
            disabled={submitted || disabled}
            maxLength={15}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!word.trim() || submitted || disabled}
            className="px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-2xl md:text-3xl rounded-xl hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg min-w-[56px] md:min-w-[60px]"
          >
            ➤
          </button>
        </div>

        {/* Skip button - always full width, separate row */}
        <button
          type="button"
          onClick={handleSkip}
          disabled={submitted || disabled}
          className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-base md:text-lg rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
        >
          ⏭️ Skip Round
        </button>

        <p className="text-white/50 text-xs md:text-sm mt-3 md:mt-4 text-center">
          {disabled ? 'Waiting for your turn...' : 'First valid word wins the round!'}
        </p>
      </form>
    </div>
  );
}

export default WordInput;
