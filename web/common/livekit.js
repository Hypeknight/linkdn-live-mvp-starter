window.LinkdNLiveKit = (() => {
  let room = null;
  let currentTracks = {
    camera: null,
    microphone: null,
  };

  function getConfig() {
    const cfg = window.LINKDN_CONFIG || {};
    if (!cfg.API_BASE) throw new Error("Missing API_BASE in config.");
    return cfg;
  }

  async function fetchToken({ roomName, identity, name, metadata, canPublish = true, canSubscribe = true }) {
    const cfg = getConfig();

    const res = await fetch(`${cfg.API_BASE}/api/livekit-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomName,
        identity,
        name,
        metadata,
        canPublish,
        canSubscribe,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Could not fetch LiveKit token.");
    }

    return res.json();
  }

  async function connect({ roomName, identity, name, metadata }) {
    if (!window.livekit) {
      throw new Error("LiveKit client library is not loaded.");
    }

    const { Room, RoomEvent, Track } = window.livekit;
    const tokenPayload = await fetchToken({
      roomName,
      identity,
      name,
      metadata,
      canPublish: true,
      canSubscribe: true,
    });

    room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    room
      .on(RoomEvent.Connected, () => {
        console.log("Connected to LiveKit room:", room.name);
      })
      .on(RoomEvent.Disconnected, () => {
        console.log("Disconnected from LiveKit room");
      })
      .on(RoomEvent.MediaDevicesError, (err) => {
        console.error("Media device error:", err);
      })
      .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log("Track subscribed:", participant.identity, track.kind);
      });

    await room.connect(tokenPayload.url, tokenPayload.token);

    return room;
  }

  function getRoom() {
    if (!room) throw new Error("LiveKit room is not connected.");
    return room;
  }

  async function enableCamera(enabled) {
    const r = getRoom();
    await r.localParticipant.setCameraEnabled(enabled);
    currentTracks.camera = enabled;
  }

  async function enableMicrophone(enabled) {
    const r = getRoom();
    await r.localParticipant.setMicrophoneEnabled(enabled);
    currentTracks.microphone = enabled;
  }

  async function switchCamera(deviceId) {
    const r = getRoom();
    await r.switchActiveDevice("videoinput", deviceId);
  }

  async function switchMicrophone(deviceId) {
    const r = getRoom();
    await r.switchActiveDevice("audioinput", deviceId);
  }

  async function listDevices() {
    if (!window.livekit) throw new Error("LiveKit client library is not loaded.");
    const { Room } = window.livekit;

    const videoInputs = await Room.getLocalDevices("videoinput");
    const audioInputs = await Room.getLocalDevices("audioinput");
    return { videoInputs, audioInputs };
  }

  async function attachRemoteTracks(containerEl) {
    const r = getRoom();
    const { Track } = window.livekit;

    containerEl.innerHTML = "";

    r.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        const track = publication.track;
        if (!track) return;

        if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
          const el = track.attach();
          el.setAttribute("data-participant", participant.identity);
          el.style.maxWidth = "100%";
          el.style.borderRadius = "12px";
          containerEl.appendChild(el);
        }
      });
    });
  }

  async function disconnect() {
    if (room) {
      room.disconnect();
      room = null;
    }
  }

  return {
    connect,
    getRoom,
    enableCamera,
    enableMicrophone,
    switchCamera,
    switchMicrophone,
    listDevices,
    attachRemoteTracks,
    disconnect,
  };
})();