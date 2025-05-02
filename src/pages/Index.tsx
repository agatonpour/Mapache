
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { SensorGrid } from "@/components/SensorGrid";
import { SensorHistory } from "@/components/SensorHistory";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fetchReadingsForDate } from "@/lib/firestore-service";

export default function Index() {
  const { toast } = useToast();
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("temperature");
  const [timeframe, setTimeframe] = useState<Timeframe>("3m");
  const [loading, setLoading] = useState(false);
  const [dataLastUpdated, setDataLastUpdated] = useState<Date>(new Date());

  // Store all sensor data
  const [sensorData, setSensorData] = useState<Record<SensorType, SensorData[]>>(
    Object.fromEntries(Object.keys(SENSOR_CONFIG).map((type) => [type, []])) as Record<SensorType, SensorData[]>
  );

  // Function to fetch data for today
  const fetchTodaysData = async () => {
    console.log("Fetching today's data");
    setLoading(true);
    
    try {
      // Format today's date as YYYY-MM-DD
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // For testing, we'll use the specific date from the requirements
      const testDateStr = "2025-05-02";
      
      console.log(`Fetching data for ${testDateStr}`);
      const data = await fetchReadingsForDate(testDateStr);
      
      setSensorData(data);
      setDataLastUpdated(new Date());
      
      // Show toast on success
      toast({
        title: "Data loaded",
        description: `Loaded sensor readings for ${testDateStr}`,
        duration: 3000,
      });
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

  // Initial data fetch
  useEffect(() => {
    fetchTodaysData();
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
                  onClick={fetchTodaysData} 
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Refresh data
                </button>
              )}
            </div>
          </div>

          <SensorGrid 
            sensorData={sensorData} 
            selectedSensor={selectedSensor} 
            onSensorSelect={setSelectedSensor} 
          />

          <SensorHistory 
            selectedSensor={selectedSensor} 
            timeframe={timeframe} 
            data={sensorData[selectedSensor] || []} 
            allSensorData={sensorData}
            onTimeframeChange={setTimeframe} 
          />
        </motion.div>
      </div>
    </div>
  );
}
