# QueryMaster — Professional Management Platform

A complete MERN stack web application for managing student queries, tasks, and finances.

## Segments
1. **Query Management** — Student queries, leads, conversions, fee tracking
2. **Task Organiser** — Kanban, list, calendar views with reminders
3. **Finance & ITR** — Income/expense tracking, investments, tax deductions

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS + Zustand
- **Backend:** Node.js + Express + MongoDB
- **Auth:** JWT + bcrypt
- **Excel:** ExcelJS

## Quick Start

### 1. Setup MongoDB Atlas (free)
- Go to https://mongodb.com/atlas
- Create free cluster → get connection string
- Paste into `backend/.env` → `MONGO_URI`

### 2. Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Open browser
http://localhost:5173

**Default Admin:** admin@querymaster.com / Admin@123456

## Deployment
- Backend → Render.com (free)
- Frontend → Vercel (free)
- Database → MongoDB Atlas (free)
