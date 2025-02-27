
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    const socket = io(BACKEND_URL);

    socket.on('connect', () => {
      // Request available ports when connected
      socket.emit('getPorts');
    });

    socket.on('availablePorts', (ports: string[]) => {
      setAvailablePorts(ports);
      if (ports.length > 0 && !selectedPort) {
        setSelectedPort(ports[0]);
        onPortChange(ports[0]);
      }
    });

    socket.on('error', (error: string) => {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [onPortChange, selectedPort, toast]);

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
          <SelectContent>
            {availablePorts.map((port) => (
              <SelectItem key={port} value={port}>
                {port}
              </SelectItem>
            ))}
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
          <SelectContent>
            {BAUD_RATES.map((rate) => (
              <SelectItem key={rate} value={rate.toString()}>
                {rate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
