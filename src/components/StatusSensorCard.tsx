import React from "react";
import { Card } from "@/components/ui/card";
import { STATUS_SENSOR_CONFIG, type StatusSensorType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface StatusSensorCardProps {
  type: StatusSensorType;
  value: number;
  timestamp: Date;
  onClick: () => void;
  isSelected: boolean;
}

export function StatusSensorCard({ type, value, timestamp, onClick, isSelected }: StatusSensorCardProps) {
  const config = STATUS_SENSOR_CONFIG[type];
  
  // Special formatting for alive_hhmm
  const displayValue = type === 'alive_hhmm' 
    ? config.formatValue(value)
    : config.formatValue(value);

  return (
    <Card 
      className={cn(
        "p-6 cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
        isSelected 
          ? "border-primary shadow-md bg-primary/5" 
          : "border-gray-200 hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{config.label}</h3>
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: config.color }}
        />
      </div>
      
      <div className="space-y-2">
        <div className="text-2xl font-bold text-gray-900">
          {displayValue}
          {config.unit && <span className="text-lg text-gray-500 ml-1">{config.unit}</span>}
        </div>
        
        <p className="text-xs text-gray-500">
          Last updated: {timestamp.toLocaleTimeString()}
        </p>
      </div>
    </Card>
  );
}