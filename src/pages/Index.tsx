
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { SensorCard } from "@/components/SensorCard";
import { SensorGraph } from "@/components/SensorGraph";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const UPDATE_INTERVAL = 5000;
const BACKEND_URL = 'http://localhost:3001';

export default function Index() {
  const { toast } = useToast();
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("temperature");
  const [timeframe, setTimeframe] = useState<Timeframe>("3m");
  const errorToastShown = useRef(false);
  const [sensorData, setSensorData] = useState<Record<SensorType, SensorData[]>>(
    Object.fromEntries(
      Object.keys(SENSOR_CONFIG).map((type) => [type, []])
    ) as Record<SensorType, SensorData[]>
  );

  useEffect(() => {
    const socket = io(BACKEND_URL);

    socket.on('connect', () => {
      errorToastShown.current = false;
      toast({
        title: "Connected to sensor",
        description: "Receiving real-time data from the Arduino",
      });
    });

    socket.on('connect_error', (error) => {
      if (!errorToastShown.current) {
        errorToastShown.current = true;
        toast({
          title: "Error",
          description: "Failed to collect sensor data",
          variant: "destructive",
        });
      }
    });

    socket.on('sensorData', (reading) => {
      setSensorData((prev) => {
        const now = new Date();
        const timeframeDurations = {
          "3m": 3 * 60 * 1000,
          "1h": 60 * 60 * 1000,
          "24h": 24 * 60 * 60 * 1000,
          "1w": 7 * 24 * 60 * 60 * 1000,
          "1m": 30 * 24 * 60 * 60 * 1000,
          "1y": 365 * 24 * 60 * 60 * 1000,
        };
        
        const cutoffTime = now.getTime() - timeframeDurations[timeframe];

        // Create new data points from the reading
        const newData = {
          aqi: { type: 'aqi' as SensorType, value: reading.aqi, timestamp: now },
          tvoc: { type: 'tvoc' as SensorType, value: reading.tvoc, timestamp: now },
          eco2: { type: 'eco2' as SensorType, value: reading.eco2, timestamp: now },
          pressure: { type: 'pressure' as SensorType, value: reading.pressure, timestamp: now },
          humidity: { type: 'humidity' as SensorType, value: reading.humidity, timestamp: now },
          temperature: { type: 'temperature' as SensorType, value: reading.temperature, timestamp: now },
        };

        // Update each sensor's data array
        return Object.fromEntries(
          Object.entries(prev).map(([type, data]) => {
            const filteredData = data.filter(
              (point) => point.timestamp.getTime() > cutoffTime
            );
            return [
              type,
              [...filteredData, newData[type as keyof typeof newData]],
            ];
          })
        ) as Record<SensorType, SensorData[]>;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [timeframe, toast]);

  const latestData = Object.fromEntries(
    Object.entries(sensorData).map(([type, data]) => [
      type,
      data[data.length - 1] || {
        timestamp: new Date(),
        value: 0,
        type: type as SensorType,
      },
    ])
  ) as Record<SensorType, SensorData>;

  // Filter data for the selected timeframe
  const filteredData = Object.fromEntries(
    Object.entries(sensorData).map(([type, data]) => {
      const now = new Date();
      const timeframeDurations = {
        "3m": 3 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "1w": 7 * 24 * 60 * 60 * 1000,
        "1m": 30 * 24 * 60 * 60 * 1000,
        "1y": 365 * 24 * 60 * 60 * 1000,
      };
      
      const cutoffTime = now.getTime() - timeframeDurations[timeframe];
      return [
        type,
        data.filter((point) => point.timestamp.getTime() > cutoffTime),
      ];
    })
  ) as Record<SensorType, SensorData[]>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Raccoonbot Interface
            </h1>
            <p className="text-gray-500">
              Real-time environmental sensor monitoring
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(SENSOR_CONFIG).map(([type]) => (
              <SensorCard
                key={type}
                type={type as SensorType}
                value={latestData[type as SensorType].value}
                timestamp={latestData[type as SensorType].timestamp}
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
              <TimeframeSelector value={timeframe} onChange={setTimeframe} />
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-sm">
              <SensorGraph
                data={filteredData[selectedSensor]}
                type={selectedSensor}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
