
import React from "react";
import { Download } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";

interface DataDownloadButtonProps {
  selectedSensor: SensorType;
  timeframe: Timeframe;
  data: SensorData[];
  allSensorData?: Record<SensorType, SensorData[]>;
  downloadAll?: boolean;
  children?: React.ReactNode; // Added children prop
}

export function DataDownloadButton({ 
  selectedSensor, 
  timeframe, 
  data, 
  allSensorData,
  downloadAll = false,
  children
}: DataDownloadButtonProps) {
  const handleDownloadData = () => {
    if (downloadAll && allSensorData) {
      // Download all sensor data in one ZIP file
      downloadAllSensorData(allSensorData, timeframe);
    } else {
      // Download single sensor data
      downloadSingleSensorData(selectedSensor, data, timeframe);
    }
  };

  const downloadSingleSensorData = (sensorType: SensorType, sensorData: SensorData[], currentTimeframe: Timeframe) => {
    if (!sensorData || sensorData.length === 0) {
      alert("No data available for the selected timeframe.");
      return;
    }
  
    // Include the unit in the Value column header
    const unit = SENSOR_CONFIG[sensorType].unit;
    let csvContent = `Date,Time,Value (${unit})\n`;
    sensorData.forEach((point) => {
      const date = point.timestamp.toLocaleDateString();
      const time = point.timestamp.toLocaleTimeString();
      csvContent += `${date},${time},${point.value}\n`;
    });
  
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sensorType}_data_${currentTimeframe}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllSensorData = (allData: Record<SensorType, SensorData[]>, currentTimeframe: Timeframe) => {
    // Check if we have data for any sensor
    const hasData = Object.values(allData).some(sensorData => sensorData && sensorData.length > 0);
    if (!hasData) {
      alert("No data available for the selected timeframe.");
      return;
    }

    // Create a single CSV file with all sensor data
    let csvContent = "Date,Time";
    
    // Add column headers for each sensor type with units
    Object.keys(SENSOR_CONFIG).forEach(type => {
      const sensorType = type as SensorType;
      const unit = SENSOR_CONFIG[sensorType].unit;
      csvContent += `,${SENSOR_CONFIG[sensorType].label} (${unit})`;
    });
    csvContent += "\n";
    
    // Create a map of timestamps to data points for easier processing
    const timestampMap = new Map<string, Record<string, any>>();
    
    // Process all sensor data to organize by timestamp
    Object.keys(allData).forEach(type => {
      const sensorType = type as SensorType;
      const sensorData = allData[sensorType];
      
      sensorData.forEach(point => {
        const timestamp = point.timestamp.toISOString();
        if (!timestampMap.has(timestamp)) {
          timestampMap.set(timestamp, {
            date: point.timestamp.toLocaleDateString(),
            time: point.timestamp.toLocaleTimeString(),
          });
        }
        timestampMap.get(timestamp)![sensorType] = point.value;
      });
    });
    
    // Sort timestamps chronologically
    const sortedTimestamps = Array.from(timestampMap.keys()).sort();
    
    // Create CSV rows
    sortedTimestamps.forEach(timestamp => {
      const rowData = timestampMap.get(timestamp)!;
      let row = `${rowData.date},${rowData.time}`;
      
      // Add data for each sensor type, or empty if not available
      Object.keys(SENSOR_CONFIG).forEach(type => {
        const sensorType = type as SensorType;
        row += `,${rowData[sensorType] !== undefined ? rowData[sensorType] : ''}`;
      });
      
      csvContent += row + "\n";
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `all_sensor_data_${currentTimeframe}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button 
      onClick={handleDownloadData} 
      variant={downloadAll ? "outline" : "default"}
      className={downloadAll ? "gap-2 ml-2" : ""}
    >
      {downloadAll && <Download size={16} />}
      {children || (downloadAll ? "Download All" : "Download selected datatype")}
    </Button>
  );
}
