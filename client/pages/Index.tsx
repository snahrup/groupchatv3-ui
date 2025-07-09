import { useState, useEffect, useRef } from "react";
import {
  ConversationStream,
  ConversationMessage,
} from "@/components/ConversationStream";
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

// AI model configurations with personalities
const initialModels: AIModel[] = [
  {
    id: "gpt4",
    name: "GPT-4 Turbo",
    shortName: "GPT",
    avatar: "/api/placeholder/40/40",
    color: "gpt4",
    status: "active",
    personality:
      "Analytical and systematic. Prefers structured approaches and often starts with frameworks.",
    specialization: "Logic, analysis, structured thinking",
  },
  {
    id: "claude",
    name: "Claude 3.5 Sonnet",
    shortName: "CLD",
    avatar: "/api/placeholder/40/40",
    color: "claude",
    status: "active",
    personality:
      "Thoughtful and nuanced. Considers ethical implications and multiple perspectives.",
    specialization: "Ethics, philosophy, balanced reasoning",
  },
  {
    id: "gemini",
    name: "Gemini 2.0 Flash",
    shortName: "GEM",
    avatar: "/api/placeholder/40/40",
    color: "gemini",
    status: "active",
    personality:
      "Creative and innovative. Likes to challenge assumptions and propose novel solutions.",
    specialization: "Innovation, creativity, lateral thinking",
  },
];

const defaultSettings: ConversationSettings = {
  allowInterruptions: true,
  showThinking: true,
  debateMode: false,
  synapseVisualization: true,
  responseDelay: 2,
  collaborationStyle: "free-form",
};

export default function Index() {
  const [models, setModels] = useState<AIModel[]>(initialModels);
  const [conversationMessages, setConversationMessages] = useState<
    ConversationMessage[]
  >([]);
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

  const addMessage = (message: ConversationMessage) => {
    setConversationMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = async (
    message: string,
    complexity: number,
    mode: string,
    settings: ConversationSettings,
  ) => {
    setIsProcessing(true);
    setSessionData((prev) => ({
      ...prev,
      messageCount: prev.messageCount + 1,
    }));

    // Add user message
    const userMessage: ConversationMessage = {
      id: generateMessageId(),
      modelId: "user",
      modelName: "You",
      modelColor: "user",
      content: message,
      type: "message",
      timestamp: new Date(),
      isComplete: true,
    };
    addMessage(userMessage);

    // Set active models to thinking
    const activeModels = models.filter((m) => m.status !== "inactive");
    setModels((prev) =>
      prev.map((model) =>
        activeModels.find((am) => am.id === model.id)
          ? { ...model, status: "thinking" as const }
          : model,
      ),
    );

    // Start AI conversation
    await initiateAIConversation(
      userMessage,
      activeModels,
      complexity,
      mode,
      settings,
    );
    setIsProcessing(false);
  };

  const initiateAIConversation = async (
    userMessage: ConversationMessage,
    activeModels: AIModel[],
    complexity: number,
    mode: string,
    settings: ConversationSettings,
  ) => {
    // Show thinking bubbles if enabled
    if (settings.showThinking) {
      activeModels.forEach((model, index) => {
        setTimeout(() => {
          const thinkingMessage: ConversationMessage = {
            id: generateMessageId(),
            modelId: model.id,
            modelName: model.name,
            modelColor: model.color,
            content: "",
            type: "thinking",
            timestamp: new Date(),
            isComplete: false,
            reasoning: generateThinkingReasoning(
              model,
              userMessage.content,
              mode,
            ),
          };
          addMessage(thinkingMessage);
        }, index * 500);
      });
    }

    // Generate AI responses with potential interruptions
    for (let round = 0; round < 3; round++) {
      const respondingModels =
        round === 0
          ? activeModels
          : activeModels.filter(() => Math.random() > 0.4); // Some models might not respond in later rounds

      for (let i = 0; i < respondingModels.length; i++) {
        const model = respondingModels[i];
        const delay =
          settings.responseDelay * 1000 +
          Math.random() * 2000 +
          complexity * 300 +
          round * 1000;

        setTimeout(async () => {
          const response = await generateAIResponse(
            model,
            userMessage.content,
            conversationMessages,
            complexity,
            mode,
            settings,
          );
          addMessage(response);

          // Set model back to active
          setModels((prev) =>
            prev.map((m) =>
              m.id === model.id ? { ...m, status: "active" } : m,
            ),
          );

          // Chance for interruption
          if (settings.allowInterruptions && Math.random() > 0.7 && round < 2) {
            setTimeout(
              () => {
                const interruptingModel = activeModels.find(
                  (m) => m.id !== model.id && Math.random() > 0.5,
                );
                if (interruptingModel) {
                  handleInterruption(interruptingModel.id, response.id);
                }
              },
              1000 + Math.random() * 2000,
            );
          }
        }, delay);
      }
    }
  };

  const generateThinkingReasoning = (
    model: AIModel,
    userMessage: string,
    mode: string,
  ): string => {
    const reasoningTemplates = {
      gpt4: [
        "Let me break this down systematically...",
        "I need to consider the logical framework here...",
        "What are the key components I should analyze?",
      ],
      claude: [
        "I should consider the ethical dimensions of this...",
        "How can I provide a balanced perspective?",
        "What nuances might others miss?",
      ],
      gemini: [
        "What's a creative angle I could explore?",
        "How can I challenge conventional thinking here?",
        "What innovative solutions come to mind?",
      ],
    };

    const templates = reasoningTemplates[
      model.id as keyof typeof reasoningTemplates
    ] || ["Let me think about this carefully..."];
    return templates[Math.floor(Math.random() * templates.length)];
  };

  const generateAIResponse = async (
    model: AIModel,
    originalMessage: string,
    conversationHistory: ConversationMessage[],
    complexity: number,
    mode: string,
    settings: ConversationSettings,
  ): Promise<ConversationMessage> => {
    // Get recent context
    const recentMessages = conversationHistory.slice(-5);
    const referencedMessages = recentMessages
      .filter((msg) => msg.modelId !== model.id && msg.type === "message")
      .map((msg) => msg.id);

    // Generate response based on model personality
    const responses = generateResponseByPersonality(
      model,
      originalMessage,
      mode,
      recentMessages,
    );
    const selectedResponse =
      responses[Math.floor(Math.random() * responses.length)];

    return {
      id: generateMessageId(),
      modelId: model.id,
      modelName: model.name,
      modelColor: model.color,
      content: selectedResponse,
      type: "message",
      timestamp: new Date(),
      isComplete: true,
      referencesTo:
        referencedMessages.length > 0 ? referencedMessages : undefined,
      confidence: 0.7 + Math.random() * 0.3,
      reasoning: `${model.specialization}: ${model.personality}`,
    };
  };

  const generateResponseByPersonality = (
    model: AIModel,
    message: string,
    mode: string,
    context: ConversationMessage[],
  ): string[] => {
    const hasContext = context.some((msg) => msg.modelId !== model.id);

    const responseBank = {
      gpt4: hasContext
        ? [
            "Building on the previous analysis, I'd like to add a systematic framework...",
            "I notice some logical gaps in the discussion that we should address...",
            "Let me provide a structured counterpoint to what's been said...",
            "From a purely analytical standpoint, I see three key issues here...",
          ]
        : [
            "I'll approach this systematically by breaking it into core components...",
            "Let me establish a logical framework for analyzing this question...",
            "The most structured way to think about this is through first principles...",
          ],
      claude: hasContext
        ? [
            "I appreciate the perspectives shared, but I think we should also consider...",
            "While I agree with much of what's been said, there are ethical implications...",
            "This is a nuanced topic that deserves deeper consideration of...",
            "I'd like to offer a more balanced view that incorporates...",
          ]
        : [
            "This is a thoughtful question that requires careful consideration of multiple perspectives...",
            "I think it's important to approach this with both analytical rigor and ethical sensitivity...",
            "Let me explore the deeper implications and nuances of this topic...",
          ],
      gemini: hasContext
        ? [
            "Wait, what if we're thinking about this all wrong? What if...",
            "I love the direction this is heading! Let me add a creative twist...",
            "This reminds me of an innovative approach I've been considering...",
            "Actually, I disagree with the conventional wisdom here. Consider this...",
          ]
        : [
            "Ooh, this is exciting! Let me explore some unconventional angles...",
            "I'm immediately thinking of several innovative approaches we could take...",
            "What if we completely reimagined how to approach this problem?",
          ],
    };

    return (
      responseBank[model.id as keyof typeof responseBank] || [
        "That's an interesting perspective. Let me add my thoughts...",
      ]
    );
  };

  const handleInterruption = async (
    interruptingModelId: string,
    targetMessageId: string,
  ) => {
    const interruptingModel = models.find((m) => m.id === interruptingModelId);
    if (!interruptingModel) return;

    const interruptionMessage: ConversationMessage = {
      id: generateMessageId(),
      modelId: interruptingModel.id,
      modelName: interruptingModel.name,
      modelColor: interruptingModel.color,
      content: generateInterruptionResponse(interruptingModel),
      type: "interruption",
      timestamp: new Date(),
      isComplete: true,
      referencesTo: [targetMessageId],
    };

    addMessage(interruptionMessage);
  };

  const generateInterruptionResponse = (model: AIModel): string => {
    const interruptions = {
      gpt4: [
        "Hold on, I think there's a logical flaw in that reasoning...",
        "Wait, let me interject with a critical point...",
        "I need to stop you there - the data doesn't support that conclusion...",
      ],
      claude: [
        "Sorry to interrupt, but I think we need to consider the ethical implications...",
        "I hate to jump in, but there's an important perspective we're missing...",
        "Excuse me, but I think we should pause and consider...",
      ],
      gemini: [
        "Whoa whoa whoa! What if we're completely wrong about this?",
        "Plot twist! I just thought of something that changes everything...",
        "Hold up! I have a wild idea that might flip this whole discussion...",
      ],
    };

    const modelInterruptions = interruptions[
      model.id as keyof typeof interruptions
    ] || ["Actually, let me add something important here..."];

    return modelInterruptions[
      Math.floor(Math.random() * modelInterruptions.length)
    ];
  };

  const onInterruptRequest = (modelId: string, targetMessageId: string) => {
    const interruptingModel = models.find((m) => m.id === modelId);
    if (!interruptingModel) return;

    const interruptionMessage: ConversationMessage = {
      id: generateMessageId(),
      modelId: interruptingModel.id,
      modelName: interruptingModel.name,
      modelColor: interruptingModel.color,
      content: generateInterruptionResponse(interruptingModel),
      type: "interruption",
      timestamp: new Date(),
      isComplete: true,
      referencesTo: [targetMessageId],
    };

    addMessage(interruptionMessage);
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
    // Export conversation messages
    const exportData = {
      messages: conversationMessages,
      models: models,
      sessionData: sessionData,
      settings: conversationSettings,
    };
    console.log(`Exporting in ${format} format`, exportData, options);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const handleSaveConversation = () => {
    const conversationData = {
      messages: conversationMessages,
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
    messages: conversationMessages
      .filter((msg) => msg.modelId === model.id && msg.type === "message")
      .map((msg) => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        isComplete: msg.isComplete,
      })),
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
            conversationMessages={conversationMessages}
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

        {/* Unified Conversation Stream */}
        <ConversationStream
          messages={conversationMessages}
          activeModels={activeModels.map((m) => m.id)}
          isProcessing={isProcessing}
          onInterrupt={onInterruptRequest}
          className="min-h-96"
        />

        {/* Collaboration Status */}
        {activeModels.length > 1 && (
          <div className="p-4 rounded-xl glass border border-synapse-active/20 text-center">
            <div className="flex items-center justify-center space-x-2 text-synapse-active">
              <div className="w-2 h-2 bg-synapse-active rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                Neural network active • {activeModels.length} AIs collaborating
                •
                {
                  conversationMessages.filter((m) => m.type === "interruption")
                    .length
                }{" "}
                interruptions •
                {
                  conversationMessages.filter((m) => m.referencesTo?.length)
                    .length
                }{" "}
                cross-references
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
