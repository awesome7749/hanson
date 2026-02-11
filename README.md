# Hanson

A React + TypeScript project, ready for future deployment to Google Cloud App Engine.

## Project Structure

```
hanson/
├── my-app/          # React frontend (TypeScript)
│   ├── public/
│   ├── src/
│   └── package.json
├── server/          # Node.js backend (empty - add your API here later)
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Install & Run

```bash
# Install frontend dependencies
cd my-app && npm install && cd ..

# Or from root (installs my-app deps)
npm run install:all

# Start the app
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
```

## Tech Stack

- **Frontend:** React 18, TypeScript, Create React App (in `my-app/`)
- **Backend:** Node.js (in `server/` - to be implemented)
