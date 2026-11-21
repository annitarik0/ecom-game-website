import { PRODUCTS, BOSS, UNIVERSES, QUOTES, INSTAGRAM_DM, byId, rarity } from './data.js';
import { draw, FRAMES, KEEPER_ART } from './sprite.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
// set by the inline script in <head>: OS setting, or the visitor's own choice
const reduced = document.documentElement.classList.contains('rm');
{
  const mb = document.querySelector('#motionBtn');
  mb.setAttribute('aria-pressed', String(!reduced));
  mb.title = reduced ? 'Animations off. Click to turn them on.' : 'Animations on. Click to calm things down.';
  mb.addEventListener('click', () => {
    try { localStorage.setItem('aq-motion', reduced ? 'on' : 'off'); } catch { /* ignore */ }
    location.reload();
  });
}
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const fmt = (n) => n.toLocaleString('en-US').replace(/,/g, ' ');
const E_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const E_IN = 'cubic-bezier(0.7, 0, 0.84, 0)';

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: fine */ } },
};

/* =====================================================================
   SOUND · tiny 8-bit blips, off until the player turns them on
   ===================================================================== */
const sound = (() => {
  let on = store.get('aq-sound', false), ctx = null;
  const btn = $('#soundBtn');
  const sync = () => btn.setAttribute('aria-pressed', String(on));
  sync();
  const tone = (f, t0, dur, type = 'square', vol = 0.05) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, ctx.currentTime + t0);
    g.gain.setValueAtTime(vol, ctx.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + dur + 0.02);
  };
  const noise = (dur, vol = 0.08) => {
    const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(), g = ctx.createGain();
    g.gain.value = vol; s.buffer = b; s.connect(g).connect(ctx.destination); s.start();
  };
  const sfx = {
    select: () => tone(740, 0, 0.04, 'square', 0.025),
    coin: () => { tone(988, 0, 0.07); tone(1319, 0.07, 0.18); },
    hit: () => { noise(0.14); tone(110, 0, 0.12, 'square', 0.06); },
    miss: () => tone(220, 0, 0.08, 'triangle', 0.05),
    start: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.12)),
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.2, 'square', 0.04)),
    open: () => tone(523, 0, 0.06, 'triangle', 0.05),
  };
  btn.addEventListener('click', () => {
    on = !on; store.set('aq-sound', on); sync();
    if (on) { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); sfx.select(); }
  });
  return { play(k) { if (on && ctx && sfx[k]) try { sfx[k](); } catch { /* ignore */ } } };
})();

/* =====================================================================
   TOASTS
   ===================================================================== */
function toast(text, ms = 2200) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  $('#toasts').append(el);
  setTimeout(() => { el.classList.add('out'); el.addEventListener('animationend', () => el.remove(), { once: true }); }, ms);
  while ($('#toasts').children.length > 3) $('#toasts').firstElementChild.remove();
}

/* =====================================================================
   PIXEL CONFETTI · used for the big moments only (peak-end)
   ===================================================================== */
function confetti(canvas = null, n = 90) {
  if (reduced) return;
  const own = !canvas;
  if (own) {
    canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.style.zIndex = 96;
    document.body.append(canvas);
  }
  const S = 4;
  const W = (canvas.width = Math.ceil(innerWidth / S)), H = (canvas.height = Math.ceil(innerHeight / S));
  const ctx = canvas.getContext('2d');
  const cols = ['#ff6b1a', '#ffd23f', '#12b886', '#e03131', '#4dabf7', '#f6eedc'];
  const ps = Array.from({ length: n }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.45,
    vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 110,
    c: cols[(Math.random() * cols.length) | 0], s: Math.random() < 0.3 ? 2 : 1,
  }));
  let last = performance.now(), t = 0;
  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05); last = now; t += dt;
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.vy += 160 * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.fillStyle = p.c; ctx.fillRect(p.x | 0, p.y | 0, p.s, p.s);
    }
    if (t < 1.8) requestAnimationFrame(tick);
    else { ctx.clearRect(0, 0, W, H); if (own) canvas.remove(); }
  };
  requestAnimationFrame(tick);
}

/* =====================================================================
   CART (inventory)
   ===================================================================== */
const cart = {
  items: store.get('aq-cart', {}),
  save() { store.set('aq-cart', this.items); renderCart(); },
  add(id, n = 1) { this.items[id] = Math.min(99, (this.items[id] || 0) + n); this.save(); },
  set(id, n) { if (n <= 0) delete this.items[id]; else this.items[id] = Math.min(99, n); this.save(); },
  count() { return Object.values(this.items).reduce((a, b) => a + b, 0); },
  total() { return Object.entries(this.items).reduce((a, [id, q]) => a + (byId(id)?.price || 0) * q, 0); },
  lines() { return Object.entries(this.items).map(([id, q]) => ({ p: byId(id), q })).filter((l) => l.p); },
};

const bagBtn = $('#bagBtn');
function renderCart(enter = false) {
  const count = cart.count(), total = cart.total();
  $('#bagCount').textContent = count;
  bagBtn.classList.toggle('is-empty', count === 0);
  $('#hudTotal').textContent = fmt(total);
  $('#bagTotal').textContent = fmt(total);
  const lines = cart.lines();
  $('#bagEmpty').hidden = lines.length > 0;
  $('#bagFoot').hidden = lines.length === 0;
  $('#bagList').innerHTML = lines.map(({ p, q }, i) => `
    <li class="bag-item${enter ? ' enter' : ''}" style="--i:${Math.min(i, 7)};--tint:${UNIVERSES[p.uni].tint}">
      <img src="${p.images[0]}" alt="" width="64" height="64">
      <div><h4>${p.name}</h4><p>${fmt(p.price)} DHS · ${rarity(p)}</p></div>
      <div class="qty" role="group" aria-label="${p.name} quantity">
        <button type="button" data-dec="${p.id}" aria-label="${q === 1 ? 'Remove' : 'One less'} ${p.name}">${q === 1 ? 'X' : '-'}</button>
        <output>${q}</output>
        <button type="button" data-inc="${p.id}" aria-label="One more ${p.name}">+</button>
      </div>
    </li>`).join('');
}
$('#bagList').addEventListener('click', (e) => {
  const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
  if (inc) { cart.add(inc.dataset.inc); sound.play('select'); }
  if (dec) { const id = dec.dataset.dec; cart.set(id, (cart.items[id] || 0) - 1); sound.play('select'); }
  // keep focus inside the list after the re-render
  const again = $(`[data-${inc ? 'inc' : 'dec'}="${(inc || dec)?.dataset[inc ? 'inc' : 'dec']}"]`, $('#bagList'));
  (again || $('#bagList button') || $('#bag .x')).focus();
});

// coin flies from the button to the bag on an arc: x eases out, y eases in,
// with a small dip first (anticipation). The bag squashes when it lands.
function flyCoin(fromEl, after = () => {}) {
  const landed = () => {
    bagBtn.classList.remove('squash'); void bagBtn.offsetWidth; bagBtn.classList.add('squash');
    const c = $('#bagCount'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
    sound.play('coin');
    after();
  };
  if (reduced || !fromEl) return landed();
  const a = fromEl.getBoundingClientRect(), b = bagBtn.getBoundingClientRect();
  const sx = a.left + a.width / 2 - 11, sy = a.top + a.height / 2 - 11;
  const dx = b.left + b.width / 2 - 11 - sx, dy = b.top + b.height / 2 - 11 - sy;
  const ox = document.createElement('div'), oy = document.createElement('div');
  ox.className = 'fly-x'; oy.className = 'fly-y';
  oy.innerHTML = '<span class="coin-ico"></span>';
  ox.style.transform = `translate(${sx}px, ${sy}px)`;
  ox.append(oy); document.body.append(ox);
  const dur = 560;
  ox.animate([{ transform: `translate(${sx}px, ${sy}px)` }, { transform: `translate(${sx + dx}px, ${sy}px)` }], { duration: dur, easing: E_OUT, fill: 'forwards' });
  const ay = oy.animate([
    { transform: 'translateY(0) rotate(0)' },
    { transform: 'translateY(14px) rotate(-20deg)', offset: 0.15 },
    { transform: `translateY(${dy}px) rotate(320deg)` },
  ], { duration: dur, easing: 'cubic-bezier(0.55, 0, 0.9, 0.4)', fill: 'forwards' });
  ay.onfinish = () => { ox.remove(); landed(); };
}

function addToCart(id, n, fromEl) {
  cart.items[id] = Math.min(99, (cart.items[id] || 0) + n);
  store.set('aq-cart', cart.items);
  // the count updates when the coin lands, so the cause and the effect read together
  flyCoin(fromEl, () => renderCart());
  if (reduced) renderCart();
}

/* =====================================================================
   DIALOGS · grow from the trigger, close in half the time
   ===================================================================== */
function openDialog(dlg, from) {
  dlg._anim?.cancel();
  dlg.classList.remove('is-closing');
  if (!dlg.open) dlg.showModal();
  sound.play('open');
  if (reduced) return;
  if (dlg.id === 'bag') {
    dlg._anim = dlg.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: 280, easing: E_OUT });
    return;
  }
  const r = dlg.getBoundingClientRect();
  if (from) {
    const f = from.getBoundingClientRect();
    dlg.style.transformOrigin = `${f.left + f.width / 2 - r.left}px ${f.top + f.height / 2 - r.top}px`;
  } else dlg.style.transformOrigin = '50% 50%';
  dlg._anim = dlg.animate([{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: E_OUT });
}
function closeDialog(dlg) {
  if (!dlg.open) return;
  dlg.dispatchEvent(new Event('aq-close'));
  if (reduced) return dlg.close();
  dlg._anim?.cancel();
  dlg.classList.add('is-closing');
  const kf = dlg.id === 'bag'
    ? [{ transform: 'none' }, { transform: 'translateX(100%)' }]
    : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.85)' }];
  dlg._anim = dlg.animate(kf, { duration: 130, easing: E_IN, fill: 'forwards' });
  dlg._anim.onfinish = () => { dlg.close(); dlg.classList.remove('is-closing'); dlg._anim.cancel(); };
}
for (const dlg of $$('dialog')) {
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(dlg); });
  dlg.addEventListener('click', (e) => {
    const r = dlg.getBoundingClientRect();
    const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (outside && e.clientX + e.clientY > 0) closeDialog(dlg);
    if (e.target.closest('[data-close]')) closeDialog(dlg);
  });
}
bagBtn.addEventListener('click', () => { renderCart(true); openDialog($('#bag'), bagBtn); });

/* =====================================================================
   STAGE 2 · CHARACTER SELECT
   ===================================================================== */
const roster = $('#roster');
let cursorId = PRODUCTS[0].id;

roster.innerHTML = PRODUCTS.map((p, i) => {
  const u = UNIVERSES[p.uni];
  return `<li class="tile-wrap" data-id="${p.id}" data-uni="${p.uni}" data-order="${i}">
    <button class="tile" type="button" data-id="${p.id}" tabindex="${i === 0 ? 0 : -1}" style="--tint:${u.tint};--uink:${u.ink}"
      aria-label="${p.name}, ${u.label}, ${p.price} dirhams. Open profile.">
      <span class="tile-art">
        <span class="tile-r" data-r="${rarity(p)}">${rarity(p)}</span>
        <img src="${p.images[0]}" alt="" width="300" height="300" loading="lazy">
      </span>
      <span class="tile-body">
        <span class="tile-name">${p.name}</span>
        <span class="tile-meta"><span class="tile-uni">${u.label}</span><span class="tile-price"><span class="coin-ico"></span>${fmt(p.price)}</span></span>
      </span>
    </button>
    <button class="tile-quick" type="button" data-quick="${p.id}" tabindex="-1" aria-label="Add ${p.name} to inventory">+</button>
  </li>`;
}).join('');

const tiles = () => $$('.tile-wrap:not(.is-hidden) .tile', roster);

function setPreview(p, animate = true) {
  const u = UNIVERSES[p.uni], img = $('#pvImg');
  $('.preview-art').style.setProperty('--tint', u.tint);
  if (img.getAttribute('src') !== p.images[0]) {
    img.src = p.images[0];
    if (animate && !reduced) { img.classList.remove('swap'); void img.offsetWidth; img.classList.add('swap'); }
  }
  img.alt = `${p.name} figure`;
  const r = rarity(p);
  Object.assign($('#pvRarity'), { textContent: r }); $('#pvRarity').dataset.r = r;
  $('#pvUni').textContent = u.label;
  $('#pvLine').textContent = p.line;
  $('#pvName').textContent = p.name;
  $('#pvPow').style.width = p.power + '%'; $('#pvPowN').textContent = p.power;
  $('#pvSpd').style.width = p.speed + '%'; $('#pvSpdN').textContent = p.speed;
  $('#pvPrice').textContent = fmt(p.price);
}

function setCursor(id, { focus = false, quiet = false } = {}) {
  if (id !== cursorId && !quiet) sound.play('select');
  cursorId = id;
  for (const t of $$('.tile', roster)) {
    const on = t.dataset.id === id;
    t.classList.toggle('is-cursor', on);
    t.tabIndex = on ? 0 : -1;
    if (on && focus) t.focus({ preventScroll: false });
  }
  setPreview(byId(id));
}

roster.addEventListener('click', (e) => {
  const q = e.target.closest('[data-quick]');
  if (q) { addToCart(q.dataset.quick, 1, q); toast(`+1 ${byId(q.dataset.quick).name}`); return; }
  const t = e.target.closest('.tile');
  if (t) { setCursor(t.dataset.id, { quiet: true }); openProfile(t.dataset.id, t); }
});
roster.addEventListener('focusin', (e) => { const t = e.target.closest('.tile'); if (t) setCursor(t.dataset.id); });
if (canHover) {
  roster.addEventListener('pointerover', (e) => { const t = e.target.closest('.tile'); if (t && t.dataset.id !== cursorId) setCursor(t.dataset.id); });
  if (!reduced) {
    roster.addEventListener('pointermove', (e) => {
      const t = e.target.closest('.tile'); if (!t) return;
      const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.setProperty('--rx', `${(0.5 - y) * 10}deg`);
      t.style.setProperty('--ry', `${(x - 0.5) * 12}deg`);
      t.style.setProperty('--gx', `${x * 100}%`);
      t.style.setProperty('--gy', `${y * 100}%`);
    });
    roster.addEventListener('pointerout', (e) => { const t = e.target.closest('.tile'); if (t && !t.contains(e.relatedTarget)) { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); } });
  }
}

// arrow keys move the 1P cursor like a fighting-game select screen
roster.addEventListener('keydown', (e) => {
  const list = tiles(); const i = list.findIndex((t) => t.dataset.id === cursorId);
  if (i < 0) return;
  const cols = Math.max(1, list.filter((t) => t.offsetTop === list[0].offsetTop).length);
  const move = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols, Home: -i, End: list.length - 1 - i }[e.key];
  if (move === undefined) return;
  e.preventDefault();
  const n = Math.max(0, Math.min(list.length - 1, i + move));
  setCursor(list[n].dataset.id, { focus: true });
});

$('#pvAdd').addEventListener('click', (e) => { addToCart(cursorId, 1, e.currentTarget); toast(`+1 ${byId(cursorId).name}`); });
$('#pvOpen').addEventListener('click', (e) => openProfile(cursorId, e.currentTarget));

// filter tabs + sort
const counts = PRODUCTS.reduce((a, p) => ((a[p.uni] = (a[p.uni] || 0) + 1), a), {});
const tabsEl = $('#tabs');
tabsEl.innerHTML = [['all', 'All', PRODUCTS.length], ...Object.entries(UNIVERSES).map(([k, u]) => [k, u.label, counts[k] || 0])]
  .map(([k, label, n], i) => `<button class="tab" role="tab" type="button" data-uni="${k}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" aria-controls="roster">${label}<span class="n">${n}</span></button>`).join('');

function replayEnter() {
  if (reduced) return;
  $$('.tile-wrap:not(.is-hidden)', roster).forEach((w, i) => {
    w.classList.remove('enter'); void w.offsetWidth;
    w.style.setProperty('--i', Math.min(i, 7)); // past 8 items the rest arrive together
    w.classList.add('enter');
  });
}
function filter(uni) {
  for (const t of $$('.tab', tabsEl)) { const on = t.dataset.uni === uni; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; }
  for (const w of $$('.tile-wrap', roster)) w.classList.toggle('is-hidden', uni !== 'all' && w.dataset.uni !== uni);
  const first = tiles()[0];
  if (first && !tiles().some((t) => t.dataset.id === cursorId)) setCursor(first.dataset.id, { quiet: true });
  replayEnter();
}
tabsEl.addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) { filter(t.dataset.uni); sound.play('select'); } });
tabsEl.addEventListener('keydown', (e) => {
  const list = $$('.tab', tabsEl), i = list.indexOf(document.activeElement);
  const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d === undefined || i < 0) return;
  e.preventDefault(); const n = list[(i + d + list.length) % list.length]; n.focus(); filter(n.dataset.uni);
});
$('#sort').addEventListener('change', (e) => {
  const v = e.target.value, ws = $$('.tile-wrap', roster);
  const key = (w) => { const p = byId(w.dataset.id); return { 'price-asc': p.price, 'price-desc': -p.price, power: -p.power }[v] ?? +w.dataset.order; };
  ws.sort((a, b) => key(a) - key(b) || +a.dataset.order - +b.dataset.order).forEach((w) => roster.append(w));
  replayEnter();
});

/* =====================================================================
   PROFILE (product detail)
   ===================================================================== */
const profile = $('#profile');
let pf = { id: null, qty: 1 };
function openProfile(id, from) {
  const p = byId(id); if (!p) return;
  const u = UNIVERSES[p.uni];
  pf = { id, qty: 1 };
  $('.profile-art', profile).style.setProperty('--tint', u.tint);
  const r = rarity(p);
  $('#pfRarity').textContent = r; $('#pfRarity').dataset.r = r;
  $('#pfImg').src = p.images[0]; $('#pfImg').alt = `${p.name} figure, photo 1 of ${p.images.length}`;
  $('#pfUni').textContent = `${u.label} · ${p.type}`;
  $('#pfName').textContent = p.name;
  $('#pfLine').textContent = p.line;
  $('#pfBlurb').textContent = p.blurb;
  $('#pfPrice').textContent = fmt(p.price);
  $('#qty').textContent = 1;
  $('#pfPow').style.width = '0%'; $('#pfSpd').style.width = '0%';
  $('#pfPowN').textContent = p.power; $('#pfSpdN').textContent = p.speed;
  $('#pfThumbs').innerHTML = p.images.length > 1 ? p.images.map((src, i) => `<button type="button" data-src="${src}" aria-pressed="${i === 0}" aria-label="Photo ${i + 1}"><img src="${src}" alt=""></button>`).join('') : '';
  $('#pfAdd').textContent = 'Add to inventory';
  openDialog(profile, from);
  // stat bars fill just after the card lands (secondary action)
  setTimeout(() => { $('#pfPow').style.width = p.power + '%'; $('#pfSpd').style.width = p.speed + '%'; }, reduced ? 0 : 160);
  history.replaceState(null, '', `#fighter=${id}`);
}
profile.addEventListener('aq-close', () => history.replaceState(null, '', location.pathname + location.search));
$('#pfThumbs').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const img = $('#pfImg'); img.src = b.dataset.src;
  if (!reduced) { img.classList.remove('swap'); void img.offsetWidth; img.classList.add('swap'); }
  $$('button', $('#pfThumbs')).forEach((x, i) => { x.setAttribute('aria-pressed', x === b); if (x === b) img.alt = `${byId(pf.id).name} figure, photo ${i + 1}`; });
});
const setQty = (n) => { pf.qty = Math.max(1, Math.min(6, n)); $('#qty').textContent = pf.qty; };
$('#qtyMinus').addEventListener('click', () => { setQty(pf.qty - 1); sound.play('select'); });
$('#qtyPlus').addEventListener('click', () => { setQty(pf.qty + 1); sound.play('select'); });
$('#pfAdd').addEventListener('click', (e) => {
  const btn = e.currentTarget, p = byId(pf.id);
  addToCart(pf.id, pf.qty, btn);
  btn.textContent = `Added ×${pf.qty} ✓`;
  toast(`${p.name} ×${pf.qty} joined your party`);
  setTimeout(() => { if (btn.isConnected) btn.textContent = 'Add another'; }, 1200);
});

/* =====================================================================
   CHECKOUT · quest complete → send the order by Instagram DM
   ===================================================================== */
function orderText() {
  const lines = cart.lines().map(({ p, q }) => `- ${q} x ${p.name} (${fmt(p.price)} DHS)`);
  return `Hi Tarik! I'd like to order from Anime Quest:\n${lines.join('\n')}\nTotal: ${fmt(cart.total())} DHS`;
}
async function copy(text) { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }

$('#checkout').addEventListener('click', () => {
  const lines = cart.lines(); if (!lines.length) return;
  closeDialog($('#bag'));
  $('#doneList').innerHTML = lines.map(({ p, q }) => `<li><span>${q} × ${p.name}</span><span>${fmt(p.price * q)} DHS</span></li>`).join('');
  $('#doneTotal').textContent = fmt(cart.total());
  $('#doneCopied').hidden = true;
  setTimeout(() => { openDialog($('#complete')); sound.play('win'); confetti($('#confetti'), 140); }, reduced ? 0 : 150);
});
$('#sendOrder').addEventListener('click', () => {
  const text = orderText();
  copy(text);
  window.open(INSTAGRAM_DM, '_blank', 'noopener');
  $('#doneCopied').hidden = false;
});

/* =====================================================================
   STAGE 3 · BOSS
   ===================================================================== */
let hp = 100;
const bossImg = $('#bossImg'), hits = $('#bossHits');
function setHp(v) {
  hp = v;
  $('#hpFill').style.width = hp + '%';
  $('#hpLag').style.width = hp + '%';
  $('#hpFill').classList.toggle('low', hp <= 30);
  $('#hpText').textContent = hp + '%';
}
function hitFx(text, big = true) {
  if (!reduced) { bossImg.classList.remove('hit'); void bossImg.offsetWidth; bossImg.classList.add('hit'); }
  const box = hits.getBoundingClientRect();
  const x = box.width * (0.35 + Math.random() * 0.3), y = box.height * (0.25 + Math.random() * 0.3);
  const d = document.createElement('span');
  d.className = 'dmg'; d.textContent = text;
  d.style.left = x + 'px'; d.style.top = y + 'px';
  if (!big) d.style.fontSize = '24px';
  hits.append(d);
  const drift = (Math.random() - 0.5) * 80;
  d.animate([
    { transform: 'translate(-50%, 0) scale(0.4)', opacity: 0 },
    { transform: `translate(calc(-50% + ${drift * 0.3}px), -30px) scale(1.25)`, opacity: 1, offset: 0.25 },
    { transform: `translate(calc(-50% + ${drift}px), -90px) scale(1)`, opacity: 0 },
  ], { duration: reduced ? 400 : 800, easing: E_OUT }).onfinish = () => d.remove();
  if (big && !reduced) {
    const b = document.createElement('span');
    b.className = 'burst'; b.style.left = x + 'px'; b.style.top = y + 30 + 'px';
    hits.append(b);
    b.animate([{ transform: 'scale(0.2) rotate(0)', opacity: 1 }, { transform: 'scale(1.6) rotate(40deg)', opacity: 0 }], { duration: 360, easing: E_OUT }).onfinish = () => b.remove();
  }
}
$('#strike').addEventListener('click', (e) => {
  const dmg = 14 + ((Math.random() * 12) | 0);
  hitFx(`-${dmg}`);
  sound.play('hit');
  addToCart(BOSS.id, 1, e.currentTarget);
  const next = Math.max(0, hp - dmg);
  setHp(next);
  if (next === 0) {
    setTimeout(() => {
      toast('K.O.! Bardock joined your party');
      sound.play('win'); confetti(null, 110);
      hitFx('K.O.!');
      setTimeout(() => setHp(100), 1300);
    }, 250);
  }
});
$('#bossStage').addEventListener('click', () => { hitFx('MISS', false); sound.play('miss'); });
$('#bossProfile').addEventListener('click', (e) => openProfile(BOSS.id, e.currentTarget));

/* =====================================================================
   STAGE 4 · LORE dialogue with a typewriter
   ===================================================================== */
const dlg = { i: 0, timer: 0, typing: false, started: false };
$('#dlgPager').innerHTML = QUOTES.map(() => '<i></i>').join('');
function showQuote(i) {
  const q = QUOTES[i], t = $('#dlgText'), img = $('#dlgImg');
  dlg.i = i;
  $('#dlgName').textContent = q.who;
  img.src = q.img; img.alt = q.who;
  if (!reduced) { img.classList.remove('swap'); void img.offsetWidth; img.classList.add('swap'); }
  $$('#dlgPager i').forEach((p, k) => p.classList.toggle('on', k === i));
  clearInterval(dlg.timer);
  t.classList.remove('done');
  if (reduced) { t.textContent = q.text; t.classList.add('done'); return; }
  let n = 0; dlg.typing = true; t.textContent = '';
  dlg.timer = setInterval(() => {
    n += 2; t.textContent = q.text.slice(0, n);
    if (n >= q.text.length) { clearInterval(dlg.timer); dlg.typing = false; t.classList.add('done'); }
  }, 22);
}
$('#dlgNext').addEventListener('click', () => {
  sound.play('select');
  if (dlg.typing) { clearInterval(dlg.timer); dlg.typing = false; $('#dlgText').textContent = QUOTES[dlg.i].text; $('#dlgText').classList.add('done'); return; }
  showQuote((dlg.i + 1) % QUOTES.length);
});

/* =====================================================================
   STAGE 5 · SAVE POINT
   ===================================================================== */
{
  const c = $('#keeperFace').getContext('2d');
  draw(c, KEEPER_ART);
}
$('#saveForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget, data = Object.fromEntries(new FormData(f));
  let bad = null;
  for (const el of $$('input, textarea', f)) {
    const ok = el.value.trim().length > 0;
    el.closest('.field').classList.toggle('bad', !ok);
    el.setAttribute('aria-invalid', String(!ok));
    if (!ok && !bad) bad = el;
  }
  if (bad) {
    f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
    bad.focus(); sound.play('miss');
    return;
  }
  copy(`Hi Tarik! I'm ${data.name.trim()} (${data.reach.trim()}).\n${data.msg.trim()}`);
  window.open(INSTAGRAM_DM, '_blank', 'noopener');
  const done = $('#saveDone'); done.hidden = false; sound.play('win');
  setTimeout(() => { done.hidden = true; f.reset(); }, 6000);
});

/* =====================================================================
   LEVEL MAP · the hero walks the HUD trail as you scroll
   ===================================================================== */
const stages = $$('.stage');
const nodes = $$('.map-node');
const hero = $('#mapHero'), heroCtx = hero.getContext('2d');
const STAGE_NAMES = ['Title screen', 'Character select', 'Boss battle', 'Lore', 'Save point'];
const seen = new Set([0]);
let mapA = 14, mapB = 100, lastY = scrollY, walkUntil = 0, facing = false, frame = 0, walking = false, current = -1;

function measureMap() {
  const m = $('.map').getBoundingClientRect();
  const d0 = $('.map-dot', nodes[0]).getBoundingClientRect(), d1 = $('.map-dot', nodes.at(-1)).getBoundingClientRect();
  mapA = d0.left + d0.width / 2 - m.left;
  mapB = d1.left + d1.width / 2 - m.left;
  Object.assign($('.map-track').style, { left: mapA + 'px', right: m.width - mapB + 'px' });
}
function progress() {
  const probe = scrollY + innerHeight * 0.35;
  let i = 0;
  stages.forEach((s, k) => { if (s.offsetTop <= probe) i = k; });
  const s = stages[i];
  const f = Math.max(0, Math.min(1, (probe - s.offsetTop) / s.offsetHeight));
  const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
  return { i: atEnd ? stages.length - 1 : i, p: atEnd ? 1 : Math.min(1, (i + f) / (stages.length - 1)) };
}
function updateMap() {
  const { i, p } = progress();
  hero.style.transform = `translateX(${mapA + p * (mapB - mapA)}px) translateX(-50%)`;
  $('#mapFill').style.width = p * 100 + '%';
  if (i !== current) {
    current = i;
    nodes.forEach((n, k) => {
      n.classList.toggle('is-done', k < i);
      n.classList.toggle('is-here', k === i);
      k === i ? n.setAttribute('aria-current', 'step') : n.removeAttribute('aria-current');
    });
    if (!seen.has(i)) { seen.add(i); toast(`▶ STAGE ${i + 1} · ${STAGE_NAMES[i].toUpperCase()}`, 1600); }
    if (i === 3 && !dlg.started) { dlg.started = true; showQuote(0); }
  }
  const dy = scrollY - lastY;
  if (Math.abs(dy) > 1) { facing = dy < 0; walkUntil = performance.now() + 160; if (!walking) walk(); }
  lastY = scrollY;
}
function walk() {
  if (reduced) return draw(heroCtx, FRAMES.idle, facing);
  walking = true;
  let last = 0;
  const step = (t) => {
    if (t > walkUntil) { walking = false; draw(heroCtx, FRAMES.idle, facing); hero.style.translate = '0 0'; return; }
    if (t - last > 90) { frame = (frame + 1) % FRAMES.walk.length; draw(heroCtx, FRAMES.walk[frame], facing); hero.style.translate = `0 ${frame % 2 ? -2 : 0}px`; last = t; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
draw(heroCtx, FRAMES.idle);
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { updateMap(); ticking = false; }); } }, { passive: true });
new ResizeObserver(() => { measureMap(); updateMap(); }).observe($('.map'));

/* =====================================================================
   REVEALS · once per element, ease-out, small stagger
   ===================================================================== */
if (!reduced && 'IntersectionObserver' in window) {
  const els = $$('.stage:not(.stage--title) .stage-head, .ach, .dialog, .boss-copy, .keeper, .save-form, .preview');
  els.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));
  // the roster gets its own cascade the first time it scrolls in
  const ro = new IntersectionObserver(([e]) => { if (e.isIntersecting) { replayEnter(); ro.disconnect(); } }, { threshold: 0.1 });
  ro.observe(roster);
} else {
  $$('.ach').forEach((a) => a.classList.add('is-in'));
}

/* =====================================================================
   STAGE 1 · TITLE
   ===================================================================== */
$('#ticker').innerHTML = [...PRODUCTS, BOSS, ...PRODUCTS, BOSS]
  .map((p) => `<span class="ticker-item"><span class="coin-ico"></span>${p.name.toUpperCase()} · ${fmt(p.price)} DHS</span>`).join('');

// PRESS START: a pixel-column wipe covers the jump to Stage 2
const wipe = $('#wipe');
wipe.innerHTML = Array.from({ length: 12 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
$('#pressStart').addEventListener('click', (e) => {
  sound.play('start');
  if (reduced) return; // plain anchor jump
  e.preventDefault();
  wipe.classList.remove('go'); void wipe.offsetWidth; wipe.classList.add('go');
  setTimeout(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    $('#select').scrollIntoView();
    document.documentElement.style.scrollBehavior = '';
    tiles()[0]?.focus({ preventScroll: true });
  }, 260);
});

// 3D world: loaded on its own so a CDN hiccup never breaks the shop
let wishes = 0;
import('./scene.js').then(({ createWorld }) => {
  const title = $('.stage--title');
  const world = createWorld($('#scene3d'), {
    reducedMotion: reduced,
    onHover: (on) => title.classList.toggle('is-hover-orb', on),
    onOrbTap: () => {
      wishes += 1;
      sound.play(wishes % 7 === 0 ? 'win' : 'select');
      const hint = $('#orbHint');
      hint.innerHTML = `<span class="px">WISH ${Math.min(wishes, 7)}/7</span> ${wishes >= 7 ? 'Wish granted. May your shelf never be empty.' : 'Keep tapping the orb.'}`;
      if (wishes === 7) { confetti(null, 120); toast('✦ WISH GRANTED ✦'); }
      if (wishes >= 7) wishes = 0;
    },
  });
  for (const b of $$('.mode-btn')) {
    b.addEventListener('click', () => {
      const px = b.dataset.mode === 'pixel';
      $$('.mode-btn').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
      world.setPixel(px ? 6 : 1);
      sound.play('select');
    });
  }
}).catch(() => {
  $('.mode').hidden = true;
  $('#orbHint').hidden = true;
});

/* =====================================================================
   BOOT
   ===================================================================== */
setCursor(cursorId, { quiet: true });
setPreview(byId(cursorId), false);
setHp(100);
renderCart();
measureMap();
updateMap();
const deep = location.hash.match(/^#fighter=([\w-]+)/);
if (deep && byId(deep[1])) {
  $('#select').scrollIntoView();
  setTimeout(() => openProfile(deep[1]), 300);
}
