
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface SerialPortSettingsProps {
  onPortChange: (port: string) => void;
  onBaudRateChange: (baudRate: number) => void;
}

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];
const BACKEND_URL = 'http://localhost:3001';

export function SerialPortSettings({ onPortChange, onBaudRateChange }: SerialPortSettingsProps) {
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [selectedBaudRate, setSelectedBaudRate] = useState<number>(115200);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{connected: boolean, port?: string, baudRate?: number}>({
    connected: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const lastErrorTime = useRef(0);
  const lastConnectionTime = useRef(0);
  const socketRef = useRef<Socket | null>(null);
  const isInitialMount = useRef(true);
  const manualConnectionAttempt = useRef(false);

  useEffect(() => {
    // Only create a socket connection if we don't already have one
    if (!socketRef.current) {
      console.log("Creating new socket connection");
      const newSocket = io(BACKEND_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5000,
        // Prevent automatic reconnection attempts
        reconnection: true
      });
      
      socketRef.current = newSocket;
      setSocket(newSocket);

      // Setup socket event listeners only once
      setupSocketListeners(newSocket);
      
      return () => {
        console.log("Cleaning up socket connection");
        if (socketRef.current) {
          if (connectionStatus.connected) {
            socketRef.current.emit('disconnectPort');
          }
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, []);

  const setupSocketListeners = (newSocket: Socket) => {
    newSocket.on('connect', () => {
      console.log('Connected to server');
      // Request available ports when connected
      newSocket.emit('getPorts');
      
      // Only show toast on manual reconnection, not on initial connection
      if (!isInitialMount.current) {
        toast({
          title: "Connected to server",
          description: "Server connection established",
        });
      }
      isInitialMount.current = false;
    });

    newSocket.on('availablePorts', (ports: string[]) => {
      console.log('Available ports:', ports);
      setAvailablePorts(ports);
      if (ports.length > 0 && !selectedPort) {
        setSelectedPort(ports[0]);
        onPortChange(ports[0]);
      }
    });

    newSocket.on('connectionStatus', (status: {connected: boolean, port?: string, baudRate?: number}) => {
      // Prevent rapid toggling of connection status
      const now = Date.now();
      if (now - lastConnectionTime.current < 1000) {
        return;
      }
      
      setConnectionStatus(status);
      setIsConnecting(false);
      lastConnectionTime.current = now;
      
      // Only show connection toast on manual connection
      if (status.connected && manualConnectionAttempt.current) {
        toast({
          title: "Connected",
          description: `Connected to ${status.port} at ${status.baudRate} baud`,
        });
        manualConnectionAttempt.current = false;
      } 
      // Only show disconnection toast on unexpected disconnection when previously connected
      else if (!status.connected && connectionStatus.connected) {
        toast({
          title: "Disconnected",
          description: "Serial connection closed",
          variant: "destructive",
        });
      }
    });

    newSocket.on('error', (error: string) => {
      // Debounce errors to prevent toast flood
      const now = Date.now();
      if (now - lastErrorTime.current < 2000) {
        return;
      }
      
      setIsConnecting(false);
      lastErrorTime.current = now;
      
      // Only show error toast for manual connection attempts
      if (manualConnectionAttempt.current) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        manualConnectionAttempt.current = false;
      }
    });

    // Request port list immediately and every 5 seconds
    const intervalId = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('getPorts');
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  };

  const handleConnect = () => {
    if (socketRef.current && selectedPort && selectedBaudRate) {
      manualConnectionAttempt.current = true;
      setIsConnecting(true);
      socketRef.current.emit('connectToPort', selectedPort, selectedBaudRate);
    }
  };

  const handleDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.emit('disconnectPort');
    }
  };

  const handlePortChange = (port: string) => {
    setSelectedPort(port);
    onPortChange(port);
  };

  const handleBaudRateChange = (baudRate: string) => {
    const rate = parseInt(baudRate, 10);
    setSelectedBaudRate(rate);
    onBaudRateChange(rate);
  };

  return (
    <div className="flex gap-4 items-center bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Port</label>
        <Select value={selectedPort} onValueChange={handlePortChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select port" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {availablePorts.length > 0 ? (
              availablePorts.map((port) => (
                <SelectItem key={port} value={port}>
                  {port}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-ports" disabled>
                No ports available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Baud Rate</label>
        <Select
          value={selectedBaudRate.toString()}
          onValueChange={handleBaudRateChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select baud rate" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {BAUD_RATES.map((rate) => (
              <SelectItem key={rate} value={rate.toString()}>
                {rate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        {connectionStatus.connected ? (
          <Button 
            variant="destructive" 
            onClick={handleDisconnect}
            disabled={isConnecting}
          >
            Disconnect
          </Button>
        ) : (
          <Button 
            variant="default" 
            onClick={handleConnect}
            disabled={isConnecting || !selectedPort}
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        )}
        <div className="text-sm flex items-center">
          Status: {connectionStatus.connected ? (
            <span className="text-green-600 ml-1">● Connected</span>
          ) : (
            <span className="text-red-600 ml-1">● Disconnected</span>
          )}
        </div>
      </div>
    </div>
  );
}
