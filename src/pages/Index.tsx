import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { SensorGrid } from "@/components/SensorGrid";
import { SensorHistory } from "@/components/SensorHistory";
import { RaccoonBotStatus } from "@/components/RaccoonBotStatus";
import { CrystalCoveLogo } from "@/components/CrystalCoveLogo";
import { RaccoonBotSelector, type RaccoonBotId, type RaccoonBot, RACCOON_BOTS } from "@/components/RaccoonBotSelector";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fetchReadingsForDateRange, fetchLatestStatusData, type StatusData } from "@/lib/firestore-service";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { fillMissingHourlyReadings } from "@/lib/interpolation-utils";
import {
  getTodayInAppTimezone,
  getHourInAppTimezone,
  getMinutesInAppTimezone,
  getDateStringInAppTimezone,
  parseAppDateString,
  toAppTimezoneDate
} from "@/lib/timezone-utils";

export default function Index() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSensor, setSelectedSensor] = useState<SensorType>("temperature");
  const [selectedBot, setSelectedBot] = useState<RaccoonBotId>("crystal-cove");
  const [customRobots, setCustomRobots] = useState<RaccoonBot[]>(() => {
    const saved = localStorage.getItem('custom-raccoon-bots');
    return saved ? JSON.parse(saved) : [];
  });
  const [timeframe, setTimeframe] = useState<Timeframe>("3m");
  const [loading, setLoading] = useState(false);
  const [dataLastUpdated, setDataLastUpdated] = useState<Date>(new Date());
  const [statusData, setStatusData] = useState<StatusData>({
    soc_percent: 92,
    solar_watts: 0,
    awake_hhmm: "0:00",
    timestamp: new Date()
  });
  
  // Date range state - initialize from URL params or today (in app timezone)
  const todayStr = getTodayInAppTimezone();
  const [startDate, setStartDate] = useState<Date>(() => {
    const urlStart = searchParams.get('startDate');
    if (urlStart) {
      // Parse date string as a date in app timezone
      return parseAppDateString(urlStart);
    }
    return parseAppDateString(todayStr);
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const urlEnd = searchParams.get('endDate');
    if (urlEnd) {
      // Parse date string as a date in app timezone
      return parseAppDateString(urlEnd);
    }
    return parseAppDateString(todayStr);
  });
  
  // Store sensor data
  const [sensorData, setSensorData] = useState<Record<SensorType, SensorData[]>>(
    Object.fromEntries(Object.keys(SENSOR_CONFIG).map((type) => [type, []])) as Record<SensorType, SensorData[]>
  );

  // Function to handle date range changes
  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // Update URL params using app timezone date formatting
    const newSearchParams = new URLSearchParams(searchParams);
    const startDateStr = getDateStringInAppTimezone(newStartDate);
    const endDateStr = getDateStringInAppTimezone(newEndDate);
    newSearchParams.set('startDate', startDateStr);
    newSearchParams.set('endDate', endDateStr);
    setSearchParams(newSearchParams);
  };

  // Function to fetch data for selected date range
  const fetchData = async () => {
    // Only fetch data for Crystal Cove
    if (selectedBot !== "crystal-cove") {
      return;
    }
    
    setLoading(true);
    
    try {
      // Format dates as YYYY-MM-DD in app timezone
      const startDateStr = getDateStringInAppTimezone(startDate);
      const endDateStr = getDateStringInAppTimezone(endDate);
      
      console.log(`Fetching data from ${startDateStr} to ${endDateStr} (America/Los_Angeles timezone)`);
      
      // Fetch both sensor data and always get latest status data
      const [data, latestStatus] = await Promise.all([
        fetchReadingsForDateRange(startDateStr, endDateStr),
        fetchLatestStatusData()
      ]);
      
      // Filter data to make sure it falls within selected date range and time window
      const filteredData = Object.fromEntries(
        Object.entries(data).map(([sensorType, readings]) => {
          const filteredReadings = readings.filter(reading => {
            const readingDate = new Date(reading.timestamp);
            const readingDateStr = getDateStringInAppTimezone(readingDate);
            const hour = getHourInAppTimezone(readingDate);
            const minutes = getMinutesInAppTimezone(readingDate);
            
            // Check if reading is within the date range
            const isWithinDateRange = readingDateStr >= startDateStr && readingDateStr <= endDateStr;
            
            // Only include readings between 10:00 and 17:05 (in app timezone)
            const isWithinTimeRange = hour >= 10 && (hour < 17 || (hour === 17 && minutes <= 5));
            
            return isWithinDateRange && isWithinTimeRange;
          });
          
          // Apply interpolation to fill in missing hourly readings
          const interpolatedReadings = fillMissingHourlyReadings(filteredReadings);
          
          return [sensorType, interpolatedReadings];
        })
      ) as Record<SensorType, SensorData[]>;
      
      setSensorData(filteredData);
      setStatusData(latestStatus);
      setDataLastUpdated(new Date());
      
      console.log("Latest status data:", latestStatus);
      
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
  }, [selectedBot]);

  // Handle adding new custom robot
  const handleAddRobot = (newRobot: RaccoonBot) => {
    const updatedRobots = [...customRobots, newRobot];
    setCustomRobots(updatedRobots);
    localStorage.setItem('custom-raccoon-bots', JSON.stringify(updatedRobots));
  };

  // Calculate date range span in days
  const dateRangeSpanDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Get all available robots (default + custom)
  const allAvailableRobots = [...RACCOON_BOTS, ...customRobots];

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

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <RaccoonBotSelector 
                selectedBotId={selectedBot}
                onBotSelect={setSelectedBot}
                customRobots={customRobots}
                onAddRobot={handleAddRobot}
              />
              <DateRangePicker 
                startDate={startDate}
                endDate={endDate}
                onRangeChange={handleDateRangeChange}
              />
            </div>
            
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
                    Load
                  </span>
                )}
              </Button>
            </div>
          </div>

          {selectedBot === "crystal-cove" ? (
            <>
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
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {selectedBot === "add-robot" 
                  ? "Add a new RaccoonBot to start monitoring" 
                  : `No data available for ${allAvailableRobots.find(bot => bot.id === selectedBot)?.displayName || selectedBot}`
                }
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
//Manual Changes