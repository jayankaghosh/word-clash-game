import React from 'react';
import { Trophy, Medal, Home } from 'lucide-react';

function GameOver({ result, playerName, onPlayAgain }) {
  const isWinner = result.winner === playerName;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center border border-white/20">
      <div className={`w-24 h-24 mx-auto mb-6 ${isWinner ? 'bg-yellow-500/30' : 'bg-blue-500/30'} rounded-full flex items-center justify-center animate-bounce-slow`}>
        {isWinner ? (
          <Trophy className="w-12 h-12 text-yellow-400" />
        ) : (
          <Medal className="w-12 h-12 text-blue-400" />
        )}
      </div>

      <h1 className={`text-5xl font-bold mb-4 ${isWinner ? 'text-yellow-400' : 'text-blue-400'}`}>
        {isWinner ? 'Victory!' : 'Good Game!'}
      </h1>

      <p className="text-2xl text-white mb-8">
        <span className="font-bold">{result.winner}</span> wins the game!
      </p>

      <div className="bg-white/5 rounded-2xl p-6 mb-8 max-w-md mx-auto border border-white/10">
        <h3 className="text-white font-bold mb-4 flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Final Scores
        </h3>
        <div className="space-y-3">
          {result.scores.map((player, index) => (
            <div
              key={index}
              className={`flex justify-between items-center p-4 rounded-lg ${
                player.name === result.winner
                  ? 'bg-yellow-500/20 border border-yellow-500/30'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <span className={`font-medium ${player.name === result.winner ? 'text-yellow-400' : 'text-white'}`}>
                {player.name}
                {player.name === playerName && ' (You)'}
              </span>
              <span className={`text-2xl font-bold ${player.name === result.winner ? 'text-yellow-400' : 'text-white'}`}>
                {player.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onPlayAgain}
        className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
      >
        <Home className="w-5 h-5" />
        Back to Home
      </button>
    </div>
  );
}

export default GameOver;
