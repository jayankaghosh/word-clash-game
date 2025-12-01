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
    if (word.trim() && !submitted) {
      socket.emit('submit-word', { word: word.trim() });
      setSubmitted(true);
      soundManager.play('submit');
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-6">Find a Word!</h2>
        
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl px-6 py-3 shadow-lg">
            <div className="text-xs text-white/70 mb-1">Starts with</div>
            <div className="text-4xl font-bold text-white">{startLetter}</div>
          </div>
          <div className="text-white text-2xl">→</div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl px-6 py-3 shadow-lg">
            <div className="text-xs text-white/70 mb-1">Ends with</div>
            <div className="text-4xl font-bold text-white">{endLetter}</div>
          </div>
        </div>

        <Timer duration={wordTime || 30} soundManager={soundManager} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          ref={inputRef}
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value.toUpperCase())}
          className="w-full px-6 py-4 rounded-xl bg-white/20 border-2 border-white/30 text-white text-center text-2xl font-bold placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          placeholder={disabled ? "Not your turn..." : "Type your word..."}
          disabled={submitted || disabled}
          maxLength={15}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!word.trim() || submitted || disabled}
          className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg rounded-xl hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg"
        >
          <Send className="w-5 h-5" />
          {disabled ? 'Wait for your turn' : (submitted ? 'Submitted!' : 'Submit Word')}
        </button>

        {submitted && (
          <div className="mt-4 text-center">
            <div className="inline-block bg-green-500/30 text-green-300 px-4 py-2 rounded-lg">
              ✓ Word submitted! Waiting for validation...
            </div>
          </div>
        )}

        <p className="text-white/50 text-sm mt-4 text-center">
          {disabled ? 'Waiting for your turn...' : 'First valid word wins the round!'}
        </p>
      </form>
    </div>
  );
}

export default WordInput;
