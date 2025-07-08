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
import { cn } from "@/lib/utils";

interface MissionControlProps {
  onSendMessage: (message: string, complexity: number, mode: string) => void;
  isProcessing: boolean;
  activeModels: number;
  className?: string;
}

export function MissionControl({
  onSendMessage,
  isProcessing,
  activeModels,
  className,
}: MissionControlProps) {
  const [message, setMessage] = useState("");
  const [complexity, setComplexity] = useState([5]);
  const [mode, setMode] = useState("collaborative");

  const handleSend = () => {
    if (message.trim() && activeModels > 0) {
      onSendMessage(message.trim(), complexity[0], mode);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  const getComplexityLabel = (value: number) => {
    if (value <= 2) return "Simple";
    if (value <= 4) return "Moderate";
    if (value <= 6) return "Complex";
    if (value <= 8) return "Expert";
    return "Research";
  };

  const getComplexityColor = (value: number) => {
    if (value <= 2) return "text-green-600";
    if (value <= 4) return "text-blue-600";
    if (value <= 6) return "text-yellow-600";
    if (value <= 8) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className={cn("glass-strong rounded-xl p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Mission Control
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeModels} AI{activeModels !== 1 ? "s" : ""} ready for
            collaboration
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className="bg-synapse-active/10 text-synapse-active border-synapse-active/30"
          >
            <div className="w-2 h-2 bg-synapse-active rounded-full mr-2 animate-pulse" />
            Live
          </Badge>
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter your question or prompt for the AI panel to discuss..."
          className="min-h-24 resize-none glass border-glass-border focus:border-synapse-active/50 focus:ring-synapse-active/20 bg-glass-bg backdrop-blur-md"
          disabled={isProcessing}
        />

        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>💡 Tip:</span>
          <span>Press Cmd/Ctrl + Enter to send</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Complexity Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Response Complexity
            </label>
            <Badge
              variant="secondary"
              className={cn("text-xs", getComplexityColor(complexity[0]))}
            >
              {getComplexityLabel(complexity[0])} ({complexity[0]}/10)
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
            <span>Quick</span>
            <span>Research</span>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Collaboration Mode
          </label>
          <Select value={mode} onValueChange={setMode} disabled={isProcessing}>
            <SelectTrigger className="glass border-glass-border bg-glass-bg backdrop-blur-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="collaborative">🤝 Collaborative</SelectItem>
              <SelectItem value="debate">⚡ Debate</SelectItem>
              <SelectItem value="analysis">🔍 Analysis</SelectItem>
              <SelectItem value="creative">🎨 Creative</SelectItem>
              <SelectItem value="research">📚 Research</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {mode === "collaborative" && "AIs work together harmoniously"}
            {mode === "debate" && "AIs present different perspectives"}
            {mode === "analysis" && "Systematic problem breakdown"}
            {mode === "creative" && "Innovative and artistic responses"}
            {mode === "research" && "Deep, comprehensive exploration"}
          </p>
        </div>
      </div>

      {/* Send Button */}
      <Button
        onClick={handleSend}
        disabled={!message.trim() || activeModels === 0 || isProcessing}
        className="w-full h-12 text-base font-medium bg-synapse-active hover:bg-synapse-active/90 text-white border-0 shadow-lg shadow-synapse-active/20 hover:shadow-synapse-active/30 transition-all duration-200"
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Processing...</span>
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>Initiate AI Panel Discussion</span>
          </div>
        )}
      </Button>

      {/* Status Bar */}
      {activeModels === 0 && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          ⚠️ No AI models selected. Please activate at least one model to begin.
        </div>
      )}
    </div>
  );
}
