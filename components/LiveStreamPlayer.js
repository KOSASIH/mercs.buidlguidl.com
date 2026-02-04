// components/LiveStreamPlayer.js
import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import axios from 'axios';

const LiveStreamPlayer = ({ streamUrl, cohortId }) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [quality, setQuality] = useState('auto');
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);

  // Fetch live viewer count (example with YouTube API)
  useEffect(() => {
    const fetchViewerCount = async () => {
      try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
          params: {
            id: extractVideoId(streamUrl), // Helper function below
            key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
            part: 'liveStreamingDetails',
          },
        });
        const liveDetails = response.data.items[0]?.liveStreamingDetails;
        setViewerCount(liveDetails?.concurrentViewers || 0);
      } catch (err) {
        setError('Failed to fetch viewer data');
      }
    };
    if (streamUrl) fetchViewerCount();
    const interval = setInterval(fetchViewerCount, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [streamUrl]);

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const handlePlayPause = () => setPlaying(!playing);
  const handleVolumeChange = (e) => setVolume(parseFloat(e.target.value));
  const handleQualityChange = (e) => setQuality(e.target.value);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-white text-xl mb-4">Live Cohort Stream</h2>
      {error && <p className="text-red-500">{error}</p>}
      <ReactPlayer
        ref={playerRef}
        url={streamUrl}
        playing={playing}
        volume={volume}
        controls={false} // Custom controls below
        width="100%"
        height="auto"
        config={{
          youtube: { playerVars: { autoplay: 0, controls: 0 } },
        }}
        onError={() => setError('Stream failed to load')}
      />
      <div className="flex items-center justify-between mt-4 text-white">
        <button
          onClick={handlePlayPause}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <div className="flex items-center">
          <label className="mr-2">Volume:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20"
          />
        </div>
        <select
          value={quality}
          onChange={handleQualityChange}
          className="bg-gray-700 text-white px-2 py-1 rounded"
        >
          <option value="auto">Auto</option>
          <option value="1080p">1080p</option>
          <option value="720p">720p</option>
          <option value="480p">480p</option>
        </select>
        <p>Viewers: {viewerCount}</p>
      </div>
    </div>
  );
};

export default LiveStreamPlayer;
