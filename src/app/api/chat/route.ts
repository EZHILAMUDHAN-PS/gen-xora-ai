import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message , image} = await req.json();
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

   const response =
  await ai.models.generateContent({
    model: "gemini-2.5-flash",
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

  return NextResponse.json({
    reply: JSON.stringify(error, null, 2),
  });
}
}