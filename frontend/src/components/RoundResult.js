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
          <p className="text-blue-200 text-lg mb-6">
            <span className="font-bold text-white">{result.winner}</span> won with the word:
          </p>
          <div className="bg-white/10 rounded-2xl px-8 py-6 inline-block">
            <div className="text-5xl font-bold text-white uppercase tracking-wider">
              {result.word}
            </div>
          </div>
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
