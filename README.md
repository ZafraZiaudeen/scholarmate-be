# Scholarmate Backend

This is the backend application for Scholarmate, providing API services and business logic for an AI-powered educational platform for ICT Grade 11 students.

## Technology Stack
- Node.js + TypeScript
- Express.js (Framework)
- MongoDB + Mongoose (Database)
- Clerk Middleware (Authentication)
- Multer (File Upload)
- Sentence Transformers (Embeddings)

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+ (for embeddings)
- MongoDB Atlas account
- Clerk account
- OpenRouter API key
- YouTube Data API key

### Setup Virtual Environment (Recommended)
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Linux/macOS
```

### Install Dependencies
```bash
npm install
pip install -r requirements.txt
```

### Development
```bash
npm run dev
```
Starts the backend server with nodemon for hot reload.

### Build
```bash
npm run build
```
Compiles TypeScript to JavaScript.

### Start
```bash
npm start
```
Runs the compiled backend server.

## API Endpoints
Refer to the project documentation for detailed API routes and usage.

## Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `CLERK_SECRET_KEY` - Clerk authentication secret
- `OPENROUTER_API_KEY` - OpenRouter API key
- `YOUTUBE_API_KEY` - YouTube Data API key

## Project Structure
- `src/api/` - Route handlers
- `src/application/` - Business logic
- `src/infrastructure/` - Database and schemas
- `src/domain/` - Domain models and DTOs
- `src/utils/` - Utility functions
- `src/index.ts` - Application entry point

## Notes
- Uses nodemon for development server reloads
- Embeddings generated using Sentence Transformers Python script
- MongoDB Atlas used for vector search capabilities
