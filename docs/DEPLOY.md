# Linkd'N Live MVP deployment notes

## 1. Create accounts/projects
- LiveKit Cloud project
- Supabase project
- Cloudflare Pages project (or Render static site)

## 2. Backend env
Copy `backend/.env.example` to `backend/.env` and paste your keys.
Do not commit `.env`.

## 3. Start backend locally
```bash
cd backend
npm install
npm run dev
```

## 4. Start frontend locally
```bash
cd web
python3 -m http.server 8080
```

## 5. Frontend config
Copy `web/common/config.example.js` to `web/common/config.js` and fill in:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- API_BASE_URL
- LIVEKIT_WS_URL

Then include `config.js` before app scripts where needed.

## 6. Supabase
Open SQL editor and run `supabase/schema.sql`.
Then create your first moderator and venue users in Auth.

## 7. Production hosting
- Frontend: Cloudflare Pages from the `web/` folder
- Backend: Render / Railway / Fly.io / Cloudflare Workers
- Database/Auth: Supabase

## 8. Security
The keys shared in chat should be treated as compromised for any public deployment.
Rotate them before production or before pushing code to a public repo.
