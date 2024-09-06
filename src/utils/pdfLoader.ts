import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// This function loads and processes PDF documents
export async function loadAndProcessPDFs(pdfPaths: string[]) {
  let documents = [];

  // Iterate through each PDF path
  for (const path of pdfPaths) {
    // Create a new instance of PDFLoader with the path
    const loader = new PDFLoader(path);
    // Load the PDF and get the documents
    const docs = await loader.load();
    // Add the documents to the array
    documents.push(...docs);
  }

  // Create a new instance of RecursiveCharacterTextSplitter
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // Set the chunk size to 1000 characters
    chunkOverlap: 50, // Set the overlap between chunks to 200 characters
  });

  // Split the documents into smaller chunks of text
  return await textSplitter.splitDocuments(documents);
}