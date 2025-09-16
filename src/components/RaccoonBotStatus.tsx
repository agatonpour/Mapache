import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ArrowRight, Battery } from "lucide-react";
import { type StatusData } from "@/lib/firestore-service";

interface RaccoonBotStatusProps {
  statusData: StatusData | null;
}

export function RaccoonBotStatus({ statusData }: RaccoonBotStatusProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleClick = () => {
    // Preserve current date range when navigating to status page
    const urlParams = new URLSearchParams();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (startDate) urlParams.set('startDate', startDate);
    if (endDate) urlParams.set('endDate', endDate);
    
    navigate(`/status${urlParams.toString() ? `?${urlParams.toString()}` : ''}`);
  };

  return (
    <Card 
      className="fixed top-4 left-4 z-50 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-gray-200 hover:border-primary/30 bg-white/90 backdrop-blur-sm"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">RaccoonBot Status</h3>
          {statusData && (
            <div className="flex items-center gap-2 mt-1">
              <Battery className="h-3 w-3 text-green-600" />
              <span className="text-xs text-gray-600 font-medium">
                {statusData.soc_percent}%
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">View detailed status data</p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
      </div>
    </Card>
  );
}
//Manual Changes