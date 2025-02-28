
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { serialService, type SensorReading } from '../lib/serial-service';
import cors from 'cors';
import { SerialPort } from 'serialport';

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
  
  // Handle getPorts event
  socket.on('getPorts', async () => {
    try {
      const ports = await SerialPort.list();
      const portPaths = ports.map(port => port.path);
      socket.emit('availablePorts', portPaths);
    } catch (error) {
      console.error('Error listing serial ports:', error);
      socket.emit('error', 'Failed to list serial ports');
    }
  });
  
  // Handle port and baudRate selection
  socket.on('connectToPort', async (portPath: string, baudRate: number) => {
    try {
      await serialService.disconnect(); // Disconnect from current port if connected
      await serialService.connect(portPath, baudRate);
      socket.emit('connectionStatus', { connected: true, port: portPath, baudRate });
    } catch (error) {
      console.error('Error connecting to port:', error);
      socket.emit('error', `Failed to connect to port ${portPath}`);
      socket.emit('connectionStatus', { connected: false });
    }
  });
  
  const unsubscribe = serialService.subscribe((reading: SensorReading) => {
    socket.emit('sensorData', reading);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    unsubscribe();
  });
});

// Update the serial service to accept port and baudRate parameters
let connected = false;
const PORT = process.env.PORT || 3001;
const RECONNECT_INTERVAL = 30000; // 30 seconds between reconnection attempts

async function startServer() {
  try {
    // Don't connect immediately - wait for client to select port
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    setTimeout(() => {
      console.log('Retrying connection...');
      startServer();
    }, RECONNECT_INTERVAL);
  }
}

startServer();
