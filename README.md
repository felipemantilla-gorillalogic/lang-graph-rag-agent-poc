# Express-based Chat Application with LangChain

This project is an Express-based chat application that utilizes LangChain for advanced conversational AI capabilities. It implements a workflow for processing user messages, retrieving relevant information, and generating responses.

## Features

- Express server for handling chat requests
- Integration with LangChain for AI-powered conversations
- PDF document processing for context-aware responses
- Streaming and non-streaming response options
- Thread management for maintaining conversation context
- Chroma vector database integration for efficient information retrieval

## Prerequisites

- Node.js (version 14 or higher recommended)
- npm (Node Package Manager)
- Docker and Docker Compose (for Chroma setup)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <project-directory>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:

   ```
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   CHROMA_COLLECTION_NAME=your_chroma_collection_name
   CHROMA_URL=your_chroma_url
   RETREIVER_TOOL_NAME=your_retriever_tool_name
   RETREIVER_TOOL_DESCRIPTION=your_retriever_tool_description
   ```

   Replace the values with your actual API keys and preferred settings.

4. Set up Chroma:
   Navigate to the `chroma` directory and start the Chroma service using Docker Compose:

   ```
   cd chroma
   docker-compose up -d
   ```

   This will start the Chroma vector database service in the background.

## Project Structure

- `server.ts`: Main Express server file
- `state.ts`: Defines the `GraphState` class
- `tools.ts`: Initializes tools for document processing
- `nodes.ts`: Defines nodes and edges for the workflow graph
- `chroma/docker-compose.yml`: Docker Compose configuration for Chroma

## Usage

1. Ensure Chroma is running (step 4 in Installation).

2. Start the server:
   ```
   npm start
   ```

3. The server will run on `http://localhost:3000` (or the port specified in your environment variables).

4. Send POST requests to `/chat` endpoint with the following structure:
   ```json
   {
     "message": "Your message here",
     "threadId": "optional-thread-id"
   }
   ```

5. For streaming responses, add `?useStream=true` to the request URL.

## API Endpoints

### POST /chat

Processes a chat message and returns a response.

Query Parameters:
- `useStream` (optional): Set to `true` for streaming responses

Request Body:
- `message` (required): The user's input message
- `threadId` (optional): ID for maintaining conversation context

Response:
- Non-streaming: JSON object with `response`, `threadId`, and `annotation`
- Streaming: Server-Sent Events (SSE) with message content and metadata

## Workflow

The application uses a `StateGraph` from LangChain to process messages:

1. Agent node: Handles initial message processing
2. Retrieve node: Fetches relevant information from documents
3. Grade Documents node: Evaluates document relevance
4. Rewrite node: Reformulates queries if needed
5. Generate node: Produces the final response

## Error Handling

The application includes basic error handling for workflow initialization and message processing. Errors are logged to the console and appropriate error responses are sent to the client.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Specify your license here]