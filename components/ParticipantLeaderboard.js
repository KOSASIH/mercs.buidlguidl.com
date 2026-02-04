// components/ParticipantLeaderboard.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

const ParticipantLeaderboard = ({ cohortId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch leaderboard
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`/api/cohorts/${cohortId}/leaderboard`);
        setLeaderboard(response.data);
      } catch (err) {
        setError('Failed to load leaderboard');
      }
    };
    fetchLeaderboard();

    // Real-time updates
    socket.on('leaderboard-update', (data) => {
      setLeaderboard(data);
    });

    return () => socket.off('leaderboard-update');
  }, [cohortId]);

  const getBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl mb-4">Participant Leaderboard</h2>
      {error && <p className="text-red-500">{error}</p>}
      <ul>
        {leaderboard.map((participant, i) => (
          <li key={participant.id} className="flex justify-between items-center p-2 border-b">
            <span>
              {getBadge(i + 1)} {i + 1}. {participant.name}
            </span>
            <span className="font-bold">{participant.score} points</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-gray-600">
        Points from chat, polls, and engagement.
      </p>
    </div>
  );
};

export default ParticipantLeaderboard;
