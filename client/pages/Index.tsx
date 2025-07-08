import { useState, useEffect, useRef } from "react";
import { AIModelPanel, AIModel, AIMessage } from "@/components/AIModelPanel";
import { MissionControl } from "@/components/MissionControl";
import { SynapseAnimation } from "@/components/SynapseAnimation";
import { ModelToggleControl } from "@/components/ModelToggleControl";
import { ExportTools } from "@/components/ExportTools";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock AI model configurations
const initialModels: AIModel[] = [
  {
    id: "gpt4",
    name: "GPT-4 Turbo",
    shortName: "GPT",
    avatar: "/api/placeholder/40/40",
    color: "gpt4",
    status: "active",
    messages: [],
  },
  {
    id: "claude",
    name: "Claude 3.5 Sonnet",
    shortName: "CLD",
    avatar: "/api/placeholder/40/40",
    color: "claude",
    status: "active",
    messages: [],
  },
  {
    id: "gemini",
    name: "Gemini 2.0 Flash",
    shortName: "GEM",
    avatar: "/api/placeholder/40/40",
    color: "gemini",
    status: "active",
    messages: [],
  },
];

export default function Index() {
  const [models, setModels] = useState<AIModel[]>(initialModels);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionData, setSessionData] = useState({
    startTime: new Date(),
    messageCount: 0,
    duration: "00:00",
  });
  const [synapseConnections, setSynapseConnections] = useState<any[]>([]);
  const sessionStartRef = useRef(new Date());

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

  // Generate synapse connections between active models
  useEffect(() => {
    const activeModels = models.filter((m) => m.status !== "inactive");
    const connections = [];

    for (let i = 0; i < activeModels.length; i++) {
      for (let j = i + 1; j < activeModels.length; j++) {
        connections.push({
          id: `${activeModels[i].id}-${activeModels[j].id}`,
          fromModel: activeModels[i].id,
          toModel: activeModels[j].id,
          intensity: Math.random() * 0.5 + 0.5,
          active:
            activeModels[i].status === "active" &&
            activeModels[j].status === "active",
        });
      }
    }

    setSynapseConnections(connections);
  }, [models]);

  const handleSendMessage = async (
    message: string,
    complexity: number,
    mode: string,
  ) => {
    setIsProcessing(true);
    setSessionData((prev) => ({
      ...prev,
      messageCount: prev.messageCount + 1,
    }));

    // Set all active models to "thinking" state
    setModels((prev) =>
      prev.map((model) =>
        model.status !== "inactive"
          ? { ...model, status: "thinking" as const }
          : model,
      ),
    );

    // Simulate AI responses with different delays
    const activeModels = models.filter((m) => m.status !== "inactive");
    const responsePromises = activeModels.map((model, index) =>
      simulateAIResponse(model, message, complexity, mode, index * 1000),
    );

    try {
      await Promise.all(responsePromises);
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateAIResponse = (
    model: AIModel,
    userMessage: string,
    complexity: number,
    mode: string,
    delay: number,
  ): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(
        () => {
          const responses = {
            gpt4: [
              "I'll approach this systematically. Based on the complexity level and collaborative mode, here's my analysis...",
              "From a technical perspective, I can break this down into several key components that we should consider...",
              "Let me provide a structured response that addresses the core aspects of your question...",
            ],
            claude: [
              "I appreciate the nuanced nature of this question. Let me offer a thoughtful perspective that complements what my colleagues might share...",
              "This is a fascinating topic that deserves careful consideration. I'd like to explore the ethical and practical implications...",
              "Building on the collaborative nature of our discussion, I see several important dimensions to consider...",
            ],
            gemini: [
              "I'm excited to dive into this! Let me bring a creative and innovative angle to our collective analysis...",
              "This presents interesting opportunities for exploration. I'll focus on the practical applications and future possibilities...",
              "From a multi-modal perspective, I can offer unique insights that blend different approaches to this challenge...",
            ],
          };

          const modelResponses = responses[
            model.id as keyof typeof responses
          ] || [
            "This is an interesting question that requires careful consideration...",
          ];

          const response =
            modelResponses[Math.floor(Math.random() * modelResponses.length)];

          const newMessage: AIMessage = {
            id: `${model.id}-${Date.now()}`,
            content: response,
            timestamp: new Date(),
            isComplete: true,
          };

          setModels((prev) =>
            prev.map((m) =>
              m.id === model.id
                ? {
                    ...m,
                    status: "active",
                    messages: [...m.messages, newMessage],
                  }
                : m,
            ),
          );

          resolve();
        },
        delay + Math.random() * 2000 + complexity * 500,
      );
    });
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

  const handleExport = async (format: string, options: any) => {
    // Simulate export functionality
    console.log(`Exporting in ${format} format`, options);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const handleSaveConversation = () => {
    const conversationData = {
      models,
      sessionData,
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
      setModels(data.models);
      setSessionData(data.sessionData);
    }
  };

  const handleClearAll = () => {
    setModels((prev) =>
      prev.map((model) => ({ ...model, messages: [], status: "inactive" })),
    );
    setSessionData({
      startTime: new Date(),
      messageCount: 0,
      duration: "00:00",
    });
    sessionStartRef.current = new Date();
  };

  const activeModels = models.filter((m) => m.status !== "inactive");

  // Calculate model positions for synapse animation
  const modelPositions = models.map((model, index) => ({
    id: model.id,
    isActive: model.status !== "inactive",
    position: {
      x: 200 + index * 400,
      y: 300,
    },
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
            onToggleModel={handleToggleModel}
            onToggleAll={handleToggleAllModels}
          />
          <ExportTools
            models={models}
            sessionData={sessionData}
            onExport={handleExport}
            onSaveConversation={handleSaveConversation}
            onLoadConversation={handleLoadConversation}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Mission Control */}
        <MissionControl
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          activeModels={activeModels.length}
        />

        {/* AI Panel Discussion Area */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-96 relative">
            {models.map((model) => (
              <AIModelPanel
                key={model.id}
                model={model}
                isActive={model.status !== "inactive"}
                onToggle={handleToggleModel}
                className="relative z-20"
              />
            ))}

            {/* Synapse Animation Overlay */}
            <SynapseAnimation
              models={modelPositions}
              connections={synapseConnections}
              className="absolute inset-0 z-10"
            />
          </div>

          {/* Collaboration Status */}
          {activeModels.length > 1 && (
            <div className="mt-6 p-4 rounded-xl glass border border-synapse-active/20 text-center">
              <div className="flex items-center justify-center space-x-2 text-synapse-active">
                <div className="w-2 h-2 bg-synapse-active rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  Synaptic connections active • {activeModels.length} AIs
                  collaborating
                </span>
                <div className="w-2 h-2 bg-synapse-active rounded-full animate-pulse" />
              </div>
            </div>
          )}
        </div>
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
