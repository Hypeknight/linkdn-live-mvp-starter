window.LinkdNAuth = (() => {
  const STORAGE_KEY = "linkdn_user_profile";

  function saveSession(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  function getSession() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function requireRole(roles = []) {
    const session = getSession();
    if (!session) {
      window.location.href = "/auth/login.html";
      return null;
    }
    if (roles.length && !roles.includes(session.role)) {
      alert("You do not have access to this page.");
      window.location.href = "/profile/index.html";
      return null;
    }
    return session;
  }

  async function mockRegister(payload) {
    const profile = {
      id: crypto.randomUUID(),
      display_name: payload.display_name,
      email: payload.email,
      role: payload.role,
      venue_name: payload.venue_name || "",
      created_at: new Date().toISOString()
    };
    saveSession(profile);
    return profile;
  }

  async function mockLogin(payload) {
    const existing = getSession();
    if (existing && existing.email === payload.email) return existing;

    const profile = {
      id: crypto.randomUUID(),
      display_name: payload.email.split("@")[0],
      email: payload.email,
      role: "venue_owner",
      created_at: new Date().toISOString()
    };
    saveSession(profile);
    return profile;
  }

  return {
    saveSession,
    getSession,
    clearSession,
    requireRole,
    mockRegister,
    mockLogin
  };
})();