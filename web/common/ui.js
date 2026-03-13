window.LinkdNUI = (() => {
  function layout(title, subtitle = "") {
    return `
      <header class="app-header">
        <div class="app-header-inner">
          <div>
            <h1 class="app-title">${title}</h1>
            ${subtitle ? `<p class="app-subtitle">${subtitle}</p>` : ""}
          </div>
          <nav class="app-nav">
            <a href="/index.html">Home</a>
            <a href="/auth/login.html">Login</a>
            <a href="/auth/register.html">Register</a>
            <a href="/profile/index.html">Profile</a>
            <a href="/moderator/dashboard.html">Moderator</a>
            <a href="/venue/index.html">Venue</a>
          </nav>
        </div>
      </header>
    `;
  }

  function dashboardShell(title, navItems = []) {
    const links = navItems.map(item => `
      <a class="sidebar-link" href="${item.href}">${item.label}</a>
    `).join("");

    return `
      <div class="dashboard-shell">
        <aside class="dashboard-sidebar">
          <div class="sidebar-brand">Linkd'N</div>
          <div class="sidebar-links">${links}</div>
        </aside>
        <main class="dashboard-main">
          <div class="dashboard-main-header">
            <h1>${title}</h1>
          </div>
          <div id="page-content"></div>
        </main>
      </div>
    `;
  }

  function card(title, body) {
    return `
      <section class="card">
        <h3>${title}</h3>
        <div>${body}</div>
      </section>
    `;
  }

  return { layout, dashboardShell, card };
})();