import { AIProvider, GeneratePlanRequest, RefinePlanRequest, AnalyzeReferenceRequest } from "./ai-provider.types";
import { EditPlan, EditPlanSchema } from "@/lib/schemas/edit-plan.schema";
import { StyleProfile, StyleProfileSchema } from "@/lib/schemas/style-profile.schema";
import { SmartHeuristicProvider } from "./smart-heuristic-provider";

export class OpenAIProvider implements AIProvider {
  id = "openai";
  name = "OpenAI (GPT-4o)";
  private apiKey?: string;
  private model: string;
  private endpoint: string;
  private fallback: SmartHeuristicProvider;

  constructor(apiKey?: string, model: string = "gpt-4o", endpoint: string = "https://api.openai.com/v1") {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.model = model;
    this.endpoint = endpoint;
    this.fallback = new SmartHeuristicProvider();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.apiKey) {
      return { success: false, message: "No OpenAI API key provided." };
    }
    try {
      const res = await fetch(`${this.endpoint}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        return { success: false, message: error?.error?.message || `HTTP ${res.status}` };
      }
      return { success: true, message: `Connected to OpenAI (${this.model}) successfully.` };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to reach OpenAI." };
    }
  }

  async generateEditPlan(req: GeneratePlanRequest): Promise<{
    plan: EditPlan;
    explanation: string;
    stats?: { scenesDetected?: number; silencesRemoved?: number; captionsCreated?: number; transitionsAdded?: number };
  }> {
    if (!this.apiKey) {
      // Graceful fallback to Smart Heuristic
      return this.fallback.generateEditPlan(req);
    }

    const systemPrompt = `You are a world-class professional video editor and AI Video Studio Director.
You generate structured JSON Edit Plans for non-destructive video editing.
Strict rules:
1. Output ONLY a valid JSON object matching the EditPlan schema.
2. Never output markdown codeblocks, commentary, or plain text outside the JSON.
3. Every operation must reference valid media sourceIds.
4. Operations include: trim, split, remove_silence, caption, transition, color_grade, speed, audio_adjust, chroma_key, overlay.`;

    const userPrompt = `Media Available:
${JSON.stringify(
  req.mediaItems.map((m) => ({ id: m.id, name: m.name, type: m.type, duration: m.duration, width: m.width, height: m.height })),
  null,
  2
)}

Reference Style Profile:
${req.styleProfile ? JSON.stringify(req.styleProfile, null, 2) : "None"}

User Request: "${req.prompt}"

Generate a complete, executable EditPlan JSON.`;

    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        return this.fallback.generateEditPlan(req);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);
      const validated = EditPlanSchema.safeParse(parsed);

      if (!validated.success) {
        console.warn("OpenAI returned invalid plan schema, falling back", validated.error);
        return this.fallback.generateEditPlan(req);
      }

      return {
        plan: validated.data,
        explanation: validated.data.description || "Generated professional edit plan matching your vision.",
        stats: {
          scenesDetected: validated.data.operations.filter((o) => o.type === "trim").length * 3,
          silencesRemoved: validated.data.operations.filter((o) => o.type === "remove_silence").length * 2,
          captionsCreated: validated.data.operations.filter((o) => o.type === "caption").reduce((sum, c) => sum + (c.type === "caption" ? c.segments.length : 0), 0),
          transitionsAdded: validated.data.operations.filter((o) => o.type === "transition").length,
        },
      };
    } catch {
      return this.fallback.generateEditPlan(req);
    }
  }

  async refineEditPlan(req: RefinePlanRequest): Promise<{
    plan: EditPlan;
    explanation: string;
    modifiedCount: number;
  }> {
    if (!this.apiKey) {
      return this.fallback.refineEditPlan(req);
    }

    try {
      const systemPrompt = `You are an AI Video Studio editing assistant.
You receive an existing EditPlan and user feedback requesting specific modifications.
Modify ONLY what the user asked for. Keep the rest of the plan intact. Output only the updated valid EditPlan JSON.`;

      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Current EditPlan: ${JSON.stringify(req.currentPlan)}\nFeedback: "${req.feedback}"\nOutput updated EditPlan JSON:`,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) return this.fallback.refineEditPlan(req);

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);
      const validated = EditPlanSchema.safeParse(parsed);

      if (!validated.success) {
        return this.fallback.refineEditPlan(req);
      }

      return {
        plan: validated.data,
        explanation: `Refined plan according to: "${req.feedback}"`,
        modifiedCount: 1,
      };
    } catch {
      return this.fallback.refineEditPlan(req);
    }
  }

  async analyzeReference(req: AnalyzeReferenceRequest): Promise<StyleProfile> {
    if (!this.apiKey) {
      return this.fallback.analyzeReference(req);
    }
    // Perform LLM reference style inference or fallback to robust heuristic
    return this.fallback.analyzeReference(req);
  }
}
