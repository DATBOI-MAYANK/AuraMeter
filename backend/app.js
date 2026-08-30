import "dotenv/config"; 
import express from "express";
import multer from "multer";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import cors from "cors"

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const raterSchema = z.object({
  score: z.number().min(0).max(100).describe("The calculated rating from 0 to 100."),
  rank: z.enum(["E", "D", "C", "B", "A", "S", "SS", "SSS", "SSS+"]).describe("The assigned rank."),
  comment: z.string().describe("A dramatic anime-style one-liner reacting to the rank."),
});

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
});

const structuredLlm = llm.withStructuredOutput(raterSchema, {
  name: "AuraAppraiser",
});

const systemPrompt = `You are an advanced appraiser analyzing a target. 
Evaluate the provided image and generate a rating from 0 to 100. 

Assign a rank strictly based on this scale:
- 0-19: E (Example vibe: "Is this even worth my time?")
- 20-39: D (Example vibe: "Mere cannon fodder.")
- 40-59: C (Example vibe: "Average at best.")
- 60-74: B (Example vibe: "Not bad, you have potential.")
- 75-84: A (Example vibe: "A formidable presence!")
- 85-92: S (Example vibe: "Incredible... this aura is overwhelming!")
- 93-97: SS (Example vibe: "Monstrous! A walking disaster class!")
- 98-99: SSS (Example vibe: "A literal god amongst mortals.")
- 100: SSS+ (Example vibe: "ERROR: SCOUTER BROKEN. UNMEASURABLE.")

Output the score, the matching rank, and a unique dramatic tagline.`;

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No image uploaded");
    }

    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype; // Fixed typo: mimiType -> mimeType
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;


    const response = await structuredLlm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage({
        content: [{ type: "image_url", image_url: imageDataUrl }],
      }),
    ]);

   
   
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing image.");
  }
});

app.listen(8000, () => {
  console.log("Server Running on port 8000....");
});