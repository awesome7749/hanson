# Hanson

A React + TypeScript project, ready for future deployment to Google Cloud App Engine.

## Project Structure

```
hanson/
├── public/          # Static assets
├── src/             # React frontend (TypeScript)
├── server/          # Node.js backend (empty - add your API here later)
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Install & Run

```bash
npm install
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

## Setting Up GitHub

1. **Create a new repository on GitHub**
   - Go to [github.com/new](https://github.com/new)
   - Name it `hanson` (or your preferred name)
   - Don't initialize with README (we already have one)

2. **Add the remote and push**

   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/hanson.git
   git branch -M main
   git push -u origin main
   ```

   Or with HTTPS:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/hanson.git
   git branch -M main
   git push -u origin main
   ```

3. **Replace `YOUR_USERNAME`** with your GitHub username.

## Tech Stack

- **Frontend:** React 18, TypeScript, Create React App
- **Backend:** Node.js (server folder - to be implemented)
