import { create } from "zustand";
import { ChatMessage, AIProviderConfig } from "@/features/ai/services/ai-provider.types";
import { EditPlan } from "@/lib/schemas/edit-plan.schema";

interface AIStoreState {
  conversation: ChatMessage[];
  currentPlan: EditPlan | null;
  planHistory: EditPlan[];
  isGenerating: boolean;
  providerConfig: AIProviderConfig;
  connectionStatus: "idle" | "testing" | "connected" | "failed";
  connectionMessage: string;

  // Actions
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  setCurrentPlan: (plan: EditPlan) => void;
  setIsGenerating: (generating: boolean) => void;
  setProviderConfig: (config: Partial<AIProviderConfig>) => void;
  setConnectionStatus: (status: "idle" | "testing" | "connected" | "failed", message?: string) => void;
  clearHistory: () => void;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "msg_init",
  sender: "ai",
  text: "Welcome to AI Video Studio. Upload your raw videos, music, and an optional reference video, then describe your vision or ask for a rough cut.",
  timestamp: Date.now(),
};

export const useAIStore = create<AIStoreState>((set) => ({
  conversation: [INITIAL_MESSAGE],
  currentPlan: null,
  planHistory: [],
  isGenerating: false,
  providerConfig: {
    provider: "smart_heuristic",
    model: "gpt-4o",
  },
  connectionStatus: "connected",
  connectionMessage: "Studio Intelligence Engine (Local) is active and ready.",

  addMessage: (msg) => {
    const newMessage: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    set((state) => ({
      conversation: [...state.conversation, newMessage],
    }));
  },

  setCurrentPlan: (plan) => {
    set((state) => ({
      currentPlan: plan,
      planHistory: [...state.planHistory, plan],
    }));
  },

  setIsGenerating: (isGenerating) => set({ isGenerating }),

  setProviderConfig: (config) => {
    set((state) => ({
      providerConfig: { ...state.providerConfig, ...config },
      connectionStatus: "idle",
      connectionMessage: "Provider updated. Click Test Connection to verify.",
    }));
  },

  setConnectionStatus: (connectionStatus, connectionMessage = "") => {
    set({ connectionStatus, connectionMessage });
  },

  clearHistory: () => set({ conversation: [INITIAL_MESSAGE], currentPlan: null, planHistory: [] }),
}));
