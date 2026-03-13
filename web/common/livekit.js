window.LinkdNLiveKit = (() => {
  let room = null;

  function getSDK() {
    return (
      window.LivekitClient ||
      window.livekit ||
      window.LiveKitClient ||
      null
    );
  }

  function requireSDK() {
    const sdk = getSDK();
    if (!sdk) {
      throw new Error("LiveKit client library is not loaded.");
    }
    return sdk;
  }

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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        roomName,
        identity,
        name,
        metadata,
        canPublish,
        canSubscribe
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not fetch LiveKit token.");
    return data;
  }

  async function listDevices() {
    const sdk = requireSDK();
    const { Room } = sdk;

    const videoInputs = await Room.getLocalDevices("videoinput");
    const audioInputs = await Room.getLocalDevices("audioinput");

    return { videoInputs, audioInputs };
  }

  async function connect({ roomName, identity, name, metadata }) {
    const sdk = requireSDK();
    const { Room, RoomEvent } = sdk;

    const tokenPayload = await fetchToken({
      roomName,
      identity,
      name,
      metadata,
      canPublish: true,
      canSubscribe: true
    });

    room = new Room({
      adaptiveStream: true,
      dynacast: true
    });

    room.on(RoomEvent.Connected, () => {
      console.log("Connected:", room.name);
    });

    room.on(RoomEvent.Disconnected, () => {
      console.log("Disconnected");
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
  }

  async function enableMicrophone(enabled) {
    const r = getRoom();
    await r.localParticipant.setMicrophoneEnabled(enabled);
  }

  async function switchCamera(deviceId) {
    const r = getRoom();
    await r.switchActiveDevice("videoinput", deviceId);
  }

  async function switchMicrophone(deviceId) {
    const r = getRoom();
    await r.switchActiveDevice("audioinput", deviceId);
  }

  async function applySavedDevices() {
    const saved = JSON.parse(localStorage.getItem("linkdn_device_setup") || "{}");
    if (saved.cameraId) {
      await switchCamera(saved.cameraId);
    }
    if (saved.audioId) {
      await switchMicrophone(saved.audioId);
    }
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
    listDevices,
    enableCamera,
    enableMicrophone,
    switchCamera,
    switchMicrophone,
    applySavedDevices,
    disconnect
  };
})();