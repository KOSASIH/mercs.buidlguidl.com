// components/NotificationCenter.js
import React, { useState, useEffect } from 'react';
import { Store } from 'react-notifications-component';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

const NotificationCenter = ({ userId, cohortId }) => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({ chatMentions: true, streamStarts: true, newParticipants: true });

  useEffect(() => {
    // Fetch past notifications
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}/notifications`);
        setNotifications(response.data);
      } catch (err) {
        console.error('Failed to fetch notifications');
      }
    };
    fetchNotifications();

    // Real-time notifications
    socket.on('notification', (notif) => {
      if (settings[notif.type]) {
        Store.addNotification({
          title: notif.title,
          message: notif.message,
          type: notif.type === 'error' ? 'danger' : 'success',
          insert: 'top',
          container: 'top-right',
          animationIn: ['animate__animated', 'animate__fadeIn'],
          animationOut: ['animate__animated', 'animate__fadeOut'],
          dismiss: { duration: 5000 },
        });
        setNotifications((prev) => [notif, ...prev]);
      }
    });

    return () => socket.off('notification');
  }, [userId, settings]);

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const clearNotifications = () => {
    setNotifications([]);
    axios.delete(`/api/users/${userId}/notifications`);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-gray-800 text-white rounded-lg shadow-lg">
      <h3 className="text-lg mb-4">Notification Center</h3>
      <div className="mb-4">
        <h4 className="mb-2">Settings</h4>
        {Object.keys(settings).map((key) => (
          <label key={key} className="flex items-center mb-1">
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={() => toggleSetting(key)}
              className="mr-2"
            />
            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </label>
        ))}
      </div>
      <button
        onClick={clearNotifications}
        className="mb-4 bg-red-600 px-4 py-2 rounded hover:bg-red-700"
      >
        Clear All
      </button>
      <ul className="max-h-64 overflow-y-auto">
        {notifications.map((notif, i) => (
          <li key={i} className="p-2 border-b border-gray-600">
            <strong>{notif.title}:</strong> {notif.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationCenter;
