
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { SensorGrid } from "@/components/SensorGrid";
import { SensorHistory } from "@/components/SensorHistory";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fetchReadingsForDateRange, filterReadingsByTimeframe } from "@/lib/firestore-service";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Index() {
  const { toast } = useToast();
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("temperature");
  const [timeframe, setTimeframe] = useState<Timeframe>("3m");
  const [loading, setLoading] = useState(false);
  const [dataLastUpdated, setDataLastUpdated] = useState<Date>(new Date());
  
  // Date range state
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(today);
  
  // Store all sensor data (unfiltered)
  const [allSensorData, setAllSensorData] = useState<Record<SensorType, SensorData[]>>(
    Object.fromEntries(Object.keys(SENSOR_CONFIG).map((type) => [type, []])) as Record<SensorType, SensorData[]>
  );
  
  // Filtered data based on timeframe
  const [filteredSensorData, setFilteredSensorData] = useState<Record<SensorType, SensorData[]>>(
    Object.fromEntries(Object.keys(SENSOR_CONFIG).map((type) => [type, []])) as Record<SensorType, SensorData[]>
  );

  // Function to handle date range changes
  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Function to fetch data for selected date range
  const fetchData = async () => {
    console.log("Fetching data for date range", startDate, endDate);
    setLoading(true);
    
    try {
      // Format dates as YYYY-MM-DD
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`Fetching data from ${startDateStr} to ${endDateStr}`);
      const data = await fetchReadingsForDateRange(startDateStr, endDateStr);
      
      setAllSensorData(data);
      
      // Apply timeframe filtering
      const filtered = filterReadingsByTimeframe(data, timeframe);
      setFilteredSensorData(filtered);
      
      setDataLastUpdated(new Date());
      
      // Show toast on success
      toast({
        title: "Data loaded",
        description: `Loaded sensor readings from ${startDateStr} to ${endDateStr}`,
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

  // Update filtered data when timeframe changes
  useEffect(() => {
    const filtered = filterReadingsByTimeframe(allSensorData, timeframe);
    setFilteredSensorData(filtered);
  }, [timeframe, allSensorData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
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

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <DateRangePicker 
              startDate={startDate}
              endDate={endDate}
              onRangeChange={handleDateRangeChange}
            />
            
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Last updated: {dataLastUpdated.toLocaleTimeString()}
                </p>
              </div>
              <Button 
                onClick={fetchData} 
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </span>
                )}
              </Button>
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
