import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChromaClient } from 'chromadb';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { loadAndProcessPDFs } from "./pdfLoader";

type VectorStore = Chroma | MemoryVectorStore;
const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
const chromaCollectionName = process.env.CHROMA_COLLECTION_NAME || 'pdfs';

export async function createOrGetVectorStore(
  dbType: 'chroma' | 'memory', 
  pdfPaths: string[], 
  forceUpdate: boolean = false
): Promise<VectorStore> {
  if (dbType === 'memory') {
    return createMemoryVectorStore(pdfPaths);
  } else if (dbType === 'chroma') {
    return createOrGetChromaVectorStore(pdfPaths, forceUpdate);
  } else {
    throw new Error('Invalid dbType');
  }
}

async function createMemoryVectorStore(pdfPaths: string[]): Promise<MemoryVectorStore> {
  const embeddings = new OpenAIEmbeddings();
  const docsSplits = await loadAndProcessPDFs(pdfPaths);
  return MemoryVectorStore.fromDocuments(docsSplits, embeddings);
}

async function createOrGetChromaVectorStore(pdfPaths: string[], forceUpdate: boolean): Promise<Chroma> {
  const client = new ChromaClient({ path: chromaUrl });
  let collection;

  try {
    collection = await client.getOrCreateCollection({ name: chromaCollectionName });
    const collectionSize = await collection.count();

    if (collectionSize === 0 || forceUpdate) {
      console.log(forceUpdate ? "Force updating the collection." : "Collection is empty. Creating new embeddings.");
      const embeddings = new OpenAIEmbeddings();
      const docsSplits = await loadAndProcessPDFs(pdfPaths);
      
      if (forceUpdate && collectionSize > 0) {
        await collection.delete();
        collection = await client.createCollection({ name: chromaCollectionName });
      }

      return Chroma.fromDocuments(docsSplits, embeddings, {
        collectionName: chromaCollectionName,
        url: chromaUrl,
      });
    } else {
      console.log("Collection already exists and is not empty. Using existing collection.");
      return new Chroma(new OpenAIEmbeddings(), {
        collectionName: chromaCollectionName,
        url: chromaUrl,
      });
    }
  } catch (error) {
    console.error('Error creating/getting the collection:', error);
    throw error;
  }
}