const express = require("express");
const { admin } = require("../lib/supabase");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/me/profile", requireAuth, async (req, res) => {
  try {
    if (!req.profile) return res.status(404).send("Profile not found.");

    const { data: memberships, error } = await admin
      .from("venue_members")
      .select("access_level, active, venues(id, slug, name, city)")
      .eq("profile_id", req.profile.id)
      .eq("active", true);

    if (error) throw error;

    res.json({
      ...req.profile,
      venue_memberships: (memberships || []).map((m) => ({
        access_level: m.access_level,
        active: m.active,
        venue_id: m.venues?.id,
        venue_slug: m.venues?.slug,
        venue_name: m.venues?.name,
        venue_city: m.venues?.city
      }))
    });
  } catch (err) {
    res.status(500).send(err.message || "Failed to load profile.");
  }
});

router.post("/me/bootstrap-profile", requireAuth, async (req, res) => {
  try {
    const role = ["moderator", "venue_owner", "venue_staff"].includes(req.body.role)
      ? req.body.role
      : "venue_owner";

    const payload = {
      id: req.authUser.id,
      role,
      display_name: req.body.display_name || req.authUser.user_metadata?.display_name || req.authUser.email,
      email: req.body.email || req.authUser.email,
      active: true
    };

    const { error } = await admin.from("profiles").upsert(payload);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).send(err.message || "Failed to bootstrap profile.");
  }
});

router.get("/moderator/venues", requireAuth, requireRoles(["moderator"]), async (req, res) => {
  try {
    const { data, error } = await admin
      .from("venues")
      .select("id, slug, name, city, active, owner_profile_id")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const ownerIds = [...new Set((data || []).map(v => v.owner_profile_id).filter(Boolean))];
    let ownerMap = {};
    if (ownerIds.length) {
      const { data: owners, error: ownerError } = await admin
        .from("profiles")
        .select("id, display_name, email")
        .in("id", ownerIds);
      if (ownerError) throw ownerError;
      ownerMap = Object.fromEntries((owners || []).map(o => [o.id, o]));
    }

    res.json((data || []).map(v => ({
      ...v,
      owner_display_name: ownerMap[v.owner_profile_id]?.display_name || null,
      owner_email: ownerMap[v.owner_profile_id]?.email || null
    })));
  } catch (err) {
    res.status(500).send(err.message || "Failed to load venues.");
  }
});

router.post("/moderator/venues", requireAuth, requireRoles(["moderator"]), async (req, res) => {
  try {
    const payload = {
      slug: req.body.slug,
      name: req.body.name,
      city: req.body.city || null,
      active: req.body.active !== false,
      created_by: req.profile.id
    };
    const { data, error } = await admin.from("venues").insert(payload).select("*").single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message || "Failed to create venue.");
  }
});

router.put("/moderator/venues/:id", requireAuth, requireRoles(["moderator"]), async (req, res) => {
  try {
    const payload = {
      slug: req.body.slug,
      name: req.body.name,
      city: req.body.city || null,
      active: req.body.active !== false
    };
    const { data, error } = await admin
      .from("venues")
      .update(payload)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message || "Failed to update venue.");
  }
});

router.delete("/moderator/venues/:id", requireAuth, requireRoles(["moderator"]), async (req, res) => {
  try {
    const { error } = await admin.from("venues").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).send(err.message || "Failed to delete venue.");
  }
});

router.get("/moderator/owners", requireAuth, requireRoles(["moderator"]), async (req, res) => {
  try {
    const { data, error } = await admin
      .from("venue_members")
      .select("access_level, active, profiles!inner(id, display_name, email, role), venues!inner(id, name, slug)")
      .order("id", { ascending: false });

    if (error) throw error;

    res.json((data || []).map(row => ({
      id: row.profiles.id,
      display_name: row.profiles.display_name,
      email: row.profiles.email,
      role: row.profiles.role,
      venue_id: row.venues.id,
      venue_name: row.venues.name,
      access_level: row.access_level,
      active: row.active
    })));
  } catch (err) {
    res.status(500).send(err.message || "Failed to load owners/staff.");
  }
});

router.post("/moderator/owners", requireAuth, requireRoles(["moderator"]), async (req, res) => {
  try {
    const role = ["venue_owner", "venue_staff"].includes(req.body.role) ? req.body.role : "venue_staff";
    const accessLevel = ["owner", "manager", "operator"].includes(req.body.access_level)
      ? req.body.access_level
      : "operator";

    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email: req.body.email,
      password: req.body.password,
      email_confirm: true,
      user_metadata: { display_name: req.body.display_name, role }
    });
    if (createError) throw createError;

    const { error: profileError } = await admin.from("profiles").upsert({
      id: createdUser.user.id,
      role,
      display_name: req.body.display_name,
      email: req.body.email,
      active: true
    });
    if (profileError) throw profileError;

    const { error: memberError } = await admin.from("venue_members").insert({
      venue_id: req.body.venue_id,
      profile_id: createdUser.user.id,
      access_level: accessLevel,
      active: true
    });
    if (memberError) throw memberError;

    if (accessLevel === "owner") {
      await admin.from("venues").update({ owner_profile_id: createdUser.user.id }).eq("id", req.body.venue_id);
    }

    res.json({ ok: true, user_id: createdUser.user.id });
  } catch (err) {
    res.status(500).send(err.message || "Failed to create owner/staff.");
  }
});

router.get("/venue/my-venues", requireAuth, async (req, res) => {
  try {
    if (req.profile?.role === "moderator") {
      const { data, error } = await admin.from("venues").select("id, slug, name, city, active").order("name");
      if (error) throw error;
      return res.json((data || []).map(v => ({ ...v, access_level: "moderator" })));
    }

    const { data, error } = await admin
      .from("venue_members")
      .select("access_level, active, venues!inner(id, slug, name, city, active)")
      .eq("profile_id", req.profile.id)
      .eq("active", true);
    if (error) throw error;

    res.json((data || []).map(m => ({
      id: m.venues.id,
      slug: m.venues.slug,
      name: m.venues.name,
      city: m.venues.city,
      active: m.venues.active,
      access_level: m.access_level
    })));
  } catch (err) {
    res.status(500).send(err.message || "Failed to load venue memberships.");
  }
});

router.put("/venue/profile/:venueId", requireAuth, async (req, res) => {
  try {
    const venueId = req.params.venueId;
    if (req.profile?.role !== "moderator") {
      const { data: member, error: memberError } = await admin
        .from("venue_members")
        .select("id")
        .eq("venue_id", venueId)
        .eq("profile_id", req.profile.id)
        .eq("active", true)
        .maybeSingle();
      if (memberError) throw memberError;
      if (!member) return res.status(403).send("You do not have access to this venue.");
    }

    const payload = {
      slug: req.body.slug,
      name: req.body.name,
      city: req.body.city || null,
      active: req.body.active !== false
    };

    const { data, error } = await admin
      .from("venues")
      .update(payload)
      .eq("id", venueId)
      .select("*")
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message || "Failed to update venue profile.");
  }
});

module.exports = router;
