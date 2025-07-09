import { ThreadedMessage } from "./ThreadedConversationStream";

export interface ConversationTiming {
  thinkingDelay: [number, number]; // min, max seconds
  responseDelay: [number, number];
  interruptionChance: number;
  subResponseChance: number;
  reactionDelay: [number, number];
}

export interface AIPersonality {
  id: string;
  name: string;
  thinkingSpeed: "fast" | "medium" | "slow";
  interruptiveness: "low" | "medium" | "high";
  agreeableness: "low" | "medium" | "high";
  creativity: "low" | "medium" | "high";
  responsePatterns: string[];
  interruptionPatterns: string[];
  subResponseTriggers: string[];
}

export class ConversationOrchestrator {
  private models: AIPersonality[];
  private timing: ConversationTiming;
  private activeTimeouts: Set<NodeJS.Timeout> = new Set();

  constructor(models: AIPersonality[], timing: ConversationTiming) {
    this.models = models;
    this.timing = timing;
  }

  private getRandomDelay(range: [number, number]): number {
    return Math.random() * (range[1] - range[0]) + range[0];
  }

  private getPersonalityMultiplier(
    personality: AIPersonality,
    type: "thinking" | "response",
  ) {
    const speed = personality.thinkingSpeed;
    const multipliers = {
      fast: 0.6,
      medium: 1.0,
      slow: 1.5,
    };
    return multipliers[speed];
  }

  async simulateNaturalConversation(
    userMessage: ThreadedMessage,
    activeModelIds: string[],
    complexity: number,
    mode: string,
    onMessageUpdate: (message: ThreadedMessage) => void,
    onSubResponseCreated: (message: ThreadedMessage, parentId: string) => void,
  ): Promise<void> {
    const activeModels = this.models.filter((m) =>
      activeModelIds.includes(m.id),
    );

    // Phase 1: Thinking phase (overlapping)
    const thinkingPromises = activeModels.map(async (model, index) => {
      const thinkingDelay =
        this.getRandomDelay(this.timing.thinkingDelay) *
        this.getPersonalityMultiplier(model, "thinking") *
        1000;

      // Stagger thinking starts for more natural feel
      const staggerDelay = index * 300 + Math.random() * 500;

      return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          const thinkingMessage: ThreadedMessage = {
            id: `thinking-${model.id}-${Date.now()}`,
            modelId: model.id,
            modelName: model.name,
            modelColor: model.id as any,
            content: "",
            type: "thinking",
            timestamp: new Date(),
            isComplete: false,
            reasoning: this.generateThinkingReasoning(
              model,
              userMessage.content,
              mode,
            ),
          };

          onMessageUpdate(thinkingMessage);

          // Complete thinking after delay
          const completeTimeout = setTimeout(() => {
            resolve();
          }, thinkingDelay);

          this.activeTimeouts.add(completeTimeout);
        }, staggerDelay);

        this.activeTimeouts.add(timeout);
      });
    });

    // Wait for thinking to overlap naturally
    await Promise.all(thinkingPromises);

    // Phase 2: Initial responses (staggered, not simultaneous)
    const responseOrder = this.determineResponseOrder(activeModels, mode);

    for (let i = 0; i < responseOrder.length; i++) {
      const model = responseOrder[i];
      const responseDelay =
        this.getRandomDelay(this.timing.responseDelay) *
        this.getPersonalityMultiplier(model, "response") *
        1000;

      // Add natural gaps between responses
      const gapDelay = i === 0 ? 500 : Math.random() * 2000 + 1000;

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(async () => {
          const response = await this.generateResponse(
            model,
            userMessage,
            [],
            complexity,
            mode,
          );
          onMessageUpdate(response);

          // Chance for immediate sub-responses from other models
          setTimeout(
            () => {
              this.handleSubResponses(
                response,
                activeModels,
                onSubResponseCreated,
              );
            },
            1000 + Math.random() * 2000,
          );

          resolve();
        }, gapDelay);

        this.activeTimeouts.add(timeout);
      });
    }

    // Phase 3: Natural follow-up interactions
    setTimeout(
      () => {
        this.simulateFollowUpInteractions(
          activeModels,
          onMessageUpdate,
          onSubResponseCreated,
        );
      },
      3000 + Math.random() * 2000,
    );
  }

  private determineResponseOrder(
    models: AIPersonality[],
    mode: string,
  ): AIPersonality[] {
    // Sort by personality traits and mode
    return [...models].sort((a, b) => {
      if (mode === "debate" || mode === "devils-advocate") {
        // More aggressive models first in debate
        const aScore =
          a.interruptiveness === "high"
            ? 3
            : a.interruptiveness === "medium"
              ? 2
              : 1;
        const bScore =
          b.interruptiveness === "high"
            ? 3
            : b.interruptiveness === "medium"
              ? 2
              : 1;
        return bScore - aScore;
      } else {
        // Random order for natural conversation
        return Math.random() - 0.5;
      }
    });
  }

  private async handleSubResponses(
    parentMessage: ThreadedMessage,
    allModels: AIPersonality[],
    onSubResponseCreated: (message: ThreadedMessage, parentId: string) => void,
  ): Promise<void> {
    const otherModels = allModels.filter((m) => m.id !== parentMessage.modelId);

    for (const model of otherModels) {
      // Check if model should create a sub-response
      const shouldRespond =
        Math.random() < this.timing.subResponseChance &&
        this.shouldCreateSubResponse(model, parentMessage);

      if (shouldRespond) {
        const delay = this.getRandomDelay(this.timing.reactionDelay) * 1000;

        setTimeout(async () => {
          const subResponse = await this.generateSubResponse(
            model,
            parentMessage,
          );
          onSubResponseCreated(subResponse, parentMessage.id);
        }, delay);
      }
    }
  }

  private shouldCreateSubResponse(
    model: AIPersonality,
    parentMessage: ThreadedMessage,
  ): boolean {
    // Check if parent message contains triggers for this model
    const content = parentMessage.content.toLowerCase();
    return model.subResponseTriggers.some((trigger) =>
      content.includes(trigger.toLowerCase()),
    );
  }

  private async simulateFollowUpInteractions(
    models: AIPersonality[],
    onMessageUpdate: (message: ThreadedMessage) => void,
    onSubResponseCreated: (message: ThreadedMessage, parentId: string) => void,
  ): Promise<void> {
    // Simulate natural conversation continuation with decreasing probability
    let continuationChance = 0.4;
    let round = 0;

    while (continuationChance > 0.1 && round < 3) {
      for (const model of models) {
        if (Math.random() < continuationChance) {
          const delay = Math.random() * 4000 + 2000; // 2-6 seconds

          setTimeout(async () => {
            const followUp = await this.generateFollowUpMessage(model, round);
            onMessageUpdate(followUp);
          }, delay);
        }
      }

      continuationChance *= 0.6; // Decrease chance each round
      round++;

      // Wait before next round
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  private generateThinkingReasoning(
    model: AIPersonality,
    userMessage: string,
    mode: string,
  ): string {
    const reasoningTemplates = {
      gpt4: [
        "Let me analyze this systematically...",
        "I need to break this down into components...",
        "What's the logical framework here?",
        "How can I structure this response effectively?",
      ],
      claude: [
        "I should consider multiple perspectives here...",
        "What are the ethical implications?",
        "How can I provide a balanced view?",
        "I want to be thoughtful about this response...",
      ],
      gemini: [
        "What's a creative angle I could explore?",
        "How can I challenge conventional thinking?",
        "What innovative ideas come to mind?",
        "Let me think outside the box...",
      ],
    };

    const templates = reasoningTemplates[
      model.id as keyof typeof reasoningTemplates
    ] || ["Let me think about this carefully..."];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private async generateResponse(
    model: AIPersonality,
    userMessage: ThreadedMessage,
    context: ThreadedMessage[],
    complexity: number,
    mode: string,
  ): Promise<ThreadedMessage> {
    const responses = this.getResponsesByPersonality(
      model,
      userMessage.content,
      mode,
    );
    const selectedResponse =
      responses[Math.floor(Math.random() * responses.length)];

    return {
      id: `msg-${model.id}-${Date.now()}`,
      modelId: model.id,
      modelName: model.name,
      modelColor: model.id as any,
      content: selectedResponse,
      type: "message",
      timestamp: new Date(),
      isComplete: true,
      confidence: 0.7 + Math.random() * 0.3,
      reasoning: `${model.name} analysis: ${this.generateDetailedReasoning(model, mode)}`,
    };
  }

  private async generateSubResponse(
    model: AIPersonality,
    parentMessage: ThreadedMessage,
  ): Promise<ThreadedMessage> {
    const subResponses = [
      "Actually, I have a different perspective on this...",
      "Wait, that reminds me of something important...",
      "I'd like to add a quick point here...",
      "Building on that thought...",
      "Hold on, what if we considered...",
    ];

    const personalizedResponses = this.getSubResponsesByPersonality(
      model,
      parentMessage.content,
    );
    const allResponses = [...subResponses, ...personalizedResponses];
    const selectedResponse =
      allResponses[Math.floor(Math.random() * allResponses.length)];

    return {
      id: `sub-${model.id}-${Date.now()}`,
      parentId: parentMessage.id,
      modelId: model.id,
      modelName: model.name,
      modelColor: model.id as any,
      content: selectedResponse,
      type: "sub-response",
      timestamp: new Date(),
      isComplete: true,
      isApproved: false,
    };
  }

  private async generateFollowUpMessage(
    model: AIPersonality,
    round: number,
  ): Promise<ThreadedMessage> {
    const followUps = [
      "Actually, I've been thinking more about this...",
      "Something just occurred to me...",
      "I want to circle back to something we discussed...",
      "This conversation is making me realize...",
      "Oh, and another thing...",
    ];

    return {
      id: `followup-${model.id}-${Date.now()}`,
      modelId: model.id,
      modelName: model.name,
      modelColor: model.id as any,
      content: followUps[Math.floor(Math.random() * followUps.length)],
      type: "message",
      timestamp: new Date(),
      isComplete: true,
    };
  }

  private getResponsesByPersonality(
    model: AIPersonality,
    userMessage: string,
    mode: string,
  ): string[] {
    const responseBank = {
      gpt4: [
        "Let me approach this systematically by breaking it into key components...",
        "I'll analyze this using a structured framework...",
        "From a logical standpoint, I see several important aspects...",
        "Let me organize my thoughts on this step by step...",
      ],
      claude: [
        "This is a thoughtful question that deserves careful consideration...",
        "I appreciate the complexity of this issue. Let me explore multiple angles...",
        "I think it's important to consider both the practical and ethical dimensions...",
        "This topic has several layers worth exploring...",
      ],
      gemini: [
        "What an interesting challenge! Let me explore some creative possibilities...",
        "This makes me think of some innovative approaches we could try...",
        "I love questions like this because they let us think outside the box...",
        "Here's a fresh perspective that might surprise you...",
      ],
    };

    return (
      responseBank[model.id as keyof typeof responseBank] || [
        "That's an interesting point. Let me share my thoughts...",
      ]
    );
  }

  private getSubResponsesByPersonality(
    model: AIPersonality,
    parentContent: string,
  ): string[] {
    const subResponseBank = {
      gpt4: [
        "From an analytical perspective, I'd add that...",
        "The data suggests we should also consider...",
        "Logically, this leads me to think...",
      ],
      claude: [
        "I want to respectfully offer another viewpoint...",
        "This raises some important ethical questions about...",
        "I think we should also consider the broader implications...",
      ],
      gemini: [
        "Plot twist: what if we completely flipped this idea?",
        "This sparks a wild idea - what if...",
        "I'm getting creative vibes from this - consider...",
      ],
    };

    return (
      subResponseBank[model.id as keyof typeof subResponseBank] || [
        "I'd like to add something to that...",
      ]
    );
  }

  private generateDetailedReasoning(
    model: AIPersonality,
    mode: string,
  ): string {
    return `Applying ${model.thinkingSpeed} analysis with ${model.creativity} creativity in ${mode} mode`;
  }

  cleanup(): void {
    this.activeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.activeTimeouts.clear();
  }
}
