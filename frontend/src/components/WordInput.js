import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import Timer from './Timer';

function WordInput({ startLetter, endLetter, socket, soundManager, wordTime }) {
  const [word, setWord] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for invalid word response to allow retry
    const handleInvalidWord = () => {
      setSubmitted(false);
      setWord('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    socket.on('invalid-word', handleInvalidWord);

    return () => {
      socket.off('invalid-word', handleInvalidWord);
    };
  }, [socket]);

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

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="flex-1 px-6 py-4 text-2xl rounded-xl bg-white/20 border-2 border-white/30 text-white placeholder-white/30 focus:outline-none focus:ring-4 focus:ring-yellow-400 uppercase"
            placeholder="Type your word"
            disabled={submitted}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!word.trim() || submitted}
            className="px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        
        {submitted && (
          <div className="mt-4 text-center">
            <div className="inline-block bg-green-500/30 text-green-300 px-4 py-2 rounded-lg">
              ✓ Word submitted! Waiting for validation...
            </div>
          </div>
        )}

        <p className="text-white/50 text-sm mt-4 text-center">
          First valid word wins the round!
        </p>
      </form>
    </div>
  );
}

export default WordInput;
