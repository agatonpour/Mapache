
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SerialPort } from 'serialport';
import { serialService } from '../lib/serial-service.js';

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors());

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// State tracking
let activePort: string | null = null;
let activeBaudRate: number | null = null;
let isConnectingToPort = false;
// Track last connection/disconnection time to prevent rapid toggling
let lastPortOperationTime = 0;
const PORT_OPERATION_DEBOUNCE = 1000; // 1 second debounce
const activeClients = new Set<string>();

// Listen for socket connections
io.on('connection', (socket) => {
  console.log('Client connected');
  activeClients.add(socket.id);

  // Forward sensor data to all connected clients
  const handleSensorData = (data: any) => {
    socket.emit('sensorData', data);
  };

  // Forward errors to the client
  const handleError = (errorMessage: string) => {
    socket.emit('error', errorMessage);
  };

  // Handle disconnection from the serial port
  const handleDisconnection = () => {
    socket.emit('connectionStatus', { connected: false });
    activePort = null;
    activeBaudRate = null;
  };

  // Register event listeners
  serialService.on('sensorData', handleSensorData);
  serialService.on('error', handleError);
  serialService.on('disconnected', handleDisconnection);

  // Send current connection status on connect
  socket.emit('connectionStatus', {
    connected: serialService.isPortConnected(),
    port: activePort,
    baudRate: activeBaudRate
  });

  // Get available serial ports
  socket.on('getPorts', async () => {
    try {
      const ports = await SerialPort.list();
      const portPaths = ports.map(port => port.path);
      socket.emit('availablePorts', portPaths);
    } catch (error) {
      console.error('Error listing ports:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      socket.emit('error', `Failed to list available ports: ${errorMessage}`);
    }
  });

  // Connect to a serial port with debounce
  socket.on('connectToPort', async (portPath, baudRate) => {
    const now = Date.now();
    if (now - lastPortOperationTime < PORT_OPERATION_DEBOUNCE) {
      console.log('Debouncing port connection request');
      return;
    }
    
    if (isConnectingToPort) {
      socket.emit('error', 'Already attempting to connect to a port');
      return;
    }

    if (serialService.isPortConnected() && activePort === portPath) {
      console.log(`Already connected to port ${portPath}`);
      socket.emit('connectionStatus', {
        connected: true,
        port: portPath,
        baudRate: activeBaudRate
      });
      return;
    }

    try {
      isConnectingToPort = true;
      lastPortOperationTime = now;
      console.log(`Attempting to connect to port: ${portPath} at ${baudRate} baud`);
      
      // If already connected to a different port, disconnect first
      if (serialService.isPortConnected()) {
        await serialService.disconnect();
      }
      
      await serialService.connect(portPath, baudRate);
      
      activePort = portPath;
      activeBaudRate = baudRate;
      isConnectingToPort = false;
      
      socket.emit('connectionStatus', {
        connected: true,
        port: portPath,
        baudRate: baudRate
      });
    } catch (error) {
      console.error('Error connecting to port:', error);
      isConnectingToPort = false;
      
      // Fix: Properly handle the unknown error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      socket.emit('error', `Failed to connect to port ${portPath}: ${errorMessage}`);
      socket.emit('connectionStatus', { connected: false });
    }
  });

  // Disconnect from serial port with debounce
  socket.on('disconnectPort', async () => {
    const now = Date.now();
    if (now - lastPortOperationTime < PORT_OPERATION_DEBOUNCE) {
      console.log('Debouncing port disconnection request');
      return;
    }
    
    lastPortOperationTime = now;
    
    try {
      await serialService.disconnect();
      socket.emit('connectionStatus', { connected: false });
      activePort = null;
      activeBaudRate = null;
    } catch (error) {
      console.error('Error disconnecting from port:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      socket.emit('error', `Failed to disconnect: ${errorMessage}`);
    }
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    activeClients.delete(socket.id);
    
    // Remove event listeners
    serialService.removeListener('sensorData', handleSensorData);
    serialService.removeListener('error', handleError);
    serialService.removeListener('disconnected', handleDisconnection);
    
    // If no clients are connected, disconnect from the serial port
    if (activeClients.size === 0 && serialService.isPortConnected()) {
      console.log('No active clients, disconnecting from serial port');
      serialService.disconnect().catch(err => {
        console.error('Error disconnecting from port after client disconnect:', err);
      });
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
