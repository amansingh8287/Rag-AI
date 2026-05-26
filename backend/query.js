import * as dotenv from "dotenv";
dotenv.config();

import readlineSync from "readline-sync";

import { GoogleGenAI } from "@google/genai";

import { Pinecone } from "@pinecone-database/pinecone";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const History = [];

// ========================================
// GEMINI EMBEDDINGS
// ========================================

class GeminiEmbeddings {
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  // ========================================
  // EMBED QUERY
  // ========================================

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
// MAIN CHAT FUNCTION
// ========================================

async function chatting(question) {
  // ========================================
  // EMBEDDING
  // ========================================

  const embeddings = new GeminiEmbeddings();
  const queryVector = await embeddings.embedQuery(question);

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

  const filteredMatches = searchResults.matches.filter(
    (match) => match.score > 0.65,
  );

  const context = filteredMatches
    .map((match) => match.metadata.text)
    .join("\n\n---\n\n");

  // ========================================
  // GEMINI CHAT MODEL
  // ========================================
  History.push({
    role: "user",
    parts: [{ text: question }],
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

  console.log("\n");
  console.log(response.text);
}

// ========================================
// MAIN LOOP
// ========================================

async function main() {
  const userProblem = readlineSync.question("Ask me anything--> ");
  await chatting(userProblem);
  main();
}

main();
