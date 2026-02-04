// pages/dashboard.js
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // Assuming NextAuth.js for auth
import CohortStream from '../components/CohortStream';
import CohortManager from '../components/CohortManager';
import CohortAnalytics from '../components/CohortAnalytics';
import StreamScheduler from '../components/StreamScheduler';
import ParticipantLeaderboard from '../components/ParticipantLeaderboard';
import FileShare from '../components/FileShare';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

const Dashboard = () => {
  const { data: session, status } = useSession();
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [userRole, setUserRole] = useState('member'); // 'admin', 'moderator', 'member'
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      // Redirect to login if not authenticated
      window.location.href = '/api/auth/signin';
      return;
    }

    // Fetch user's cohorts and role
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/user/cohorts', {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        setCohorts(response.data.cohorts);
        setUserRole(response.data.role);
        if (response.data.cohorts.length > 0) setSelectedCohort(response.data.cohorts[0]);
      } catch (err) {
        setError('Failed to load dashboard data');
      }
    };
    fetchData();

    // Real-time updates for cohort changes
    socket.on('cohort-update', (data) => {
      setCohorts((prev) => prev.map((c) => (c.id === data.id ? data : c)));
    });

    return () => socket.off('cohort-update');
  }, [session, status]);

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return <p>Redirecting to login...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-4xl font-bold mb-6 text-center">Cohort Dashboard</h1>
      {error && <p className="text-red-500 text-center">{error}</p>}
      <div className="mb-4">
        <select
          value={selectedCohort?.id || ''}
          onChange={(e) => setSelectedCohort(cohorts.find((c) => c.id === e.target.value))}
          className="p-2 border rounded w-full max-w-sm"
        >
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          ))}
        </select>
      </div>
      {selectedCohort && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2">
            <CohortStream
              cohortId={selectedCohort.id}
              userId={session.user.id}
              isModerator={userRole === 'moderator' || userRole === 'admin'}
            />
          </div>
          <div>
            <CohortManager cohortId={selectedCohort.id} />
            <FileShare cohortId={selectedCohort.id} userId={session.user.id} />
          </div>
          <div>
            <CohortAnalytics cohortId={selectedCohort.id} />
          </div>
          <div>
            <StreamScheduler
              cohortId={selectedCohort.id}
              isModerator={userRole === 'moderator' || userRole === 'admin'}
            />
          </div>
          <div>
            <ParticipantLeaderboard cohortId={selectedCohort.id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
