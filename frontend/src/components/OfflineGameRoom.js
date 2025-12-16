import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';
import LetterInput from './LetterInput';
import WordInput from './WordInput';
import ScoreBoard from './ScoreBoard';
import RoundResult from './RoundResult';
import GameOver from './GameOver';
import ComputerAI from '../utils/ComputerAI';
import OfflineManager from '../utils/OfflineManager';

function OfflineGameRoom({ playerName, difficulty, config, soundManager, onGameEnd }) {
  const [phase, setPhase] = useState('waiting');
  const [role, setRole] = useState(null);
  const [letters, setLetters] = useState({ start: null, end: null });
  const [roundResult, setRoundResult] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [gameResult, setGameResult] = useState(null);
  const [scores, setScores] = useState([
    { name: playerName, score: 0 },
    { name: 'Bot', score: 0 }
  ]);
  const [notification, setNotification] = useState('');
  const [usedWords, setUsedWords] = useState(new Set());
  const [computerAI] = useState(() => new ComputerAI(difficulty));
  const [dictionary, setDictionary] = useState(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [currentTurn, setCurrentTurn] = useState(null); // Battle Royale: whose turn
  const [roundWords, setRoundWords] = useState([]); // Battle Royale: words in this round
  const [usedLetterCombinations, setUsedLetterCombinations] = useState(new Set());
  const roundTimeoutRef = useRef(null);
  const letterTimeoutRef = useRef(null);
  const usedWordsRef = useRef(usedWords);
  const dictionaryRef = useRef(dictionary);

  // Keep refs updated
  useEffect(() => {
    usedWordsRef.current = usedWords;
  }, [usedWords]);

  useEffect(() => {
    dictionaryRef.current = dictionary;
  }, [dictionary]);

  // Load dictionary on mount
  useEffect(() => {
    const dict = OfflineManager.getDictionary();
    if (dict) {
      setDictionary(dict);
    }
  }, []);

  // Start first round when dictionary is loaded
  useEffect(() => {
    if (dictionary && phase === 'waiting') {
      const timer = setTimeout(() => startRound(), 2000);
      return () => clearTimeout(timer);
    }
  }, [dictionary]);

  const startRound = () => {
    if (!dictionary) return;

    // Randomly assign roles
    const playerIsStart = Math.random() > 0.5;
    setRole(playerIsStart ? 'start' : 'end');
    setPhase('letter-input');
    setLetters({ start: null, end: null });
    setRoundResult(null);
    soundManager.play('roundStart');

    // Computer chooses its letter after delay
    const computerRole = playerIsStart ? 'end' : 'start';
    setTimeout(() => {
      if (computerRole === 'start') {
        const computerLetter = computerAI.chooseLetter(dictionary, new Set());
        setLetters(prev => ({ ...prev, start: computerLetter }));
      } else {
        const computerLetter = computerAI.chooseLetter(dictionary, new Set());
        setLetters(prev => ({ ...prev, end: computerLetter }));
      }
    }, computerAI.getLetterDelay());
  };

  const handleLetterSubmit = (letter) => {
    if (role === 'start') {
      setLetters(prev => ({ ...prev, start: letter }));
    } else {
      setLetters(prev => ({ ...prev, end: letter }));
    }
    soundManager.play('submit');
  };

  // Check when both letters are submitted
  useEffect(() => {
    if (letters.start && letters.end && phase === 'letter-input') {
      revealLetters();
    }
  }, [letters, phase]);

  const revealLetters = () => {
    if (roundTimeoutRef.current) {
      clearTimeout(roundTimeoutRef.current);
    }

    const { start, end } = letters;
    const letterCombo = `${start}-${end}`;

    // Battle Royale: Check if this combination was already used
    if (config.gameType === 'battle-royale' && usedLetterCombinations.has(letterCombo)) {
      setNotification(`${start}-${end} already used! Choosing new letters...`);
      soundManager.play('error');
      setPhase('waiting');
      setLetters({ start: null, end: null });
      setTimeout(() => {
        setNotification('');
        startRound();
      }, 2000);
      return;
    }

    // Check if valid words exist
    if (!computerAI.hasValidWords(start, end, usedWords, dictionary)) {
      setNotification(`No valid words for ${start}-${end}. Restarting round...`);
      soundManager.play('error');
      setPhase('waiting');
      setLetters({ start: null, end: null });
      setTimeout(() => {
        setNotification('');
        startRound();
      }, 2000);
      return;
    }

    // Mark combination as used in battle royale
    if (config.gameType === 'battle-royale') {
      setUsedLetterCombinations(prev => new Set([...prev, letterCombo]));
      setRoundWords([]); // Reset words for this round
      setCurrentTurn(playerName); // Player goes first
    }

    setPhase('letters-revealed');
    soundManager.play('reveal');
    setTimerKey(prev => prev + 1);

    setTimeout(() => {
      setPhase('word-input');
      
      if (config.gameType === 'battle-royale') {
        // Battle Royale: Player always goes first
        setIsPlayerTurn(true);
        
        // Set timeout for player's turn
        roundTimeoutRef.current = setTimeout(() => {
          // Player timed out, Bot wins
          computerWinsRound(null);
        }, config.wordTime * 1000 + 2000); // Add 2s buffer
      } else {
        // Normal mode: Random first turn
        const computerGoesFirst = Math.random() < 0.5;
        if (computerGoesFirst) {
          setIsPlayerTurn(false);
          // Delay computerTurn to ensure state has updated
          setTimeout(() => {
            computerTurn(start, end);
          }, 100);
        } else {
          setIsPlayerTurn(true);
          
          // Set timeout for normal mode
          roundTimeoutRef.current = setTimeout(() => {
            // Player timed out, Bot wins
            computerWinsRound(null);
          }, config.wordTime * 1000 + 2000);
        }
      }
    }, 2000);
  };

  const handleWordSubmit = async (word, onRetry) => {
    if (!isPlayerTurn) {
      setNotification("Wait for Bot's turn!");
      if (onRetry) onRetry(); // Allow retry
      return;
    }

    const validation = validateWord(word, letters.start, letters.end);
    if (!validation.valid) {
      setNotification(validation.reason);
      soundManager.play('error');
      setTimeout(() => setNotification(''), 2000);
      if (onRetry) onRetry(); // Allow retry
      return;
    }

    const w = word.toLowerCase();
    setUsedWords(prev => new Set([...prev, w]));

    if (config.gameType === 'battle-royale') {
      // Battle Royale: Add word to round history and switch turns
      setRoundWords(prev => [...prev, { player: playerName, word: w }]);
      setNotification(`You submitted: ${w}`);
      soundManager.play('submit');
      setTimeout(() => setNotification(''), 2000);

      // Switch turn to Bot
      setCurrentTurn('Bot');
      setIsPlayerTurn(false);
      setTimerKey(prev => prev + 1);

      // Bot takes its turn
      setTimeout(() => {
        computerTurn(letters.start, letters.end, true); // true = battle royale mode
      }, 1000);
    } else {
      // Normal mode: Player wins immediately
      playerWinsRound(word);
    }
  };

  const handleSkip = () => {
    if (config.gameType === 'battle-royale') {
      // Battle Royale: Skipping means player gives up, Bot wins
      computerWinsRound(null);
    } else {
      // Normal mode: Both skip is a draw, but for offline just let Bot win
      computerWinsRound(null);
    }
  };

  const computerTurn = async (startLetter, endLetter, isBattleRoyale = false) => {
    try {
      const currentDict = dictionaryRef.current;
      const currentUsedWords = usedWordsRef.current;
      
      console.log('Computer turn starting', { startLetter, endLetter, dictionaryLoaded: !!currentDict, usedWordsSize: currentUsedWords.size });
      
      if (!currentDict) {
        console.error('Dictionary not loaded');
        playerWinsRound(null, 'Bot encountered an error');
        return;
      }
      
      const word = await computerAI.findWord(startLetter, endLetter, currentUsedWords, currentDict);
      
      console.log('Computer found word:', word);
      
      if (word) {
        // Computer found a word
        const w = word.toLowerCase();
        setUsedWords(prev => new Set([...prev, w]));

        if (isBattleRoyale) {
          // Battle Royale: Add to round history and switch back to player
          setRoundWords(prev => [...prev, { player: 'Bot', word: w }]);
          setNotification(`Bot submitted: ${w}`);
          soundManager.play('submit');
          setTimeout(() => setNotification(''), 2000);

          // Switch turn back to player
          setCurrentTurn(playerName);
          setIsPlayerTurn(true);
          setTimerKey(prev => prev + 1);
        } else {
          // Normal mode: Bot wins immediately
          console.log('Calling computerWinsRound');
          computerWinsRound(word);
        }
      } else {
        console.log('Computer failed to find word');
        // Computer failed/timed out
        if (isBattleRoyale) {
          // Battle Royale: Bot couldn't find word, player wins
          playerWinsRound(null, 'Bot ran out of time');
        } else {
          // Normal mode: Bot failed, player wins
          playerWinsRound(null, 'Bot ran out of time');
        }
      }
    } catch (error) {
      console.error('Computer turn error:', error);
      // On error, player wins
      playerWinsRound(null, 'Bot encountered an error');
    }
  };

  const validateWord = (word, startLetter, endLetter) => {
    const w = word.toLowerCase().trim();
    
    if (w.length < 3) return { valid: false, reason: 'Word must be at least 3 letters' };
    if (w.length > 15) return { valid: false, reason: 'Word too long (max 15 letters)' };
    if (!dictionary.includes(w)) return { valid: false, reason: 'Not a valid English word' };
    if (usedWords.has(w)) return { valid: false, reason: 'Word already used' };
    if (w[0] !== startLetter.toLowerCase()) return { valid: false, reason: `Must start with '${startLetter}'` };
    if (w[w.length - 1] !== endLetter.toLowerCase()) return { valid: false, reason: `Must end with '${endLetter}'` };
    
    return { valid: true };
  };

  const playerWinsRound = (word, reason) => {
    if (roundTimeoutRef.current) {
      clearTimeout(roundTimeoutRef.current);
    }

    setPhase('round-end');
    soundManager.play('win');

    const newScores = [...scores];
    newScores[0].score++;
    setScores(newScores);

    setRoundResult({
      winner: playerName,
      word: word,
      winningReason: reason || (config.gameType === 'battle-royale' ? `${playerName} outlasted opponent` : null),
      roundWords: config.gameType === 'battle-royale' ? roundWords : undefined,
      scores: newScores
    });

    checkGameOver(newScores);
  };

  const computerWinsRound = (word) => {
    if (roundTimeoutRef.current) {
      clearTimeout(roundTimeoutRef.current);
    }

    setPhase('round-end');
    soundManager.play('lose');

    const newScores = [...scores];
    newScores[1].score++;
    setScores(newScores);

    setRoundResult({
      winner: 'Bot',
      word: word,
      winningReason: config.gameType === 'battle-royale' ? 'Bot outlasted opponent' : null,
      roundWords: config.gameType === 'battle-royale' ? roundWords : undefined,
      scores: newScores
    });

    checkGameOver(newScores);
  };

  const checkGameOver = (currentScores) => {
    const winner = currentScores.find(s => s.score >= config.roundsToWin);
    if (winner) {
      setTimeout(() => {
        setPhase('game-over');
        setGameResult({
          winner: winner.name,
          scores: currentScores
        });
        
        if (winner.name === playerName) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          soundManager.play('gameWin');
        } else {
          soundManager.play('gameLose');
        }
      }, 3000);
    }
  };

  const handleNextRound = () => {
    startRound();
  };

  const handleExitGame = () => {
    if (roundTimeoutRef.current) {
      clearTimeout(roundTimeoutRef.current);
    }
    if (letterTimeoutRef.current) {
      clearTimeout(letterTimeoutRef.current);
    }
    onGameEnd();
  };

  if (!dictionary) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-white/20">
        <div className="text-center text-white">
          <p className="text-xl">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-white/20 relative">
      <button
        onClick={handleExitGame}
        className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full transition-all"
        title="Exit Game"
      >
        <X className="w-5 h-5" />
      </button>

      {notification && (
        <div className="mb-4 bg-blue-500/80 text-white px-4 py-2 rounded-lg text-center">
          {notification}
        </div>
      )}

      <ScoreBoard 
        currentScores={scores}
        roundsToWin={config.roundsToWin}
        players={scores}
      />

      {phase === 'waiting' && (
        <div className="text-center text-white py-8">
          <p className="text-xl">Get Ready...</p>
        </div>
      )}

      {phase === 'letter-input' && (
        <LetterInput
          role={role}
          onSubmit={handleLetterSubmit}
          letterTime={config.letterTime}
          soundManager={soundManager}
        />
      )}

      {phase === 'letters-revealed' && (
        <div className="text-center py-8 slide-in">
          <h2 className="text-3xl font-bold text-white mb-4">Letters Revealed!</h2>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-white/70 mb-2">Start</p>
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{letters.start}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-white/70 mb-2">End</p>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{letters.end}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'word-input' && (
        <div>
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-white/70 mb-2">Start</p>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{letters.start}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-white/70 mb-2">End</p>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{letters.end}</span>
              </div>
            </div>
          </div>

          {config.gameType === 'battle-royale' && (
            <div className="mb-6">
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <p className="text-white/70 text-sm mb-2 text-center">
                  Current Turn: <span className="font-bold text-yellow-400">{currentTurn}</span>
                </p>
                {roundWords.length > 0 && (
                  <div className="mt-3">
                    <p className="text-white/50 text-xs mb-2 text-center">Words this round:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {roundWords.map((item, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-1 rounded-lg">
                          <span className="text-xs text-white/70">{item.player}</span>
                          <div className="text-sm font-bold text-white">{item.word}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isPlayerTurn ? (
            <WordInput
              startLetter={letters.start}
              endLetter={letters.end}
              onSubmit={handleWordSubmit}
              onSkip={handleSkip}
              wordTime={config.wordTime}
              soundManager={soundManager}
              disabled={config.gameType === 'battle-royale' && currentTurn !== playerName}
            />
          ) : (
            <div className="text-center text-white py-8">
              <p className="text-xl">Bot is thinking...</p>
            </div>
          )}
        </div>
      )}

      {phase === 'round-end' && roundResult && (
        <RoundResult
          result={roundResult}
          playerName={playerName}
          onNextRound={handleNextRound}
          isCreator={true}
          gameType={config.gameType}
          soundManager={soundManager}
        />
      )}

      {phase === 'game-over' && gameResult && (
        <GameOver
          result={gameResult}
          onPlayAgain={() => {
            setScores([
              { name: playerName, score: 0 },
              { name: 'Bot', score: 0 }
            ]);
            setUsedWords(new Set());
            startRound();
          }}
          onExit={handleExitGame}
        />
      )}
    </div>
  );
}

export default OfflineGameRoom;
