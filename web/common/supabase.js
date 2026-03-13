(function () {
  const cfg = window.LINKDN_CONFIG || {};

  if (!cfg.SUPABASE_URL) {
    console.error("Missing SUPABASE_URL in LINKDN_CONFIG");
  }

  if (!cfg.SUPABASE_ANON_KEY) {
    console.error("Missing SUPABASE_ANON_KEY in LINKDN_CONFIG");
  }

  if (!window.supabase) {
    console.error("Supabase CDN library is not loaded.");
    return;
  }

  window.linkdnSupabase = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );

  console.log("Supabase client initialized");
})();