import { useState, useEffect, useRef } from "react";
import {
  ThreadedConversationStream,
  ThreadedMessage,
} from "@/components/ThreadedConversationStream";
import {
  ConversationOrchestrator,
  AIPersonality,
  ConversationTiming,
} from "@/components/ConversationOrchestrator";
import {
  EnhancedMissionControl,
  ConversationSettings,
} from "@/components/EnhancedMissionControl";
import { ModelToggleControl } from "@/components/ModelToggleControl";
import { ExportTools } from "@/components/ExportTools";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// AI Model interface for the new system
interface AIModel {
  id: string;
  name: string;
  shortName: string;
  avatar: string;
  color: "gpt4" | "claude" | "gemini";
  status: "active" | "thinking" | "inactive";
  personality: string;
  specialization: string;
}

// AI personalities for natural conversation
const aiPersonalities: AIPersonality[] = [
  {
    id: "gpt4",
    name: "GPT-4 Turbo",
    thinkingSpeed: "fast",
    interruptiveness: "medium",
    agreeableness: "medium",
    creativity: "medium",
    responsePatterns: [
      "Let me approach this systematically...",
      "I'll break this down into components...",
      "From an analytical perspective...",
    ],
    interruptionPatterns: [
      "Hold on, I see a logical issue here...",
      "Wait, the data doesn't support that...",
    ],
    subResponseTriggers: [
      "analysis",
      "data",
      "logic",
      "framework",
      "structure",
    ],
  },
  {
    id: "claude",
    name: "Claude 3.5 Sonnet",
    thinkingSpeed: "medium",
    interruptiveness: "low",
    agreeableness: "high",
    creativity: "medium",
    responsePatterns: [
      "I appreciate the thoughtfulness of this question...",
      "This deserves careful consideration...",
      "I'd like to explore multiple perspectives...",
    ],
    interruptionPatterns: [
      "Sorry to interrupt, but I think we should consider...",
      "I respectfully disagree because...",
    ],
    subResponseTriggers: [
      "ethics",
      "perspective",
      "consideration",
      "implications",
      "balance",
    ],
  },
  {
    id: "gemini",
    name: "Gemini 2.0 Flash",
    thinkingSpeed: "fast",
    interruptiveness: "high",
    agreeableness: "low",
    creativity: "high",
    responsePatterns: [
      "What an exciting challenge!",
      "This makes me think of innovative possibilities...",
      "Let me offer a completely different angle...",
    ],
    interruptionPatterns: [
      "Whoa, what if we're thinking about this all wrong?",
      "Plot twist! I just had a crazy idea...",
    ],
    subResponseTriggers: [
      "creative",
      "innovative",
      "different",
      "unique",
      "outside",
    ],
  },
];

// AI model interface for compatibility
const initialModels: AIModel[] = aiPersonalities.map((p) => ({
  id: p.id,
  name: p.name,
  shortName: p.id.toUpperCase().slice(0, 3),
  avatar: "/api/placeholder/40/40",
  color: p.id as "gpt4" | "claude" | "gemini",
  status: "active" as const,
  personality: `${p.thinkingSpeed} thinker, ${p.interruptiveness} interruption style`,
  specialization: p.responsePatterns[0],
}));

const defaultSettings: ConversationSettings = {
  allowInterruptions: true,
  showThinking: true,
  debateMode: false,
  synapseVisualization: true,
  responseDelay: 2,
  collaborationStyle: "free-form",
};

// Natural conversation timing
const conversationTiming: ConversationTiming = {
  thinkingDelay: [1, 3], // 1-3 seconds thinking
  responseDelay: [2, 5], // 2-5 seconds to respond
  interruptionChance: 0.3, // 30% chance to interrupt
  subResponseChance: 0.4, // 40% chance for sub-response
  reactionDelay: [0.5, 2], // 0.5-2 seconds reaction time
};

export default function Index() {
  const [models, setModels] = useState<AIModel[]>(initialModels);
  const [threadedMessages, setThreadedMessages] = useState<ThreadedMessage[]>(
    [],
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationSettings, setConversationSettings] =
    useState<ConversationSettings>(defaultSettings);
  const [sessionData, setSessionData] = useState({
    startTime: new Date(),
    messageCount: 0,
    duration: "00:00",
  });
  const sessionStartRef = useRef(new Date());
  const messageIdCounter = useRef(0);
  const orchestratorRef = useRef<ConversationOrchestrator | null>(null);

  // Initialize conversation orchestrator
  useEffect(() => {
    orchestratorRef.current = new ConversationOrchestrator(
      aiPersonalities,
      conversationTiming,
    );

    return () => {
      orchestratorRef.current?.cleanup();
    };
  }, []);

  // Update session duration
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const duration = Math.floor(
        (now.getTime() - sessionStartRef.current.getTime()) / 1000,
      );
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      setSessionData((prev) => ({
        ...prev,
        duration: `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const generateMessageId = () => `msg-${++messageIdCounter.current}`;

  const addThreadedMessage = (message: ThreadedMessage) => {
    setThreadedMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = async (
    message: string,
    complexity: number,
    mode: string,
    settings: ConversationSettings,
  ) => {
    if (!orchestratorRef.current) return;

    setIsProcessing(true);
    setSessionData((prev) => ({
      ...prev,
      messageCount: prev.messageCount + 1,
    }));

    // Add user message
    const userMessage: ThreadedMessage = {
      id: generateMessageId(),
      modelId: "user",
      modelName: "You",
      modelColor: "user",
      content: message,
      type: "message",
      timestamp: new Date(),
      isComplete: true,
    };
    addThreadedMessage(userMessage);

    // Set active models to thinking
    const activeModels = models.filter((m) => m.status !== "inactive");
    setModels((prev) =>
      prev.map((model) =>
        activeModels.find((am) => am.id === model.id)
          ? { ...model, status: "thinking" as const }
          : model,
      ),
    );

    // Start natural conversation
    try {
      await orchestratorRef.current.simulateNaturalConversation(
        userMessage,
        activeModels.map((m) => m.id),
        complexity,
        mode,
        (message) => {
          addThreadedMessage(message);
          // Update model status
          setModels((prev) =>
            prev.map((m) =>
              m.id === message.modelId ? { ...m, status: "active" } : m,
            ),
          );
        },
        (subMessage, parentId) => {
          const messageWithParent = { ...subMessage, parentId };
          addThreadedMessage(messageWithParent);
        },
      );
    } finally {
      setIsProcessing(false);
      setModels((prev) => prev.map((m) => ({ ...m, status: "active" })));
    }
  };

  // Update conversation export data
  const handleExport = async (format: string, options: any) => {
    const exportData = {
      threadedMessages: threadedMessages,
      models: models,
      sessionData: sessionData,
      settings: conversationSettings,
    };
    console.log(`Exporting in ${format} format`, exportData, options);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const handleSaveConversation = () => {
    const conversationData = {
      threadedMessages: threadedMessages,
      models,
      sessionData,
      settings: conversationSettings,
      timestamp: new Date(),
    };
    localStorage.setItem(
      "groupchat-conversation",
      JSON.stringify(conversationData),
    );
  };

  const handleLoadConversation = () => {
    const saved = localStorage.getItem("groupchat-conversation");
    if (saved) {
      const data = JSON.parse(saved);
      setThreadedMessages(data.threadedMessages || []);
      setModels(data.models);
      setSessionData(data.sessionData);
      setConversationSettings(data.settings || defaultSettings);
    }
  };

  const handleClearAll = () => {
    setThreadedMessages([]);
    setModels((prev) =>
      prev.map((model) => ({ ...model, status: "inactive" })),
    );
    setSessionData({
      startTime: new Date(),
      messageCount: 0,
      duration: "00:00",
    });
    sessionStartRef.current = new Date();
    messageIdCounter.current = 0;
    orchestratorRef.current?.cleanup();
  };

  const handleApproveSubResponse = (messageId: string) => {
    setThreadedMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, isApproved: true, type: "message" as const }
          : msg,
      ),
    );
  };

  const handleRejectSubResponse = (messageId: string) => {
    setThreadedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleToggleModel = (modelId: string) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === modelId
          ? {
              ...model,
              status: model.status === "inactive" ? "active" : "inactive",
            }
          : model,
      ),
    );
  };

  const handleToggleAllModels = (active: boolean) => {
    setModels((prev) =>
      prev.map((model) => ({
        ...model,
        status: active ? "active" : "inactive",
      })),
    );
  };

  const handleLoadConversation = () => {
    const saved = localStorage.getItem("groupchat-conversation");
    if (saved) {
      const data = JSON.parse(saved);
      setConversationMessages(data.messages || []);
      setModels(data.models);
      setSessionData(data.sessionData);
      setConversationSettings(data.settings || defaultSettings);
    }
  };

  const handleClearAll = () => {
    setConversationMessages([]);
    setModels((prev) =>
      prev.map((model) => ({ ...model, status: "inactive" })),
    );
    setSessionData({
      startTime: new Date(),
      messageCount: 0,
      duration: "00:00",
    });
    sessionStartRef.current = new Date();
    messageIdCounter.current = 0;
  };

  const activeModels = models.filter((m) => m.status !== "inactive");

  // Create legacy model format for ExportTools compatibility
  const legacyModels = models.map((model) => ({
    ...model,
    messages: threadedMessages
      .filter((msg) => msg.modelId === model.id && msg.type === "message")
      .map((msg) => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        isComplete: msg.isComplete,
      })),
  }));

  // Create legacy conversation messages for ModelToggleControl
  const legacyConversationMessages = threadedMessages.map((msg) => ({
    id: msg.id,
    modelId: msg.modelId,
    type: msg.type,
  }));

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 glass-strong border-b border-glass-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-synapse-active to-synapse-idle flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  GroupChatLLM <span className="text-synapse-active">v3</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Multi-AI Collaborative Intelligence Platform
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge
              variant="outline"
              className="bg-synapse-active/10 text-synapse-active border-synapse-active/30"
            >
              {activeModels.length} AI{activeModels.length !== 1 ? "s" : ""}{" "}
              Active
            </Badge>

            <Button
              variant="outline"
              size="sm"
              className="glass border-glass-border"
              onClick={() => window.location.reload()}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset Session
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModelToggleControl
            models={models}
            conversationMessages={legacyConversationMessages}
            onToggleModel={handleToggleModel}
            onToggleAll={handleToggleAllModels}
          />
          <ExportTools
            models={legacyModels}
            sessionData={sessionData}
            onExport={handleExport}
            onSaveConversation={handleSaveConversation}
            onLoadConversation={handleLoadConversation}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Enhanced Mission Control */}
        <EnhancedMissionControl
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          activeModels={activeModels.map((m) => m.id)}
          conversationSettings={conversationSettings}
          onSettingsChange={setConversationSettings}
        />

        {/* Threaded Conversation Stream */}
        <ThreadedConversationStream
          messages={threadedMessages}
          activeModels={activeModels.map((m) => m.id)}
          isProcessing={isProcessing}
          onApproveSubResponse={handleApproveSubResponse}
          onRejectSubResponse={handleRejectSubResponse}
          className="min-h-96"
        />

        {/* Collaboration Status */}
        {activeModels.length > 1 && (
          <div className="p-4 rounded-xl glass border border-synapse-active/20 text-center">
            <div className="flex items-center justify-center space-x-2 text-synapse-active">
              <div className="w-2 h-2 bg-synapse-active rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                Neural threads active • {activeModels.length} AIs collaborating
                •
                {
                  threadedMessages.filter((m) => m.type === "interruption")
                    .length
                }{" "}
                interruptions •
                {
                  threadedMessages.filter((m) => m.type === "sub-response")
                    .length
                }{" "}
                sub-responses •
                {threadedMessages.filter((m) => m.isApproved).length} approved
              </span>
              <div className="w-2 h-2 bg-synapse-active rounded-full animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg bg-synapse-active hover:bg-synapse-active/90 text-white"
          onClick={() => {
            const missionControl = document.querySelector(
              "[data-mission-control]",
            );
            missionControl?.scrollIntoView({ behavior: "smooth" });
          }}
        >
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
