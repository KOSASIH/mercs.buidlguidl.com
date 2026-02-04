// components/CohortStream.js
import React, { useState, useEffect } from 'react';
import LiveStreamPlayer from './LiveStreamPlayer';
import LiveChat from './LiveChat';
import LivePoll from './LivePoll';
import NotificationCenter from './NotificationCenter';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

const CohortStream = ({ cohortId, userId, isModerator }) => {
  const [streamStatus, setStreamStatus] = useState('offline'); // 'live', 'offline', 'scheduled'
  const [streamUrl, setStreamUrl] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch initial stream status
    const fetchStream = async () => {
      try {
        const response = await axios.get(`/api/stream?cohortId=${cohortId}`);
        setStreamStatus(response.data.status);
        setStreamUrl(response.data.url || '');
      } catch (err) {
        setError('Failed to load stream');
      }
    };
    fetchStream();

    // Real-time updates
    socket.on('stream-status-change', (data) => {
      setStreamStatus(data.status);
      setStreamUrl(data.url || '');
    });

    return () => socket.off('stream-status-change');
  }, [cohortId]);

  const startStream = async () => {
    if (!isModerator) return;
    try {
      await axios.post('/api/stream', { cohortId, action: 'start' });
      socket.emit('update-stream-status', { cohortId, status: 'live' });
    } catch (err) {
      setError('Failed to start stream');
    }
  };

  const stopStream = async () => {
    if (!isModerator) return;
    try {
      await axios.post('/api/stream', { cohortId, action: 'stop' });
      socket.emit('update-stream-status', { cohortId, status: 'offline' });
    } catch (err) {
      setError('Failed to stop stream');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 bg-gray-100 rounded-lg shadow-lg">
      <h1 className="text-3xl mb-4">Cohort Stream: {cohortId}</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {streamStatus === 'live' && streamUrl ? (
            <LiveStreamPlayer streamUrl={streamUrl} cohortId={cohortId} />
          ) : (
            <div className="p-8 bg-gray-800 text-white rounded text-center">
              <p>Stream is {streamStatus}</p>
              {isModerator && streamStatus === 'offline' && (
                <button
                  onClick={startStream}
                  className="mt-4 bg-green-600 px-4 py-2 rounded hover:bg-green-700"
                >
                  Start Stream
                </button>
              )}
              {isModerator && streamStatus === 'live' && (
                <button
                  onClick={stopStream}
                  className="mt-4 bg-red-600 px-4 py-2 rounded hover:bg-red-700"
                >
                  Stop Stream
                </button>
              )}
            </div>
          )}
          <LivePoll cohortId={cohortId} isModerator={isModerator} />
        </div>
        <div>
          <LiveChat cohortId={cohortId} userId={userId} isModerator={isModerator} />
          <NotificationCenter userId={userId} cohortId={cohortId} />
        </div>
      </div>
    </div>
  );
};

export default CohortStream;
