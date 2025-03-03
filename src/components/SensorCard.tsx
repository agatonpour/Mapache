
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SENSOR_CONFIG, type SensorType } from "@/lib/mock-data";

interface SensorCardProps {
  type: SensorType;
  value: number;
  timestamp: Date;
  onClick: () => void;
  isSelected: boolean;
}

export function SensorCard({ type, value, timestamp, onClick, isSelected }: SensorCardProps) {
  const config = SENSOR_CONFIG[type];
  
  // Format value correctly based on sensor type
  const displayValue = type === 'humidity' ? value / 10 : 
                       type === 'pressure' ? value / 100 : 
                       value;

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border bg-white/80 backdrop-blur-sm p-4 shadow-sm cursor-pointer transition-colors ${
        isSelected ? "border-blue-500 shadow-blue-100" : "border-gray-200/50"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{config.label}</h3>
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: config.color }}
          />
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold tracking-tight text-gray-900">
            {config.formatValue(displayValue)} {config.unit}
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Last updated: {timestamp.toLocaleTimeString()}
        </p>
      </div>
    </motion.div>
  );
}
