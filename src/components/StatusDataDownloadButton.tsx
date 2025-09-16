import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";
import { STATUS_SENSOR_CONFIG, type SensorData, type StatusSensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";

interface StatusDataDownloadButtonProps {
  selectedSensor: StatusSensorType;
  timeframe: Timeframe;
  data: SensorData[];
  allSensorData?: Record<StatusSensorType, SensorData[]>;
  downloadAll?: boolean;
  children?: React.ReactNode;
}

export function StatusDataDownloadButton({
  selectedSensor,
  timeframe,
  data,
  allSensorData,
  downloadAll = false,
  children
}: StatusDataDownloadButtonProps) {
  const handleDownload = () => {
    if (downloadAll && allSensorData) {
      // Download all sensor data as CSV
      const headers = ["timestamp", ...Object.keys(allSensorData)];
      const csvContent = "data:text/csv;charset=utf-8,";
      
      // Create a map of all timestamps
      const allTimestamps = new Set<number>();
      Object.values(allSensorData).forEach(sensorDataArray => {
        sensorDataArray.forEach(reading => {
          allTimestamps.add(reading.timestamp.getTime());
        });
      });
      
      const sortedTimestamps = Array.from(allTimestamps).sort();
      
      const csvRows = [
        headers.join(","),
        ...sortedTimestamps.map(timestamp => {
          const timestampStr = new Date(timestamp).toISOString();
          const row = [timestampStr];
          
          Object.keys(allSensorData).forEach(sensorType => {
            const reading = allSensorData[sensorType as StatusSensorType]?.find(
              r => r.timestamp.getTime() === timestamp
            );
            row.push(reading ? reading.value.toString() : "");
          });
          
          return row.join(",");
        })
      ];
      
      const csv = csvContent + csvRows.join("\n");
      const encodedUri = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `status_data_${timeframe}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Download single sensor data
      const config = STATUS_SENSOR_CONFIG[selectedSensor];
      const csvContent = "data:text/csv;charset=utf-8,";
      const headers = ["timestamp", config.label.toLowerCase().replace(/\s+/g, '_')];
      
      const csvRows = [
        headers.join(","),
        ...data.map(reading => 
          `${reading.timestamp.toISOString()},${reading.value}`
        )
      ];
      
      const csv = csvContent + csvRows.join("\n");
      const encodedUri = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${config.label.toLowerCase().replace(/\s+/g, '_')}_${timeframe}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleDownload}
      className="gap-2"
    >
      {downloadAll ? <FileDown className="h-4 w-4" /> : <Download className="h-4 w-4" />}
      {children || (downloadAll ? "Download all data" : "Download data")}
    </Button>
  );
}