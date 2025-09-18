import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  customRobots?: RaccoonBot[];
  onAddRobot?: (robot: RaccoonBot) => void;
}

export function RaccoonBotSelector({ selectedBotId, onBotSelect, customRobots = [], onAddRobot }: RaccoonBotSelectorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRobotName, setNewRobotName] = useState("");
  
  const allRobots = [...RACCOON_BOTS, ...customRobots];
  const selectedBot = allRobots.find(bot => bot.id === selectedBotId);
  const displayName = selectedBot?.displayName || (selectedBotId === "add-robot" ? ADD_ROBOT_OPTION.displayName : "Select RaccoonBot");

  const handleSelect = (value: string) => {
    if (value === "add-robot") {
      setShowAddDialog(true);
    } else {
      onBotSelect(value as RaccoonBotId);
    }
  };

  const handleAddRobot = () => {
    if (newRobotName.trim() && onAddRobot) {
      const robotId = newRobotName.toLowerCase().replace(/\s+/g, '-') as RaccoonBotId;
      const newRobot: RaccoonBot = {
        id: robotId,
        name: newRobotName.trim(),
        displayName: newRobotName.trim()
      };
      onAddRobot(newRobot);
      onBotSelect(robotId);
      setNewRobotName("");
      setShowAddDialog(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-gray-700">RaccoonBot:</span>
      </div>
      <Select value={selectedBotId} onValueChange={handleSelect}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Select RaccoonBot">
            {displayName}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allRobots.map((bot) => (
            <SelectItem key={bot.id} value={bot.id}>
              {bot.displayName}
            </SelectItem>
          ))}
          <SelectItem key={ADD_ROBOT_OPTION.id} value={ADD_ROBOT_OPTION.id}>
            {ADD_ROBOT_OPTION.displayName}
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New RaccoonBot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="robot-name">Robot Name</Label>
              <Input
                id="robot-name"
                placeholder="Enter robot name..."
                value={newRobotName}
                onChange={(e) => setNewRobotName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRobot()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRobot} disabled={!newRobotName.trim()}>
              Add Robot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}