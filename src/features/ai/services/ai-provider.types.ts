import { EditPlan } from "@/lib/schemas/edit-plan.schema";
import { StyleProfile } from "@/lib/schemas/style-profile.schema";
import { ProjectSession } from "@/lib/schemas/project.schema";
import { MediaItem } from "@/lib/schemas/media.schema";

export interface AIProviderConfig {
  provider: "openai" | "anthropic" | "mcp" | "local" | "smart_heuristic";
  apiKey?: string;
  model?: string;
  endpoint?: string;
  mcpServerUrl?: string;
  mcpToken?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  timestamp: number;
  operationsApplied?: number;
  suggestedOperations?: string[];
  stats?: {
    scenesDetected?: number;
    silencesRemoved?: number;
    captionsCreated?: number;
    transitionsAdded?: number;
  };
}

export interface GeneratePlanRequest {
  prompt: string;
  mediaItems: MediaItem[];
  styleProfile?: StyleProfile;
  currentProject: ProjectSession;
}

export interface RefinePlanRequest {
  feedback: string;
  currentPlan: EditPlan;
  currentProject: ProjectSession;
  conversationHistory: ChatMessage[];
  mediaItems: MediaItem[];
}

export interface AnalyzeReferenceRequest {
  referenceMedia: MediaItem;
}

export interface AIProvider {
  id: string;
  name: string;
  testConnection(): Promise<{ success: boolean; message: string }>;
  generateEditPlan(req: GeneratePlanRequest): Promise<{ plan: EditPlan; explanation: string; stats?: ChatMessage["stats"] }>;
  refineEditPlan(req: RefinePlanRequest): Promise<{ plan: EditPlan; explanation: string; modifiedCount: number }>;
  analyzeReference(req: AnalyzeReferenceRequest): Promise<StyleProfile>;
}
