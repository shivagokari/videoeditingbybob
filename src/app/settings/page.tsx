"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/common/header";
import { Button } from "@/components/ui/button";
import { useAIStore } from "@/lib/state/use-ai-store";
import { AIProviderConfig } from "@/features/ai/services/ai-provider.types";
import {
  ArrowLeft,
  Sparkles,
  Key,
  Server,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const { providerConfig, setProviderConfig, connectionStatus, setConnectionStatus, connectionMessage } = useAIStore();

  const [provider, setProvider] = useState<AIProviderConfig["provider"]>(providerConfig.provider || "smart_heuristic");
  const [apiKey, setApiKey] = useState(providerConfig.apiKey || "");
  const [model, setModel] = useState(providerConfig.model || "gpt-4o");
  const [mcpServerUrl, setMcpServerUrl] = useState(providerConfig.mcpServerUrl || "http://localhost:3001/mcp");
  const [mcpToken, setMcpToken] = useState(providerConfig.mcpToken || "");
  const [customEndpoint, setCustomEndpoint] = useState(providerConfig.endpoint || "");
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus("testing", "Contacting provider...");

    try {
      const config: AIProviderConfig = {
        provider,
        apiKey: apiKey.trim(),
        model,
        endpoint: customEndpoint.trim() || undefined,
        mcpServerUrl: mcpServerUrl.trim() || undefined,
        mcpToken: mcpToken.trim() || undefined,
      };

      const res = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (data.success) {
        setConnectionStatus("connected", data.message || "Connected successfully.");
      } else {
        setConnectionStatus("failed", data.message || "Failed to authenticate.");
      }
    } catch (err: any) {
      setConnectionStatus("failed", err.message || "Connection timeout.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setProviderConfig({
      provider,
      apiKey: apiKey.trim(),
      model,
      endpoint: customEndpoint.trim() || undefined,
      mcpServerUrl: mcpServerUrl.trim() || undefined,
      mcpToken: mcpToken.trim() || undefined,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-studio-950 text-white flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link href="/editor" className="flex items-center gap-1.5 text-xs text-studio-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Video Editor</span>
          </Link>

          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Keys Stay Private • Never Saved to Public Storage
          </span>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-1 border-b border-studio-800 pb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-blue" />
            AI Provider & Engine Configuration
          </h1>
          <p className="text-xs text-studio-400">
            Switch between OpenAI, Claude, Custom MCP, or Studio Intelligence at any time. The editor remains completely usable even without external API keys.
          </p>
        </div>

        {/* Provider Cards */}
        <div className="flex flex-col gap-4 bg-studio-900/60 border border-studio-800 rounded-xl p-5">
          <label className="text-xs font-semibold text-studio-300 uppercase tracking-wider">
            Select Active AI Provider
          </label>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: "smart_heuristic", name: "Studio Intelligence", desc: "Built-in / Offline Engine" },
              { id: "openai", name: "OpenAI", desc: "GPT-4o & GPT-4o-mini" },
              { id: "anthropic", name: "Anthropic", desc: "Claude 3.5 Sonnet" },
              { id: "mcp", name: "Custom MCP", desc: "External Tool Server" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id as any)}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  provider === p.id
                    ? "bg-accent-blue/15 border-accent-blue text-white ring-1 ring-accent-blue/40"
                    : "bg-studio-950 border-studio-800 text-studio-300 hover:border-studio-700 hover:bg-studio-900"
                }`}
              >
                <span className="text-xs font-bold text-white">{p.name}</span>
                <span className="text-[10px] text-studio-400">{p.desc}</span>
              </button>
            ))}
          </div>

          {/* Provider Specific Inputs */}
          {provider === "smart_heuristic" && (
            <div className="p-4 rounded-lg bg-studio-950/80 border border-studio-800 text-xs text-studio-300 leading-relaxed">
              <span className="font-semibold text-emerald-400 block mb-1">
                ✓ Ready Out-of-the-Box
              </span>
              Studio Intelligence runs locally in the browser with full support for prompt-to-edit, silence detection, hook trimming, dynamic caption generation, cinematic color presets, and reference style extraction without requiring an API key.
            </div>
          )}

          {provider === "openai" && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-studio-300">OpenAI API Key</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-studio-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-studio-950 border border-studio-700/80 focus:border-accent-blue rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-studio-300">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-studio-950 border border-studio-700/80 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-blue"
                >
                  <option value="gpt-4o">gpt-4o (High Intelligence & Vision)</option>
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast & Cost-Efficient)</option>
                </select>
              </div>
            </div>
          )}

          {provider === "anthropic" && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-studio-300">Anthropic API Key</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-studio-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-studio-950 border border-studio-700/80 focus:border-accent-blue rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-studio-300">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-studio-950 border border-studio-700/80 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-accent-blue"
                >
                  <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022</option>
                  <option value="claude-3-haiku-20240307">claude-3-haiku-20240307</option>
                </select>
              </div>
            </div>
          )}

          {provider === "mcp" && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-studio-300">MCP Server URL</label>
                <div className="relative">
                  <Server className="w-4 h-4 text-studio-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={mcpServerUrl}
                    onChange={(e) => setMcpServerUrl(e.target.value)}
                    placeholder="http://localhost:3001/mcp"
                    className="w-full bg-studio-950 border border-studio-700/80 focus:border-accent-blue rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-studio-300">MCP Token (Optional)</label>
                <input
                  type="password"
                  value={mcpToken}
                  onChange={(e) => setMcpToken(e.target.value)}
                  placeholder="Bearer token"
                  className="w-full bg-studio-950 border border-studio-700/80 focus:border-accent-blue rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Connection Status & Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-studio-800">
            <div className="flex items-center gap-2">
              {connectionStatus === "connected" && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  {connectionMessage || "Connected"}
                </span>
              )}
              {connectionStatus === "failed" && (
                <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                  <XCircle className="w-4 h-4" />
                  {connectionMessage || "Connection failed"}
                </span>
              )}
              {connectionStatus === "testing" && (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing connection...
                </span>
              )}
              {connectionStatus === "idle" && (
                <span className="text-xs text-studio-500">Not verified yet</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="text-xs"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Test Connection"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                className="text-xs font-semibold gap-1.5"
              >
                {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
                {saveSuccess ? "Saved!" : "Save Configuration"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
