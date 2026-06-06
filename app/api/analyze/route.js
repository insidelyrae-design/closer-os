import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { system, user, maxTokens = 1400 } = await req.json();

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });

    return NextResponse.json({ result: message.content[0].text });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
