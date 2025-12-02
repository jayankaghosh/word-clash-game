import React, { useState, useEffect, useRef } from 'react';
import Timer from './Timer';

function LetterInput({ role, socket, soundManager, letterTime }) {
  const [letter, setLetter] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (letter && !submitted) {
      socket.emit('submit-letter', { letter: letter.toUpperCase() });
      setSubmitted(true);
      soundManager.play('submit');
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase();
    // Only accept A-Z letters
    if (/^[A-Z]?$/.test(value)) {
      setLetter(value);
      
      // Auto-submit when a letter is entered
      if (value && !submitted) {
        setTimeout(() => {
          if (!submitted) {
            socket.emit('submit-letter', { letter: value });
            setSubmitted(true);
            soundManager.play('submit');
          }
        }, 100);
      }
    }
  };

  const handleInputFocus = (e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-white/20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          You are the <span className={role === 'start' ? 'text-green-400' : 'text-blue-400'}>{role}</span> player
        </h2>
        <p className="text-blue-200 text-lg mb-6">Type ONE letter (A-Z)</p>
        
        <Timer duration={letterTime || 5} soundManager={soundManager} />
      </div>

      <form onSubmit={handleSubmit} className="max-w-xs mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={letter}
          onChange={handleChange}
          onFocus={handleInputFocus}
          className="w-full text-center text-6xl font-bold py-8 rounded-2xl bg-white/20 border-2 border-white/30 text-white placeholder-white/30 focus:outline-none focus:ring-4 focus:ring-yellow-400 uppercase"
          placeholder="?"
          maxLength={1}
          disabled={submitted}
          autoComplete="off"
          inputMode="text"
        />
        
        {submitted && (
          <div className="mt-4 text-center">
            <div className="inline-block bg-green-500/30 text-green-300 px-4 py-2 rounded-lg">
              ✓ Letter submitted: <span className="font-bold">{letter}</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default LetterInput;
