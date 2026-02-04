// components/LiveChat.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Picker } from 'emoji-mart'; // Install: npm install emoji-mart

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL); // Your Socket.io server URL

const LiveChat = ({ cohortId, userId, isModerator }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [bannedUsers, setBannedUsers] = useState(new Set());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit('join-cohort', { cohortId, userId });

    socket.on('message', (msg) => {
      if (!bannedUsers.has(msg.userId)) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('user-banned', (bannedUserId) => {
      setBannedUsers((prev) => new Set([...prev, bannedUserId]));
    });

    return () => {
      socket.off('message');
      socket.off('user-banned');
    };
  }, [cohortId, userId, bannedUsers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('send-message', { cohortId, userId, text: input });
      setInput('');
    }
  };

  const handleEmojiSelect = (emoji) => {
    setInput((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const banUser = (userId) => {
    if (isModerator) {
      socket.emit('ban-user', { cohortId, userId });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-gray-800 rounded-lg shadow-lg text-white">
      <h3 className="text-lg mb-4">Live Chat</h3>
      <div className="h-64 overflow-y-auto mb-4 border border-gray-600 p-2 rounded">
        {messages.map((msg, i) => (
          <div key={i} className="mb-2">
            <strong>{msg.username}:</strong> {msg.text}
            {isModerator && (
              <button
                onClick={() => banUser(msg.userId)}
                className="ml-2 text-red-500 text-sm"
              >
                Ban
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 p-2 rounded-l bg-gray-700"
        />
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 bg-gray-600"
        >
          😀
        </button>
        <button
          onClick={sendMessage}
          className="p-2 bg-blue-600 rounded-r hover:bg-blue-700"
        >
          Send
        </button>
      </div>
      {showEmojiPicker && (
        <Picker onSelect={handleEmojiSelect} style={{ position: 'absolute', bottom: '60px' }} />
      )}
    </div>
  );
};

export default LiveChat;
