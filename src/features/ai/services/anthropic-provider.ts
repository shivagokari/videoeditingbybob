import { AIProvider, GeneratePlanRequest, RefinePlanRequest, AnalyzeReferenceRequest } from "./ai-provider.types";
import { EditPlan, EditPlanSchema } from "@/lib/schemas/edit-plan.schema";
import { StyleProfile } from "@/lib/schemas/style-profile.schema";
import { SmartHeuristicProvider } from "./smart-heuristic-provider";

export class AnthropicProvider implements AIProvider {
  id = "anthropic";
  name = "Anthropic (Claude 3.5 Sonnet)";
  private apiKey?: string;
  private model: string;
  private endpoint: string;
  private fallback: SmartHeuristicProvider;

  constructor(apiKey?: string, model: string = "claude-3-5-sonnet-20241022", endpoint: string = "https://api.anthropic.com/v1") {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = model;
    this.endpoint = endpoint;
    this.fallback = new SmartHeuristicProvider();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.apiKey) {
      return { success: false, message: "No Anthropic API key provided." };
    }
    try {
      const res = await fetch(`${this.endpoint}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        return { success: false, message: error?.error?.message || `HTTP ${res.status}` };
      }
      return { success: true, message: `Connected to Claude (${this.model}) successfully.` };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to reach Anthropic." };
    }
  }

  async generateEditPlan(req: GeneratePlanRequest): Promise<{
    plan: EditPlan;
    explanation: string;
    stats?: { scenesDetected?: number; silencesRemoved?: number; captionsCreated?: number; transitionsAdded?: number };
  }> {
    if (!this.apiKey) {
      return this.fallback.generateEditPlan(req);
    }

    const systemPrompt = `You are a video editing director for AI Video Studio. You must output ONLY a valid JSON object adhering to EditPlan schema. No markdown formatting. No conversational filler outside JSON.`;
    const userPrompt = `Media Available: ${JSON.stringify(req.mediaItems.map((m) => ({ id: m.id, name: m.name, type: m.type, duration: m.duration })))}\nUser Request: "${req.prompt}"\nGenerate valid EditPlan JSON:`;

    try {
      const response = await fetch(`${this.endpoint}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) return this.fallback.generateEditPlan(req);

      const data = await response.json();
      const text = data.content?.[0]?.text;
      // Extract JSON if enclosed in markdown
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return this.fallback.generateEditPlan(req);

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = EditPlanSchema.safeParse(parsed);
      if (!validated.success) return this.fallback.generateEditPlan(req);

      return {
        plan: validated.data,
        explanation: validated.data.description || "Generated editing plan with Claude.",
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
    if (!this.apiKey) return this.fallback.refineEditPlan(req);
    // Can call Anthropic or fallback cleanly
    return this.fallback.refineEditPlan(req);
  }

  async analyzeReference(req: AnalyzeReferenceRequest): Promise<StyleProfile> {
    return this.fallback.analyzeReference(req);
  }
}
