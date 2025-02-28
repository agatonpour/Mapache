
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

// Track active connections to prevent reconnection loops
let isConnectingToPort = false;
let activeConnections = new Map();

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
    // Prevent multiple connection attempts at once
    if (isConnectingToPort) {
      socket.emit('error', 'Already attempting to connect to a port');
      return;
    }
    
    try {
      isConnectingToPort = true;
      
      // Ensure we're disconnected first
      await serialService.disconnect();
      
      // Wait a moment to ensure port is released
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await serialService.connect(portPath, baudRate);
      
      // Store this connection in our active connections
      activeConnections.set(socket.id, { portPath, baudRate });
      
      isConnectingToPort = false;
      socket.emit('connectionStatus', { connected: true, port: portPath, baudRate });
    } catch (error) {
      console.error('Error connecting to port:', error);
      isConnectingToPort = false;
      // Fix: properly handle the unknown error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      socket.emit('error', `Failed to connect to port ${portPath}: ${errorMessage}`);
      socket.emit('connectionStatus', { connected: false });
    }
  });
  
  // Handle explicit disconnect request
  socket.on('disconnectPort', async () => {
    try {
      await serialService.disconnect();
      // Remove from active connections
      activeConnections.delete(socket.id);
      socket.emit('connectionStatus', { connected: false });
    } catch (error) {
      console.error('Error disconnecting from port:', error);
      socket.emit('error', 'Failed to disconnect from port');
    }
  });
  
  // Subscribe to sensor data
  const unsubscribe = serialService.subscribe((reading: SensorReading) => {
    socket.emit('sensorData', reading);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    unsubscribe();
    
    // Remove from active connections
    activeConnections.delete(socket.id);
    
    // If this was the last connected client, disconnect from the port
    if (activeConnections.size === 0) {
      // We may want to disconnect from the serial port here
      // serialService.disconnect();
    }
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();
