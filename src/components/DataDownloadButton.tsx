
import React from "react";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";

interface DataDownloadButtonProps {
  selectedSensor: SensorType;
  timeframe: Timeframe;
  data: SensorData[];
}

export function DataDownloadButton({ selectedSensor, timeframe, data }: DataDownloadButtonProps) {
  const handleDownloadData = () => {
    if (!data || data.length === 0) {
      alert("No data available for the selected timeframe.");
      return;
    }
  
    // Include the unit in the Value column header
    const unit = SENSOR_CONFIG[selectedSensor].unit;
    let csvContent = `Date,Time,Value (${unit})\n`;
    data.forEach((point) => {
      const date = point.timestamp.toLocaleDateString();
      const time = point.timestamp.toLocaleTimeString();
      csvContent += `${date},${time},${point.value}\n`;
    });
  
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSensor}_data_${timeframe}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button 
      onClick={handleDownloadData} 
      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
    >
      Download Data
    </button>
  );
}
