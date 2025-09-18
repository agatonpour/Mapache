import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot } from "lucide-react";

export type RaccoonBotId = "crystal-cove" | "yosemite" | "amazon-jungle" | "add-robot";

export interface RaccoonBot {
  id: RaccoonBotId;
  name: string;
  displayName: string;
}

export const RACCOON_BOTS: RaccoonBot[] = [
  { id: "crystal-cove", name: "Crystal Cove", displayName: "Crystal Cove" },
  { id: "yosemite", name: "Yosemite", displayName: "Yosemite" },
  { id: "amazon-jungle", name: "Amazon Jungle", displayName: "Amazon Jungle" }
];

export const ADD_ROBOT_OPTION = { id: "add-robot", name: "Add Robot", displayName: "+ Add Robot" };

interface RaccoonBotSelectorProps {
  selectedBotId: RaccoonBotId;
  onBotSelect: (botId: RaccoonBotId) => void;
}

export function RaccoonBotSelector({ selectedBotId, onBotSelect }: RaccoonBotSelectorProps) {
  const selectedBot = RACCOON_BOTS.find(bot => bot.id === selectedBotId);
  const displayName = selectedBot?.displayName || (selectedBotId === "add-robot" ? ADD_ROBOT_OPTION.displayName : "Select RaccoonBot");

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-gray-700">RaccoonBot:</span>
      </div>
      <Select value={selectedBotId} onValueChange={(value) => onBotSelect(value as RaccoonBotId)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select RaccoonBot">
            {displayName}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {RACCOON_BOTS.map((bot) => (
            <SelectItem key={bot.id} value={bot.id}>
              {bot.displayName}
            </SelectItem>
          ))}
          <SelectItem key={ADD_ROBOT_OPTION.id} value={ADD_ROBOT_OPTION.id}>
            {ADD_ROBOT_OPTION.displayName}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}