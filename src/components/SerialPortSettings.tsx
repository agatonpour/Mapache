
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SerialPortSettingsProps {
  onPortChange: (port: string) => void;
  onBaudRateChange: (baudRate: number) => void;
}

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];
const DEFAULT_PORT = "/dev/tty.usbmodem1101";

export function SerialPortSettings({ onPortChange, onBaudRateChange }: SerialPortSettingsProps) {
  const [availablePorts, setAvailablePorts] = useState<string[]>([DEFAULT_PORT]);
  const [selectedPort, setSelectedPort] = useState<string>(DEFAULT_PORT);
  const [selectedBaudRate, setSelectedBaudRate] = useState<number>(115200);

  useEffect(() => {
    // In a real implementation, this would fetch the available ports
    // For now, we're just using the default port
    setAvailablePorts([DEFAULT_PORT]);
    onPortChange(DEFAULT_PORT);
  }, [onPortChange]);

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
