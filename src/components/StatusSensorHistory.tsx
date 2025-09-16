import React from "react";
import { StatusSensorGraph } from "./StatusSensorGraph";
import { StatusDataDownloadButton } from "./StatusDataDownloadButton";
import { STATUS_SENSOR_CONFIG, type SensorData, type StatusSensorType } from "@/lib/mock-data";
import { type Timeframe } from "@/lib/utils";

interface StatusSensorHistoryProps {
  selectedSensor: StatusSensorType;
  timeframe: Timeframe;
  data: SensorData[];
  allSensorData?: Record<StatusSensorType, SensorData[]>;
  dateRangeSpanDays?: number;
}

export function StatusSensorHistory({ 
  selectedSensor, 
  timeframe, 
  data, 
  allSensorData,
  dateRangeSpanDays = 1
}: StatusSensorHistoryProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-lg font-medium text-gray-900">
          {STATUS_SENSOR_CONFIG[selectedSensor].label} History
        </div>
        {allSensorData && (
          <div className="flex justify-end gap-2">
            <StatusDataDownloadButton 
              selectedSensor={selectedSensor} 
              timeframe={timeframe} 
              data={data} 
            >
              Download selected datatype
            </StatusDataDownloadButton>
            <StatusDataDownloadButton 
              selectedSensor={selectedSensor} 
              timeframe={timeframe} 
              data={data}
              allSensorData={allSensorData}
              downloadAll={true}
            />
          </div>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-sm">
        <StatusSensorGraph data={data} type={selectedSensor} dateRangeSpanDays={dateRangeSpanDays} />
      </div>
    </div>
  );
}