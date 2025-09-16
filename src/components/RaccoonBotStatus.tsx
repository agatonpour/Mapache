import React from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type StatusData } from "@/lib/firestore-service";

interface RaccoonBotStatusProps {
  statusData: StatusData | null;
}

export function RaccoonBotStatus({ statusData }: RaccoonBotStatusProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="fixed top-4 left-4 z-50 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-gray-200 hover:border-primary/30 bg-white/90 backdrop-blur-sm"
      onClick={() => navigate('/status')}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">RaccoonBot Status</h3>
          <p className="text-xs text-gray-500 mt-1">View detailed status data</p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
      </div>
    </Card>
  );
}
//Manual Changes