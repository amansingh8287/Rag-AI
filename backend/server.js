import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { GoogleGenAI } from "@google/genai";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ========================================
// GEMINI
// ========================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const History = [];

// ========================================
// EMBEDDINGS
// ========================================

class GeminiEmbeddings {
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async embedQuery(text) {
    const response = await this.ai.models.embedContent({
      model: "gemini-embedding-2",

      contents: text,

      config: {
        outputDimensionality: 768,
      },
    });

    return response.embeddings[0].values;
  }
}

// ========================================
// CHAT API
// ========================================

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // ========================================
    // CREATE QUERY EMBEDDING
    // ========================================

    const embeddings = new GeminiEmbeddings();

    const queryVector = await embeddings.embedQuery(message);

    // ========================================
    // PINECONE
    // ========================================

    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    // ========================================
    // SEARCH
    // ========================================

    const searchResults = await pineconeIndex.query({
      topK: 3,

      vector: queryVector,

      includeMetadata: true,
    });

    // ========================================
    // FILTER RESULTS
    // ========================================

    const filteredMatches = searchResults.matches.filter(
      (match) => match.score > 0.65,
    );

    // ========================================
    // CONTEXT
    // ========================================

    const context = filteredMatches
      .map((match) => match.metadata.text)
      .join("\n\n---\n\n");

    // ========================================
    // GENERATE ANSWER
    // ========================================

    History.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: History,
      config: {
        systemInstruction: `You are a Data Structures and Algorithms expert.
      Rules:
       Normally give short and simple answers in 2-3 lines.
       If the user asks "briefly explain", "detail me explain", "explain properly", or similar, then give a detailed explanation.
       Keep answers easy to understand.
      
      Context: ${context}
      `,
      },
    });

    History.push({
      role: "model",
      parts: [{ text: response.text }],
    });

    // ========================================
    // SEND RESPONSE
    // ========================================

    res.json({
      answer: response.text,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      answer: "Something went wrong.",
    });
  }
});

// ========================================
// SERVER
// ========================================

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
