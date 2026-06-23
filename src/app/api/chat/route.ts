import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
   const { message, image, model } = await req.json();
    const selectedModel = model === "pro" ? "gemini-2.5-pro" : "gemini-2.0-flash";
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

  const response =
  await ai.models.generateContent({
    model: selectedModel,
    contents: image
      ? [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: image.split(",")[1],
            },
          },
          {
            text:
              message ||
              "Describe this image",
          },
        ]
      : message,
  });

    return NextResponse.json({
      reply: response.text,
    });
  } catch (error: any) {
  console.error(error);

  return NextResponse.json(
  {
    reply:
      error?.message ||
      "Gemini API Error",
  },
  { status: 500 }
);
}
}