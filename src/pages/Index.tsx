
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { SerialPortSettings } from "@/components/SerialPortSettings";
import { Header } from "@/components/Header";
import { SensorGrid } from "@/components/SensorGrid";
import { SensorHistory } from "@/components/SensorHistory";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fetchReadingsForTimeRange } from "@/lib/firestore-service";

export default function Index() {
  const { toast } = useToast();
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("temperature");
  const [timeframe, setTimeframe] = useState<Timeframe>("3m");
  const [loading, setLoading] = useState(false);
  const currentTimeframeRef = useRef<Timeframe>("3m");
  const [dataLastUpdated, setDataLastUpdated] = useState<Date>(new Date());

  // Store all sensor data since the app started
  const [filteredSensorData, setFilteredSensorData] = useState<Record<SensorType, SensorData[]>>(
    Object.fromEntries(Object.keys(SENSOR_CONFIG).map((type) => [type, []])) as Record<SensorType, SensorData[]>
  );

  // Function to calculate the time range based on the selected timeframe
  const calculateTimeRange = (selectedTimeframe: Timeframe) => {
    const now = new Date();
    const timeframeDurations: Record<Timeframe, number> = {
      "3m": 3 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "1w": 7 * 24 * 60 * 60 * 1000,
      "1m": 30 * 24 * 60 * 60 * 1000,
      "1y": 365 * 24 * 60 * 60 * 1000,
    };
    
    const cutoffTime = new Date(now.getTime() - timeframeDurations[selectedTimeframe]);
    return { startTime: cutoffTime, endTime: now };
  };

  // Update currentTimeframeRef whenever timeframe changes
  useEffect(() => {
    currentTimeframeRef.current = timeframe;
    updateGraphData(timeframe);
  }, [timeframe]);

  // Function to update graph data when timeframe changes
  const updateGraphData = async (selectedTimeframe: Timeframe = timeframe) => {
    console.log(`Updating graph data with timeframe: ${selectedTimeframe}`);
    setLoading(true);
    
    try {
      const { startTime, endTime } = calculateTimeRange(selectedTimeframe);
      const data = await fetchReadingsForTimeRange(startTime, endTime);
      
      setFilteredSensorData(data);
      setDataLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch sensor data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Create an automatic refresh every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateGraphData(currentTimeframeRef.current);
    }, 60000); // Refresh every 60 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Initial data fetch
  useEffect(() => {
    updateGraphData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <Header />

          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                Last updated: {dataLastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex space-x-2 items-center">
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              ) : (
                <button 
                  onClick={() => updateGraphData()} 
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Refresh data
                </button>
              )}
            </div>
          </div>

          <SensorGrid 
            sensorData={filteredSensorData} 
            selectedSensor={selectedSensor} 
            onSensorSelect={setSelectedSensor} 
          />

          <SensorHistory 
            selectedSensor={selectedSensor} 
            timeframe={timeframe} 
            data={filteredSensorData[selectedSensor] || []} 
            allSensorData={filteredSensorData}
            onTimeframeChange={setTimeframe} 
          />
        </motion.div>
      </div>
    </div>
  );
}
