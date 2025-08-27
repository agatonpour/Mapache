import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { SensorGrid } from "@/components/SensorGrid";
import { SensorHistory } from "@/components/SensorHistory";
import { RaccoonBotStatus } from "@/components/RaccoonBotStatus";
import { CrystalCoveLogo } from "@/components/CrystalCoveLogo";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fetchReadingsForDateRange, fetchLatestStatusData, type StatusData } from "@/lib/firestore-service";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function Index() {
  const { toast } = useToast();
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("temperature");
  const [timeframe, setTimeframe] = useState<Timeframe>("3m");
  const [loading, setLoading] = useState(false);
  const [dataLastUpdated, setDataLastUpdated] = useState<Date>(new Date());
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  
  // Date range state - initialize both to today
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(today);
  
  // Store sensor data
  const [sensorData, setSensorData] = useState<Record<SensorType, SensorData[]>>(
    Object.fromEntries(Object.keys(SENSOR_CONFIG).map((type) => [type, []])) as Record<SensorType, SensorData[]>
  );

  // Function to handle date range changes
  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Function to fetch data for selected date range
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Format dates as YYYY-MM-DD
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`Fetching data from ${startDateStr} to ${endDateStr}`);
      
      // Fetch both sensor data and status data
      const [data, latestStatus] = await Promise.all([
        fetchReadingsForDateRange(startDateStr, endDateStr),
        fetchLatestStatusData()
      ]);
      
      // Filter data to make sure it falls within selected date range
      const filteredData = Object.fromEntries(
        Object.entries(data).map(([sensorType, readings]) => {
          // Add one day to endDate to include the entire end day
          const endDateLimit = new Date(endDate);
          endDateLimit.setDate(endDateLimit.getDate() + 1);
          
          const filteredReadings = readings.filter(reading => {
            const readingDate = new Date(reading.timestamp);
            const hour = readingDate.getHours();
            
            // Only include readings between 11:00 and 17:00 (11:00-16:59)
            const isWithinTimeRange = hour >= 11 && hour < 17;
            
            return readingDate >= startDate && readingDate < endDateLimit && isWithinTimeRange;
          });
          
          return [sensorType, filteredReadings];
        })
      ) as Record<SensorType, SensorData[]>;
      
      setSensorData(filteredData);
      setStatusData(latestStatus);
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

  // Initial data fetch - using today's date only
  useEffect(() => {
    fetchData();
  }, []);

  // Calculate date range span in days
  const dateRangeSpanDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative">
      <RaccoonBotStatus statusData={statusData} />
      <CrystalCoveLogo />
      
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
            dateRangeSpanDays={dateRangeSpanDays}
          />
        </motion.div>
      </div>
    </div>
  );
}
//Manual Changes