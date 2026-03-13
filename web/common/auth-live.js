(function () {
  async function getSession() {
    const { data, error } = await window.LinkdNSupabase.getClient().auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function getUser() {
    const { data, error } = await window.LinkdNSupabase.getClient().auth.getUser();
    if (error) throw error;
    return data.user || null;
  }

  async function getProfile() {
    const res = await window.LinkdNSupabase.apiFetch("/me/profile");
    if (!res.ok) return null;
    return await res.json();
  }

  async function signUp({ email, password, display_name, role }) {
    const client = window.LinkdNSupabase.getClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { display_name, role } }
    });
    if (error) throw error;
    if (data.session) {
      await window.LinkdNSupabase.apiFetch("/me/bootstrap-profile", {
        method: "POST",
        body: JSON.stringify({ display_name, role, email })
      });
    }
    return data;
  }

  async function signIn({ email, password }) {
    const client = window.LinkdNSupabase.getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await window.LinkdNSupabase.apiFetch("/me/bootstrap-profile", {
      method: "POST",
      body: JSON.stringify({
        display_name: data.user?.user_metadata?.display_name || email.split("@")[0],
        role: data.user?.user_metadata?.role || "venue_owner",
        email
      })
    });
    return data;
  }

  async function signOut() {
    const { error } = await window.LinkdNSupabase.getClient().auth.signOut();
    if (error) throw error;
  }

  async function requireRole(roles = []) {
    const profile = await getProfile();
    if (!profile) {
      window.location.href = "/auth/login.html";
      return null;
    }
    if (roles.length && !roles.includes(profile.role)) {
      alert("You do not have access to this page.");
      window.location.href = "/profile/index.html";
      return null;
    }
    return profile;
  }

  window.LinkdNAuthLive = { getSession, getUser, getProfile, signUp, signIn, signOut, requireRole };
})();
