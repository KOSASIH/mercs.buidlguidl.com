// components/StreamScheduler.js
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

const StreamScheduler = ({ cohortId, isModerator }) => {
  const [scheduledStreams, setScheduledStreams] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newStream, setNewStream] = useState({ title: '', date: '', time: '', description: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch scheduled streams
    const fetchStreams = async () => {
      try {
        const response = await axios.get(`/api/cohorts/${cohortId}/streams`);
        setScheduledStreams(response.data);
      } catch (err) {
        setError('Failed to load streams');
      }
    };
    fetchStreams();

    // Real-time updates
    socket.on('stream-scheduled', (stream) => {
      setScheduledStreams((prev) => [...prev, stream]);
    });

    return () => socket.off('stream-scheduled');
  }, [cohortId]);

  const scheduleStream = async () => {
    if (!isModerator) return;
    try {
      const response = await axios.post(`/api/cohorts/${cohortId}/streams`, newStream);
      socket.emit('schedule-stream', response.data);
      setNewStream({ title: '', date: '', time: '', description: '' });
    } catch (err) {
      setError('Scheduling failed');
    }
  };

  const sendReminder = (streamId) => {
    socket.emit('send-reminder', { cohortId, streamId });
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const streamsOnDate = scheduledStreams.filter(
        (s) => new Date(s.date).toDateString() === date.toDateString()
      );
      return streamsOnDate.length > 0 ? <p className="text-xs text-blue-600">{streamsOnDate.length} streams</p> : null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl mb-4">Stream Scheduler</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={tileContent}
            className="w-full"
          />
        </div>
        <div>
          <h3 className="text-lg mb-2">Scheduled Streams</h3>
          <ul className="max-h-64 overflow-y-auto">
            {scheduledStreams
              .filter((s) => new Date(s.date).toDateString() === selectedDate.toDateString())
              .map((stream) => (
                <li key={stream.id} className="p-2 border-b">
                  <strong>{stream.title}</strong> at {stream.time} - {stream.description}
                  {isModerator && (
                    <button
                      onClick={() => sendReminder(stream.id)}
                      className="ml-2 bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
                    >
                      Send Reminder
                    </button>
                  )}
                </li>
              ))}
          </ul>
          {isModerator && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Title"
                value={newStream.title}
                onChange={(e) => setNewStream({ ...newStream, title: e.target.value })}
                className="w-full p-2 mb-2 border rounded"
              />
              <input
                type="date"
                value={newStream.date}
                onChange={(e) => setNewStream({ ...newStream, date: e.target.value })}
                className="w-full p-2 mb-2 border rounded"
              />
              <input
                type="time"
                value={newStream.time}
                onChange={(e) => setNewStream({ ...newStream, time: e.target.value })}
                className="w-full p-2 mb-2 border rounded"
              />
              <textarea
                placeholder="Description"
                value={newStream.description}
                onChange={(e) => setNewStream({ ...newStream, description: e.target.value })}
                className="w-full p-2 mb-2 border rounded"
              />
              <button
                onClick={scheduleStream}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Schedule
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamScheduler;
