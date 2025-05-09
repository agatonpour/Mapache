
import React from "react";
import { SensorGraph } from "./SensorGraph";
import { DataDownloadButton } from "./DataDownloadButton";
import { SENSOR_CONFIG, type SensorData, type SensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";

interface SensorHistoryProps {
  selectedSensor: SensorType;
  timeframe: Timeframe;
  data: SensorData[];
  allSensorData: Record<SensorType, SensorData[]>;
  onTimeframeChange: (value: Timeframe) => void;
  dateRangeSpanDays?: number;
}

export function SensorHistory({ 
  selectedSensor, 
  timeframe, 
  data, 
  allSensorData,
  dateRangeSpanDays = 1
}: SensorHistoryProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-lg font-medium text-gray-900">
          {SENSOR_CONFIG[selectedSensor].label} History
        </div>
        <div className="flex justify-end gap-2">
          <DataDownloadButton 
            selectedSensor={selectedSensor} 
            timeframe={timeframe} 
            data={data} 
          />
          <DataDownloadButton 
            selectedSensor={selectedSensor} 
            timeframe={timeframe} 
            data={data}
            allSensorData={allSensorData}
            downloadAll={true}
          />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-sm">
        <SensorGraph data={data} type={selectedSensor} dateRangeSpanDays={dateRangeSpanDays} />
      </div>
    </div>
  );
}
