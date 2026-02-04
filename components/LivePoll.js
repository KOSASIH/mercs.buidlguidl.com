// components/LivePoll.js
import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

const LivePoll = ({ cohortId, isModerator }) => {
  const [activePoll, setActivePoll] = useState(null);
  const [votes, setVotes] = useState({});
  const [userVote, setUserVote] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch active poll
    const fetchPoll = async () => {
      try {
        const response = await axios.get(`/api/cohorts/${cohortId}/polls/active`);
        setActivePoll(response.data);
      } catch (err) {
        setError('Failed to load poll');
      }
    };
    fetchPoll();

    // Real-time updates
    socket.on('poll-update', (data) => {
      setActivePoll(data.poll);
      setVotes(data.votes);
    });

    socket.on('poll-ended', () => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    });

    return () => {
      socket.off('poll-update');
      socket.off('poll-ended');
    };
  }, [cohortId]);

  const createPoll = async (question, options) => {
    if (!isModerator) return;
    try {
      const response = await axios.post(`/api/cohorts/${cohortId}/polls`, { question, options });
      socket.emit('start-poll', response.data);
    } catch (err) {
      setError('Poll creation failed');
    }
  };

  const vote = (option) => {
    if (userVote) return;
    setUserVote(option);
    socket.emit('vote', { cohortId, option });
  };

  const endPoll = () => {
    if (!isModerator) return;
    socket.emit('end-poll', { cohortId });
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 bg-gray-900 text-white rounded-lg shadow-lg relative">
      {showConfetti && <Confetti />}
      <h2 className="text-xl mb-4">Live Poll</h2>
      {error && <p className="text-red-500">{error}</p>}
      {activePoll ? (
        <div>
          <h3 className="text-lg mb-2">{activePoll.question}</h3>
          {activePoll.options.map((option, i) => (
            <button
              key={i}
              onClick={() => vote(option)}
              disabled={!!userVote}
              className={`w-full p-2 mb-2 rounded ${
                userVote === option ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {option} ({votes[option] || 0} votes)
            </button>
          ))}
          {isModerator && (
            <button
              onClick={endPoll}
              className="mt-4 bg-red-600 px-4 py-2 rounded hover:bg-red-700"
            >
              End Poll
            </button>
          )}
        </div>
      ) : (
        isModerator && (
          <div>
            <input
              type="text"
              placeholder="Poll Question"
              className="w-full p-2 mb-2 border rounded bg-gray-800 text-white"
              id="question"
            />
            <input
              type="text"
              placeholder="Options (comma-separated)"
              className="w-full p-2 mb-2 border rounded bg-gray-800 text-white"
              id="options"
            />
            <button
              onClick={() => {
                const question = document.getElementById('question').value;
                const options = document.getElementById('options').value.split(',');
                createPoll(question, options);
              }}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Start Poll
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default LivePoll;
