import express from "express";
import { RoomServiceClient } from "livekit-server-sdk";

const router = express.Router();

function getRoomService() {
  return new RoomServiceClient(
    process.env.LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
  );
}

router.get("/participants/:roomName", async (req, res) => {
  try {
    const roomService = getRoomService();
    const result = await roomService.listParticipants(req.params.roomName);
    res.json({ participants: result.participants || [] });
  } catch (err) {
    res.status(500).json({ error: err.message || "Could not list participants." });
  }
});

router.post("/mute-track", async (req, res) => {
  try {
    const { room, identity, trackSid, muted } = req.body;
    const roomService = getRoomService();

    const result = await roomService.mutePublishedTrack(room, identity, trackSid, !!muted);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Could not mute track." });
  }
});

router.post("/remove-participant", async (req, res) => {
  try {
    const { room, identity } = req.body;
    const roomService = getRoomService();

    await roomService.removeParticipant(room, identity);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Could not remove participant." });
  }
});

export default router;
