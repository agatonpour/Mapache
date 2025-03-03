
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { SensorCard } from "@/components/SensorCard";
import { SensorGraph } from "@/components/SensorGraph";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { SerialPortSettings } from "@/components/SerialPortSettings";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import RaccoonbotLogo from '../../Raccoonbot-Logo.png';

const BACKEND_URL = 'http://localhost:3001';

export default function Index() {
  const { toast } = useToast();
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("temperature");
  const [timeframe, setTimeframe] = useState<Timeframe>("3m");
  const errorToastShown = useRef(false);
  const [sensorConnected, setSensorConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const connectAttemptsRef = useRef(0);

  // Store all sensor data since the app started
  const allSensorData = useRef<Record<SensorType, SensorData[]>>(
    Object.fromEntries(Object.keys(SENSOR_CONFIG).map((type) => [type, []])) as Record<SensorType, SensorData[]>
  );

  const [filteredSensorData, setFilteredSensorData] = useState<Record<SensorType, SensorData[]>>(
    Object.fromEntries(Object.keys(SENSOR_CONFIG).map((type) => [type, []])) as Record<SensorType, SensorData[]>
  );

  const handlePortChange = (port: string) => {
    // This would be handled by your backend
    console.log("Selected port:", port);
  };

  const handleBaudRateChange = (baudRate: number) => {
    // This would be handled by your backend
    console.log("Selected baud rate:", baudRate);
  };

  // Function to filter data based on timeframe
  const filterDataByTimeframe = (data: SensorData[], selectedTimeframe: Timeframe) => {
    const now = new Date();
    const timeframeDurations: Record<Timeframe, number> = {
      "3m": 3 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "1w": 7 * 24 * 60 * 60 * 1000,
      "1m": 30 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    const cutoffTime = now.getTime() - timeframeDurations[selectedTimeframe];
    return data.filter((point) => point.timestamp.getTime() > cutoffTime);
  };

  useEffect(() => {
    // Don't recreate socket connections repeatedly
    if (socketRef.current) {
      return;
    }
    
    const socket = io(BACKEND_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
      // Don't reconnect automatically
      reconnection: true,
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
      errorToastShown.current = false;
      
      // Prevent repeated connection toasts
      if (connectAttemptsRef.current > 0) {
        toast({
          title: "Connected to server",
          description: "Server connection established",
        });
      }
      connectAttemptsRef.current++;
      setSensorConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      // Don't show disconnection toasts for socket server
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      
      if (!errorToastShown.current) {
        errorToastShown.current = true;
        toast({
          title: "Error",
          description: "Failed to connect to server",
          variant: "destructive",
        });
        setSensorConnected(false);
      }
    });

    socket.on("sensorData", (reading) => {
      const now = new Date();
    
      // New data point
      const newData: Partial<Record<SensorType, SensorData>> = {
        aqi: { type: "aqi", value: reading.aqi, timestamp: now },
        tvoc: { type: "tvoc", value: reading.tvoc, timestamp: now },
        eco2: { type: "eco2", value: reading.eco2, timestamp: now },
        pressure: { type: "pressure", value: reading.pressure, timestamp: now },
        humidity: { type: "humidity", value: reading.humidity, timestamp: now },
        temperature: { type: "temperature", value: reading.temperature, timestamp: now },
      };
    
      // Store new data in allSensorData
      Object.entries(newData).forEach(([type, dataPoint]) => {
        const typedType = type as SensorType;
        if (!allSensorData.current[typedType]) {
          allSensorData.current[typedType] = [];
        }
        allSensorData.current[typedType].push(dataPoint);
      });
    
      // Update filtered data for all sensors based on current timeframe
      setFilteredSensorData((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.keys(SENSOR_CONFIG).map((type) => [
            type,
            filterDataByTimeframe(allSensorData.current[type as SensorType] || [], timeframe)
          ])
        ),
      }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [toast]);

  // Function to update graph data when timeframe changes
  const updateGraphData = () => {
    setFilteredSensorData((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.keys(SENSOR_CONFIG).map((type) => [
          type,
          filterDataByTimeframe(allSensorData.current[type as SensorType] || [], timeframe)
        ])
      ),
    }));
  };

  // Update the data immediately when timeframe changes
  useEffect(() => {
    updateGraphData();
  }, [timeframe]);

  const handleDownloadData = () => {
    const selectedData = filteredSensorData[selectedSensor];
  
    if (!selectedData || selectedData.length === 0) {
      alert("No data available for the selected timeframe.");
      return;
    }
  
    // Include the unit in the Value column header
    const unit = SENSOR_CONFIG[selectedSensor].unit;
    let csvContent = `Date,Time,Value (${unit})\n`;
    selectedData.forEach((point) => {
      const date = point.timestamp.toLocaleDateString();
      const time = point.timestamp.toLocaleTimeString();
      csvContent += `${date},${time},${point.value}\n`;
    });
  
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSensor}_data_${timeframe}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <img src={RaccoonbotLogo} alt="Raccoonbot Logo" className="mx-auto" style={{ width: '250px', height: 'auto' }}/>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Mapache: The Raccoonbot Interface App
            </h1>
            <p className="text-gray-500">
              Real-time Environmental Monitoring
            </p>
          </div>

          <SerialPortSettings
            onPortChange={handlePortChange}
            onBaudRateChange={handleBaudRateChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(SENSOR_CONFIG).map(([type]) => (
              <SensorCard
                key={type}
                type={type as SensorType}
                value={filteredSensorData[type as SensorType]?.at(-1)?.value || 0}
                timestamp={filteredSensorData[type as SensorType]?.at(-1)?.timestamp || new Date()}
                onClick={() => setSelectedSensor(type as SensorType)}
                isSelected={selectedSensor === type}
              />
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-lg font-medium text-gray-900">
                {SENSOR_CONFIG[selectedSensor].label} History
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={handleDownloadData} 
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Download Data
                </button>
              </div>
              <TimeframeSelector value={timeframe} onChange={setTimeframe} />
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-sm">
              <SensorGraph data={filteredSensorData[selectedSensor]} type={selectedSensor} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
