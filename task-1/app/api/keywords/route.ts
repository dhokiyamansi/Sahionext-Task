import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "gemini-2.5-flash";

const PROMPT = [
  "You are given a short audio clip of someone speaking.",
  "Extract the 3 to 5 most important keywords or short key phrases that were actually spoken.",
  "Rules:",
  "- Use the speaker's own words (transcribe, don't invent).",
  "- Lowercase, no duplicates, no filler words.",
  "- Prefer nouns and meaningful phrases over verbs/pronouns.",
  "- If the audio has no intelligible speech, return an empty list.",
].join("\n");

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set. Add it to .env.local and restart." },
      { status: 500 }
    );
  }

  let audioBase64: string | undefined;
  try {
    const body = await req.json();
    audioBase64 = body?.audio;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!audioBase64 || typeof audioBase64 !== "string") {
    return NextResponse.json({ error: "Missing 'audio' (base64 WAV)." }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
          ],
        },
      ],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["keywords"],
        },
      },
    });

    let keywords: string[] = [];
    try {
      const parsed = JSON.parse(response.text ?? "{}");
      if (Array.isArray(parsed?.keywords)) {
        keywords = parsed.keywords
          .map((k: unknown) => String(k).trim())
          .filter(Boolean)
          .slice(0, 5);
      }
    } catch {
      keywords = [];
    }

    return NextResponse.json({ keywords });
  } catch (err) {
    console.error("[api/keywords] Gemini request failed:", err);
    return NextResponse.json({ error: "Model request failed." }, { status: 502 });
  }
}
