# News Aggregator

A modern news aggregation platform built with React and Node.js.

## Project Structure

```
project-root/
├── backend/           # Backend application
│   ├── src/
│   │   ├── app/      # Core application code
│   │   ├── config/   # Configuration files
│   │   └── services/ # Shared services
│   └── tsconfig.json # Backend TypeScript config
│
├── src/              # Frontend application
│   ├── components/   # React components
│   ├── types/       # TypeScript types
│   └── utils/       # Utility functions
│
├── public/          # Static assets
└── package.json    # Project dependencies
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend server:
   ```bash
   npm run start:backend
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
VITE_API_URL=http://localhost:3000/api
```

For the backend, copy `.env.example` to `.env` in the backend directory and set your Azure OpenAI API key:

```env
# Backend server configuration
PORT=3000

# Azure OpenAI configuration
AZURE_OPENAI_ENDPOINT=https://hackatum-2024.openai.azure.com
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-ada-002
AZURE_OPENAI_API_VERSION=2023-05-15
```

## AI News Rewriting

The API supports AI-powered news rewriting using Azure OpenAI. To use this feature:

1. Set up your Azure OpenAI credentials in the backend `.env` file
2. Add `rewrite=true` query parameter to the news endpoints:
   - `GET /api/news?rewrite=true` - Get all news with AI rewriting
   - `GET /news/{article_id}?rewrite=true` - Get a specific article with AI rewriting

The rewritten content will be available in the `rewritten_content` field of the response.

## Available Scripts

- `npm run dev`: Start the frontend development server
- `npm run build`: Build the frontend for production
- `npm run build:backend`: Build the backend
- `npm run start:backend`: Start the backend server
- `npm run lint`: Run ESLint