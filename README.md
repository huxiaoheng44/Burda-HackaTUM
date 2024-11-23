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

## Available Scripts

- `npm run dev`: Start the frontend development server
- `npm run build`: Build the frontend for production
- `npm run build:backend`: Build the backend
- `npm run start:backend`: Start the backend server
- `npm run lint`: Run ESLint