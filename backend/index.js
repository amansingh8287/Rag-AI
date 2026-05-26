import * as dotenv from "dotenv";
dotenv.config();

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pinecone } from "@pinecone-database/pinecone";
// import { PineconeStore } from "@langchain/pinecone";
import { GoogleGenAI } from "@google/genai";

// Custom Gemini Embeddings Class
class GeminiEmbeddings {
  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async embedDocuments(texts) {
    const response = await this.ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: texts,
      config: {
        outputDimensionality: 768,
      },
    });

    return response.embeddings.map((e) => e.values);
  }

  async embedQuery(text) {
    const response = await this.ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: [text],
      config: {
        outputDimensionality: 768,
      },
    });

    return response.embeddings[0].values;
  }
}
async function indexDocument() {
  try {
    // =========================
    // LOAD PDF
    // =========================

    const PDF_PATH = "./Dsa.pdf";

    const pdfLoader = new PDFLoader(PDF_PATH);

    const rawDocs = await pdfLoader.load();

    console.log("pdf loaded");

    // =========================
    // SPLIT DOCUMENT
    // =========================

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);

    console.log("chunk complete:", chunkedDocs.length);

    // =========================
    // GEMINI EMBEDDINGS
    // =========================

    const embeddings = new GeminiEmbeddings();
    console.log("vector embedding");

    // =========================
    // PINECONE
    // =========================

    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    console.log("pine conf");


    // =========================
    // CREATE VECTORS
    // =========================

    const vectors = [];

    for (let i = 0; i < chunkedDocs.length; i++) {
      const text = chunkedDocs[i].pageContent;

      // skip empty chunks
      if (!text || text.trim() === "") continue;

      // create single embedding
      const embedding = await embeddings.embedQuery(text);

      vectors.push({
        id: `doc-${i}`,

        values: embedding,

        metadata: {
          text: text,
          source: chunkedDocs[i].metadata.source || "pdf",
          page: chunkedDocs[i].metadata.loc?.pageNumber || 0,
        },
      });

      console.log(`vector created ${i + 1}`);

      // avoid Gemini rate limit
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("TOTAL VECTORS:", vectors.length);

    // =========================
    // UPSERT
    // =========================

    const batchSize = 100;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);

      await pineconeIndex.upsert(batch);

      console.log(`uploaded batch ${i / batchSize + 1}`);
    }

    console.log("ALL DATA STORED");
    console.log("ALL DATA STORED");
  } catch (error) {
    console.log("ERROR:", error);
  }
}

indexDocument();
