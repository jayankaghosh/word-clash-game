import React from 'react';
import { Trophy } from 'lucide-react';

function ScoreBoard({ players, roundsToWin, currentScores }) {
  const scores = currentScores && currentScores.length > 0 
    ? currentScores 
    : players.map(p => ({ name: p.name, score: p.score }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-bold">First to {roundsToWin}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {scores.map((player, index) => (
          <div
            key={index}
            className="bg-white/5 rounded-xl p-4 border border-white/10 text-center"
          >
            <div className="text-white font-medium mb-2">{player.name}</div>
            <div className="text-4xl font-bold text-yellow-400">{player.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScoreBoard;
