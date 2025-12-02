import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import LetterInput from './LetterInput';
import WordInput from './WordInput';
import ScoreBoard from './ScoreBoard';
import RoundResult from './RoundResult';
import GameOver from './GameOver';
import { useVoiceChat } from '../utils/useVoiceChat';

function GameRoom({ gameData, playerName, socket, soundManager, onGameEnd }) {
  const [phase, setPhase] = useState('waiting'); // waiting, letter-input, letters-revealed, word-input, round-end, game-over
  const [role, setRole] = useState(null); // 'start' or 'end'
  const [letters, setLetters] = useState({ start: null, end: null });
  const [roundResult, setRoundResult] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null); // Battle Royale: whose turn
  const [roundWords, setRoundWords] = useState([]); // Battle Royale: words in this round
  const [timerKey, setTimerKey] = useState(0); // Key to force timer reset
  const [gameResult, setGameResult] = useState(null);
  const [scores, setScores] = useState([]);
  const [notification, setNotification] = useState('');
  
  // Get player and opponent socket IDs
  const playerSocketId = socket?.id;
  const opponentSocketId = gameData?.players?.find(p => p.id !== playerSocketId)?.id;

  // Voice chat hook
  const {
    voiceEnabled,
    opponentVoiceEnabled,
    isConnected,
    error: voiceError,
    toggleVoiceChat,
    remoteAudio
  } = useVoiceChat(socket, playerSocketId, opponentSocketId);

  const remoteAudioRef = useRef(null);

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
      
      // Reset timer key for new round
      setTimerKey(prev => prev + 1);
      
      setTimeout(() => {
        setPhase('word-input');
      }, 2000);
    });

    socket.on('no-valid-words', ({ startLetter, endLetter }) => {
      setNotification(`No valid words for ${startLetter}-${endLetter}. Restarting round...`);
      soundManager.play('error');
      // Reset to waiting state
      setPhase('waiting');
      setLetters({ start: null, end: null });
      setTimeout(() => setNotification(''), 2000);
    });

    socket.on('combination-used', ({ startLetter, endLetter }) => {
      setNotification(`${startLetter}-${endLetter} already used! Choosing new letters...`);
      soundManager.play('error');
      // Reset to waiting state
      setPhase('waiting');
      setLetters({ start: null, end: null });
      setTimeout(() => setNotification(''), 2000);
    });

    socket.on('invalid-word', ({ reason }) => {
      setNotification(reason);
      soundManager.play('error');
      setTimeout(() => setNotification(''), 2000);
    });

    // Battle Royale events
    socket.on('turn-update', ({ currentTurn, roundWords }) => {
      setCurrentTurn(currentTurn);
      setRoundWords(roundWords || []);
    });

    socket.on('word-accepted', ({ word, player, roundWords }) => {
      setNotification(`${player} submitted: ${word}`);
      setRoundWords(roundWords || []);
      soundManager.play('submit');
      setTimeout(() => setNotification(''), 2000);
      
      // Reset timer by changing key
      setTimerKey(prev => prev + 1);
    });

    socket.on('combination-used', ({ startLetter, endLetter }) => {
      setNotification(`${startLetter}-${endLetter} already used! Choosing new letters...`);
      soundManager.play('error');
      setTimeout(() => setNotification(''), 2000);
    });

    socket.on('round-ended', ({ winner, word, scores, roundWords, winningReason }) => {
      setRoundResult({ winner, word, roundWords, winningReason });
      setScores(scores);
      setPhase('round-end');
      setCurrentTurn(null);
      setRoundWords([]);
      
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
      socket.off('combination-used');
      socket.off('invalid-word');
      socket.off('game-exited');
      socket.off('round-ended');
      socket.off('game-ended');
      socket.off('turn-update');
      socket.off('word-accepted');
    };
  }, [socket, soundManager, playerName, onGameEnd, gameData]);

  const handleExitGame = () => {
    if (window.confirm('Are you sure you want to exit? This will end the game for all players.')) {
      socket.emit('exit-game');
      soundManager.play('error');
      onGameEnd();
    }
  };

  // Connect remote audio element
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudio.current = remoteAudioRef.current;
    }
  }, [remoteAudio]);

  if (!gameData) return null;

  return (
    <div className="max-w-4xl w-full">
      {/* Hidden audio element for remote voice */}
      <audio ref={remoteAudioRef} autoPlay />

      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg slide-in z-50">
          {notification}
        </div>
      )}

      {voiceError && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg slide-in z-50">
          Voice chat error: {voiceError}
        </div>
      )}

      <div className="relative">
        <ScoreBoard 
          players={gameData.players}
          roundsToWin={gameData.roundsToWin}
          currentScores={scores}
        />
        
        {/* Voice chat button */}
        <button
          onClick={toggleVoiceChat}
          className={`absolute top-2 right-14 p-2 rounded-full border transition-all ${
            voiceEnabled 
              ? 'bg-green-500/50 hover:bg-green-500/70 border-green-500/70 text-white' 
              : 'bg-gray-500/30 hover:bg-gray-500/50 border-gray-500/50 text-white/70'
          } ${isConnected ? 'ring-2 ring-green-400' : ''}`}
          title={voiceEnabled ? 'Mute microphone' : 'Enable voice chat'}
        >
          {voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Voice status indicator */}
        {opponentVoiceEnabled && (
          <div className="absolute top-2 left-2 bg-green-500/30 text-green-300 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-green-500/50">
            <Mic className="w-3 h-3" />
            Opponent mic on
          </div>
        )}

        {/* Exit button */}
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
          <div>
            {/* Battle Royale: Turn indicator and words list */}
            {gameData.gameType === 'battle-royale' && (
              <div className="mb-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-4">
                  <div className="text-center mb-4">
                    {currentTurn === playerName ? (
                      <div className="text-2xl font-bold text-yellow-400">🎯 Your Turn!</div>
                    ) : (
                      <div className="text-xl font-medium text-blue-200">
                        Waiting for {currentTurn}...
                      </div>
                    )}
                  </div>
                  
                  {roundWords.length > 0 && (
                    <div>
                      <div className="text-sm text-white/70 mb-2">Words submitted this round:</div>
                      <div className="flex flex-wrap gap-2">
                        {roundWords.map((item, idx) => (
                          <div 
                            key={idx}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 rounded-lg shadow-md"
                          >
                            <div className="text-xs text-white/70">{item.player}</div>
                            <div className="text-lg font-bold text-white">{item.word}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <WordInput 
              key={timerKey}
              startLetter={letters.start}
              endLetter={letters.end}
              socket={socket}
              soundManager={soundManager}
              wordTime={gameData.wordTime || 30}
              disabled={gameData.gameType === 'battle-royale' && currentTurn !== playerName}
            />
          </div>
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
