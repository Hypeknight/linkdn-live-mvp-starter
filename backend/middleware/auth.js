const { anon, admin } = require("../lib/supabase");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).send("Missing bearer token.");

    const { data, error } = await anon.auth.getUser(token);
    if (error || !data.user) return res.status(401).send("Invalid token.");

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) return res.status(500).send(profileError.message);

    req.authUser = data.user;
    req.profile = profile || null;
    next();
  } catch (err) {
    res.status(500).send(err.message || "Auth middleware failed.");
  }
}

function requireRoles(roles = []) {
  return (req, res, next) => {
    if (!req.profile) return res.status(403).send("Profile missing.");
    if (!roles.includes(req.profile.role)) return res.status(403).send("Forbidden.");
    next();
  };
}

module.exports = { requireAuth, requireRoles };
