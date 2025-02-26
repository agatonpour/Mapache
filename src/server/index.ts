
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { serialService, type SensorReading } from '../lib/serial-service';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');
  
  const unsubscribe = serialService.subscribe((reading: SensorReading) => {
    socket.emit('sensorData', reading);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    unsubscribe();
  });
});

const PORT = process.env.PORT || 1101;

async function startServer() {
  try {
    // Try to connect without specifying a port - it will auto-detect
    await serialService.connect();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    setTimeout(() => {
      console.log('Retrying connection...');
      startServer();
    }, 5000);
  }
}

startServer();
