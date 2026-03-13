window.LinkdNNav = {
  venue() {
    return `
      <nav class="app-nav">
        <a href="/venue/dashboard.html">Dashboard</a>
        <a href="/venue/my-profile.html">My Profile</a>
        <a href="/venue/my-venue.html">My Venue</a>
        <a href="/venue/ready-check.html">Ready Check</a>
        <a href="/venue/local-controls.html">Local Controls</a>
        <a href="/venue/device-setup.html">Device Setup</a>
        <a href="/venue/screen-settings.html">Screen Settings</a>
        <a href="/venue/support.html">Support</a>
        <a href="/auth/login.html" id="logoutLink">Logout</a>
      </nav>
    `;
  },

  moderator() {
    return `
      <nav class="app-nav">
        <a href="/moderator/dashboard.html">Dashboard</a>
        <a href="/moderator/venues.html">Venues</a>
        <a href="/moderator/owners.html">Owners & Staff</a>
        <a href="/moderator/rooms.html">Rooms</a>
        <a href="/moderator/schedules.html">Schedules</a>
        <a href="/moderator/show-control.html">Show Control</a>
        <a href="/moderator/venue-ops.html">Venue Ops</a>
        <a href="/moderator/patron-pulse.html">Patron Pulse</a>
        <a href="/moderator/metrics.html">Metrics</a>
        <a href="/auth/login.html" id="logoutLink">Logout</a>
      </nav>
    `;
  }
};