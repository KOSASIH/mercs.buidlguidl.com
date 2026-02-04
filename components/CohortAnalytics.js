// components/CohortAnalytics.js
import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import io from 'socket.io-client';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

const CohortAnalytics = ({ cohortId }) => {
  const [viewerData, setViewerData] = useState([]);
  const [chatActivity, setChatActivity] = useState([]);
  const [engagementScore, setEngagementScore] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial fetch
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`/api/cohorts/${cohortId}/analytics`);
        setViewerData(response.data.viewers);
        setChatActivity(response.data.chats);
        setEngagementScore(response.data.engagement);
      } catch (err) {
        setError('Failed to load analytics');
      }
    };
    fetchAnalytics();

    // Real-time updates
    socket.on('analytics-update', (data) => {
      setViewerData(data.viewers);
      setChatActivity(data.chats);
      setEngagementScore(data.engagement);
    });

    return () => socket.off('analytics-update');
  }, [cohortId]);

  const viewerChartData = {
    labels: viewerData.map((_, i) => `T${i + 1}`),
    datasets: [{
      label: 'Viewers',
      data: viewerData,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    }],
  };

  const chatChartData = {
    labels: chatActivity.map((_, i) => `Msg ${i + 1}`),
    datasets: [{
      label: 'Chat Messages',
      data: chatActivity,
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
    }],
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl mb-4">Cohort Analytics Dashboard</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg mb-2">Viewer Count Over Time</h3>
          <Line data={viewerChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
        <div>
          <h3 className="text-lg mb-2">Chat Activity</h3>
          <Bar data={chatChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
      </div>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="text-lg">Overall Engagement Score: {engagementScore}/100</h3>
        <progress value={engagementScore} max="100" className="w-full h-4"></progress>
      </div>
    </div>
  );
};

export default CohortAnalytics;
