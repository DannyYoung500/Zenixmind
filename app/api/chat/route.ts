import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to use ZenixMind." }, { status: 401 });

    const body = await request.json() as {
      messages?: ChatMessage[];
      conversationId?: string | null;
      model?: string;
    };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const userMessage = [...messages].reverse().find((m) => m.role === "user" && m.content?.trim());

    if (!userMessage) return NextResponse.json({ error: "A message is required." }, { status: 400 });

    const apiKey = process.env.ZENIXMIND_AI_API_KEY;
    const baseUrl = (process.env.ZENIXMIND_AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const providerModel = process.env.ZENIXMIND_AI_MODEL;
    if (!apiKey || !providerModel) {
      return NextResponse.json({
        error: "ZenixMind is not connected to an AI provider yet. Add ZENIXMIND_AI_API_KEY and ZENIXMIND_AI_MODEL to the Vercel environment.",
      }, { status: 503 });
    }

    let conversationId = body.conversationId || null;
    if (conversationId) {
      const { data } = await supabase.from("conversations").select("id").eq("id", conversationId).eq("user_id", user.id).maybeSingle();
      if (!data) conversationId = null;
    }

    if (!conversationId) {
      const title = userMessage.content.trim().slice(0, 70);
      const { data, error } = await supabase.from("conversations").insert({
        user_id: user.id,
        title: title || "New conversation",
        model: body.model || "default",
      }).select("id").single();
      if (error) throw error;
      conversationId = data.id;
    }

    const { data: history } = await supabase.from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(100);

    const providerMessages = [
      { role: "system", content: "You are ZenixMind, a helpful AI assistant. Be accurate, clear and practical. Never claim to have used tools or sources you did not use." },
      ...((history || []) as ChatMessage[]),
      { role: "user" as const, content: userMessage.content.trim() },
    ];

    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: providerModel, messages: providerMessages, temperature: 0.7 }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      console.error("AI provider error:", await upstream.text());
      return NextResponse.json({ error: "The configured AI provider returned an error." }, { status: 502 });
    }

    const data = await upstream.json();
    const assistantMessage = data?.choices?.[0]?.message?.content;
    if (typeof assistantMessage !== "string" || !assistantMessage.trim()) {
      return NextResponse.json({ error: "The AI provider returned an empty response." }, { status: 502 });
    }

    const { error: messageError } = await supabase.from("messages").insert([
      { conversation_id: conversationId, user_id: user.id, role: "user", content: userMessage.content.trim() },
      { conversation_id: conversationId, user_id: user.id, role: "assistant", content: assistantMessage.trim() },
    ]);
    if (messageError) throw messageError;

    await supabase.from("conversations").update({ updated_at: new Date().toISOString(), model: body.model || "default" })
      .eq("id", conversationId).eq("user_id", user.id);

    return NextResponse.json({ message: assistantMessage.trim(), conversationId });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: "Unable to process the chat request." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to view conversations." }, { status: 401 });

    const searchParams = new URL(request.url).searchParams;
    if (searchParams.get("export") === "1") {
      const { data: conversations, error: conversationError } = await supabase.from("conversations").select("id,title,model,created_at,updated_at").eq("user_id", user.id).order("created_at", { ascending: true });
      if (conversationError) throw conversationError;
      const { data: messages, error: messageError } = await supabase.from("messages").select("conversation_id,role,content,created_at").eq("user_id", user.id).order("created_at", { ascending: true });
      if (messageError) throw messageError;
      return NextResponse.json({ exportedAt: new Date().toISOString(), conversations: conversations || [], messages: messages || [] });
    }
    const id = searchParams.get("conversation_id");
    if (!id) {
      const { data, error } = await supabase.from("conversations").select("id,title,model,created_at,updated_at")
        .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(50);
      if (error) throw error;
      return NextResponse.json({ conversations: data || [] });
    }

    const { data: conversation } = await supabase.from("conversations").select("id,title,model")
      .eq("id", id).eq("user_id", user.id).maybeSingle();
    if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

    const { data: messages, error } = await supabase.from("messages").select("id,role,content,created_at")
      .eq("conversation_id", id).eq("user_id", user.id).order("created_at", { ascending: true });
    if (error) throw error;
    return NextResponse.json({ conversation, messages: messages || [] });
  } catch (error) {
    console.error("Conversation route error:", error);
    return NextResponse.json({ error: "Unable to load conversations." }, { status: 500 });
  }
}


export async function DELETE() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to delete chats." }, { status: 401 });

    const { error: messageError } = await supabase.from("messages").delete().eq("user_id", user.id);
    if (messageError) throw messageError;
    const { error: conversationError } = await supabase.from("conversations").delete().eq("user_id", user.id);
    if (conversationError) throw conversationError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete chats error:", error);
    return NextResponse.json({ error: "Unable to delete chats." }, { status: 500 });
  }
}
