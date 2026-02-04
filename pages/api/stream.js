// pages/api/stream.js
import { Server } from 'socket.io'; // Assuming Socket.io server is set up elsewhere
import db from '../../lib/db'; // Your database connection (e.g., MongoDB)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Fetch stream status
    try {
      const { cohortId } = req.query;
      const stream = await db.collection('streams').findOne({ cohortId });
      res.status(200).json({
        status: stream ? stream.status : 'offline',
        url: stream ? stream.url : null,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stream' });
    }
  } else if (req.method === 'POST') {
    // Start or stop stream
    try {
      const { cohortId, action, url } = req.body;
      if (action === 'start') {
        await db.collection('streams').updateOne(
          { cohortId },
          { $set: { status: 'live', url: url || 'https://youtube.com/embed/default' } },
          { upsert: true }
        );
        // Emit to Socket.io clients
        const io = res.socket.server.io;
        if (io) io.emit('stream-status-change', { cohortId, status: 'live', url });
        res.status(200).json({ message: 'Stream started' });
      } else if (action === 'stop') {
        await db.collection('streams').updateOne(
          { cohortId },
          { $set: { status: 'offline', url: null } }
        );
        const io = res.socket.server.io;
        if (io) io.emit('stream-status-change', { cohortId, status: 'offline' });
        res.status(200).json({ message: 'Stream stopped' });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to update stream' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
