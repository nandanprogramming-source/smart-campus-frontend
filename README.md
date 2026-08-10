# Smart Campus Frontend

A minimal Vite + React wrapper around the Smart Campus UI prototype, ready to
deploy. The actual application lives in `src/App.jsx` — it's the same
component from the chat artifact, unchanged except that `API_BASE` now reads
from `VITE_API_BASE` so the deployed build can point at your deployed backend.

## Local development

```
npm install
cp .env.example .env      # optional locally — defaults to localhost:4000/api
npm run dev                # http://localhost:5173
```

## Production build

```
npm run build               # outputs to dist/
npm run preview             # serve the build locally to sanity-check it
```

See `../DEPLOYMENT.md` for the full Neon → Render → Vercel walkthrough.

## Note on Next.js

The original project spec called for Next.js. This Vite setup is the fastest
path to a deployed, working site from the existing single-file component.
Migrating to a full multi-page Next.js app (with its own routing, layouts,
and server components) is a separate, larger undertaking — ask if you'd like
that scaffolded next.
