window.LinkdNAuthLive = (() => {
  function getSupabase() {
    if (!window.LinkdNSupabase) {
      throw new Error("LinkdNSupabase is not initialized.");
    }
    return window.LinkdNSupabase.getClient();
  }

  async function signUp({ email, password, display_name, role = "venue_owner" }) {
    const supabase = getSupabase();

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    const user = data.user;
    if (!user) return data;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      role,
      display_name,
      email,
      active: true
    });

    if (profileError) throw profileError;

    return data;
  }

  async function signIn({ email, password }) {
    const supabase = getSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async function signOut() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function getUser() {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async function getProfile() {
    const supabase = getSupabase();
    const user = await getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    const { data: memberships, error: membershipError } = await supabase
      .from("venue_members")
      .select(`
        access_level,
        venues (
          id,
          name
        )
      `)
      .eq("profile_id", user.id)
      .eq("active", true);

    if (membershipError) {
      profile.venue_memberships = [];
      return profile;
    }

    profile.venue_memberships = (memberships || []).map(m => ({
      access_level: m.access_level,
      venue_id: m.venues?.id || null,
      venue_name: m.venues?.name || "Unknown Venue"
    }));

    return profile;
  }

  return {
    signUp,
    signIn,
    signOut,
    getUser,
    getProfile
  };
})();