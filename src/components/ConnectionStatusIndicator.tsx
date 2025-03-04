
import React from "react";

interface ConnectionStatusIndicatorProps {
  connected: boolean;
}

export function ConnectionStatusIndicator({ connected }: ConnectionStatusIndicatorProps) {
  return (
    <div className="flex items-center space-x-2">
      <div
        className={`h-3 w-3 rounded-full ${
          connected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-sm font-medium">
        {connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
}
