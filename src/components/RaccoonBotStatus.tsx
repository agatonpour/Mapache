import { Battery, BatteryLow, BatteryWarning } from "lucide-react";
import { StatusData } from "@/lib/firestore-service";

interface RaccoonBotStatusProps {
  statusData: StatusData | null;
}

export function RaccoonBotStatus({ statusData }: RaccoonBotStatusProps) {
  if (!statusData) {
    return (
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex items-center text-gray-400">
          <Battery className="h-5 w-5 mr-2" />
          <span className="text-sm">No status data</span>
        </div>
      </div>
    );
  }

  // Determine battery icon and color based on percentage
  let BatteryIcon = Battery;
  let batteryColor = "text-green-600";
  
  if (statusData.battery_percent <= 20) {
    BatteryIcon = BatteryLow;
    batteryColor = "text-red-600";
  } else if (statusData.battery_percent <= 59) {
    BatteryIcon = BatteryWarning;
    batteryColor = "text-yellow-600";
  }

  return (
    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-gray-200 space-y-2">
      {/* Battery Status */}
      <div className="flex items-center">
        <BatteryIcon className={`h-5 w-5 mr-2 ${batteryColor}`} />
        <span className={`font-medium ${batteryColor}`}>
          {statusData.battery_percent}%
        </span>
      </div>
      
      {/* Solar Power */}
      <div className="text-sm text-gray-700">
        <span className="font-medium">Solar Power: </span>
        <span>{statusData.solar_watts}W</span>
      </div>
      
      {/* Awake Time */}
      <div className="text-sm text-gray-700">
        <span className="font-medium">RaccoonBot has been awake for: </span>
        <span>{statusData.awake_hhmm}</span>
      </div>
    </div>
  );
}