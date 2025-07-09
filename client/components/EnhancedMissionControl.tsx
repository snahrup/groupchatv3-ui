import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface EnhancedMissionControlProps {
  onSendMessage: (
    message: string,
    complexity: number,
    mode: string,
    settings: ConversationSettings,
  ) => void;
  isProcessing: boolean;
  activeModels: string[];
  conversationSettings: ConversationSettings;
  onSettingsChange: (settings: ConversationSettings) => void;
  className?: string;
}

export interface ConversationSettings {
  allowInterruptions: boolean;
  showThinking: boolean;
  debateMode: boolean;
  synapseVisualization: boolean;
  responseDelay: number;
  collaborationStyle: "consensus" | "debate" | "cascade" | "free-form";
}

export function EnhancedMissionControl({
  onSendMessage,
  isProcessing,
  activeModels,
  conversationSettings,
  onSettingsChange,
  className,
}: EnhancedMissionControlProps) {
  const [message, setMessage] = useState("");
  const [complexity, setComplexity] = useState([5]);
  const [mode, setMode] = useState("collaborative");

  const handleSend = () => {
    if (message.trim() && activeModels.length > 0) {
      onSendMessage(message.trim(), complexity[0], mode, conversationSettings);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  const updateSetting = (key: keyof ConversationSettings, value: any) => {
    onSettingsChange({
      ...conversationSettings,
      [key]: value,
    });
  };

  const getCollaborationDescription = (style: string) => {
    switch (style) {
      case "consensus":
        return "AIs work toward agreement";
      case "debate":
        return "AIs challenge each other's ideas";
      case "cascade":
        return "AIs build sequentially on responses";
      case "free-form":
        return "Natural, organic conversation flow";
      default:
        return "";
    }
  };

  return (
    <div className={cn("glass-strong rounded-xl p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-synapse-active to-synapse-idle flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span>Conversation Command Center</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Orchestrate AI collaboration with advanced controls
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              activeModels.length > 0
                ? "bg-synapse-active/10 text-synapse-active border-synapse-active/30"
                : "bg-muted/50 text-muted-foreground",
            )}
          >
            <div className="w-2 h-2 bg-synapse-active rounded-full mr-2 animate-pulse" />
            {activeModels.length} Connected
          </Badge>
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask a question to start AI collaboration... They'll interrupt, debate, and build on each other's ideas."
          className="min-h-20 resize-none glass border-glass-border focus:border-synapse-active/50 focus:ring-synapse-active/20 bg-glass-bg backdrop-blur-md"
          disabled={isProcessing}
        />

        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>💡 Pro tip:</span>
          <span>
            Ask controversial questions to trigger debates • Use "What do you
            think about..." for discussions
          </span>
        </div>
      </div>

      {/* Conversation Settings */}
      <div className="space-y-4 p-4 rounded-lg bg-background/30 border border-glass-border">
        <h3 className="text-sm font-medium text-foreground">
          Collaboration Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Collaboration Style */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Collaboration Style
            </label>
            <Select
              value={conversationSettings.collaborationStyle}
              onValueChange={(value: any) =>
                updateSetting("collaborationStyle", value)
              }
              disabled={isProcessing}
            >
              <SelectTrigger className="glass border-glass-border bg-glass-bg backdrop-blur-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consensus">🤝 Consensus Building</SelectItem>
                <SelectItem value="debate">⚡ Debate Mode</SelectItem>
                <SelectItem value="cascade">🌊 Cascade Responses</SelectItem>
                <SelectItem value="free-form">
                  🎭 Free-form Discussion
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getCollaborationDescription(
                conversationSettings.collaborationStyle,
              )}
            </p>
          </div>

          {/* Response Delay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Response Timing
              </label>
              <Badge variant="secondary" className="text-xs">
                {conversationSettings.responseDelay}s delay
              </Badge>
            </div>
            <Slider
              value={[conversationSettings.responseDelay]}
              onValueChange={(value) =>
                updateSetting("responseDelay", value[0])
              }
              max={10}
              min={0}
              step={0.5}
              className="w-full"
              disabled={isProcessing}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Instant</span>
              <span>Thoughtful</span>
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
            <div>
              <div className="text-sm font-medium text-foreground">
                Interruptions
              </div>
              <div className="text-xs text-muted-foreground">
                Allow AIs to interrupt each other
              </div>
            </div>
            <Switch
              checked={conversationSettings.allowInterruptions}
              onCheckedChange={(checked) =>
                updateSetting("allowInterruptions", checked)
              }
              className="data-[state=checked]:bg-synapse-active"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
            <div>
              <div className="text-sm font-medium text-foreground">
                Show Thinking
              </div>
              <div className="text-xs text-muted-foreground">
                Display AI reasoning process
              </div>
            </div>
            <Switch
              checked={conversationSettings.showThinking}
              onCheckedChange={(checked) =>
                updateSetting("showThinking", checked)
              }
              className="data-[state=checked]:bg-synapse-active"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
            <div>
              <div className="text-sm font-medium text-foreground">
                Debate Mode
              </div>
              <div className="text-xs text-muted-foreground">
                Encourage disagreement
              </div>
            </div>
            <Switch
              checked={conversationSettings.debateMode}
              onCheckedChange={(checked) =>
                updateSetting("debateMode", checked)
              }
              className="data-[state=checked]:bg-synapse-active"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
            <div>
              <div className="text-sm font-medium text-foreground">
                Synapse Viz
              </div>
              <div className="text-xs text-muted-foreground">
                Show connection animations
              </div>
            </div>
            <Switch
              checked={conversationSettings.synapseVisualization}
              onCheckedChange={(checked) =>
                updateSetting("synapseVisualization", checked)
              }
              className="data-[state=checked]:bg-synapse-active"
            />
          </div>
        </div>
      </div>

      {/* Complexity & Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Complexity Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Discussion Depth
            </label>
            <Badge variant="secondary" className="text-xs">
              Level {complexity[0]}/10
            </Badge>
          </div>
          <Slider
            value={complexity}
            onValueChange={setComplexity}
            max={10}
            min={1}
            step={1}
            className="w-full"
            disabled={isProcessing}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Surface level</span>
            <span>Deep research</span>
          </div>
        </div>

        {/* Discussion Mode */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Discussion Focus
          </label>
          <Select value={mode} onValueChange={setMode} disabled={isProcessing}>
            <SelectTrigger className="glass border-glass-border bg-glass-bg backdrop-blur-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="collaborative">🤝 Collaborative</SelectItem>
              <SelectItem value="analytical">🔍 Analytical</SelectItem>
              <SelectItem value="creative">🎨 Creative</SelectItem>
              <SelectItem value="devils-advocate">
                😈 Devil's Advocate
              </SelectItem>
              <SelectItem value="research">📚 Research Deep-dive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Send Button */}
      <Button
        onClick={handleSend}
        disabled={!message.trim() || activeModels.length === 0 || isProcessing}
        className="w-full h-12 text-base font-medium bg-synapse-active hover:bg-synapse-active/90 text-white border-0 shadow-lg shadow-synapse-active/20 hover:shadow-synapse-active/30 transition-all duration-200"
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>AI Collaboration in Progress...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Start AI Collaboration</span>
          </div>
        )}
      </Button>

      {/* Status */}
      {activeModels.length === 0 && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          ⚠️ No AI models active. Enable at least one model to start a
          conversation.
        </div>
      )}
    </div>
  );
}
