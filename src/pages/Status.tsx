import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { StatusSensorGrid } from "@/components/StatusSensorGrid";
import { StatusSensorHistory } from "@/components/StatusSensorHistory";
import { RaccoonBotSelector, type RaccoonBotId } from "@/components/RaccoonBotSelector";
import { STATUS_SENSOR_CONFIG, type SensorData, type StatusSensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fetchStatusReadingsForDateRange } from "@/lib/status-firestore-service";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { fillMissingHourlyReadings } from "@/lib/interpolation-utils";
import {
  getTodayInAppTimezone,
  getHourInAppTimezone,
  getMinutesInAppTimezone,
  getDateStringInAppTimezone,
  parseAppDateString
} from "@/lib/timezone-utils";

export default function Status() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSensor, setSelectedSensor] = useState<StatusSensorType>("soc_percent");
  const [selectedBot, setSelectedBot] = useState<RaccoonBotId>("crystal-cove");
  const [timeframe, setTimeframe] = useState<Timeframe>("3m");
  const [loading, setLoading] = useState(false);
  const [dataLastUpdated, setDataLastUpdated] = useState<Date>(new Date());
  
  // Date range state - initialize from URL params or today (in app timezone)
  const todayStr = getTodayInAppTimezone();
  const [startDate, setStartDate] = useState<Date>(() => {
    const urlStart = searchParams.get('startDate');
    if (urlStart) {
      return parseAppDateString(urlStart);
    }
    return parseAppDateString(todayStr);
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const urlEnd = searchParams.get('endDate');
    if (urlEnd) {
      return parseAppDateString(urlEnd);
    }
    return parseAppDateString(todayStr);
  });
  
  // Store sensor data
  const [sensorData, setSensorData] = useState<Record<StatusSensorType, SensorData[]>>(
    Object.fromEntries(Object.keys(STATUS_SENSOR_CONFIG).map((type) => [type, []])) as Record<StatusSensorType, SensorData[]>
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
    setLoading(true);
    
    try {
      // Format dates as YYYY-MM-DD in app timezone
      const startDateStr = getDateStringInAppTimezone(startDate);
      const endDateStr = getDateStringInAppTimezone(endDate);
      
      console.log(`Fetching status data from ${startDateStr} to ${endDateStr} (America/Los_Angeles timezone)`);
      
      const data = await fetchStatusReadingsForDateRange(startDateStr, endDateStr);
      
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
      ) as Record<StatusSensorType, SensorData[]>;
      
      setSensorData(filteredData);
      setDataLastUpdated(new Date());
      
      // Show toast on success
      toast({
        title: "Status data loaded",
        description: `Loaded status readings from ${startDateStr} to ${endDateStr}`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error fetching status data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch status data",
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
      {/* Environmental Data Navigation Card */}
        <Card 
        className="fixed top-4 left-4 z-50 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-gray-200 hover:border-primary/30 bg-white/90 backdrop-blur-sm"
        onClick={() => {
          // Preserve date range when navigating back (using app timezone)
          const urlParams = new URLSearchParams();
          urlParams.set('startDate', getDateStringInAppTimezone(startDate));
          urlParams.set('endDate', getDateStringInAppTimezone(endDate));
          navigate(`/?${urlParams.toString()}`);
        }}
      >
        <div className="flex items-center gap-3">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Environmental Data</h3>
            <p className="text-xs text-gray-500">Back to main dashboard</p>
          </div>
        </div>
      </Card>
      
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

          <StatusSensorGrid 
            sensorData={sensorData} 
            selectedSensor={selectedSensor} 
            onSensorSelect={setSelectedSensor} 
          />

          <StatusSensorHistory 
            selectedSensor={selectedSensor} 
            timeframe={timeframe} 
            data={sensorData[selectedSensor] || []} 
            allSensorData={sensorData}
            dateRangeSpanDays={dateRangeSpanDays}
          />
        </motion.div>
      </div>
    </div>
  );
}