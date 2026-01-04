# College Bot Implementation Notes

## Overview
This is a RAG-based chatbot for college information using Convex Agent and RAG components.

## Key Features Implemented

### 1. Document Upload & Storage
- Uses `getUploadUrl` pattern for direct file uploads to Convex storage
- PDF text extraction using pdfUtils
- Stores files in Convex storage and references in documents table
- Ingests extracted text into RAG component for semantic search

### 2. RAG Integration
- Documents are ingested into RAG with metadata (filename, storageId, category)
- Search returns context text and document references
- Supports filtering by category

### 3. Agent + RAG Chatbot
- Agent component with RAG search tool
- Rate limiting (10 messages per hour per session)
- Returns document download links when documents are referenced
- Maintains conversation thread history

### 4. Document Management
- List all active documents with download URLs
- Delete documents (removes from RAG, storage, and database)
- Category-based organization

## API Endpoints

### Document Management
- `document.getUploadUrl` - Get URL for direct file upload
- `document.storeFile` - Store uploaded file and ingest into RAG
- `document.listDocuments` - List all active documents
- `document.deleteOldPdf` - Delete document and clean up RAG embeddings
- `document.getDownloadUrl` - Get download URL for a document

### Chat
- `agent.createThread` - Create a new conversation thread
- `agent.sendMessage` - Send message and get AI response (with rate limiting)
- `agent.getMessages` - Get conversation history

## Schema

### Documents Table
- `entryId` - RAG entry ID
- `filename` - Document filename
- `storageId` - Convex storage ID
- `category` - Optional category (e.g., "College Prospectus", "Sample")
- `isActive` - Whether document is active
- `validTill` - Optional expiration timestamp
- `createdAt` - Creation timestamp

### Messages Table
- `role` - "user" or "assistant"
- `sessionId` - Session identifier
- `text` - Message text
- `timestamp` - Message timestamp
- `reference` - Optional document references

## Usage Flow

### Admin Upload Flow
1. Admin selects PDF file
2. PDF text is extracted client-side
3. Get upload URL from Convex
4. Upload file directly to Convex storage
5. Call `storeFile` with extracted text
6. Document is ingested into RAG and saved to database

### Student Chat Flow
1. Student sends message
2. Rate limit is checked
3. Agent processes message and uses RAG search tool if needed
4. Response includes text and document references with download URLs
5. Message history is maintained in thread

## Notes

- The Agent API methods may need adjustment based on actual @convex-dev/agent version
- Tool call result extraction may need refinement based on actual response structure
- Consider adding admin authentication for document management
- Consider adding document expiration cleanup cron job

