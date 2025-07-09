import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConversationMessage {
  id: string;
  modelId: string;
  modelName: string;
  modelColor: "gpt4" | "claude" | "gemini" | "user";
  content: string;
  type: "message" | "thinking" | "interruption" | "reaction";
  timestamp: Date;
  isComplete: boolean;
  referencesTo?: string[]; // IDs of messages this responds to
  confidence?: number;
  reasoning?: string;
}

interface ConversationStreamProps {
  messages: ConversationMessage[];
  activeModels: string[];
  isProcessing: boolean;
  onInterrupt: (modelId: string, targetMessageId: string) => void;
  className?: string;
}

const ModelAvatar = ({
  modelId,
  modelColor,
  modelName,
  status = "idle",
  size = "default",
}: {
  modelId: string;
  modelColor: string;
  modelName: string;
  status?: "idle" | "thinking" | "speaking" | "interrupted";
  size?: "sm" | "default";
}) => {
  const sizeClasses = size === "sm" ? "w-6 h-6" : "w-10 h-10";

  return (
    <div className="relative">
      <Avatar
        className={cn(
          sizeClasses,
          "border-2 transition-all duration-300",
          status === "speaking"
            ? `border-${modelColor} ring-2 ring-${modelColor}/30`
            : "",
          status === "thinking"
            ? `border-${modelColor} ring-2 ring-${modelColor}/50 animate-pulse`
            : "",
          status === "interrupted"
            ? "border-destructive ring-2 ring-destructive/30"
            : "",
          "border-muted",
        )}
      >
        <AvatarImage src={`/api/placeholder/40/40`} alt={modelName} />
        <AvatarFallback
          className={cn(
            "text-xs font-semibold",
            `bg-${modelColor}/10 text-${modelColor}`,
          )}
        >
          {modelId.toUpperCase().slice(0, 3)}
        </AvatarFallback>
      </Avatar>

      {/* Status indicator */}
      <div
        className={cn(
          "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
          status === "speaking" ? `bg-${modelColor} animate-glow` : "",
          status === "thinking" ? `bg-${modelColor} animate-pulse` : "",
          status === "interrupted" ? "bg-destructive animate-bounce" : "",
          status === "idle" ? "bg-muted" : "",
        )}
      />
    </div>
  );
};

const ThinkingBubble = ({
  message,
  onComplete,
}: {
  message: ConversationMessage;
  onComplete: () => void;
}) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    // Complete thinking after 2-4 seconds
    const timeout = setTimeout(onComplete, 2000 + Math.random() * 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "flex items-start space-x-3 p-4 rounded-xl transition-all duration-300",
        `bg-${message.modelColor}/5 border border-${message.modelColor}/20`,
        "animate-pulse",
      )}
    >
      <ModelAvatar
        modelId={message.modelId}
        modelColor={message.modelColor}
        modelName={message.modelName}
        status="thinking"
        size="sm"
      />
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <span
            className={cn("text-sm font-medium", `text-${message.modelColor}`)}
          >
            {message.modelName}
          </span>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              `bg-${message.modelColor}/10 text-${message.modelColor}`,
            )}
          >
            thinking{dots}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground italic">
          💭{" "}
          {message.reasoning ||
            "Analyzing the conversation and formulating response..."}
        </div>
      </div>
    </div>
  );
};

const SynapseConnection = ({
  fromMessage,
  toMessage,
  intensity = 1,
}: {
  fromMessage: string;
  toMessage: string;
  intensity?: number;
}) => {
  return (
    <div className="absolute left-4 top-0 bottom-0 w-px">
      <div
        className="h-full bg-gradient-to-b from-synapse-active to-synapse-idle animate-synapse-pulse"
        style={{ opacity: intensity }}
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-synapse-active rounded-full animate-ping" />
      </div>
    </div>
  );
};

const MessageBubble = ({
  message,
  onInterrupt,
  activeModels,
  showSynapse = false,
}: {
  message: ConversationMessage;
  onInterrupt: (modelId: string, targetMessageId: string) => void;
  activeModels: string[];
  showSynapse?: boolean;
}) => {
  const [showInterruptOptions, setShowInterruptOptions] = useState(false);

  const canInterrupt = message.type === "message" && !message.isComplete;
  const availableInterruptors = activeModels.filter(
    (id) => id !== message.modelId,
  );

  return (
    <div className="relative group">
      {showSynapse && <SynapseConnection fromMessage="" toMessage="" />}

      <div
        className={cn(
          "flex items-start space-x-3 p-4 rounded-xl transition-all duration-300 hover:shadow-md",
          message.modelColor === "user"
            ? "bg-background border border-border ml-12"
            : `bg-${message.modelColor}/5 border border-${message.modelColor}/20`,
          message.type === "interruption"
            ? "border-l-4 border-l-destructive"
            : "",
          !message.isComplete ? "animate-pulse" : "",
        )}
        onMouseEnter={() => canInterrupt && setShowInterruptOptions(true)}
        onMouseLeave={() => setShowInterruptOptions(false)}
      >
        <ModelAvatar
          modelId={message.modelId}
          modelColor={message.modelColor}
          modelName={message.modelName}
          status={!message.isComplete ? "speaking" : "idle"}
        />

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className={cn(
                  "font-medium text-sm",
                  message.modelColor === "user"
                    ? "text-foreground"
                    : `text-${message.modelColor}`,
                )}
              >
                {message.modelName}
              </span>

              {message.type === "interruption" && (
                <Badge variant="destructive" className="text-xs">
                  interrupted
                </Badge>
              )}

              {message.confidence && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(message.confidence * 100)}% confident
                </Badge>
              )}

              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>

            {/* Interrupt Button */}
            {showInterruptOptions &&
              canInterrupt &&
              availableInterruptors.length > 0 && (
                <div className="flex space-x-1">
                  {availableInterruptors.map((modelId) => (
                    <Button
                      key={modelId}
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onInterrupt(modelId, message.id)}
                    >
                      {modelId.toUpperCase()} interrupt
                    </Button>
                  ))}
                </div>
              )}
          </div>

          {/* Message Content */}
          <div className="text-sm leading-relaxed">
            {message.content}
            {!message.isComplete && (
              <span className="inline-block w-2 h-4 bg-current animate-blink ml-1" />
            )}
          </div>

          {/* Reference connections */}
          {message.referencesTo && message.referencesTo.length > 0 && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span>
                Responding to previous {message.referencesTo.length} message(s)
              </span>
            </div>
          )}

          {/* Reasoning (if available) */}
          {message.reasoning && message.type === "message" && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                💭 View reasoning process
              </summary>
              <div className="mt-2 p-2 bg-background/50 rounded border-l-2 border-synapse-idle">
                {message.reasoning}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export function ConversationStream({
  messages,
  activeModels,
  isProcessing,
  onInterrupt,
  className,
}: ConversationStreamProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [thinkingMessages, setThinkingMessages] = useState<
    ConversationMessage[]
  >([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkingMessages]);

  const handleThinkingComplete = (messageId: string) => {
    setThinkingMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const allMessages = [...messages, ...thinkingMessages].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  return (
    <div className={cn("glass-strong rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-glass-border bg-background/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              Live Collaboration Stream
            </h3>
            <p className="text-sm text-muted-foreground">
              Watch as AI models interact, interrupt, and build on each other's
              ideas
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="bg-synapse-active/10 text-synapse-active border-synapse-active/30"
            >
              <div className="w-2 h-2 bg-synapse-active rounded-full mr-2 animate-pulse" />
              {activeModels.length} AIs connected
            </Badge>
          </div>
        </div>
      </div>

      {/* Conversation Stream */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-synapse-idle/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6"
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
              </div>
              <p>Start a conversation to see AI collaboration in action</p>
            </div>
          </div>
        ) : (
          allMessages.map((message, index) => {
            const hasReference =
              message.referencesTo && message.referencesTo.length > 0;

            return (
              <div key={message.id}>
                {message.type === "thinking" ? (
                  <ThinkingBubble
                    message={message}
                    onComplete={() => handleThinkingComplete(message.id)}
                  />
                ) : (
                  <MessageBubble
                    message={message}
                    onInterrupt={onInterrupt}
                    activeModels={activeModels}
                    showSynapse={hasReference}
                  />
                )}
              </div>
            );
          })
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-synapse-active">
              <div className="w-2 h-2 bg-synapse-active rounded-full animate-ping" />
              <div
                className="w-2 h-2 bg-synapse-active rounded-full animate-ping"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-synapse-active rounded-full animate-ping"
                style={{ animationDelay: "0.2s" }}
              />
              <span className="text-sm font-medium ml-2">
                AIs are collaborating...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-glass-border bg-background/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            💡 Hover over messages to interrupt • Click thinking bubbles to see
            reasoning
          </span>
          <span>{messages.length} messages exchanged</span>
        </div>
      </div>
    </div>
  );
}
