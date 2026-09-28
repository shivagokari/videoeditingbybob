import { AIProvider, AIProviderConfig } from "./ai-provider.types";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { MCPProvider } from "./mcp-provider";
import { SmartHeuristicProvider } from "./smart-heuristic-provider";

export class AIProviderFactory {
  static getProvider(config: AIProviderConfig): AIProvider {
    switch (config.provider) {
      case "openai":
        return new OpenAIProvider(config.apiKey, config.model, config.endpoint);
      case "anthropic":
        return new AnthropicProvider(config.apiKey, config.model, config.endpoint);
      case "mcp":
        return new MCPProvider(config.mcpServerUrl, config.mcpToken);
      case "local":
      case "smart_heuristic":
      default:
        return new SmartHeuristicProvider();
    }
  }
}
