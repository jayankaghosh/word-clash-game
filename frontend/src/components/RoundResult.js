import React from 'react';
import { Trophy, Award } from 'lucide-react';

function RoundResult({ result, playerName, gameData, socket, soundManager }) {
  const isDraw = !result.winner;
  const isWinner = result.winner === playerName;
  const isCreator = socket?.id === gameData?.creator;

  const handleStartNextRound = () => {
    socket.emit('start-next-round');
    soundManager.play('click');
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center border border-white/20">
      {isDraw ? (
        <>
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-500/30 rounded-full flex items-center justify-center">
            <Award className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-4xl font-bold text-gray-300 mb-4">No Winner</h2>
          <p className="text-blue-200 text-lg mb-6">Time's up! No one submitted a valid word.</p>
        </>
      ) : (
        <>
          <div className={`w-20 h-20 mx-auto mb-6 ${isWinner ? 'bg-yellow-500/30' : 'bg-red-500/30'} rounded-full flex items-center justify-center`}>
            <Trophy className={`w-10 h-10 ${isWinner ? 'text-yellow-400' : 'text-red-400'}`} />
          </div>
          <h2 className={`text-4xl font-bold mb-4 ${isWinner ? 'text-yellow-400' : 'text-red-400'}`}>
            {isWinner ? 'You Won!' : 'You Lost'}
          </h2>
          {gameData.gameType === 'battle-royale' ? (
            <div className="text-center mb-6">
              <p className="text-xl text-white/80 mb-4">{result.winningReason}</p>
              {result.roundWords && result.roundWords.length > 0 && (
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-white/70 mb-3">Words submitted this round:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {result.roundWords.map((item, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 rounded-lg shadow-md">
                        <span className="text-xs text-white/70">{item.player}</span>
                        <div className="text-lg font-bold text-white">{item.word}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-blue-200 text-lg mb-6">
                <span className="font-bold text-white">{result.winner}</span> won the round!
              </p>
              <div className="text-center mb-6">
                <p className="text-2xl text-white mb-2">Winning Word:</p>
                <div className="bg-white/10 rounded-2xl px-8 py-6 inline-block">
                  <div className="text-5xl font-bold text-yellow-300 uppercase tracking-wider">
                    {result.word}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
      
      {isCreator ? (
        <button
          onClick={handleStartNextRound}
          className="mt-8 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105"
        >
          🎮 Start Next Round
        </button>
      ) : (
        <p className="text-white/50 text-sm mt-8">Waiting for host to start next round...</p>
      )}
    </div>
  );
}

export default RoundResult;
