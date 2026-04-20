/* ═══════════════════════════════════════════════
   ToolzHub — Shared Components
   Dynamically injects navbar and footer
   ═══════════════════════════════════════════════ */

function renderNavbar(activePage) {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `
    <div class="container">
      <a href="/" class="navbar-brand">
        <div class="logo-icon">⚡</div>
        ToolzHub
      </a>
      <button class="mobile-menu-btn" onclick="toggleMenu()" aria-label="Menu">☰</button>
      <ul class="navbar-links" id="nav-links">
        <li><a href="/" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
        <li><a href="/tools/qr" class="${activePage === 'qr' ? 'active' : ''}">QR Generator</a></li>
        <li><a href="/tools/word" class="${activePage === 'word' ? 'active' : ''}">Word Counter</a></li>
        <li><a href="/tools/case" class="${activePage === 'case' ? 'active' : ''}">Case Converter</a></li>
        <li><a href="/tools/json" class="${activePage === 'json' ? 'active' : ''}">JSON Formatter</a></li>
      </ul>
    </div>
  `;
}

function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="container">
      <p>&copy; ${year} ToolzHub. All rights reserved.</p>
      <ul class="footer-links">
        <li><a href="/">Home</a></li>
        <li><a href="/tools/qr">Tools</a></li>
        <li><a href="#">Privacy Policy</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </div>
  `;
}

function renderMinimalNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `
    <div class="container">
      <a href="/" class="navbar-brand">
        <div class="logo-icon">⚡</div>
        ToolzHub
      </a>
    </div>
  `;
}

function toggleMenu() {
  const links = document.getElementById('nav-links');
  if (links) links.classList.toggle('open');
}
