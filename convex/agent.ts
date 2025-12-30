import { components } from "./_generated/api";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";

const agent = new Agent(components.agent, {
    name: "Basic Agent",
    languageModel: openai.chat("gpt-4o-mini"),
});