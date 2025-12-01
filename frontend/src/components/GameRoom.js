import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';
import LetterInput from './LetterInput';
import WordInput from './WordInput';
import ScoreBoard from './ScoreBoard';
import RoundResult from './RoundResult';
import GameOver from './GameOver';

function GameRoom({ gameData, playerName, socket, soundManager, onGameEnd }) {
  const [phase, setPhase] = useState('waiting'); // waiting, letter-input, letters-revealed, word-input, round-end, game-over
  const [role, setRole] = useState(null); // 'start' or 'end'
  const [letters, setLetters] = useState({ start: null, end: null });
  const [roundResult, setRoundResult] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [scores, setScores] = useState([]);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (!socket) return;

    socket.on('round-started', ({ role }) => {
      setPhase('letter-input');
      setRole(role);
      setLetters({ start: null, end: null });
      setRoundResult(null);
      soundManager.play('roundStart');
    });

    socket.on('letters-revealed', ({ startLetter, endLetter }) => {
      setLetters({ start: startLetter, end: endLetter });
      setPhase('letters-revealed');
      soundManager.play('reveal');
      
      setTimeout(() => {
        setPhase('word-input');
      }, 2000);
    });

    socket.on('no-valid-words', ({ startLetter, endLetter }) => {
      setNotification(`No valid words for ${startLetter}-${endLetter}. Restarting round...`);
      soundManager.play('error');
      setTimeout(() => setNotification(''), 2000);
    });

    socket.on('invalid-word', ({ reason }) => {
      setNotification(reason);
      soundManager.play('error');
      setTimeout(() => setNotification(''), 2000);
    });

    socket.on('round-ended', ({ winner, word, scores }) => {
      setRoundResult({ winner, word });
      setScores(scores);
      setPhase('round-end');
      
      if (winner === playerName) {
        soundManager.play('win');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else if (winner) {
        soundManager.play('lose');
      }
    });

    socket.on('game-ended', ({ winner, scores }) => {
      setGameResult({ winner, scores });
      setPhase('game-over');
      
      if (winner === playerName) {
        soundManager.play('gameWin');
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 }
        });
      } else {
        soundManager.play('gameLose');
      }
    });

    socket.on('game-exited', ({ message }) => {
      soundManager.play('error');
      alert(message);
      onGameEnd();
    });

    return () => {
      socket.off('round-started');
      socket.off('letters-revealed');
      socket.off('no-valid-words');
      socket.off('invalid-word');
      socket.off('game-exited');
      socket.off('round-ended');
      socket.off('game-ended');
    };
  }, [socket, playerName, soundManager, onGameEnd]);

  const handleExitGame = () => {
    if (window.confirm('Are you sure you want to exit? This will end the game for all players.')) {
      socket.emit('exit-game');
      soundManager.play('error');
      onGameEnd();
    }
  };

  if (!gameData) return null;

  return (
    <div className="max-w-4xl w-full">
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg slide-in z-50">
          {notification}
        </div>
      )}

      <div className="relative">
        <ScoreBoard 
          players={gameData.players}
          roundsToWin={gameData.roundsToWin}
          currentScores={scores}
        />
        <button
          onClick={handleExitGame}
          className="absolute top-2 right-2 bg-red-500/30 hover:bg-red-500/50 text-white p-2 rounded-full border border-red-500/50 transition-all"
          title="Exit Game"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-6">
        {phase === 'waiting' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">Get Ready!</h2>
            <p className="text-blue-200 text-lg">Round starting soon...</p>
          </div>
        )}

        {phase === 'letter-input' && (
          <LetterInput 
            role={role}
            socket={socket}
            soundManager={soundManager}
            letterTime={gameData.letterTime || 5}
          />
        )}

        {phase === 'letters-revealed' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-8">The Letters Are...</h2>
            <div className="flex justify-center gap-8 mb-8">
              <div className="flip-animation">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 shadow-xl">
                  <div className="text-sm text-white/70 mb-2">Start</div>
                  <div className="text-6xl font-bold text-white">{letters.start}</div>
                </div>
              </div>
              <div className="flip-animation" style={{ animationDelay: '0.2s' }}>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 shadow-xl">
                  <div className="text-sm text-white/70 mb-2">End</div>
                  <div className="text-6xl font-bold text-white">{letters.end}</div>
                </div>
              </div>
            </div>
            <p className="text-blue-200 text-lg">Get ready to find a word...</p>
          </div>
        )}

        {phase === 'word-input' && (
          <WordInput 
            startLetter={letters.start}
            endLetter={letters.end}
            socket={socket}
            soundManager={soundManager}
            wordTime={gameData.wordTime || 30}
          />
        )}

        {phase === 'round-end' && (
          <RoundResult 
            result={roundResult}
            playerName={playerName}
            gameData={gameData}
            socket={socket}
            soundManager={soundManager}
          />
        )}

        {phase === 'game-over' && (
          <GameOver 
            result={gameResult}
            playerName={playerName}
            onPlayAgain={onGameEnd}
          />
        )}
      </div>
    </div>
  );
}

export default GameRoom;
