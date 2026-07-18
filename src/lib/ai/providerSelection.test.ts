import { afterEach, describe, expect, it, vi } from "vitest";
import { getAIProvider, getAIProviderForInput } from "@/lib/ai";
import type { BaseAnalyzeInput } from "@/lib/ai/types";

function buildInput(userMode?: BaseAnalyzeInput["userMode"]): BaseAnalyzeInput {
  return {
    requestId: "test-request",
    locale: "he-IL",
    preferredResponseLanguage: "he",
    userMode,
    files: [],
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI provider selection", () => {
  it("uses mock when no GEMINI_API_KEY is configured", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("AI_PROVIDER", "");

    expect(getAIProvider().id).toBe("mock");
  });

  it("uses gemini automatically when GEMINI_API_KEY is set", () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "");

    expect(getAIProvider().id).toBe("gemini");
    expect(getAIProviderForInput(buildInput("basic")).id).toBe("gemini");
    expect(getAIProviderForInput(buildInput("authenticated")).id).toBe("gemini");
  });

  it("demo mode never reaches the paid provider, even with a key configured", () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "");

    expect(getAIProviderForInput(buildInput("demo")).id).toBe("mock");
  });

  it("AI_PROVIDER=mock overrides a configured key (testing escape hatch)", () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("AI_PROVIDER", "mock");

    expect(getAIProvider().id).toBe("mock");
  });

  it("AI_ENABLED=false disables live analysis entirely", () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("AI_ENABLED", "false");

    expect(getAIProvider().id).toBe("mock");
  });
});
