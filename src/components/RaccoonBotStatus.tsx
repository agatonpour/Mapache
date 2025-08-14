import { BatteryFull, BatteryMedium, BatteryLow } from "lucide-react";
import { StatusData } from "@/lib/firestore-service";

interface RaccoonBotStatusProps {
  statusData: StatusData | null;
}

export function RaccoonBotStatus({ statusData }: RaccoonBotStatusProps) {
  // statusData should never be null now, but provide fallback just in case
  const data = statusData || {
    battery_percent: 0,
    solar_watts: 0,
    awake_hhmm: "0:00",
    timestamp: new Date()
  };

  // Determine battery icon and color based on percentage
  let BatteryIcon = BatteryFull;
  let batteryColor = "text-green-600";
  
  if (data.battery_percent <= 20) {
    BatteryIcon = BatteryLow;
    batteryColor = "text-red-600";
  } else if (data.battery_percent <= 59) {
    BatteryIcon = BatteryMedium;
    batteryColor = "text-yellow-600";
  }

  return (
    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-gray-200 space-y-2">
      {/* Battery Status */}
      <div className="flex items-center">
        <BatteryIcon className={`h-5 w-5 mr-2 ${batteryColor}`} />
        <span className={`font-medium ${batteryColor}`}>
          {data.battery_percent}%
        </span>
      </div>
      
      {/* Solar Power */}
      <div className="text-sm text-gray-700">
        <span className="font-medium">Solar Power: </span>
        <span>{data.solar_watts}W</span>
      </div>
      
      {/* Awake Time */}
      <div className="text-sm text-gray-700">
        <span className="font-medium">RaccoonBot has been awake for: </span>
        <span>{data.awake_hhmm}</span>
      </div>
    </div>
  );
}