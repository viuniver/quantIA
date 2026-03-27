import { GoogleGenAI } from "@google/genai";

async function generateDemoVideo() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log("Starting video generation...");
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: 'A high-tech 3D animation showing an artificial intelligence scanning a complex architectural blueprint. Glowing light blue lines trace the walls and symbols. A digital table appears next to it, populating with quantities and costs. Modern, clean aesthetic with light blue and orange accents. Cinematic lighting.',
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      console.log("Generating video... checking again in 10 seconds");
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      console.log("VIDEO_URL_START");
      console.log(downloadLink);
      console.log("VIDEO_URL_END");
    } else {
      console.error("Video generation failed, no link returned.");
    }
  } catch (error) {
    console.error("Error generating video:", error);
  }
}

generateDemoVideo();
