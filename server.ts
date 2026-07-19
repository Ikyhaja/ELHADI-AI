import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits to support base64 encoded images
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Shared Gemini client lazy initialization
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Chat completion endpoint utilizing Gemini SDK on server-side
app.post("/api/chat", async (req, res) => {
  try {
    const { message, imageBase64, imageMimeType, model, temperature } = req.body;
    
    // Validate inputs
    const selectedModel = model || "gemini-3.5-flash";
    const temp = typeof temperature === "number" ? temperature : 0.7;

    const ai = getGeminiClient();

    // Prepare content parts list
    const parts: any[] = [];
    
    // Append base64 image if uploaded
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
    }

    // Append textual prompt
    parts.push({
      text: message || (imageBase64 ? "Analisis gambar ini secara detail." : "Halo!"),
    });

    // Call server-side generateContent
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: { parts },
      config: {
        systemInstruction: "Kamu adalah ELHADI AI Pro Edition, sebuah sistem AI asisten cerdas berkinerja tinggi yang dikembangkan oleh ikysaputra. Berikan respon dalam bahasa Indonesia yang sangat informatif, ramah, interaktif, rapi, dan terstruktur dengan format markdown yang indah.",
        temperature: temp,
      },
    });

    res.json({
      success: true,
      text: response.text || "Tidak ada respon tertulis yang dihasilkan oleh model.",
    });

  } catch (error: any) {
    console.error("Gemini SDK Generation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Terjadi kegagalan komunikasi internal dengan Gemini API.",
    });
  }
});

// Setup server with Vite middleware in development or static assets in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ELHADI AI Backend] Server successfully running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
