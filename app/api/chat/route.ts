import { NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  try {
    const body = await request.json() as { messages?: ChatMessage[]; model?: string };
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!messages.length) {
      return NextResponse.json({ error: "A message is required." }, { status: 400 });
    }

    const apiKey = process.env.ZENIXMIND_AI_API_KEY;
    const baseUrl = (process.env.ZENIXMIND_AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.ZENIXMIND_AI_MODEL || "zenixmind-default";

    if (!apiKey) {
      return NextResponse.json({
        message: "The ZenixMind chat interface is connected and ready. Add ZENIXMIND_AI_API_KEY in Vercel and choose a model with ZENIXMIND_AI_MODEL to activate live AI responses.",
      });
    }

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are ZenixMind, a helpful AI assistant. Be clear, accurate, practical and concise. Do not claim to have used tools or sources you did not actually use.",
          },
          ...messages,
        ],
        temperature: 0.7,
      }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("AI provider error:", detail);
      return NextResponse.json({ error: "The configured AI provider returned an error. Check the provider, model and API key." }, { status: 502 });
    }

    const data = await upstream.json();
    const message = data?.choices?.[0]?.message?.content;

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "The AI provider returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: "Unable to process the chat request." }, { status: 500 });
  }
}
