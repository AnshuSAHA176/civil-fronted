# CivicAI Frontend

React + Vite frontend for the CivicAI backend.

## 1. Configure the backend URL

Create a file named `.env` in this folder:

```env
VITE_API_BASE_URL=https://YOUR-RENDER-BACKEND-URL
```

Replace the value with the actual Render backend URL. Do not add a trailing slash unless the frontend API client is configured for it.

## 2. Install dependencies

```powershell
npm install
```

## 3. Start locally

```powershell
npm run dev
```

Open the local URL printed by Vite, normally:

```text
http://localhost:5173
```

## 4. Production build

```powershell
npm run build
```

Preview the production build with:

```powershell
npm run preview
```

## Important

- Keep the Render backend URL in `.env`, not in source code.
- Do not put backend secrets such as `DJANGO_SECRET_KEY` or `GROQ_API_KEY` in this frontend.
- The frontend expects the deployed Django API to allow the frontend origin through CORS.
