// Futuristic Portfolio - Main Interactions and Animations
// Libraries: anime.js, VanillaTilt (loaded via CDN)

// Helpers
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const on = (el, evt, cb, opts) => el && el.addEventListener(evt, cb, opts);

// Apply user configuration (name, roles, email, socials, stats, resume path)
(function applyConfig() {
  const cfg = window.PORTFOLIO_CONFIG || {};
  // Title
  if (cfg.name) {
    document.title = `${cfg.name} — Futuristic Portfolio`;
  }
  // Hero name
  const nameEl = document.querySelector('.hero__name .neon');
  if (nameEl && cfg.name) nameEl.textContent = cfg.name;
  // Roles
  const roleEl = document.querySelector('.role-typing');
  if (roleEl && Array.isArray(cfg.roles) && cfg.roles.length) {
    roleEl.setAttribute('data-roles', JSON.stringify(cfg.roles));
  }
  // Stats
  const statEls = Array.from(document.querySelectorAll('.hero__stats .num'));
  if (cfg.stats && statEls.length >= 3) {
    if (cfg.stats.years != null) statEls[0].setAttribute('data-count', String(cfg.stats.years));
    if (cfg.stats.projects != null) statEls[1].setAttribute('data-count', String(cfg.stats.projects));
    if (cfg.stats.certs != null) statEls[2].setAttribute('data-count', String(cfg.stats.certs));
  }
  // Email
  if (cfg.email) {
    const mail = document.querySelector('a[href^="mailto:"]');
    if (mail) mail.setAttribute('href', `mailto:${cfg.email}`);
    const copyBtn = document.getElementById('copyEmail');
    if (copyBtn) copyBtn.setAttribute('data-email', cfg.email);
  }
  // Social links
  const socials = (cfg.socials || {});
  const socialMap = [
    ['GitHub', socials.github],
    ['Facebook', socials.facebook],
    ['LinkedIn', socials.linkedin],
    ['Twitter', socials.twitter],
    ['Dribbble', socials.dribbble]
  ];
  socialMap.forEach(([label, url]) => {
    if (!url) return;
    const a = document.querySelector(`.socials a[aria-label="${label}"]`);
    if (a) a.setAttribute('href', url);
  });
  // Footer name
  if (cfg.name) {
    const fp = document.querySelector('.footer p');
    if (fp) fp.innerHTML = `© <span id="year"></span> ${cfg.name} • Crafted with <span class="neon">Motivation</span> & love`;
  }
  // Expose cfg
  window.__CFG = cfg;
})();

// Theming
(function themeInit() {
  const html = document.documentElement;
  const btn = $('#themeToggle');
  const saved = localStorage.getItem('theme');
  const isLight = saved ? saved === 'light' : false;
  html.classList.toggle('theme-light', isLight);
  updateThemeIcon();

  function updateThemeIcon() {
    const icon = btn?.querySelector('i');
    if (!icon) return;
    if (html.classList.contains('theme-light')) {
      icon.className = 'bx bx-sun';
      icon.setAttribute('aria-label', 'Switch to dark');
    } else {
      icon.className = 'bx bx-moon';
      icon.setAttribute('aria-label', 'Switch to light');
    }
  }

  on(btn, 'click', () => {
    html.classList.toggle('theme-light');
    localStorage.setItem('theme', html.classList.contains('theme-light') ? 'light' : 'dark');
    updateThemeIcon();
  });
})();

// Smooth scroll utility
(function smoothScrollInit() {
  const NAV_OFFSET = 70; // height of sticky nav approx
  const triggers = $$('[data-scrollto]');
  const goTo = (target) => {
    if (!target) return;
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  };
  triggers.forEach(t => on(t, 'click', (e) => {
    e.preventDefault();
    const to = t.getAttribute('data-scrollto');
    goTo(to);
  }));
  // expose for cmdk
  window.__goTo = goTo;
})();

// Reveal on scroll
(function revealInit() {
  const items = $$('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(i => i.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(i => io.observe(i));
})();

// Hero counters
(function countersInit() {
  const nums = $$('.hero__stats .num');
  const animate = () => nums.forEach(el => {
    const target = parseInt(el.dataset.count || '0', 10);
    const obj = { v: 0 };
    anime({
      targets: obj,
      v: target,
      round: 1,
      duration: 1600,
      easing: 'easeOutExpo',
      update: () => { el.textContent = obj.v.toString(); }
    });
  });
  // Start after first paint
  window.addEventListener('load', () => setTimeout(animate, 300));
})();

// Skills radial progress
(function skillsInit() {
  const skills = $$('.skill');
  if (!skills.length) return;

  const play = (card) => {
    const level = parseInt(card.dataset.level || '0', 10);
    const ring = $('.ring', card);
    if (!ring) return;
    const obj = { p: 0 };
    anime({
      targets: obj,
      p: level,
      duration: 1400,
      easing: 'easeInOutCubic',
      update: () => {
        const v = Math.max(0, Math.min(100, obj.p));
        ring.style.background = `conic-gradient(var(--neon) 0% ${v}%, rgba(255,255,255,0.12) ${v}% 100%)`;
      }
    });
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        play(entry.target);
        io.unobserve(entry.target);
      }
    })
  }, { threshold: 0.2 });

  skills.forEach(s => io.observe(s));
})();

// Tilt cards
(function tiltInit() {
  if (window.VanillaTilt) {
    VanillaTilt.init($$('.tilt'), { max: 10, speed: 400, glare: true, 'max-glare': 0.2, scale: 1.02 });
  }
})();

// Typing roles
(function typingInit() {
  const holder = $('.role-typing');
  if (!holder) return;
  let roles = [];
  try { roles = JSON.parse(holder.dataset.roles || '[]'); } catch {}
  if (!roles.length) return;

  const caret = '▌';
  let i = 0;

  const type = async (text) => {
    holder.textContent = '';
    for (let c = 0; c < text.length; c++) {
      holder.textContent = text.slice(0, c + 1) + caret;
      await wait(rand(18, 38));
    }
    holder.textContent = text; // stop caret for a moment
    await wait(1200);
    for (let c = text.length; c >= 0; c--) {
      holder.textContent = text.slice(0, c) + caret;
      await wait(rand(10, 22));
    }
    holder.textContent = '';
  };

  const loop = async () => {
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      await type(roles[i % roles.length]);
      i++;
    }
  };
  loop();
})();

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// GitHub Projects Loader with Pagination and View-All Modal
(function githubProjectsInit() {
  const cfg = window.PORTFOLIO_CONFIG || {};
  const grid = document.getElementById('projectsGrid');
  const controls = document.getElementById('projectsControls');
  if (!grid) return;

  // Controls
  const pgPrev = document.getElementById('pgPrev');
  const pgNext = document.getElementById('pgNext');
  const pgInfo = document.getElementById('pgInfo');
  const pgViewAll = document.getElementById('pgViewAll');
  const modal = document.getElementById('projectsModal');
  const pgClose = document.getElementById('pgClose');
  const allGrid = document.getElementById('projectsAllGrid');

  if (controls) controls.style.display = 'none';

  const users = Array.isArray(cfg.githubUsers) && cfg.githubUsers.length
    ? cfg.githubUsers
    : extractUserFromUrl(cfg.socials?.github);
  if (!users || users.length === 0) return;

  // State
  const pageSize = 10;
  let reposAll = [];
  let page = 1;

  loadAll(users).then((repos) => {
    reposAll = repos;
    if (controls) controls.style.display = '';
    renderPage();
  }).catch((err) => {
    console.error('GitHub load error:', err);
    grid.innerHTML = '';
    if (controls) controls.style.display = 'none';
    const card = document.createElement('article');
    card.className = 'project card';
    const h = document.createElement('h4');
    h.textContent = 'Unable to load GitHub repositories';
    const p = document.createElement('p');
    p.textContent = 'Please try again later or check your GitHub usernames in assets/js/config.js.';
    card.append(h, p);
    grid.append(card);
  });

  // Events
  on(pgPrev, 'click', () => { if (page > 1) { page--; renderPage(); } });
  on(pgNext, 'click', () => { const max = totalPages(); if (page < max) { page++; renderPage(); } });
  on(pgViewAll, 'click', () => { openModal(); });
  on(pgClose, 'click', () => closeModal());
  on(modal, 'click', (e) => { if (e.target === modal) closeModal(); });
  on(document, 'keydown', (e) => { if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal(); });

  function openModal() {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const panel = modal.querySelector('.projects-modal__panel');
    if (panel) panel.scrollTop = 0;
    renderAll();
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function totalPages() { return Math.max(1, Math.ceil(reposAll.length / pageSize)); }

  function renderPage() {
    grid.innerHTML = '';
    if (!reposAll.length) {
      const card = document.createElement('article');
      card.className = 'project card';
      const h = document.createElement('h4');
      h.textContent = 'No repositories found';
      const p = document.createElement('p');
      p.textContent = 'Public repositories from your GitHub accounts will appear here.';
      card.append(h, p);
      grid.append(card);
      if (controls) controls.style.display = 'none';
      return;
    }
    const start = (page - 1) * pageSize;
    const slice = reposAll.slice(start, start + pageSize);
    slice.forEach(r => grid.append(createRepoCard(r)));
    if (window.VanillaTilt) {
      VanillaTilt.init(grid.querySelectorAll('.tilt'), { max: 10, speed: 400, glare: true, 'max-glare': 0.2, scale: 1.02 });
    }
    updatePager();
  }

  function renderAll() {
    if (!allGrid) return;
    allGrid.innerHTML = '';
    reposAll.forEach(r => allGrid.append(createRepoCard(r, false))); // no tilt in modal for stability
    const panel = modal?.querySelector('.projects-modal__panel');
    if (panel) panel.scrollTop = 0;
  }

  function updatePager() {
    const max = totalPages();
    if (pgInfo) pgInfo.textContent = `Page ${page} of ${max}`;
    if (pgPrev) pgPrev.disabled = page <= 1;
    if (pgNext) pgNext.disabled = page >= max;
  }

  function extractUserFromUrl(url) {
    if (!url) return [];
    try {
      const u = new URL(url);
      if (u.hostname !== 'github.com') return [];
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[0] ? [parts[0]] : [];
    } catch { return []; }
  }

  async function loadAll(usernames) {
    const all = [];
    const results = await Promise.allSettled(usernames.map(u => fetchUserRepos(u)));
    results.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        all.push(...res.value);
      } else {
        console.warn('Skipping user due to error:', usernames[idx], res.reason);
      }
    });
    // De-duplicate by full_name
    const map = new Map();
    for (const r of all) map.set(r.full_name, r);
    // Sort by stargazers then updated_at
    return Array.from(map.values()).sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
  }

  async function fetchUserRepos(user) {
    const url = `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort('timeout'), 8000);
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' }, signal: controller.signal });
      if (!res.ok) throw new Error(`GitHub API error for ${user}: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } finally {
      clearTimeout(t);
    }
  }

  function createRepoCard(repo, withTilt = true) {
    const article = document.createElement('article');
    article.className = 'project card' + (withTilt ? ' tilt' : '');

    const badge = document.createElement('div');
    badge.className = 'project__badge';
    badge.textContent = repo.fork ? 'Fork' : 'Repo';

    const h4 = document.createElement('h4');
    h4.textContent = repo.name;

    const p = document.createElement('p');
    p.textContent = repo.description || 'No description provided.';

    const meta = document.createElement('div');
    meta.className = 'project__meta';
    const stars = document.createElement('span');
    stars.innerHTML = `<i class='bx bx-star'></i> ${formatCount(repo.stargazers_count)}`;
    const lang = document.createElement('span');
    lang.innerHTML = `<i class='bx bx-code-block'></i> ${repo.language || '—'}`;
    meta.append(stars, lang);

    const actions = document.createElement('div');
    actions.className = 'project__actions';
    if (repo.homepage && /^https?:\/\//i.test(repo.homepage)) {
      const live = document.createElement('a');
      live.className = 'btn btn--small btn--primary';
      live.href = repo.homepage;
      live.target = '_blank';
      live.rel = 'noopener noreferrer';
      live.textContent = 'Live';
      actions.append(live);
    }
    const code = document.createElement('a');
    code.className = 'btn btn--small btn--glass';
    code.href = repo.html_url;
    code.target = '_blank';
    code.rel = 'noopener noreferrer';
    code.textContent = 'Code';
    actions.append(code);

    article.append(badge, h4, p, meta, actions);
    return article;
  }

  function formatCount(n) {
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0) + 'k';
    return String(n);
  }
})();

// Background particles canvas
(function backgroundCanvas() {
  const canvas = $('#bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth * devicePixelRatio;
  let h = canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  const DPR = devicePixelRatio || 1;
  const count = Math.min(140, Math.floor((window.innerWidth * window.innerHeight) / 12000));
  const particles = [];
  const mouse = { x: w / 2, y: h / 3, active: false };
  const colors = ['#22d3ee', '#7c3aed', '#00e5ff'];

  function resize() {
    w = canvas.width = window.innerWidth * DPR;
    h = canvas.height = window.innerHeight * DPR;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    mouse.active = true;
    mouse.x = e.clientX * DPR;
    mouse.y = e.clientY * DPR;
  });
  window.addEventListener('mouseleave', () => mouse.active = false);

  class P {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      const speed = init ? rand(10, 30) / 10 : rand(6, 24) / 10;
      const dir = Math.random() * Math.PI * 2;
      this.vx = Math.cos(dir) * speed;
      this.vy = Math.sin(dir) * speed;
      this.r = rand(1, 2) * DPR;
      this.c = colors[rand(0, colors.length - 1)];
      this.life = rand(600, 1600);
      this.age = 0;
    }
    step() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;
      // mouse attraction
      if (mouse.active) {
        const dx = (mouse.x - this.x);
        const dy = (mouse.y - this.y);
        const d2 = dx*dx + dy*dy;
        const force = Math.min(1.6, 120000 / (d2 + 20000));
        this.vx += (dx / Math.sqrt(d2 + 0.001)) * force * 0.02;
        this.vy += (dy / Math.sqrt(d2 + 0.001)) * force * 0.02;
      }
      this.age++;
      if (this.age > this.life) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.c;
      ctx.globalAlpha = 0.9;
      ctx.fill();
    }
  }

  for (let i = 0; i < count; i++) particles.push(new P());

  function drawConnections() {
    const maxDist = 110 * DPR;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < maxDist) {
          const alpha = 1 - (d / maxDist);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(124,58,237,${alpha * 0.35})`;
          ctx.lineWidth = 1 * DPR;
          ctx.stroke();
        }
      }
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    // subtle grid glow backdrop
    const grd = ctx.createRadialGradient(w*0.1, h*0.1, 0, w*0.1, h*0.1, Math.max(w, h));
    grd.addColorStop(0, 'rgba(124,58,237,0.08)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    particles.forEach(p => { p.step(); p.draw(); });
    drawConnections();
    requestAnimationFrame(tick);
  }
  tick();
})();

// Command Palette (Cmd/Ctrl+K)
(function cmdkInit() {
  const panel = $('#cmdk');
  const btn = $('#cmdkBtn');
  const input = $('#cmdkInput');
  const list = $('#cmdkList');
  const items = () => $$('#cmdkList li');
  let open = false;
  let sel = 0;

  const openCmdk = () => {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    input.value = '';
    filter('');
    open = true;
    setTimeout(() => input.focus(), 0);
  };
  const closeCmdk = () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    open = false;
  };
  const toggleCmdk = () => open ? closeCmdk() : openCmdk();

  const filter = (q) => {
    const ql = q.trim().toLowerCase();
    items().forEach(li => {
      const text = li.textContent?.toLowerCase() || '';
      const match = text.includes(ql);
      li.style.display = match ? '' : 'none';
    });
    // reset selection to first visible
    const visible = items().filter(li => li.style.display !== 'none');
    sel = 0;
    items().forEach(li => li.classList.remove('selected'));
    if (visible[0]) visible[0].classList.add('selected');
  };

  const execute = (li) => {
    if (!li) return;
    const target = li.getAttribute('data-target');
    const action = li.getAttribute('data-action');
    if (target) {
      window.__goTo?.(target);
      closeCmdk();
      return;
    }
    if (action === 'theme') {
      $('#themeToggle')?.click();
      return;
    }
    if (action === 'resume') {
      downloadResume();
      return;
    }
  };

  on(btn, 'click', toggleCmdk);
  on(document, 'keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      toggleCmdk();
    }
    if (!open) return;
    if (e.key === 'Escape') closeCmdk();
    if (e.key === 'ArrowDown' || e.key === 'Tab') {
      e.preventDefault();
      const visible = items().filter(li => li.style.display !== 'none');
      sel = (sel + 1) % visible.length;
      items().forEach(li => li.classList.remove('selected'));
      visible[sel]?.classList.add('selected');
      visible[sel]?.scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const visible = items().filter(li => li.style.display !== 'none');
      sel = (sel - 1 + visible.length) % visible.length;
      items().forEach(li => li.classList.remove('selected'));
      visible[sel]?.classList.add('selected');
      visible[sel]?.scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const visible = items().filter(li => li.style.display !== 'none');
      execute(visible[sel]);
      closeCmdk();
    }
  });

  on(input, 'input', (e) => filter(e.target.value));
  items().forEach(li => on(li, 'click', () => { execute(li); closeCmdk(); }));
})();

// Resume Download and Copy Email
(function actionsInit() {
  const downloadBtn = $('#downloadResume');
  const copyBtn = $('#copyEmail');
  on(downloadBtn, 'click', (e) => { e.preventDefault(); downloadResume(); });
  on(copyBtn, 'click', async () => {
    const email = copyBtn.getAttribute('data-email') || 'you@example.com';
    try {
      await navigator.clipboard.writeText(email);
      toast('Email copied to clipboard');
    } catch {
      toast('Press Ctrl+C to copy: ' + email);
    }
  });
})();

async function downloadResume() {
  const path = (window.PORTFOLIO_CONFIG && window.PORTFOLIO_CONFIG.resumePath) || 'assets/resume.pdf';
  try {
    const res = await fetch(path, { method: 'HEAD' });
    if (!res.ok) throw new Error('not found');
    const a = document.createElement('a');
    a.href = path;
    a.download = '';
    a.click();
    toast('Downloading resume...');
  } catch {
    toast('Place your resume at assets/resume.pdf');
  }
}

// Footer year
(function yearInit() {
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear().toString();
})();

// Toast utility
function toast(msg) {
  let el = $('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2000);
}
