
import React from "react";
import type { DateGroup } from "@/lib/graph-utils";

interface DateMarkersProps {
  dateGroups: DateGroup[];
}

export function DateMarkers({ dateGroups }: DateMarkersProps) {
  return (
    <div className="relative w-full h-6 -mt-8 px-10">
      {dateGroups.map((group, idx) => (
        <div 
          key={`date-${idx}`} 
          className="absolute -mt-2 text-xs font-medium text-gray-600"
          style={{ 
            left: `${group.position * 100}%`,
            transform: 'translateX(-50%)', // Center the date label
          }}
        >
          {group.date}
        </div>
      ))}
    </div>
  );
}
