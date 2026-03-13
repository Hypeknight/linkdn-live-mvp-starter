# Linkd'N Live MVP Starter

This package combines the browser mock system with a starter backend and database schema so you can begin turning Linkd'N into a live MVP.

## Included
- `web/` — moderator, venue, patron, and venue-screen apps
- `backend/` — starter Express API with LiveKit token endpoint and Supabase hooks
- `supabase/schema.sql` — initial live MVP schema
- `docs/DEPLOY.md` — deployment notes

## Local run
### Frontend
```bash
cd web
python3 -m http.server 8080
```

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## Important
Secrets are **not embedded** in the files. Add them to your local `.env` and `config.js` files.
If you shared working secrets in chat, rotate them before production or any public repo.
