class LoginManager {
  constructor() {
    this.overlay = document.getElementById('login-overlay');
    this.form = document.getElementById('login-form');
    this.username = document.getElementById('login-username');
    this.password = document.getElementById('login-password');
    this.confirm = document.getElementById('login-confirm');
    this.confirmField = document.getElementById('confirm-field');
    this.error = document.getElementById('login-error');
    this.btn = document.getElementById('login-submit-btn');
    this.btnText = document.getElementById('lsb-text');
    this.btnIcon = document.getElementById('lsb-icon');
    this.toggleBtn = document.getElementById('login-toggle-btn');
    this.toggleMsg = document.getElementById('login-toggle-msg');
    this.hint = document.getElementById('login-hint');
    this.isSignup = false;
    this.validCredentials = [
      { user: 'naruto', pass: 'rasengan' },
      { user: 'sasuke', pass: 'chidori' },
      { user: 'sakura', pass: 'kai' },
      { user: 'kakashi', pass: 'sharingan' },
      { user: 'shinobi', pass: 'konoha' },
    ];
    this.init();
  }

  init() {
    if (sessionStorage.getItem('shinobi_authenticated') === 'true') {
      this.overlay.classList.remove('active');
      return;
    }
    this.overlay.classList.add('active');
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    document.getElementById('login-toggle-msg').addEventListener('click', (e) => {
      if (e.target.id === 'login-toggle-btn') this.toggleMode();
    });
    this.username.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.password.focus();
    });
    this.password.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.isSignup) this.confirm.focus();
    });
  }

  toggleMode() {
    this.isSignup = !this.isSignup;
    this.error.classList.remove('show');
    this.form.reset();
    if (this.isSignup) {
      this.confirmField.style.display = 'flex';
      this.btnText.textContent = 'Create Account';
      this.btnIcon.textContent = '📜';
      this.toggleMsg.innerHTML = 'Already a shinobi? <button type="button" class="login-toggle-btn" id="login-toggle-btn">Sign In</button>';
      this.hint.textContent = 'Choose a name and a strong secret code.';
    } else {
      this.confirmField.style.display = 'none';
      this.btnText.textContent = 'Enter the Village';
      this.btnIcon.textContent = '⛩️';
      this.toggleMsg.innerHTML = 'New genin? <button type="button" class="login-toggle-btn" id="login-toggle-btn">Create Account</button>';
      this.hint.innerHTML = 'First time? Try <strong>naruto</strong> and <strong>rasengan</strong>';
    }
    this.username.focus();
  }

  handleSubmit(e) {
    e.preventDefault();
    const user = this.username.value.trim().toLowerCase();
    const pass = this.password.value.trim().toLowerCase();
    this.error.classList.remove('show');

    if (!user || !pass) {
      this.showError('Both fields are required, shinobi.');
      return;
    }

    if (this.isSignup) {
      const confirmPass = this.confirm.value.trim().toLowerCase();
      if (pass !== confirmPass) {
        this.showError('Secret codes do not match. Try again.');
        this.password.value = '';
        this.confirm.value = '';
        this.password.focus();
        return;
      }
      if (user.length < 3) {
        this.showError('Shinobi name must be at least 3 characters.');
        return;
      }
      if (pass.length < 4) {
        this.showError('Secret code must be at least 4 characters.');
        return;
      }
      const existing = this.loadAccounts();
      if (existing.find((a) => a.user === user)) {
        this.showError('This shinobi name is already taken.');
        return;
      }
      existing.push({ user, pass });
      this.saveAccounts(existing);

      this.btn.classList.add('submitting');
      sessionStorage.setItem('shinobi_authenticated', 'true');
      setTimeout(() => {
        this.overlay.classList.remove('active');
        window.app = new ShinobiMissionApp();
      }, 600);
    } else {
      const allAccounts = [...this.validCredentials, ...this.loadAccounts()];
      const match = allAccounts.find((a) => a.user === user && a.pass === pass);
      if (match) {
        this.btn.classList.add('submitting');
        sessionStorage.setItem('shinobi_authenticated', 'true');
        setTimeout(() => {
          this.overlay.classList.remove('active');
          window.app = new ShinobiMissionApp();
        }, 600);
      } else {
        this.showError('Invalid credentials. Check the hint or create a new account.');
        this.password.value = '';
        this.password.focus();
      }
    }
  }

  loadAccounts() {
    try { return JSON.parse(localStorage.getItem('shinobi_accounts') || '[]'); }
    catch { return []; }
  }

  saveAccounts(accounts) {
    try { localStorage.setItem('shinobi_accounts', JSON.stringify(accounts)); }
    catch { /* silent */ }
  }

  showError(msg) {
    this.error.textContent = msg;
    this.error.classList.add('show');
  }
}

class ShinobiMissionApp {
  constructor() {
    this.missions = this.loadMissions();
    this.filter = 'all';
    this.soundEnabled = false;
    this.checkedAchievements = new Set();

    this.form = document.getElementById('todo-form');
    this.input = document.getElementById('todo-input');
    this.list = document.getElementById('mission-list');
    this.empty = document.getElementById('empty-state');
    this.dateEl = document.getElementById('current-date');
    this.countEl = document.getElementById('mastery-count');
    this.bar = document.getElementById('mastery-bar');
    this.icon = document.getElementById('mastery-icon');
    this.nameEl = document.getElementById('mastery-name');
    this.subEl = document.getElementById('mastery-sub');
    this.emojiEl = document.getElementById('mastery-emoji');
    this.filterTabs = document.querySelectorAll('.headband-filter');
    this.clearBtn = document.getElementById('clear-completed');
    this.soundToggle = document.getElementById('sound-toggle');
    this.addBtn = document.getElementById('add-btn');
    this.celebrationOverlay = document.getElementById('celebration-overlay');
    this.achievementContainer = document.getElementById('achievement-toasts');
    this.celebrationDismiss = document.getElementById('celebration-dismiss');

    this.init();
  }

  static RANKS = ['D', 'C', 'B', 'A', 'S'];
  static RANK_EMOJI = { D: '🥉', C: '🥈', B: '🥇', A: '💎', S: '👑' };

  static MASTERY_LEVELS = [
    { min: 0,  max: 25,  name: 'Basic Rasengan',       sub: 'Chakra Mastery Initiate',     emoji: '🌀', cls: 'level-1' },
    { min: 26, max: 50,  name: 'Ōdama Rasengan',       sub: 'Big Ball Rasengan Adept',     emoji: '🌀', cls: 'level-2' },
    { min: 51, max: 75,  name: 'Rasenshuriken',         sub: 'Wind Blade Jutsu Expert',     emoji: '🌪️', cls: 'level-3' },
    { min: 76, max: 100, name: 'Ultra-Big Ball Rasen',  sub: 'Sage Art · Tailed Beast Mode', emoji: '⚡', cls: 'level-4' },
  ];

  getRandomRank() {
    const weighted = ['D','D','D','C','C','C','B','B','A','S'];
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  getMasteryLevel(percent) {
    const p = Math.min(100, Math.max(0, percent));
    for (const lvl of ShinobiMissionApp.MASTERY_LEVELS) {
      if (p >= lvl.min && p <= lvl.max) return lvl;
    }
    return ShinobiMissionApp.MASTERY_LEVELS[0];
  }

  initAudio() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { this.soundEnabled = false; }
  }

  playHandSign() {
    if (!this.soundEnabled || !this.audioCtx) return;
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.08);
  }

  playRasengan() {
    if (!this.soundEnabled || !this.audioCtx) return;
    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin(2 * Math.PI * i * (40 + i * 80 / bufferSize) / ctx.sampleRate);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.Q.setValueAtTime(2, ctx.currentTime);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(); noise.stop(ctx.currentTime + 0.4);
  }

  playSmoke() {
    if (!this.soundEnabled || !this.audioCtx) return;
    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    noise.connect(gain).connect(ctx.destination);
    noise.start(); noise.stop(ctx.currentTime + 0.35);
  }

  playComplete() {
    if (!this.soundEnabled || !this.audioCtx) return;
    const ctx = this.audioCtx;
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.2);
    });
  }

  loadMissions() {
    try {
      const stored = localStorage.getItem('naruto_shinobi_missions');
      if (stored) return JSON.parse(stored);
      return [
        { id: '1', text: 'Train to become Hokage', completed: false, createdAt: Date.now(), rank: 'S' },
        { id: '2', text: 'Master the Rasengan technique', completed: false, createdAt: Date.now() + 1, rank: 'A' },
        { id: '3', text: 'Complete daily D-rank missions', completed: true, createdAt: Date.now() + 2, rank: 'D' },
      ];
    } catch { return []; }
  }

  saveMissions() {
    try {
      localStorage.setItem('naruto_shinobi_missions', JSON.stringify(this.missions));
    } catch { /* silent */ }
  }

  init() {
    this.renderDate();
    this.bindEvents();
    this.render();
    this.dismissLoading();
  }

  dismissLoading() {
    const loader = document.getElementById('rasengan-loading');
    if (!loader) return;
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => { loader.remove(); }, 600);
    }, 2000);
  }

  renderDate() {
    const opts = { weekday: 'long', month: 'short', day: 'numeric' };
    this.dateEl.textContent = new Date().toLocaleDateString('en-US', opts);
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.input.value.trim();
      if (!text) return;
      this.addMission(text);
      this.input.value = '';
    });

    this.list.addEventListener('click', (e) => {
      const el = e.target.closest('.mission-scroll');
      if (!el) return;
      const id = el.dataset.id;

      if (e.target.closest('.shuriken-check')) {
        e.preventDefault();
        this.toggleMission(id, el);
      } else if (e.target.closest('.delete-btn')) {
        this.deleteMission(el, id);
      } else if (e.target.closest('.edit-btn')) {
        this.activateEdit(el);
      }
    });

    this.list.addEventListener('dblclick', (e) => {
      const span = e.target.closest('.mission-text');
      if (!span) return;
      const el = span.closest('.mission-scroll');
      if (el && !el.classList.contains('completed')) {
        this.activateEdit(el);
      }
    });

    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        this.filter = tab.dataset.filter;
        this.render();
      });
    });

    this.clearBtn.addEventListener('click', () => this.removeCompleted());

    this.soundToggle.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      if (this.soundEnabled) this.initAudio();
      this.soundToggle.classList.toggle('active');
      this.soundToggle.querySelector('span:first-child').textContent = this.soundEnabled ? '🔊' : '🔇';
      if (this.soundEnabled) this.playHandSign();
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('shinobi_authenticated');
        location.reload();
      });
    }

    if (this.celebrationDismiss) {
      this.celebrationDismiss.addEventListener('click', () => this.hideCelebration());
      this.celebrationOverlay.addEventListener('click', (e) => {
        if (e.target === this.celebrationOverlay) this.hideCelebration();
      });
    }
  }

  addMission(text) {
    this.playRasengan();
    this.addBtn.classList.add('submitting');
    setTimeout(() => this.addBtn.classList.remove('submitting'), 500);

    const mission = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: Date.now(),
      rank: this.getRandomRank()
    };
    this.missions.unshift(mission);
    this.saveMissions();
    this.render();
  }

  toggleMission(id, el) {
    const wasCompleted = this.missions.find(m => m.id === id)?.completed;

    this.missions = this.missions.map(m => {
      if (m.id === id) return { ...m, completed: !m.completed };
      return m;
    });
    this.saveMissions();

    if (!wasCompleted) {
      el.classList.add('completed');
      const cbx = el.querySelector('input[type="checkbox"]');
      if (cbx) cbx.checked = true;

      this.playComplete();
      el.style.setProperty('--impact-x', '50%');
      el.style.setProperty('--impact-y', '50%');
      el.classList.add('rasengan-impact');
      el.querySelectorAll('.wind-cut').forEach(w => w.remove());
      for (let i = 0; i < 3; i++) {
        const w = document.createElement('div');
        w.className = 'wind-cut';
        el.appendChild(w);
      }
      setTimeout(() => {
        el.classList.remove('rasengan-impact');
        el.querySelectorAll('.wind-cut').forEach(w => w.remove());
        this.render();
      }, 950);
    } else {
      this.render();
    }
  }

  deleteMission(el, id) {
    this.playSmoke();
    el.classList.add('smoke-poof');
    el.querySelectorAll('.smoke-cloud').forEach(s => s.remove());
    const clouds = ['sc-center', 'sc-top', 'sc-right'];
    for (const cls of clouds) {
      const s = document.createElement('div');
      s.className = `smoke-cloud ${cls}`;
      el.appendChild(s);
    }
    el.addEventListener('animationend', (ev) => {
      if (ev.animationName === 'smoke-poof') {
        this.missions = this.missions.filter(m => m.id !== id);
        this.saveMissions();
        this.render();
      }
    }, { once: true });
  }

  removeCompleted() {
    const completedEls = this.list.querySelectorAll('.mission-scroll.completed');
    if (completedEls.length === 0) {
      this.missions = this.missions.filter(m => !m.completed);
      this.saveMissions();
      this.render();
      return;
    }
    let count = 0;
    completedEls.forEach(el => {
      this.playSmoke();
      el.classList.add('smoke-poof');
      el.querySelectorAll('.smoke-cloud').forEach(s => s.remove());
      const clouds = ['sc-center', 'sc-top', 'sc-right'];
      for (const cls of clouds) {
        const s = document.createElement('div');
        s.className = `smoke-cloud ${cls}`;
        el.appendChild(s);
      }
      el.addEventListener('animationend', (ev) => {
        if (ev.animationName === 'smoke-poof') {
          count++;
          if (count === completedEls.length) {
            this.missions = this.missions.filter(m => !m.completed);
            this.saveMissions();
            this.render();
          }
        }
      }, { once: true });
    });
  }

  activateEdit(el) {
    const span = el.querySelector('.mission-text');
    const input = el.querySelector('.inline-edit-input');
    const actions = el.querySelector('.mission-actions');
    const check = el.querySelector('.shuriken-check');

    if (!span || !input) return;
    span.style.display = 'none';
    input.style.display = 'block';
    input.value = span.textContent.trim();
    input.focus();
    input.select();
    if (actions) actions.style.opacity = '0';
    if (check) check.style.pointerEvents = 'none';

    const save = () => {
      const val = input.value.trim();
      const id = el.dataset.id;
      if (val && val !== span.textContent.trim()) {
        this.missions = this.missions.map(m => {
          if (m.id === id) return { ...m, text: val };
          return m;
        });
        this.saveMissions();
      }
      this.render();
    };
    const cancel = () => this.render();

    input.onkeydown = (e) => {
      if (e.key === 'Enter') { input.onblur = null; save(); }
      else if (e.key === 'Escape') { input.onblur = null; cancel(); }
    };
    input.onblur = () => save();
  }

  getFiltered() {
    let items = [...this.missions];
    if (this.filter === 'active') items = items.filter(m => !m.completed);
    else if (this.filter === 'completed') items = items.filter(m => m.completed);
    items.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
    return items;
  }

  render() {
    const visible = this.getFiltered();
    this.list.innerHTML = '';

    if (visible.length === 0) {
      this.list.style.display = 'none';
      this.empty.style.display = 'flex';
      const title = this.empty.querySelector('.empty-title');
      const sub = this.empty.querySelector('.empty-sub');
      if (this.filter === 'completed') {
        title.innerHTML = 'No <span class="emphasize">Completed</span> Missions';
        sub.textContent = 'Complete your daily missions to see your achievements recorded here.';
      } else if (this.filter === 'active') {
        title.innerHTML = 'All <span class="emphasize">Missions</span> Cleared!';
        sub.textContent = 'Perfect score! Ready for new missions or take a well-deserved break.';
      } else {
        title.innerHTML = 'No <span class="emphasize">Missions</span> Today';
        sub.textContent = 'A shinobi\'s work is never done. Focus your chakra and add a new mission above.';
      }
    } else {
      this.list.style.display = 'flex';
      this.empty.style.display = 'none';
      const frag = document.createDocumentFragment();
      visible.forEach(m => frag.appendChild(this.createMissionElement(m)));
      this.list.appendChild(frag);
    }

    this.renderStats();
  }

  createMissionElement(mission) {
    const li = document.createElement('li');
    li.className = `mission-scroll ${mission.completed ? 'completed' : ''}`;
    li.dataset.id = mission.id;

    const safe = this.escape(mission.text);
    const rankCls = `rank-${mission.rank.toLowerCase()}`;
    const rankEmoji = ShinobiMissionApp.RANK_EMOJI[mission.rank] || '📜';

    li.innerHTML = `
      <label class="shuriken-check">
        <input type="checkbox" ${mission.completed ? 'checked' : ''} aria-label="Complete mission">
        <span class="shuriken-visual">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span class="shuriken-spin"></span>
        </span>
      </label>

      <span class="rank-badge ${rankCls}">${rankEmoji} ${mission.rank}-Rank</span>

      <div class="mission-text-box">
        <span class="mission-text" tabindex="0">${safe}</span>
        <input type="text" class="inline-edit-input" style="display:none;" aria-label="Edit mission">
      </div>

      <div class="mission-actions">
        ${!mission.completed ? `
          <button class="action-btn edit-btn" aria-label="Edit mission">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            </svg>
          </button>
        ` : ''}
        <button class="action-btn delete-btn" aria-label="Delete mission">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
    return li;
  }

  escape(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  renderStats() {
    const total = this.missions.length;
    const done = this.missions.filter(m => m.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    this.countEl.textContent = `${done} / ${total}`;
    this.bar.style.width = `${pct}%`;
    this.bar.setAttribute('aria-valuenow', pct);

    const lvl = this.getMasteryLevel(pct);
    this.nameEl.textContent = lvl.name;
    this.subEl.textContent = lvl.sub;
    this.emojiEl.textContent = lvl.emoji;
    this.icon.className = `mastery-icon ${lvl.cls}`;
    if (lvl.cls === 'level-3' || lvl.cls === 'level-4') {
      const ring = document.createElement('span');
      ring.className = 'spin-ring';
      this.icon.appendChild(ring);
    }

    this.clearBtn.style.display = done > 0 ? '' : 'none';

    this.checkAchievements(pct);
    if (pct === 100 && total > 0) {
      this.showCelebration();
    }
  }

  static ACHIEVEMENTS = [
    { pct: 25,  icon: '🌀', title: 'Rasengan Initiate',   desc: 'You mastered the basics of chakra rotation' },
    { pct: 50,  icon: '🌊', title: 'Ōdama Rasengan',       desc: 'Your chakra reserves have doubled in size' },
    { pct: 75,  icon: '🌪️', title: 'Rasenshuriken',        desc: 'Wind nature infused — your blade cuts through all' },
    { pct: 100, icon: '⚡', title: 'Sage Art Mastery',      desc: 'Student & master unite — the ultimate Rasengan!' },
  ];

  checkAchievements(pct) {
    for (const a of ShinobiMissionApp.ACHIEVEMENTS) {
      if (pct >= a.pct && !this.checkedAchievements.has(a.pct)) {
        this.checkedAchievements.add(a.pct);
        this.showAchievementToast(a);
      }
    }
  }

  showAchievementToast(achievement) {
    if (!this.achievementContainer) return;
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="toast-icon">${achievement.icon}</div>
      <div class="toast-content">
        <div class="toast-title">${achievement.title}</div>
        <div class="toast-desc">${achievement.desc}</div>
      </div>
    `;
    this.achievementContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('exiting');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
    if (this.soundEnabled) this.playAchievement();
  }

  playAchievement() {
    if (!this.soundEnabled || !this.audioCtx) return;
    const ctx = this.audioCtx;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.07, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  }

  showCelebration() {
    if (!this.celebrationOverlay) return;
    this.celebrationOverlay.classList.add('active');
    this.fireConfetti();
    if (this.soundEnabled) this.playCelebrationFanfare();
    document.body.style.overflow = 'hidden';
  }

  playCelebrationFanfare() {
    if (!this.soundEnabled || !this.audioCtx) return;
    const ctx = this.audioCtx;
    const melody = [523, 587, 659, 784, 880, 1047, 1175, 1319];
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
  }

  hideCelebration() {
    if (!this.celebrationOverlay) return;
    this.celebrationOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  fireConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    const colors = ['#FF6B00', '#00E5FF', '#FFC700', '#0088FF', '#FF5252', '#69F0AE', '#E040FB', '#FFD740'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const size = 4 + Math.random() * 8;
      const delay = Math.random() * 2;
      const duration = 2 + Math.random() * 2;
      const shape = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.cssText = `
        left: ${left}%;
        width: ${size}px; height: ${size}px;
        background: ${color};
        border-radius: ${shape};
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
        box-shadow: 0 0 6px ${color}40;
      `;
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LoginManager();
  if (sessionStorage.getItem('shinobi_authenticated') === 'true') {
    window.app = new ShinobiMissionApp();
  }
});
