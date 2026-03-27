import { GoogleGenAI } from "@google/genai";

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("NO_API_KEY");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: 'A cinematic 3D animation of an AI interface analyzing a blueprint. Light blue glowing lines scan the drawing. Orange highlights appear on specific symbols. A spreadsheet pops up with data. Clean, professional, high-tech aesthetic. Light blue and white background.',
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    console.log("VIDEO_URL:" + operation.response?.generatedVideos?.[0]?.video?.uri);
  } catch (e) {
    console.log("ERROR:" + e.message);
  }
}

run();
