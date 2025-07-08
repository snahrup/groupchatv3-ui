import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface AIMessage {
  id: string;
  content: string;
  timestamp: Date;
  isComplete: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  shortName: string;
  avatar: string;
  color: "gpt4" | "claude" | "gemini";
  status: "active" | "thinking" | "inactive";
  messages: AIMessage[];
}

interface AIModelPanelProps {
  model: AIModel;
  isActive: boolean;
  onToggle: (modelId: string) => void;
  className?: string;
}

const TypingIndicator = ({ modelColor }: { modelColor: string }) => (
  <div className="flex space-x-1 py-2">
    <div className={`w-2 h-2 rounded-full bg-${modelColor} typing-indicator`} />
    <div className={`w-2 h-2 rounded-full bg-${modelColor} typing-indicator`} />
    <div className={`w-2 h-2 rounded-full bg-${modelColor} typing-indicator`} />
  </div>
);

export function AIModelPanel({
  model,
  isActive,
  onToggle,
  className,
}: AIModelPanelProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (model.status === "thinking" && isActive) {
      setIsTyping(true);
      // Simulate typing delay
      const timer = setTimeout(
        () => {
          setIsTyping(false);
          // This would be replaced with actual AI response logic
        },
        2000 + Math.random() * 3000,
      );
      return () => clearTimeout(timer);
    }
  }, [model.status, isActive]);

  const getStatusColor = () => {
    switch (model.status) {
      case "active":
        return model.color;
      case "thinking":
        return model.color;
      case "inactive":
        return "muted";
      default:
        return "muted";
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col h-full rounded-xl transition-all duration-300",
        isActive
          ? `glass-strong border-2 border-${model.color}/30 shadow-lg shadow-${model.color}/10`
          : "glass border-border/50 opacity-75",
        `ai-${model.color}`,
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-glass-border">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar
              className={cn(
                "w-10 h-10 border-2 transition-all duration-300",
                isActive ? `border-${model.color}` : "border-muted",
              )}
            >
              <AvatarImage src={model.avatar} alt={model.name} />
              <AvatarFallback
                className={cn(
                  "text-sm font-semibold",
                  isActive
                    ? `bg-${model.color}/10 text-${model.color}`
                    : "bg-muted text-muted-foreground",
                )}
              >
                {model.shortName}
              </AvatarFallback>
            </Avatar>
            {/* Status indicator */}
            <div
              className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                model.status === "active" && isActive
                  ? `bg-${model.color} animate-glow`
                  : "",
                model.status === "thinking" && isActive
                  ? `bg-${model.color} animate-pulse`
                  : "",
                model.status === "inactive" ? "bg-muted" : "",
              )}
            />
          </div>

          <div>
            <h3
              className={cn(
                "font-medium text-sm transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {model.name}
            </h3>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                isActive
                  ? `bg-${model.color}/10 text-${model.color} border-${model.color}/20`
                  : "",
              )}
            >
              {model.status}
            </Badge>
          </div>
        </div>

        <button
          onClick={() => onToggle(model.id)}
          className={cn(
            "w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-105",
            isActive
              ? `bg-${model.color}/10 border-${model.color} text-${model.color}`
              : "bg-muted/50 border-muted text-muted-foreground hover:border-foreground hover:text-foreground",
          )}
        >
          {isActive ? (
            <svg
              className="w-4 h-4 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {model.messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "p-3 rounded-lg text-sm leading-relaxed transition-all duration-300",
              `bg-${model.color}/5 border border-${model.color}/10`,
              !message.isComplete && "animate-pulse",
            )}
          >
            {message.content}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && isActive && (
          <div
            className={cn(
              "p-3 rounded-lg",
              `bg-${model.color}/5 border border-${model.color}/10`,
            )}
          >
            <TypingIndicator modelColor={model.color} />
          </div>
        )}
      </div>

      {/* Connection points for synapse lines */}
      <div className="absolute right-0 top-1/2 w-2 h-2 bg-synapse-idle rounded-full transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
