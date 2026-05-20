# OfflineFirst

> Education without internet. For every student, everywhere.

Addresses UN SDGs **4** (Quality Education), **9** (Industry, Innovation & Infrastructure), and **10** (Reduced Inequalities).

## The Problem
300 million students have no internet access. Every edtech solution ever built requires connectivity. OfflineFirst doesn't.

## How It Works
1. Lessons sync to devices when internet is briefly available
2. Devices share content with each other over local WiFi using WebRTC (no internet needed)
3. Students complete quizzes offline; scores sync when connectivity returns
4. Teachers monitor all devices and results from a live dashboard

## Quick Start

### Backend
```
cd server
npm install
npm run dev
```
Server runs on `http://localhost:3001`

### Frontend
```
cd client
npm install
npm run dev
```
App runs on `http://localhost:5173`

## Demo Instructions
1. Open the app on two devices on the same WiFi network
2. Disconnect from the internet on both
3. Lessons still load — served from the local IndexedDB / service worker cache
4. Complete a quiz — score saves to IndexedDB
5. Reconnect one device — scores sync to server automatically
6. Switch to **Teacher View** in the navbar to see the dashboard

## Deploy
One-process deploy (Express serves the API and the built React app):
```
npm run build
NODE_ENV=production npm start
```
See [DEPLOYMENT.md](DEPLOYMENT.md) for Render / Railway / Fly.io / Docker / VPS step-by-step.

## SDG Alignment
- **SDG 4**: Delivers structured curriculum (lessons + quizzes) to zero-connectivity environments
- **SDG 9**: Mesh sync layer creates resilient educational infrastructure from existing consumer devices
- **SDG 10**: Targets the exact population excluded from mainstream edtech — the 2.7 billion without internet

## Tech Stack
React · Vite · Tailwind CSS · Node.js · Express · SQLite · PeerJS (WebRTC) · IndexedDB · PWA Service Worker
