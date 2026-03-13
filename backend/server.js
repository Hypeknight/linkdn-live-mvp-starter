import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:8080';

const required = ['LIVEKIT_URL','LIVEKIT_API_KEY','LIVEKIT_API_SECRET','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`Missing env: ${key}`);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, service: 'linkdn-live-mvp-backend' });
});

app.post('/api/livekit-token', async (req, res) => {
  try {
    const { roomName, identity, name, metadata, canPublish = true, canSubscribe = true } = req.body || {};
    if (!roomName || !identity) {
      return res.status(400).json({ error: 'roomName and identity are required' });
    }

    const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity,
      name: name || identity,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish,
      canSubscribe,
      canPublishData: true
    });

    return res.json({
      url: process.env.LIVEKIT_URL,
      token: await token.toJwt()
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create LiveKit token' });
  }
});

app.get('/api/rooms', async (_req, res) => {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, slug, title, notes, is_active')
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ rooms: data });
});

app.post('/api/patron-polls/:roomId/open', async (req, res) => {
  const roomId = req.params.roomId;
  const { type, question, options = [], duration_seconds = 60, created_by } = req.body || {};
  const closesAt = new Date(Date.now() + Number(duration_seconds) * 1000).toISOString();

  const { data: poll, error: pollError } = await supabase
    .from('patron_polls')
    .insert({ room_id: roomId, type, question, status: 'open', closes_at: closesAt, created_by })
    .select('*')
    .single();
  if (pollError) return res.status(500).json({ error: pollError.message });

  if (options.length) {
    const rows = options.map((opt, idx) => ({
      poll_id: poll.id,
      option_key: opt.option_key || `option_${idx + 1}`,
      label: opt.label || String(opt),
      sort_order: idx + 1
    }));
    const { error: optionError } = await supabase.from('patron_poll_options').insert(rows);
    if (optionError) return res.status(500).json({ error: optionError.message });
  }

  res.json({ ok: true, poll_id: poll.id });
});

app.listen(port, () => {
  console.log(`Linkd'N backend listening on http://localhost:${port}`);
});
