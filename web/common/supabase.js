(function () {
  function getConfig() {
    if (!window.LINKDN_CONFIG) throw new Error("Load /common/config.js first.");
    return window.LINKDN_CONFIG;
  }

  function getClient() {
    if (window.__linkdnSupabaseClient) return window.__linkdnSupabaseClient;
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error("Supabase CDN is not loaded.");
    }
    const cfg = getConfig();
    window.__linkdnSupabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return window.__linkdnSupabaseClient;
  }

  async function getAccessToken() {
    const client = getClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session?.access_token || null;
  }

  async function apiFetch(path, options = {}) {
    const cfg = getConfig();
    const token = await getAccessToken();
    const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${cfg.API_BASE}${path}`, Object.assign({}, options, { headers }));
  }

  window.LinkdNSupabase = { getConfig, getClient, getAccessToken, apiFetch };
})();
