
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { SerialPortSettings } from "@/components/SerialPortSettings";
import { Header } from "@/components/Header";
import { SensorGrid } from "@/components/SensorGrid";
import { SensorHistory } from "@/components/SensorHistory";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BACKEND_URL = 'http://localhost:3001';
const TOAST_DURATION = 3000; // 3 seconds

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
          duration: TOAST_DURATION,
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
          duration: TOAST_DURATION,
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <Header />

          <div className="flex justify-center">
            <SerialPortSettings />
          </div>

          <SensorGrid 
            sensorData={filteredSensorData} 
            selectedSensor={selectedSensor} 
            onSensorSelect={setSelectedSensor} 
          />

          <SensorHistory 
            selectedSensor={selectedSensor} 
            timeframe={timeframe} 
            data={filteredSensorData[selectedSensor]} 
            onTimeframeChange={setTimeframe} 
          />
        </motion.div>
      </div>
    </div>
  );
}
