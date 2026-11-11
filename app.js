'use strict';
(() => {
  const APP_VERSION = '1.5.0';
  const LOCK_MS = 5 * 60 * 1000;
  const KDF_ITER = 600000;
  const MIN_PASS = 8;
  const CFG = window.NOTAS_CONFIG || {};
  const te = new TextEncoder();
  const td = new TextDecoder();
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ---------- Íconos (texto estático) ---------- */
  const I = {
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/></svg>',
    focus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9 4.5v15"/></svg>',
    ul: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/></svg>',
    ol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 5l1.5-1v5M3.5 13.5a1.5 1.5 0 0 1 3 .2c0 .9-3 2.3-3 3.3h3" stroke-width="1.4"/></svg>',
    task: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="6" height="6" rx="1.2"/><path d="M5 7l1.2 1.2L8.2 6"/><rect x="3.5" y="14" width="6" height="6" rx="1.2"/><path d="M13 7h8M13 17h8"/></svg>',
    indent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 6h9M11 12h9M11 18h9M4 9l3 3-3 3"/></svg>',
    outdent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 6h9M11 12h9M11 18h9M7 9l-3 3 3 3"/></svg>',
    quote: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 7C6.5 7.6 5 9.7 5 13v4h5v-5H7.6c.2-1.6 1-2.6 2.4-3zM18.5 7c-3 .6-4.5 2.7-4.5 6v4h5v-5h-2.4c.2-1.6 1-2.6 2.4-3z"/></svg>',
    table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 10h17M3.5 14.5h17M10 5v14"/></svg>',
    hr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3.5 12h17"/><path d="M7 6.5h10M7 17.5h10" stroke-width="1.2" opacity=".5"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h9.5a5 5 0 0 1 0 10H11"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7l4.5 4.5L15 16"/><path d="M19 11.5H9.5a5 5 0 0 0 0 10H13"/></svg>',
    outline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M8 11h12M8 16h12M4 11h.01M4 16h.01"/></svg>',
    app: '<svg viewBox="0 0 24 24"><rect class="am-bg" x="1" y="1" width="22" height="22" rx="6.5"/><rect class="am-pg" x="7.2" y="5.2" width="9.6" height="13.6" rx="1.3"/><path class="am-ln" d="M9.6 9.6h4.8M9.6 12h4.8M9.6 14.4h3.2"/></svg>',
    cloud: '<svg class="i-cloud" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M7.2 18.5h9.9a3.9 3.9 0 0 0 .5-7.77A5.6 5.6 0 0 0 6.9 9.8a4.35 4.35 0 0 0 .3 8.7z"/></svg>',
    spin: '<svg class="i-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12a7.5 7.5 0 0 1-13.1 5"/><path d="M4.5 12a7.5 7.5 0 0 1 13.1-5"/><path d="M17.8 3.6v3.6h-3.6M6.2 20.4v-3.6h3.6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8h5M9 12h7M9 15.5h7"/></svg>'
  };

  /* ---------- Utilidades ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v; // solo cadenas estáticas propias
        else if (k === 'value') el.value = v;
        else if (k === 'checked') el.checked = !!v;
        else if (k === 'disabled') el.disabled = !!v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : String(kid));
    }
    return el;
  }
  function b64(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unb64(str) {
    const s = atob(str.replace(/\s+/g, ''));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function uid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    return [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function validISO(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }
  function fmtDate(iso) {
    if (!iso || !validISO(iso)) return 'Sin fecha';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const nf = n => n.toLocaleString('es-AR');
  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function narrow() { return matchMedia('(max-width: 819px)').matches; }

  let toastTimer;
  function toast(msg, ms = 3200) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  function download(name, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function pickFile(accept, multiple = false) {
    return new Promise(resolve => {
      const inp = h('input', { type: 'file', accept });
      if (multiple) inp.multiple = true;
      inp.addEventListener('change', () => resolve([...inp.files]));
      inp.click();
    });
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = h('textarea', { value: text });
      ta.setAttribute('readonly', '');
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }

  /* ---------- Almacenamiento local (IndexedDB) ---------- */
  const DB = {
    db: null,
    open() {
      return new Promise((res, rej) => {
        const r = indexedDB.open('notas-app', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => { DB.db = r.result; res(); };
        r.onerror = () => rej(r.error);
      });
    },
    req(mode, fn) {
      return new Promise((res, rej) => {
        const tx = DB.db.transaction('kv', mode);
        const r = fn(tx.objectStore('kv'));
        tx.oncomplete = () => res(r && r.result);
        tx.onerror = () => rej(tx.error);
        tx.onabort = () => rej(tx.error);
      });
    },
    get(k) { return DB.req('readonly', s => s.get(k)); },
    put(k, v) { return DB.req('readwrite', s => s.put(v, k)); },
    del(k) { return DB.req('readwrite', s => s.delete(k)); }
  };

  /* ---------- Sesiones: cada contraseña abre su propia bóveda ---------- */
  // La primera sesión usa las claves de siempre ('vault' y 'drive'); las demás, 'vault:<id>' y 'drive:<id>'.
  // El índice guarda solo ids y un hash del nombre de archivo de Drive, nunca nombres ni contraseñas.
  const MAIN = 'main';
  const vaultKey = sid => sid === MAIN ? 'vault' : 'vault:' + sid;
  const driveKey = sid => sid === MAIN ? 'drive' : 'drive:' + sid;
  async function listSessions() {
    const idx = await DB.get('sessions');
    if (Array.isArray(idx)) return idx;
    return (await DB.get('vault')) ? [{ id: MAIN, fh: '' }] : [];
  }
  function saveSessions(list) { return DB.put('sessions', list); }
  function slugify(s) {
    return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  }
  function driveFileFor(name) { const s = slugify(name); return s ? `notas-app-${s}.txt` : 'notas-app-vault.txt'; }
  async function sha(s) { return b64(await crypto.subtle.digest('SHA-256', te.encode(s))); }
  // Prueba una contraseña contra todas las sesiones del dispositivo, en paralelo. Devuelve la primera que abre.
  async function openAny(pass, exceptSid) {
    const list = (await listSessions()).filter(x => x.id !== exceptSid);
    const tries = list.map(async x => {
      const rec = await DB.get(vaultKey(x.id));
      if (!rec) throw new Error('vacía');
      const salt = unb64(rec.salt);
      const key = await deriveKey(pass, salt, rec.iter);
      const data = await unseal(key, rec);
      return { sid: x.id, key, salt, iter: rec.iter, data };
    });
    if (!tries.length) return null;
    try { return await Promise.any(tries); } catch { return null; }
  }

  /* ---------- Criptografía ---------- */
  async function deriveKey(pass, salt, iter) {
    const base = await crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }
  async function seal(key, salt, iter, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(obj)));
    return { format: 'notas-app-vault', v: 1, kdf: 'PBKDF2-SHA256', iter, salt: b64(salt), iv: b64(iv), ct: b64(ct), savedAt: Date.now() };
  }
  async function unseal(key, rec) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(rec.iv) }, key, unb64(rec.ct));
    return JSON.parse(td.decode(pt));
  }

  /* ---------- Sesión ---------- */
  let S = null; // { sid, key, salt, iter, data: { v, notes, cats, profile } }
  const ui = { query: '', tags: new Set(), year: '', from: '', to: '', cats: new Set(), rangeOpen: false, searchOpen: false, sel: null, current: null };

  let saveTimer = null;
  let saveChain = Promise.resolve();
  function setStatus(t) { const el = $('#ed-status'); if (el) el.textContent = t; }
  function queueSave() {
    const snap = S;
    saveChain = saveChain.then(async () => {
      if (!snap) return;
      const rec = await seal(snap.key, snap.salt, snap.iter, snap.data);
      await DB.put(vaultKey(snap.sid), rec);
      if (S === snap) setStatus('Guardado');
    }).catch(e => { console.error(e); toast('No se pudo guardar: ' + (e && e.message || e)); });
    return saveChain;
  }
  function scheduleSave() {
    setStatus('Guardando…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveTimer = null; queueSave(); }, 600);
    syncSoon();
  }
  async function flush() {
    commitEditor();
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; queueSave(); }
    await saveChain;
  }

  /* ---------- Bloqueo automático ---------- */
  let lastActive = Date.now();
  ['pointerdown', 'keydown', 'input', 'wheel', 'touchstart', 'scroll'].forEach(ev =>
    addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true, capture: true }));
  function checkIdle() { if (S && Date.now() - lastActive > LOCK_MS) lock(); }
  setInterval(checkIdle, 10000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush();
    else checkIdle();
  });
  addEventListener('pagehide', () => { flush(); });

  async function lock() {
    if (!S) return;
    const cur = ui.current;
    destroyEditor();
    if (cur) pruneNote(cur);
    await flush();
    if (driveOn() && G.pending && tokenValid()) {
      try { await Promise.race([syncNow(), new Promise(r => setTimeout(r, 8000))]); } catch { /* sigue */ }
    }
    S = null;
    driveMeta = null;
    clearTimeout(G.timer);
    G.state = 'idle'; G.detail = ''; G.pending = false; G.forcePush = false;
    ui.current = null; clearFilters(); ui.searchOpen = false; ui.rangeOpen = false; ui.sel = null;
    document.body.classList.remove('selecting');
    for (const d of [$('#dlg'), $('#dlg2')]) { if (d.open) d.close(); d.replaceChildren(); }
    $('#sidebar').replaceChildren();
    $('#editor').replaceChildren();
    $('#app').hidden = true;
    document.body.classList.remove('show-editor');
    showLock();
  }

  /* ---------- Pantalla de bloqueo ---------- */
  async function showLock() {
    const root = $('#lock');
    root.hidden = false;
    const sessions = await listSessions();
    const msg = h('p', { class: 'msg' });
    const card = h('div', { class: 'lock-card' }, h('div', { class: 'lock-mark', html: I.lock }));

    if (!sessions.length) {
      const p1 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Contraseña nueva', 'aria-label': 'Contraseña nueva' });
      const p2 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Repetila', 'aria-label': 'Repetir contraseña' });
      const btn = h('button', { class: 'btn primary', type: 'submit', text: 'Crear y entrar' });
      const form = h('form', {
        onsubmit: async e => {
          e.preventDefault();
          if (p1.value.length < MIN_PASS) { msg.textContent = `Usá al menos ${MIN_PASS} caracteres.`; return; }
          if (p1.value !== p2.value) { msg.textContent = 'Las contraseñas no coinciden.'; return; }
          btn.disabled = true; btn.textContent = 'Preparando…'; msg.textContent = '';
          try {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const key = await deriveKey(p1.value, salt, KDF_ITER);
            S = { sid: MAIN, key, salt, iter: KDF_ITER, data: { v: 1, notes: [], cats: [], profile: { name: 'Principal', driveFile: driveFileFor('') } } };
            p1.value = p2.value = '';
            await queueSave();
            await saveSessions([{ id: MAIN, fh: await sha(S.data.profile.driveFile) }]);
            if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
            startApp();
          } catch (err) {
            console.error(err);
            msg.textContent = 'No se pudo crear: ' + err.message;
            btn.disabled = false; btn.textContent = 'Crear y entrar';
          }
        }
      }, p1, p2, msg, btn,
      h('p', { class: 'note', text: 'Esta contraseña encripta tus notas en este dispositivo. No se puede recuperar: si la perdés, se pierden las notas. Guardala en tu gestor de contraseñas.' }));
      card.append(h('h1', { text: 'Crear contraseña' }), h('p', { text: 'Primera vez en este dispositivo.' }), form);
      root.replaceChildren(card);
      setTimeout(() => p1.focus(), 50);
      return;
    }

    const pw = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Contraseña', 'aria-label': 'Contraseña' });
    const btn = h('button', { class: 'btn primary', type: 'submit', text: 'Desbloquear' });
    const form = h('form', {
      onsubmit: async e => {
        e.preventDefault();
        if (!pw.value) return;
        btn.disabled = true; btn.textContent = 'Abriendo…'; msg.textContent = '';
        const got = await openAny(pw.value).catch(() => null);
        if (!got) {
          msg.textContent = 'Contraseña incorrecta.';
          btn.disabled = false; btn.textContent = 'Desbloquear';
          pw.select();
          return;
        }
        pw.value = '';
        S = got;
        normalizeData(S.data, S.sid);
        if (!Array.isArray(await DB.get('sessions'))) await saveSessions([{ id: MAIN, fh: await sha(S.data.profile.driveFile) }]);
        driveMeta = (await DB.get(driveKey(S.sid)).catch(() => null)) || null;
        S.multi = (await listSessions()).length > 1;
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
        startApp();
      }
    }, pw, msg, btn);
    card.append(h('h1', { text: 'notas-app' }), h('p', { text: 'Ingresá tu contraseña.' }), form,
      h('button', { class: 'linklike', type: 'button', text: '¿Olvidaste la contraseña?', onclick: forgotDialog }));
    root.replaceChildren(card);
    setTimeout(() => pw.focus(), 50);
  }

  function forgotDialog() {
    const conf = h('input', { type: 'text', placeholder: 'Escribí BORRAR', autocomplete: 'off' });
    const ok = h('button', { class: 'btn danger solid', text: 'Borrar todo', disabled: true });
    conf.addEventListener('input', () => { ok.disabled = conf.value.trim() !== 'BORRAR'; });
    ok.addEventListener('click', async () => {
      await wipeAll();
      driveMeta = null;
      $('#dlg2').close();
      toast('Datos borrados de este dispositivo.');
      showLock();
    });
    openDialog($('#dlg2'), 'Sin contraseña no hay recuperación', [
      h('p', { text: 'Tus notas están encriptadas con esa contraseña y nadie puede abrirlas sin ella.' }),
      h('p', { class: 'muted small', text: 'Si tenés un backup encriptado y recordás su contraseña, podés empezar de cero y después importarlo. Esto borra las notas de este dispositivo, de todas las sesiones. Lo que esté en Drive no se toca.' }),
      conf
    ], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => $('#dlg2').close() }), ok]);
  }

  async function wipeAll() {
    for (const x of await listSessions()) {
      await DB.del(vaultKey(x.id)).catch(() => {});
      await DB.del(driveKey(x.id)).catch(() => {});
    }
    await DB.del('vault').catch(() => {});
    await DB.del('drive').catch(() => {});
    await DB.del('sessions').catch(() => {});
  }

  // Completa campos que las versiones anteriores no tenían.
  function normalizeData(d, sid) {
    if (!Array.isArray(d.notes)) d.notes = [];
    if (!Array.isArray(d.cats)) d.cats = [];
    if (!d.profile || typeof d.profile !== 'object') d.profile = {};
    if (!d.profile.name) d.profile.name = sid === MAIN ? 'Principal' : 'Sesión';
    if (!d.profile.driveFile) d.profile.driveFile = driveFileFor(sid === MAIN ? '' : d.profile.name);
  }

  /* ---------- Sesiones: crear y eliminar ---------- */
  function newSessionDialog() {
    const d = $('#dlg');
    const name = h('input', { type: 'text', placeholder: 'Nombre (ej. Trabajo)', autocomplete: 'off', maxlength: '40' });
    const p1 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Contraseña de la nueva sesión' });
    const p2 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Repetila' });
    const msg = h('p', { class: 'small', text: '' });
    const ok = h('button', { class: 'btn primary', text: 'Crear sesión' });
    ok.addEventListener('click', async () => {
      msg.textContent = '';
      const nm = name.value.trim();
      if (!slugify(nm)) { msg.textContent = 'Poné un nombre con letras o números.'; return; }
      if (slugify(nm) === 'vault') { msg.textContent = 'Ese nombre está reservado. Elegí otro.'; return; }
      if (p1.value.length < MIN_PASS) { msg.textContent = `Usá al menos ${MIN_PASS} caracteres.`; return; }
      if (p1.value !== p2.value) { msg.textContent = 'Las contraseñas no coinciden.'; return; }
      ok.disabled = true; ok.textContent = 'Preparando…';
      try {
        const list = await listSessions();
        const file = driveFileFor(nm);
        const fh = await sha(file);
        if (list.some(x => x.fh === fh)) throw new Error('Ya hay una sesión con ese nombre en este dispositivo. Elegí otro.');
        if (await openAny(p1.value)) throw new Error('Esa contraseña ya abre otra sesión. Usá una distinta.');
        await flush();
        const sid = uid().replace(/-/g, '').slice(0, 16);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await deriveKey(p1.value, salt, KDF_ITER);
        const data = { v: 1, notes: [], cats: [], profile: { name: nm, driveFile: file } };
        await DB.put(vaultKey(sid), await seal(key, salt, KDF_ITER, data));
        await saveSessions([...list, { id: sid, fh }]);
        p1.value = p2.value = '';
        d.close();
        await lock();
        toast(`Sesión "${nm}" creada. Entrá con su contraseña.`, 5000);
      } catch (e) {
        msg.textContent = e.message || String(e);
        ok.disabled = false; ok.textContent = 'Crear sesión';
      }
    });
    openDialog(d, 'Crear otra sesión', [
      h('p', { class: 'muted small', text: 'Cada sesión tiene sus propias notas, su contraseña y su conexión a Drive. En la pantalla de bloqueo, la contraseña que pongas decide qué sesión se abre. No se muestra cuántas sesiones hay.' }),
      name, p1, p2, msg,
      h('p', { class: 'muted small', text: 'Para usar esta misma sesión en otro dispositivo, creala allá con el mismo nombre y conectá Drive: encuentra el archivo y te pide su contraseña.' })
    ], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => d.close() }), ok]);
    setTimeout(() => name.focus(), 50);
  }

  function deleteSessionDialog() {
    const d = $('#dlg');
    const conf = h('input', { type: 'text', placeholder: 'Escribí BORRAR', autocomplete: 'off' });
    const ok = h('button', { class: 'btn danger solid', text: 'Eliminar sesión', disabled: true });
    conf.addEventListener('input', () => { ok.disabled = conf.value.trim() !== 'BORRAR'; });
    ok.addEventListener('click', async () => {
      const sid = S.sid;
      clearTimeout(saveTimer); saveTimer = null;
      await saveChain;
      S = null;
      const list = (await listSessions()).filter(x => x.id !== sid);
      await DB.del(vaultKey(sid));
      await DB.del(driveKey(sid)).catch(() => {});
      if (list.length) await saveSessions(list); else await DB.del('sessions');
      location.reload();
    });
    openDialog(d, 'Eliminar esta sesión', [
      h('p', { text: `Se borran de este dispositivo las notas de la sesión "${S.data.profile.name}". Las demás sesiones no se tocan. El archivo en Drive, si está conectado, queda en tu Drive.` }),
      conf
    ], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => d.close() }), ok]);
  }

  /* ---------- Categorías de secciones ---------- */
  // Las secciones viven en n.transcripts (así las versiones viejas las siguen viendo como pestañas).
  // Cada una tiene cat: 'tr' (Transcripción, texto plano) o el id de una categoría propia (con formato).
  const TR = 'tr';
  const catOf = t => (t && t.cat) || TR;
  const isPlain = cat => cat === TR;
  function liveCats() { return (S.data.cats || []).filter(c => !c.deleted); }
  function catName(cat) {
    if (cat === TR) return 'Transcripción';
    const c = (S.data.cats || []).find(x => x.id === cat);
    return c ? c.name : 'Sección';
  }
  function allCatsForPick() { return [{ id: TR, name: 'Transcripción' }, ...liveCats()]; }
  function findCatByName(name) {
    const k = norm(name.trim());
    if (!k) return null;
    if (k === 'transcripcion') return TR;
    const c = liveCats().find(x => norm(x.name) === k);
    return c ? c.id : null;
  }
  function addCat(name) {
    const found = findCatByName(name);
    if (found) return found;
    const c = { id: 'c' + uid().replace(/-/g, '').slice(0, 10), name: name.trim(), updatedAt: Date.now() };
    S.data.cats.push(c);
    scheduleSave();
    return c.id;
  }
  function catInUse(cat) { return liveNotes().some(n => (n.transcripts || []).some(t => catOf(t) === cat)); }
  function secLabel(n, t) {
    if (t.name) return t.name;
    const same = n.transcripts.filter(x => catOf(x) === catOf(t));
    return same.length > 1 ? `${catName(catOf(t))} ${same.indexOf(t) + 1}` : catName(catOf(t));
  }
  function mergeCats(incoming) {
    if (!Array.isArray(incoming)) return false;
    const map = new Map(S.data.cats.map((c, i) => [c.id, i]));
    let changed = false;
    for (const c of incoming) {
      if (!c || !c.id) continue;
      if (!map.has(c.id)) { S.data.cats.push(c); map.set(c.id, S.data.cats.length - 1); changed = true; }
      else {
        const i = map.get(c.id);
        if ((c.updatedAt || 0) > (S.data.cats[i].updatedAt || 0)) { S.data.cats[i] = c; changed = true; }
      }
    }
    return changed;
  }

  function catsDialog() {
    const d = $('#dlg');
    const list = h('div', { class: 'cat-list' });
    const input = h('input', { type: 'text', placeholder: 'Nueva categoría (ej. Resumen)', autocomplete: 'off', maxlength: '40' });
    function draw() {
      list.replaceChildren(
        h('div', { class: 'cat-row' }, h('span', { class: 'cat-n', text: 'Transcripción' }), h('span', { class: 'muted small', text: 'Texto plano, fija' })),
        ...liveCats().map(c => {
          const nm = h('input', { type: 'text', value: c.name, 'aria-label': 'Nombre de la categoría', maxlength: '40' });
          nm.addEventListener('change', () => {
            const v = nm.value.trim();
            const other = findCatByName(v);
            if (!v || (other && other !== c.id)) { nm.value = c.name; toast(v ? 'Ya existe una categoría con ese nombre.' : 'El nombre no puede quedar vacío.'); return; }
            c.name = v; c.updatedAt = Date.now(); scheduleSave(); if (ui.current) renderEditor();
          });
          return h('div', { class: 'cat-row' }, nm, h('button', { class: 'btn small danger', text: 'Quitar', onclick: () => {
            if (catInUse(c.id)) { toast('Hay notas con secciones de esta categoría. Borrá esas secciones primero.', 5000); return; }
            c.deleted = true; c.updatedAt = Date.now(); scheduleSave(); draw();
          } }));
        })
      );
    }
    const add = () => {
      const v = input.value.trim();
      if (!v) return;
      if (findCatByName(v)) { toast('Ya existe una categoría con ese nombre.'); return; }
      addCat(v); input.value = ''; draw();
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    openDialog(d, 'Categorías de secciones', [
      h('p', { class: 'muted small', text: 'Las categorías valen para todas las notas. En cada nota, "+ Sección" agrega una pestaña de la categoría que elijas. Las secciones nuevas tienen formato, como la pestaña Nota.' }),
      list,
      h('div', { class: 'row' }, input, h('button', { class: 'btn', text: 'Agregar', onclick: add }))
    ], [h('button', { class: 'btn', text: 'Cerrar', onclick: () => d.close() })]);
    draw();
  }

  /* ---------- App ---------- */
  function liveNotes() { return S.data.notes.filter(n => !n.deleted); }
  function getNote(id) { return S.data.notes.find(n => n.id === id && !n.deleted); }
  function allTags() {
    const m = new Map();
    for (const n of liveNotes()) for (const t of n.tags || []) {
      const k = norm(t);
      if (!m.has(k)) m.set(k, { name: t, count: 0 });
      m.get(k).count++;
    }
    return [...m.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }
  function sortNotes(arr) {
    return arr.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.updatedAt - a.updatedAt);
  }
  function filterActive() {
    return !!(ui.query.trim() || ui.tags.size || ui.year || ui.from || ui.to || ui.cats.size);
  }
  function filteredNotes() {
    const q = norm(ui.query.trim());
    const tags = [...ui.tags];
    const cats = [...ui.cats];
    return sortNotes(liveNotes().filter(n => {
      if (tags.length && !tags.every(t => (n.tags || []).some(x => norm(x) === t))) return false;
      if (ui.year && (n.date || '').slice(0, 4) !== ui.year) return false;
      if (ui.from && !(n.date && n.date >= ui.from)) return false;
      if (ui.to && !(n.date && n.date <= ui.to)) return false;
      if (cats.length && !cats.every(c => (n.transcripts || []).some(t => catOf(t) === c && (t.text || '').trim()))) return false;
      if (!q) return true;
      const hay = norm([n.title, n.text, (n.tags || []).join(' '), ...(n.transcripts || []).map(t => t.name + ' ' + t.text)].join('\n'));
      return q.split(/\s+/).every(w => hay.includes(w));
    }));
  }
  function clearFilters() {
    ui.query = ''; ui.tags.clear(); ui.year = ''; ui.from = ''; ui.to = ''; ui.cats.clear();
    const s = $('#search'); if (s) s.value = '';
    const f = $('#f-from'); if (f) f.value = '';
    const t = $('#f-to'); if (t) t.value = '';
  }

  function startApp() {
    $('#lock').hidden = true;
    $('#lock').replaceChildren();
    $('#app').hidden = false;
    lastActive = Date.now();
    sweepEmpty();
    buildSidebar();
    renderList();
    showEmpty();
    driveAfterUnlock();
  }

  function buildSidebar() {
    const search = h('input', { type: 'search', id: 'search', placeholder: 'Buscar en notas y secciones', 'aria-label': 'Buscar', value: ui.query, autocomplete: 'off' });
    search.addEventListener('input', debounce(() => { ui.query = search.value; renderList(); }, 150));
    const from = h('input', { type: 'date', id: 'f-from', 'aria-label': 'Desde', value: ui.from });
    const to = h('input', { type: 'date', id: 'f-to', 'aria-label': 'Hasta', value: ui.to });
    from.addEventListener('change', () => { ui.from = from.value; ui.year = ''; renderList(); });
    to.addEventListener('change', () => { ui.to = to.value; ui.year = ''; renderList(); });
    $('#sidebar').replaceChildren(
      h('div', { class: 'side-head', id: 'side-head' },
        h('div', { class: 'brand', 'data-tip': S.multi ? `Sesión abierta: ${S.data.profile.name}. Hay más de una sesión en este dispositivo y cada contraseña abre la suya.` : 'notas-app ' + APP_VERSION },
          h('span', { class: 'app-mark', html: I.app, 'aria-label': 'notas-app', role: 'img' }),
          S.multi ? h('span', { class: 'brand-s', text: S.data.profile.name }) : null),
        h('button', { class: 'btn ghost icon sync-btn', id: 'sync-btn', type: 'button', hidden: !driveConfigured(), onclick: syncBtnTap, html: I.cloud + I.spin + '<span class="sync-badge"></span>' }),
        h('button', { class: 'btn ghost icon search-btn', id: 'search-btn', type: 'button', title: 'Buscar y filtrar', 'aria-label': 'Buscar y filtrar', 'aria-expanded': ui.searchOpen ? 'true' : 'false', html: I.search + '<span class="dot"></span>', onclick: toggleSearch }),
        h('button', { class: 'btn ghost icon', title: 'Menú', 'aria-label': 'Menú', html: I.menu, onclick: menuDialog })
      ),
      h('div', { class: 'sel-bar', id: 'sel-bar', hidden: true }),
      h('div', { class: 'search-panel', id: 'search-panel', hidden: !ui.searchOpen },
        search,
        h('div', { class: 'f-group', id: 'f-tags' }),
        h('div', { class: 'f-group', id: 'f-dates' }),
        h('div', { class: 'range f-range', id: 'f-range', hidden: true },
          h('label', { class: 'field' }, h('span', { text: 'Desde' }), from),
          h('label', { class: 'field' }, h('span', { text: 'Hasta' }), to)),
        h('div', { class: 'f-group', id: 'f-cats' })
      ),
      h('div', { class: 'filter-line', id: 'filter-line', hidden: true }),
      h('div', { class: 'list', id: 'list' }),
      h('button', { class: 'fab', id: 'fab', type: 'button', title: 'Nueva nota', 'aria-label': 'Nueva nota', html: I.plus, onclick: newNote })
    );
    renderSync();
  }

  function toggleSearch() {
    ui.searchOpen = !ui.searchOpen;
    $('#search-panel').hidden = !ui.searchOpen;
    $('#search-btn').setAttribute('aria-expanded', ui.searchOpen ? 'true' : 'false');
    renderList();
    if (ui.searchOpen) setTimeout(() => $('#search').focus(), 30);
  }

  function chipBtn(label, on, onclick, count) {
    return h('button', { class: 'chip' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick },
      label, count != null ? h('span', { class: 'muted', text: String(count) }) : null);
  }
  function renderFilters() {
    const tags = allTags();
    for (const t of [...ui.tags]) if (!tags.some(x => norm(x.name) === t)) ui.tags.delete(t);
    const years = [...new Set(liveNotes().map(n => (n.date || '').slice(0, 4)).filter(Boolean))].sort().reverse();
    if (ui.year && !years.includes(ui.year)) ui.year = '';
    const present = new Set();
    for (const n of liveNotes()) for (const t of n.transcripts || []) if ((t.text || '').trim()) present.add(catOf(t));
    for (const c of [...ui.cats]) if (!present.has(c)) ui.cats.delete(c);

    const fl = $('#filter-line');
    const active = filterActive();
    $('#search-btn').classList.toggle('has-filter', active);
    if (active) {
      const parts = [];
      if (ui.query.trim()) parts.push(`"${ui.query.trim()}"`);
      for (const t of ui.tags) { const x = tags.find(y => norm(y.name) === t); parts.push('#' + (x ? x.name : t)); }
      if (ui.year) parts.push(ui.year);
      if (ui.from || ui.to) parts.push((ui.from ? fmtDate(ui.from) : '…') + ' a ' + (ui.to ? fmtDate(ui.to) : 'hoy'));
      for (const c of ui.cats) parts.push('con ' + catName(c).toLowerCase());
      const count = filteredNotes().length;
      fl.replaceChildren(
        h('span', { class: 'fl-t', text: `${count} nota${count === 1 ? '' : 's'} · ${parts.join(' · ')}` }),
        h('button', { class: 'x', type: 'button', 'aria-label': 'Quitar filtros', text: '×', onclick: () => { clearFilters(); renderList(); } })
      );
    }
    fl.hidden = !active;
    if (!ui.searchOpen) return;

    const label = t => h('div', { class: 'f-label', text: t });
    $('#f-tags').replaceChildren(...(tags.length ? [label('Etiquetas'), h('div', { class: 'chips' }, tags.map(t => {
      const k = norm(t.name);
      return chipBtn(t.name, ui.tags.has(k), () => { ui.tags.has(k) ? ui.tags.delete(k) : ui.tags.add(k); renderList(); }, t.count);
    }))] : []));
    const rangeOn = !ui.year && !!(ui.from || ui.to || ui.rangeOpen);
    $('#f-dates').replaceChildren(label('Fecha'), h('div', { class: 'chips' },
      chipBtn('Todas', !ui.year && !rangeOn, () => { ui.year = ''; ui.from = ''; ui.to = ''; ui.rangeOpen = false; $('#f-from').value = ''; $('#f-to').value = ''; renderList(); }),
      years.map(y => chipBtn(y, ui.year === y, () => { ui.year = ui.year === y ? '' : y; ui.from = ''; ui.to = ''; ui.rangeOpen = false; $('#f-from').value = ''; $('#f-to').value = ''; renderList(); })),
      chipBtn('Rango…', rangeOn, () => { ui.year = ''; ui.rangeOpen = !rangeOn; if (!ui.rangeOpen) { ui.from = ''; ui.to = ''; $('#f-from').value = ''; $('#f-to').value = ''; } renderList(); })
    ));
    $('#f-range').hidden = !rangeOn;
    const cats = [...present].sort((a, b) => (a === TR ? -1 : b === TR ? 1 : catName(a).localeCompare(catName(b))));
    $('#f-cats').replaceChildren(...(cats.length ? [label('Con sección'), h('div', { class: 'chips' }, cats.map(c =>
      chipBtn(catName(c), ui.cats.has(c), () => { ui.cats.has(c) ? ui.cats.delete(c) : ui.cats.add(c); renderList(); })))] : []));
  }

  /* ---------- Selección múltiple (toque largo en una nota) ---------- */
  let longFired = false; // el toque largo que recién terminó no cuenta como toque
  function longPress(el, onLong) {
    let t = 0, sx = 0, sy = 0;
    el.addEventListener('pointerdown', e => {
      if (e.button) return;
      sx = e.clientX; sy = e.clientY;
      longFired = false;
      clearTimeout(t);
      t = setTimeout(() => { longFired = true; if (navigator.vibrate) navigator.vibrate(12); onLong(); }, 480);
    });
    const cancel = () => clearTimeout(t);
    el.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 10) cancel(); });
    el.addEventListener('pointerup', cancel);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('pointerleave', cancel);
    el.addEventListener('contextmenu', e => e.preventDefault());
  }
  function startSelect(id) {
    if (!ui.sel) ui.sel = new Set();
    ui.sel.add(id);
    renderList();
  }
  function endSelect() { ui.sel = null; renderList(); }
  function renderSelBar() {
    const bar = $('#sel-bar');
    const on = !!ui.sel;
    bar.hidden = !on;
    $('#side-head').hidden = on;
    $('#fab').hidden = on;
    document.body.classList.toggle('selecting', on);
    if (!on) return;
    const n = ui.sel.size;
    const visible = filteredNotes();
    const allOn = visible.length > 0 && visible.every(x => ui.sel.has(x.id));
    bar.replaceChildren(
      h('button', { class: 'btn ghost icon', type: 'button', 'aria-label': 'Salir de la selección', title: 'Salir de la selección', text: '×', onclick: endSelect }),
      h('span', { class: 'sel-n', text: n === 1 ? '1 elegida' : `${n} elegidas` }),
      h('button', { class: 'btn ghost small', type: 'button', text: allOn ? 'Ninguna' : 'Todas', onclick: () => { if (allOn) ui.sel.clear(); else visible.forEach(x => ui.sel.add(x.id)); renderList(); } }),
      h('button', { class: 'btn ghost icon', type: 'button', title: 'Copiar o descargar como texto', 'aria-label': 'Copiar o descargar como texto', html: I.copy, disabled: !n, onclick: () => { const ids = [...ui.sel]; endSelect(); exportDialog(null, ids); } }),
      h('button', { class: 'btn ghost icon danger', type: 'button', title: 'Eliminar', 'aria-label': 'Eliminar las elegidas', html: I.trash, disabled: !n, onclick: deleteSelected })
    );
  }
  async function deleteSelected() {
    const ids = [...ui.sel].filter(id => getNote(id));
    if (!ids.length) return;
    if (!(await confirmBox(ids.length === 1 ? '¿Eliminar la nota elegida? No se puede deshacer.' : `¿Eliminar las ${ids.length} notas elegidas? No se puede deshacer.`, 'Eliminar', true))) return;
    if (ui.current && ids.includes(ui.current)) {
      if (ED) ED.dirty = false;
      destroyEditor();
      ui.current = null;
      document.body.classList.remove('show-editor');
      showEmpty();
    }
    const now = Date.now();
    for (const id of ids) {
      const i = S.data.notes.findIndex(x => x.id === id);
      if (i >= 0) S.data.notes[i] = { id, deleted: true, updatedAt: now };
    }
    scheduleSave();
    ui.sel = null;
    renderList();
    toast(ids.length === 1 ? 'Nota eliminada.' : `${ids.length} notas eliminadas.`);
  }

  function renderList() {
    if (!S) return;
    if (ui.sel) for (const id of [...ui.sel]) if (!getNote(id)) ui.sel.delete(id);
    renderFilters();
    renderSelBar();
    const list = $('#list');
    list.classList.toggle('selecting', !!ui.sel);
    const notes = filteredNotes();
    if (!notes.length) {
      const total = liveNotes().length;
      list.replaceChildren(h('div', { class: 'list-empty', text: total ? 'Ninguna nota coincide.' : 'Todavía no hay notas. Tocá + para crear una.' }));
      return;
    }
    list.replaceChildren(...notes.map(n => {
      const trs = (n.transcripts || []).length;
      const allTr = (n.transcripts || []).every(t => catOf(t) === TR);
      const snip = plainSnippet(n.text).slice(0, 160);
      const picked = !!(ui.sel && ui.sel.has(n.id));
      const el = h('button', {
        class: 'item' + (n.id === ui.current && !ui.sel ? ' active' : '') + (picked ? ' picked' : ''),
        'aria-pressed': ui.sel ? (picked ? 'true' : 'false') : null,
        onclick: () => {
          if (longFired) { longFired = false; return; }
          if (ui.sel) { picked ? ui.sel.delete(n.id) : ui.sel.add(n.id); if (!ui.sel.size) ui.sel = null; renderList(); return; }
          openNote(n.id);
        }
      },
        h('div', { class: 'item-title' + (n.title ? '' : ' untitled'), text: n.title || 'Sin título' }),
        h('div', { class: 'item-meta', text: fmtDate(n.date) + (!trs ? '' : allTr ? ` · ${trs} transcripci${trs === 1 ? 'ón' : 'ones'}` : ` · ${trs} secci${trs === 1 ? 'ón' : 'ones'}`) }),
        snip ? h('div', { class: 'item-snip', text: snip }) : null,
        (n.tags || []).length ? h('div', { class: 'item-tags' }, n.tags.map(t => h('span', { text: t }))) : null
      );
      longPress(el, () => { if (ui.sel) { ui.sel.add(n.id); renderList(); } else startSelect(n.id); });
      return el;
    }));
  }
  const renderListSoon = debounce(renderList, 300);

  /* ---------- Preferencias de lectura (solo en este dispositivo) ---------- */
  const PREF = { size: 'm', focus: false };
  try { Object.assign(PREF, JSON.parse(localStorage.getItem('notas-app-prefs') || '{}')); } catch { /* sin preferencias guardadas */ }
  const SIZES = [['s', 'Letra chica'], ['m', 'Letra normal'], ['l', 'Letra grande'], ['xl', 'Letra muy grande']];
  function savePrefs() { try { localStorage.setItem('notas-app-prefs', JSON.stringify(PREF)); } catch { /* sin almacenamiento */ } }
  // Escritura centrada: activada de entrada en el celu, apagada en la PC.
  if (typeof PREF.center !== 'boolean') { PREF.center = narrow(); savePrefs(); }
  // Corrector del navegador: en Android, tocar una palabra subrayada abre el menú de sugerencias y cierra el teclado.
  // Por eso viene apagado en el celu (el teclado sigue sugiriendo y corrigiendo).
  if (typeof PREF.spell !== 'boolean') { PREF.spell = !narrow(); savePrefs(); }
  function applyPrefs() {
    document.documentElement.dataset.size = PREF.size;
    document.body.classList.toggle('focus-mode', !!PREF.focus);
    document.body.classList.toggle('center-on', !!PREF.center);
  }
  applyPrefs();
  function readingDialog() {
    const d = $('#dlg2');
    const radios = h('div', { class: 'radio-list' }, SIZES.map(([k, label]) => {
      const r = h('input', { type: 'radio', name: 'size', value: k, checked: PREF.size === k });
      r.addEventListener('change', () => {
        PREF.size = k; savePrefs(); applyPrefs();
      });
      return h('label', null, r, h('span', { class: 'sz-' + k, text: label }));
    }));
    const cb = h('input', { type: 'checkbox', checked: !!PREF.center });
    cb.addEventListener('change', () => { PREF.center = cb.checked; savePrefs(); applyPrefs(); });
    const sp = h('input', { type: 'checkbox', checked: !!PREF.spell });
    sp.addEventListener('change', () => {
      PREF.spell = sp.checked; savePrefs();
      document.querySelectorAll('.prose-ed').forEach(el => el.setAttribute('spellcheck', PREF.spell ? 'true' : 'false'));
    });
    openDialog(d, 'Lectura y escritura', [
      radios,
      h('label', { class: 'check' }, cb, h('span', null,
        h('span', { text: 'Escritura centrada' }),
        h('span', { class: 'muted small block', text: 'Al tocar o escribir, la pantalla se acomoda para que el cursor quede cerca del medio y no abajo de todo.' }))),
      h('label', { class: 'check' }, sp, h('span', null,
        h('span', { text: 'Subrayar errores de ortografía' }),
        h('span', { class: 'muted small block', text: 'En el celu conviene apagado: si está prendido, tocar una palabra subrayada abre las sugerencias y cierra el teclado. El teclado igual sigue corrigiendo.' })))
    ], [h('button', { class: 'btn', text: 'Listo', onclick: () => d.close() })]);
  }
  function toggleFocus() {
    PREF.focus = !PREF.focus; savePrefs(); applyPrefs();
    const b = $('#focus-btn'); if (b) b.title = PREF.focus ? 'Mostrar la lista de notas' : 'Modo foco: ocultar la lista de notas';
  }

  /* ---------- Notas vacías ---------- */
  function noteIsEmpty(n) {
    return !(n.title || '').trim() && !(n.text || '').trim() && !(n.tags || []).length &&
      !(n.transcripts || []).some(t => (t.text || '').trim());
  }
  // Descarta transcripciones vacías y, si la nota quedó vacía, la borra.
  function pruneNote(id) {
    if (!S) return false;
    const i = S.data.notes.findIndex(n => n.id === id && !n.deleted);
    if (i < 0) return false;
    const n = S.data.notes[i];
    const trs = (n.transcripts || []).filter(t => (t.text || '').trim());
    if (trs.length !== (n.transcripts || []).length) { n.transcripts = trs; n.updatedAt = Date.now(); scheduleSave(); }
    if (!noteIsEmpty(n)) return false;
    if (S.data.syncBase && S.data.syncBase[id]) S.data.notes[i] = { id, deleted: true, updatedAt: Date.now() };
    else S.data.notes.splice(i, 1);
    scheduleSave();
    return true;
  }
  function sweepEmpty() { for (const n of liveNotes()) if (n.id !== ui.current) pruneNote(n.id); }

  function plainSnippet(md) {
    return (md || '')
      .replace(/^\s{0,3}(#{1,6}|>|[-*+]\s\[[ xX]\]|[-*+]|\d+[.)])\s+/gm, '')
      .replace(/^\s*([-*_]\s*){3,}$/gm, '')
      .replace(/^\s*\|?[\s:|-]*-[\s:|-]*$/gm, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/(^|[^\\])\|/g, '$1 ')
      .replace(/[*_~`]+/g, '')
      .replace(/\\([\\`*_{}\[\]()#+\-.!>|=])/g, '$1')
      .replace(/\s+/g, ' ').trim();
  }
  function wordCount(s) { const m = (s || '').match(/\S+/g); return m ? m.length : 0; }
  function wordsLabel(s) { const w = wordCount(s); return w === 1 ? '1 palabra' : `${nf(w)} palabras`; }

  /* ---------- Pantalla de la nota ---------- */
  let ED = null; // editor con formato de la nota abierta
  const view = { tab: 'nota' }; // 'nota' o el id de una transcripción

  function commitEditor() {
    if (!ED || !ED.dirty) return;
    clearTimeout(ED.timer);
    ED.dirty = false;
    const md = ED.editor.getMarkdown();
    const conv = ED.target !== ED.note && isPlainT(ED.target);
    if (conv) ED.target.fmt = 1; // desde ahora esta transcripción se guarda con formato
    if (md !== ED.target.text || conv) {
      ED.target.text = md; touch(ED.note);
      if (ED.onText) ED.onText(md);
    } else setStatus('Guardado');
  }
  function destroyEditor() {
    if (!ED) return;
    commitEditor();
    try { ED.editor.destroy(); } catch { /* ya destruido */ }
    ED = null;
    document.body.classList.remove('editing');
  }

  function showEmpty() {
    const has = liveNotes().length > 0;
    $('#editor').replaceChildren(h('div', { class: 'empty' }, h('div', null,
      h('h2', { text: has ? 'Elegí una nota' : 'Tu primera nota' }),
      h('p', { text: has ? 'O creá una nueva.' : 'Una nota puede ser una sesión, un tema o una reflexión. Vos decidís.' }),
      h('button', { class: 'btn primary', onclick: newNote, html: I.plus + '<span>Nueva nota</span>' })
    )));
  }

  function newNote() {
    const now = Date.now();
    const n = { id: uid(), title: '', date: todayISO(), text: '', tags: [], transcripts: [], createdAt: now, updatedAt: now };
    S.data.notes.push(n);
    openNote(n.id);
    const t = $('.ed-title'); if (t) t.focus();
    return n;
  }

  function openNote(id, tab) {
    const prev = ui.current;
    if (prev && prev !== id) { destroyEditor(); pruneNote(prev); }
    ui.current = id;
    view.tab = tab || 'nota';
    renderEditor();
    renderList();
    if (narrow()) {
      document.body.classList.add('show-editor');
      if (!prev) history.pushState({ note: id }, '');
      else history.replaceState({ note: id }, '');
    }
    $('#editor').scrollTop = 0;
  }
  function closeEditor() {
    const prev = ui.current;
    destroyEditor();
    ui.current = null;
    if (prev) pruneNote(prev);
    document.body.classList.remove('show-editor');
    showEmpty();
    renderList();
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && S && ui.sel && !$('#dlg').open && !$('#dlg2').open) endSelect(); });
  addEventListener('popstate', () => { if (S && ui.current && narrow()) closeEditor(); });
  function goBack() {
    if (history.state && history.state.note) history.back();
    else closeEditor();
  }

  function touch(n) { n.updatedAt = Date.now(); scheduleSave(); renderListSoon(); }


  function switchTab(n, tab) {
    commitEditor();
    if (view.tab !== 'nota') {
      const t = n.transcripts.find(x => x.id === view.tab);
      if (t && !(t.text || '').trim()) { n.transcripts = n.transcripts.filter(x => x !== t); }
    }
    view.tab = tab;
    renderEditor();
    $('#editor').scrollTop = 0;
  }

  function renderEditor() {
    destroyEditor();
    const n = getNote(ui.current);
    if (!n) { closeEditor(); return; }
    if (view.tab !== 'nota' && !n.transcripts.some(t => t.id === view.tab)) view.tab = 'nota';
    const nav = h('div', { class: 'ed-nav' }, edBar(n), edTabs(n));
    const head = h('div', { class: 'ed-head' }, nav);
    const pane = h('div', { class: 'ed-pane' });
    $('#editor').replaceChildren(head, pane);
    if (view.tab === 'nota') notePane(n, head, pane);
    else {
      const t = n.transcripts.find(x => x.id === view.tab);
      secPane(n, t, head, pane);
    }
    measureNav();
  }

  /* ---------- Cabecera de la nota: la fila de navegación se va con el scroll, la barra de formato queda ---------- */
  let navY = 0;
  let autoScrollUntil = 0;
  function measureNav() {
    const head = $('.ed-head'); const nav = $('.ed-nav');
    if (!head || !nav) return;
    head.style.setProperty('--navh', nav.offsetHeight + 'px');
  }
  function setNav(show) {
    const head = $('.ed-head');
    if (!head) return;
    if (!show) measureNav();
    head.classList.toggle('nav-off', !show);
  }
  function navHidden() { const head = $('.ed-head'); return !!(head && head.classList.contains('nav-off')); }
  function onEditorScroll() {
    const sc = $('#editor');
    const y = sc.scrollTop;
    const dy = y - navY;
    navY = y;
    if (document.body.classList.contains('kbd')) return; // con teclado la navegación ya está guardada
    if (y < 24) { setNav(true); return; }
    // Solo el scroll que hace la persona con el dedo o la rueda mueve la navegación, no el automático.
    if (Date.now() < autoScrollUntil || Date.now() - userScrollAt > 700) return;
    if (dy > 6) setNav(false);
    else if (dy < -6) setNav(true);
  }
  let userScrollAt = 0;
  $('#editor').addEventListener('scroll', onEditorScroll, { passive: true });
  for (const ev of ['touchmove', 'wheel']) $('#editor').addEventListener(ev, () => { userScrollAt = Date.now(); }, { passive: true });
  $('#editor').addEventListener('keydown', e => { if (/^(PageUp|PageDown|Home|End)$/.test(e.key) && !e.target.isContentEditable) userScrollAt = Date.now(); });
  // Con el teclado abierto en el celu se esconde la navegación; al cerrarlo vuelve.
  // Teclado abierto = la ventana se achicó bastante respecto de su alto máximo (con el mismo ancho).
  let baseH = innerHeight, baseW = innerWidth;
  function checkKeyboard() {
    if (innerWidth !== baseW) { baseW = innerWidth; baseH = innerHeight; }
    if (innerHeight > baseH) baseH = innerHeight;
    const open = narrow() && baseH - innerHeight > 150;
    const was = document.body.classList.contains('kbd');
    if (open === was) return;
    document.body.classList.toggle('kbd', open);
    setNav(true);
    measureNav();
    if (open) centerSoon(true, 120);
  }
  addEventListener('resize', checkKeyboard);
  if (window.visualViewport) visualViewport.addEventListener('resize', checkKeyboard);

  /* ---------- Escritura centrada: el cursor queda cerca del 40% de la pantalla ---------- */
  function centerOn() { return !!PREF.center; }
  function centerCaret(smooth) {
    if (!ED || !centerOn()) return;
    const v = ED.editor.view;
    if (!v.hasFocus()) return;
    const sc = $('#editor');
    let c;
    try { c = v.coordsAtPos(v.state.selection.head); } catch { return; }
    const r = sc.getBoundingClientRect();
    const head = $('.ed-head');
    let headVis = 0;
    if (head) {
      const navh = parseFloat(getComputedStyle(head).getPropertyValue('--navh')) || 0;
      headVis = head.offsetHeight - (navHidden() ? navh : 0);
    }
    const vv = window.visualViewport;
    const top = r.top + headVis;
    const bottom = Math.min(r.bottom, vv ? vv.offsetTop + vv.height : innerHeight);
    const avail = bottom - top;
    if (avail < 100) return;
    const y = (c.top + c.bottom) / 2;
    const rel = (y - top) / avail;
    if (rel > 0.25 && rel < 0.6) return; // zona muerta: no mover por poco
    const delta = Math.round(y - (top + avail * 0.4));
    if (Math.abs(delta) < 4) return;
    autoScrollUntil = Date.now() + (smooth ? 600 : 150);
    sc.scrollBy({ top: delta, behavior: smooth ? 'smooth' : 'auto' });
  }
  let centerT = 0;
  function centerSoon(smooth, ms = 180) {
    clearTimeout(centerT);
    centerT = setTimeout(() => centerCaret(smooth), ms);
  }

  function edBar(n) {
    return h('div', { class: 'ed-bar' },
      h('button', { class: 'btn ghost icon only-narrow', 'aria-label': 'Volver', html: I.back, onclick: goBack }),
      h('button', { class: 'btn ghost icon only-wide', id: 'focus-btn', title: PREF.focus ? 'Mostrar la lista de notas' : 'Modo foco: ocultar la lista de notas', 'aria-label': 'Modo foco', html: I.focus, onclick: toggleFocus }),
      h('span', { class: 'status', id: 'ed-status', text: 'Guardado' }),
      h('button', { class: 'btn ghost icon', title: 'Letra y escritura centrada', 'aria-label': 'Letra y escritura centrada', html: '<span class="aa">Aa</span>', onclick: readingDialog }),
      h('button', { class: 'btn ghost', title: 'Copiar esta nota como texto', onclick: () => exportDialog(n.id), html: I.copy + '<span class="label">Copiar para chat</span>' }),
      h('button', { class: 'btn ghost icon', title: 'Más opciones', 'aria-label': 'Más opciones de la nota', html: I.menu, onclick: () => noteMenu(n) })
    );
  }

  function edTabs(n) {
    const tabs = h('div', { class: 'ed-tabs', role: 'tablist' });
    const mk = (id, label, sub) => h('button', {
      class: 'tab' + (view.tab === id ? ' on' : ''), role: 'tab', 'aria-selected': view.tab === id ? 'true' : 'false',
      onclick: () => { if (view.tab !== id) switchTab(n, id); }
    }, h('span', { class: 'tab-l', text: label }), sub ? h('span', { class: 'tab-s', text: sub }) : null);
    tabs.append(mk('nota', 'Nota'));
    n.transcripts.forEach(t => tabs.append(mk(t.id, secLabel(n, t), wordsLabel(t.text))));
    tabs.append(h('button', { class: 'tab add', title: 'Agregar una sección', onclick: () => pickSection(n) }, '+ Sección'));
    return tabs;
  }

  function pickSection(n) {
    const d = $('#dlg2');
    const go = cat => () => { d.close(); addTranscript(n, '', '', cat); };
    const input = h('input', { type: 'text', placeholder: 'Otra categoría nueva', autocomplete: 'off', maxlength: '40' });
    const create = () => { const v = input.value.trim(); if (!v) return; const cat = addCat(v); d.close(); addTranscript(n, '', '', cat); };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); create(); } });
    openDialog(d, 'Agregar sección', [
      h('div', { class: 'menu' }, allCatsForPick().map(c => h('button', { class: 'btn', text: c.name, onclick: go(c.id) }))),
      h('div', { class: 'row' }, input, h('button', { class: 'btn', text: 'Crear', onclick: create })),
      h('p', { class: 'muted small', text: 'Las categorías se editan en Menú, "Categorías de secciones".' })
    ], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => d.close() })]);
  }

  function addTranscript(n, text = '', name = '', cat = TR) {
    commitEditor();
    const t = { id: uid(), name, text };
    if (cat !== TR) t.cat = cat;
    else if (!text) t.fmt = 1;
    n.transcripts.push(t);
    if (text) touch(n);
    view.tab = t.id;
    renderEditor();
    $('#editor').scrollTop = 0;
    if (!text) {
      if (ED) ED.editor.commands.focus('end');
    }
    return t;
  }

  function noteMenu(n) {
    const d = $('#dlg');
    const go = fn => () => { d.close(); fn(); };
    openDialog(d, n.title || 'Sin título', [h('div', { class: 'menu' },
      h('button', { class: 'btn', text: 'Agregar contenido de un archivo .docx', onclick: go(() => docxIntoNote(n)) }),
      h('button', { class: 'btn', text: 'Agregar transcripción desde un .txt', onclick: go(() => txtTranscripts(n)) }),
      h('button', { class: 'btn', text: 'Ver índice de títulos', onclick: go(() => { if (!ED) switchTab(n, 'nota'); outlineDialog(); }) }),
      h('hr'),
      h('button', { class: 'btn danger', text: 'Eliminar nota', onclick: go(() => deleteNote(n)) })
    )], [h('button', { class: 'btn', text: 'Cerrar', onclick: () => d.close() })]);
  }

  /* Pestaña Nota: título, fecha, etiquetas y texto con formato */
  function notePane(n, head, pane) {
    const title = h('input', { type: 'text', class: 'ed-title', placeholder: 'Título', value: n.title, 'aria-label': 'Título' });
    title.addEventListener('input', () => { n.title = title.value; touch(n); });
    title.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || !ED) return;
      e.preventDefault();
      ED.editor.commands.setTextSelection(1);
      ED.editor.view.focus();
    });
    const date = h('input', { type: 'date', value: n.date || '', 'aria-label': 'Fecha' });
    date.addEventListener('change', () => { n.date = date.value; touch(n); });
    const host = h('div', { class: 'prose' });
    pane.append(h('div', { class: 'ed-body' }, title, h('div', { class: 'ed-meta' }, date, tagsEditor(n)), host));
    mountEditor(n, n, head, host, 'Escribí acá. Atajos: "# " título, "- " viñeta, "1. " lista, "[ ] " tarea, "> " cita.', 'Texto de la nota');
  }

  /* Pestaña de una sección con formato (Resumen, Comentarios, etc.) */
  function secPane(n, t, head, pane) {
    const name = h('input', { type: 'text', class: 'tr-name', placeholder: secLabel(n, Object.assign({}, t, { name: '' })), value: t.name, 'aria-label': 'Nombre de la sección' });
    const stats = h('span', { class: 'tr-stats', text: catName(catOf(t)) + ' · ' + wordsLabel(t.text) });
    name.addEventListener('input', () => { t.name = name.value; const l = $('.tab.on .tab-l'); if (l) l.textContent = secLabel(n, t); touch(n); });
    const host = h('div', { class: 'prose' });
    const isTr = catOf(t) === TR;
    const loadTxt = isTr ? h('button', { class: 'btn small', text: 'Cargar .txt', onclick: async () => {
      const [f] = await pickFile('.txt,.md,text/plain');
      if (!f || !ED || ED.target !== t) return;
      const html = plainToHtml(await f.text());
      if (ED.editor.isEmpty) ED.editor.commands.setContent(html);
      else ED.editor.chain().focus('end').insertContent(html).run();
      if (!t.name) { t.name = f.name.replace(/\.(txt|md)$/i, ''); name.value = t.name; const l = $('.tab.on .tab-l'); if (l) l.textContent = secLabel(n, t); }
      ED.dirty = true; commitEditor(); toast('Transcripción cargada.');
    } }) : null;
    pane.append(h('div', { class: 'ed-body' },
      h('div', { class: 'tr-top' }, name,
        h('div', { class: 'tr-actions' }, stats, loadTxt,
          h('button', { class: 'btn small', text: 'Copiar', onclick: async () => { commitEditor(); toast(await copyText(t.text) ? 'Sección copiada.' : 'No se pudo copiar.'); } }),
          h('button', { class: 'btn small danger', text: 'Eliminar', onclick: async () => {
            commitEditor();
            if ((t.text || '').trim() && !(await confirmBox('¿Eliminar esta sección?', 'Eliminar', true))) return;
            if (ED) ED.dirty = false;
            n.transcripts = n.transcripts.filter(x => x.id !== t.id); touch(n); view.tab = 'nota'; renderEditor();
          } })
        )
      ),
      host));
    mountEditor(n, t, head, host, isTr ? 'Pegá acá la transcripción o cargala desde un archivo .txt' : 'Escribí acá. Tiene el mismo formato que la nota.', isTr ? 'Transcripción' : 'Texto de la sección', md => {
      const w = wordsLabel(md);
      stats.textContent = catName(catOf(t)) + ' · ' + w;
      const s = $('.tab.on .tab-s'); if (s) s.textContent = w;
    });
  }

  function mountEditor(n, target, head, host, placeholder, label, onText) {
    const fmt = fmtBar();
    head.append(fmt);
    const X = window.NotasEditor;
    const E = edExtensions();
    const legacy = target !== n && isPlainT(target);
    const editor = new X.Editor({
      element: host,
      injectCSS: false,
      extensions: [
        X.StarterKit.configure({ paragraph: false, underline: false, link: { openOnClick: false, autolink: true, linkOnPaste: true } }),
        E.Para,
        X.TaskList, X.TaskItem.configure({ nested: true }),
        E.Table.configure({ resizable: false }), X.TableRow, X.TableHeader, X.TableCell,
        X.Placeholder.configure({ placeholder }),
        X.Markdown
      ],
      content: legacy ? plainToHtml(target.text) : (target.text || ''),
      contentType: legacy ? 'html' : 'markdown',
      editorProps: {
        attributes: { class: 'prose-ed', 'aria-label': label, spellcheck: PREF.spell ? 'true' : 'false' },
        transformPastedHTML: cleanPastedHTML,
        scrollMargin: { top: 130, bottom: 60, left: 0, right: 0 },
        scrollThreshold: { top: 130, bottom: 60, left: 0, right: 0 },
        // Con escritura centrada, el scroll lo maneja centerCaret.
        handleScrollToSelection: () => centerOn()
      },
      onUpdate: () => {
        if (!ED) return;
        ED.dirty = true;
        setStatus('Guardando…');
        clearTimeout(ED.timer);
        ED.timer = setTimeout(commitEditor, 500);
        typedAt = Date.now();
        if (centerOn()) { clearTimeout(centerT); requestAnimationFrame(() => centerCaret(false)); }
      },
      onSelectionUpdate: () => {
        if (centerOn() && Date.now() - typedAt > 80) centerSoon(true, 220);
      },
      onTransaction: () => updateFmtSoon(),
      onFocus: () => {
        document.body.classList.add('editing');
        if (centerOn()) centerSoon(true, 350);
      },
      onBlur: () => document.body.classList.remove('editing')
    });
    ED = { editor, note: n, target, dirty: false, timer: null, fmt, onText };
    updateFmt();
  }

  // Protege símbolos que al principio de un renglón se leerían como formato al volver a abrir la nota
  // (# título, - o + viñeta, 1. lista, --- línea, filas que parecen tabla).
  function escLineStarts(s) {
    return s.split('\n').map(l => l
      .replace(/^(\s{0,3})(#{1,6})(?=\s|$)/, '$1\\$2')
      .replace(/^(\s{0,3})([-+])(?=\s)/, '$1\\$2')
      .replace(/^(\s{0,3}\d{1,9})([.)])(?=\s|$)/, '$1\\$2')
      .replace(/^(\s{0,3})([-=])(?=[-=\s]*$)/, '$1\\$2')
      .replace(/^(\s{0,3})([|:-])(?=[\s|:-]*-[\s|:-]*$)/, (m, a, b) => /\|/.test(l) ? a + '\\' + b : m)
    ).join('\n');
  }
  let EXT = null;
  function edExtensions() {
    if (EXT) return EXT;
    const X = window.NotasEditor;
    EXT = {
      Para: X.Paragraph.extend({ renderMarkdown: (node, hh, ctx) => escLineStarts(X.Paragraph.config.renderMarkdown(node, hh, ctx) || '') }),
      // Al copiar, la tabla sale sin estilos en línea (la política de seguridad no los permite).
      Table: X.Table.extend({ renderHTML({ HTMLAttributes }) { return ['table', HTMLAttributes, ['tbody', 0]]; } })
    };
    return EXT;
  }
  // Texto plano (transcripciones viejas) a HTML: cada renglón se respeta tal cual.
  function plainToHtml(t) {
    const esc = x => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return (t || '').replace(/\r\n?/g, '\n').split(/\n[ \t]*\n/)
      .filter(b => b.trim())
      .map(b => '<p>' + b.split('\n').map(esc).join('<br>') + '</p>').join('');
  }
  const isPlainT = t => catOf(t) === TR && !t.fmt; // transcripción vieja, todavía en texto plano

  let typedAt = 0;
  let fmtRaf = 0;
  function updateFmtSoon() { if (!fmtRaf) fmtRaf = requestAnimationFrame(() => { fmtRaf = 0; updateFmt(); }); }
  function updateFmt() {
    if (!ED) return;
    const e = ED.editor;
    const inTable = e.isActive('table');
    if (inTable !== ED.fmt.classList.contains('in-table')) {
      ED.fmt.classList.toggle('in-table', inTable);
      if (inTable) ED.fmt.scrollLeft = 0; // que los controles de la tabla queden a la vista
    }
    for (const b of ED.fmt.querySelectorAll('[data-k]')) {
      const k = b.dataset.k;
      let on = false, dis = false;
      if (k === 'p') on = e.isActive('paragraph') && !e.isActive('bulletList') && !e.isActive('orderedList') && !e.isActive('taskList') && !e.isActive('blockquote');
      else if (/^h[1-3]$/.test(k)) on = e.isActive('heading', { level: Number(k[1]) });
      else if (['bold', 'italic', 'strike', 'bulletList', 'orderedList', 'taskList', 'blockquote'].includes(k)) on = e.isActive(k);
      else if (k === 'undo') dis = !e.can().undo();
      else if (k === 'redo') dis = !e.can().redo();
      else if (k === 'indent') dis = !(e.can().sinkListItem('listItem') || e.can().sinkListItem('taskItem'));
      else if (k === 'outdent') dis = !(e.can().liftListItem('listItem') || e.can().liftListItem('taskItem'));
      else if (k === 'table') { on = inTable; dis = inTable; }
      else if (k === 'tRowDel') dis = !inTable || !e.can().deleteRow();
      else if (k === 'tColDel') dis = !inTable || !e.can().deleteColumn();
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.disabled = dis;
    }
  }

  function fmtBar() {
    const run = fn => () => { if (ED) { fn(ED.editor); updateFmt(); } };
    const B = (k, label, title, fn, html) => {
      const b = h('button', { class: 'fb' + (html ? ' ico' : ''), type: 'button', title, 'aria-label': title, 'data-k': k, onclick: run(fn) });
      if (html) b.innerHTML = html; else b.textContent = label;
      // Que tocar un botón no le saque el foco al texto (si no, el teclado se cierra y se vuelve a abrir).
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') e.preventDefault(); });
      return b;
    };
    const sep = () => h('span', { class: 'fsep', 'aria-hidden': 'true' });
    const c = e => e.chain().focus();
    const T = (k, label, title, fn) => { const b = B(k, label, title, fn); b.classList.add('tb'); return b; };
    return h('div', { class: 'fmt-bar', role: 'toolbar', 'aria-label': 'Formato' },
      T('tRowAdd', '+ Fila', 'Agregar fila debajo', e => c(e).addRowAfter().run()),
      T('tColAdd', '+ Columna', 'Agregar columna a la derecha', e => c(e).addColumnAfter().run()),
      T('tRowDel', '− Fila', 'Quitar esta fila', e => c(e).deleteRow().run()),
      T('tColDel', '− Columna', 'Quitar esta columna', e => c(e).deleteColumn().run()),
      T('tDel', 'Quitar tabla', 'Quitar la tabla entera', e => c(e).deleteTable().run()),
      h('span', { class: 'fsep tb', 'aria-hidden': 'true' }),
      B('p', 'Texto', 'Texto normal', e => c(e).setParagraph().run()),
      B('h1', 'T1', 'Título 1', e => c(e).toggleHeading({ level: 1 }).run()),
      B('h2', 'T2', 'Título 2', e => c(e).toggleHeading({ level: 2 }).run()),
      B('h3', 'T3', 'Título 3', e => c(e).toggleHeading({ level: 3 }).run()),
      sep(),
      B('bold', 'B', 'Negrita', e => c(e).toggleBold().run()),
      B('italic', 'I', 'Cursiva', e => c(e).toggleItalic().run()),
      B('strike', 'S', 'Tachado', e => c(e).toggleStrike().run()),
      sep(),
      B('bulletList', '', 'Viñetas', e => c(e).toggleBulletList().run(), I.ul),
      B('orderedList', '', 'Lista numerada', e => c(e).toggleOrderedList().run(), I.ol),
      B('taskList', '', 'Lista de tareas', e => c(e).toggleTaskList().run(), I.task),
      B('outdent', '', 'Reducir sangría', e => { if (!c(e).liftListItem('listItem').run()) c(e).liftListItem('taskItem').run(); }, I.outdent),
      B('indent', '', 'Aumentar sangría', e => { if (!c(e).sinkListItem('listItem').run()) c(e).sinkListItem('taskItem').run(); }, I.indent),
      sep(),
      B('blockquote', '', 'Cita', e => c(e).toggleBlockquote().run(), I.quote),
      B('hr', '', 'Línea divisoria', e => c(e).setHorizontalRule().run(), I.hr),
      B('table', '', 'Insertar tabla', e => c(e).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), I.table),
      sep(),
      B('undo', '', 'Deshacer', e => c(e).undo().run(), I.undo),
      B('redo', '', 'Rehacer', e => c(e).redo().run(), I.redo),
      sep(),
      B('outline', '', 'Índice de títulos', () => outlineDialog(), I.outline)
    );
  }

  function outlineDialog() {
    if (!ED) return;
    const e = ED.editor;
    const items = [];
    e.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') { items.push({ level: node.attrs.level, text: node.textContent, pos }); return false; }
      return true;
    });
    if (!items.length) { toast('Esta nota no tiene títulos. Usá T1, T2 o T3 para crearlos.', 4000); return; }
    const d = $('#dlg2');
    openDialog(d, 'Índice', [h('div', { class: 'outline' }, items.map(it => h('button', {
      class: 'ol-item lvl' + Math.min(it.level, 4), text: it.text || '(título vacío)',
      onclick: () => {
        d.close();
        const dom = e.view.nodeDOM(it.pos);
        if (dom && dom.scrollIntoView) dom.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    })))], [h('button', { class: 'btn', text: 'Cerrar', onclick: () => d.close() })]);
  }

  async function txtTranscripts(n) {
    const files = await pickFile('.txt,.md,text/plain', true);
    if (!files.length) return;
    let last = null;
    for (const f of files) {
      const t = { id: uid(), name: f.name.replace(/\.(txt|md)$/i, ''), text: await f.text() };
      n.transcripts.push(t); last = t.id;
    }
    touch(n);
    commitEditor();
    view.tab = last;
    renderEditor();
    toast(files.length === 1 ? 'Transcripción agregada.' : `${files.length} transcripciones agregadas.`);
  }

  function tagsEditor(n) {
    const wrap = h('div', { class: 'tags-edit' });
    const listId = 'tag-sugg';
    const input = h('input', { type: 'text', placeholder: n.tags.length ? 'Otra etiqueta' : 'Agregar etiqueta', list: listId, 'aria-label': 'Agregar etiqueta', autocomplete: 'off' });
    const dl = h('datalist', { id: listId }, allTags().map(t => h('option', { value: t.name })));
    function add(raw) {
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
      let changed = false;
      for (const p of parts) if (!n.tags.some(t => norm(t) === norm(p))) { n.tags.push(p); changed = true; }
      input.value = '';
      if (changed) { touch(n); draw(); renderList(); }
    }
    function draw() {
      wrap.replaceChildren(
        ...n.tags.map((t, i) => h('span', { class: 'chip on' }, t,
          h('button', { class: 'x', 'aria-label': 'Quitar ' + t, text: '×', onclick: () => { n.tags.splice(i, 1); touch(n); draw(); renderList(); } }))),
        input, dl
      );
      input.placeholder = n.tags.length ? 'Otra etiqueta' : 'Agregar etiqueta';
    }
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input.value); }
      else if (e.key === 'Backspace' && !input.value && n.tags.length) { n.tags.pop(); touch(n); draw(); renderList(); setTimeout(() => input.focus()); }
    });
    input.addEventListener('change', () => { if (input.value.trim()) add(input.value); });
    input.addEventListener('blur', () => { if (input.value.trim()) add(input.value); });
    draw();
    return wrap;
  }

  async function deleteNote(n) {
    if (!(await confirmBox(`¿Eliminar "${n.title || 'Sin título'}"? No se puede deshacer.`, 'Eliminar', true))) return;
    if (ED && ED.note === n) { ED.dirty = false; destroyEditor(); }
    const idx = S.data.notes.indexOf(n);
    S.data.notes[idx] = { id: n.id, deleted: true, updatedAt: Date.now() };
    scheduleSave();
    if (history.state && history.state.note && narrow()) history.back();
    else closeEditor();
    toast('Nota eliminada.');
  }

  /* ---------- Pegar desde Word o Docs, e importar .docx ---------- */
  // Las tablas simples quedan como tablas; las que tienen celdas combinadas en vertical o tablas
  // dentro de tablas se pasan a renglones "a | b", porque el formato de las notas no las admite.
  function flattenTables(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('img, style, script, meta, link, title').forEach(e => e.remove());
    doc.querySelectorAll('[style]').forEach(e => e.removeAttribute('style'));
    const flat = tb => {
      const frag = doc.createDocumentFragment();
      tb.querySelectorAll('tr').forEach(tr => {
        const cells = [...tr.children].map(c => c.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean);
        if (cells.length) { const p = doc.createElement('p'); p.textContent = cells.join(' | '); frag.append(p); }
      });
      tb.replaceWith(frag);
    };
    // De adentro hacia afuera: una tabla dentro de otra se aplana.
    for (const tb of [...doc.querySelectorAll('table')].reverse()) {
      if (!tb.isConnected) continue;
      const rows = [...tb.querySelectorAll('tr')].filter(tr => tr.closest('table') === tb);
      if (!rows.length) { tb.remove(); continue; }
      if (tb.parentElement && tb.parentElement.closest('table') || rows.some(tr => [...tr.children].some(c => Number(c.getAttribute('rowspan') || 1) > 1))) { flat(tb); continue; }
      const grid = rows.map(tr => {
        const out = [];
        for (const c of [...tr.children].filter(c => /^T[DH]$/.test(c.tagName))) {
          // Dentro de una celda: solo texto con negrita, cursiva, tachado, código y enlaces; cada párrafo o ítem, en su renglón.
          const parts = [];
          const walk = (node, into) => {
            for (const ch of [...node.childNodes]) {
              if (ch.nodeType === 3) { into.push(ch.textContent.replace(/\s+/g, ' ')); continue; }
              if (ch.nodeType !== 1) continue;
              const tag = ch.tagName;
              if (tag === 'BR') { into.push('\n'); continue; }
              if (/^(B|STRONG|I|EM|S|DEL|STRIKE|CODE|A)$/.test(tag)) {
                const inner = []; walk(ch, inner);
                const t = inner.join('');
                if (!t.trim()) { into.push(t); continue; }
                const el = doc.createElement(tag === 'B' ? 'strong' : tag === 'I' ? 'em' : /^(DEL|STRIKE)$/.test(tag) ? 's' : tag.toLowerCase());
                if (tag === 'A' && ch.getAttribute('href')) el.setAttribute('href', ch.getAttribute('href'));
                into.push({ el, t });
                continue;
              }
              const block = /^(P|DIV|LI|H[1-6]|TR|UL|OL|BLOCKQUOTE|PRE)$/.test(tag);
              if (block) into.push('\n');
              walk(ch, into);
              if (block) into.push('\n');
            }
          };
          walk(c, parts);
          const cell = doc.createElement(c.tagName === 'TH' ? 'th' : 'td');
          const lines = [[]];
          for (const x of parts) {
            if (typeof x === 'string') x.split('\n').forEach((seg, i) => { if (i) lines.push([]); if (seg) lines[lines.length - 1].push(seg); });
            else lines[lines.length - 1].push(x);
          }
          const used = lines.filter(l => l.some(x => typeof x === 'string' ? x.trim() : x.t.trim()));
          used.forEach((l, i) => {
            if (i) cell.append(doc.createElement('br'));
            l.forEach((x, j) => {
              if (typeof x === 'string') cell.append(j === 0 ? x.replace(/^\s+/, '') : x);
              else { x.el.textContent = x.t; cell.append(x.el); }
            });
          });
          out.push(cell);
          for (let k = 1; k < Number(c.getAttribute('colspan') || 1); k++) out.push(doc.createElement(c.tagName === 'TH' ? 'th' : 'td'));
        }
        return out;
      }).filter(r => r.length);
      if (!grid.length) { tb.remove(); continue; }
      const cols = Math.max(...grid.map(r => r.length));
      const table = doc.createElement('table');
      const body = doc.createElement('tbody');
      table.append(body);
      grid.forEach((r, i) => {
        while (r.length < cols) r.push(doc.createElement('td'));
        const tr = doc.createElement('tr');
        r.forEach(c => {
          // La primera fila es el encabezado (así lo pide el formato de tablas de las notas); las demás, celdas comunes.
          const want = i === 0 ? 'th' : 'td';
          if (c.tagName.toLowerCase() !== want) { const nc = doc.createElement(want); nc.append(...c.childNodes); c = nc; }
          tr.append(c);
        });
        body.append(tr);
      });
      tb.replaceWith(table);
    }
    return doc.body.innerHTML;
  }
  // Word pega las viñetas como párrafos sueltos con el símbolo adelante; acá se rearman como lista.
  function wordLists(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('[data-mso-ignore]').forEach(e => e.remove());
    let cur = null;
    for (const p of [...doc.body.querySelectorAll('p')]) {
      const item = /MsoListParagraph/i.test(p.className) || p.hasAttribute('data-mso-item');
      if (!item) continue;
      if (!(cur && p.previousElementSibling === cur)) { cur = doc.createElement('ul'); p.before(cur); }
      const li = doc.createElement('li');
      li.innerHTML = p.innerHTML;
      cur.append(li);
      p.remove();
    }
    return doc.body.innerHTML;
  }
  // Quita los estilos en línea antes de leer el HTML (la política de seguridad no los permite) y guarda las marcas de lista de Word.
  function stripStyles(html) {
    return html.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi, (m, v) =>
      /mso-list:\s*Ignore/i.test(v) ? ' data-mso-ignore="1"' : /mso-list:\s*l\d/i.test(v) ? ' data-mso-item="1"' : '');
  }
  function cleanPastedHTML(html) {
    html = stripStyles(html);
    if (/class="?Mso|urn:schemas-microsoft-com/i.test(html)) html = wordLists(html);
    return flattenTables(html);
  }
  let mammothLoading = null;
  function loadMammoth() {
    if (window.mammoth) return Promise.resolve();
    if (mammothLoading) return mammothLoading;
    mammothLoading = new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = 'vendor/mammoth.browser.min.js';
      sc.onload = () => res();
      sc.onerror = () => { mammothLoading = null; rej(new Error('No se pudo cargar el lector de .docx.')); };
      document.head.append(sc);
    });
    return mammothLoading;
  }
  async function docxToHtml(file) {
    await loadMammoth();
    const r = await window.mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, {
      styleMap: ["p[style-name='Title'] => h1:fresh", "p[style-name='Subtitle'] => h2:fresh", "p[style-name='Título'] => h1:fresh", "p[style-name='Subtítulo'] => h2:fresh"]
    });
    return flattenTables(r.value || '');
  }
  async function pickDocx() {
    const [f] = await pickFile('.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    if (!f) return null;
    toast('Leyendo el documento…', 2500);
    try { return { name: f.name.replace(/\.docx$/i, ''), html: await docxToHtml(f) }; }
    catch (e) { console.error(e); toast('No se pudo leer el .docx: ' + (e.message || e), 5000); return null; }
  }
  async function docxIntoNote(n) {
    const doc = await pickDocx();
    if (!doc) return;
    if (!getNote(n.id)) return;
    if (ui.current !== n.id) openNote(n.id, 'nota');
    else if (view.tab !== 'nota') switchTab(n, 'nota');
    if (!ED) return;
    if (!(n.text || '').trim()) ED.editor.commands.setContent(doc.html);
    else ED.editor.chain().focus('end').insertContent('<hr>' + doc.html).run();
    if (!n.title.trim()) { n.title = doc.name; const t = $('.ed-title'); if (t) t.value = n.title; }
    ED.dirty = true; commitEditor(); touch(n);
    toast('Contenido del .docx agregado.');
  }
  async function newNoteFromDocx() {
    const doc = await pickDocx();
    if (!doc) return;
    const n = newNote();
    n.title = doc.name;
    const t = $('.ed-title'); if (t) { t.value = n.title; t.blur(); }
    if (ED) { ED.editor.commands.setContent(doc.html); ED.dirty = true; commitEditor(); }
    touch(n);
    toast('Nota creada desde el .docx.');
  }

  /* ---------- Toque largo en un botón: muestra qué hace (como los tooltips de Android) ---------- */
  const tip = h('div', { class: 'tip', id: 'tip', role: 'tooltip', hidden: true });
  document.body.append(tip);
  let tipTimer = 0, tipHide = 0, tipFired = false, tipX = 0, tipY = 0;
  function tipFor(el) {
    if (el.id === 'sync-btn') { const [, name, why] = syncVisual(); return { title: 'Drive: ' + name, body: why }; }
    const t = el.dataset.tip || el.getAttribute('title') || el.getAttribute('aria-label');
    return t ? { title: t } : null;
  }
  function showTip(el) {
    const info = tipFor(el);
    if (!info) return;
    tip.replaceChildren(h('strong', { text: info.title }), info.body ? h('span', { text: info.body }) : null);
    tip.classList.toggle('rich', !!info.body);
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const left = Math.max(8, Math.min(innerWidth - tw - 8, r.left + r.width / 2 - tw / 2));
    const below = r.bottom + 8 + th < innerHeight - 8;
    tip.style.left = left + 'px';
    tip.style.top = (below ? r.bottom + 8 : Math.max(8, r.top - 8 - th)) + 'px';
    clearTimeout(tipHide);
  }
  function hideTipSoon(ms) { clearTimeout(tipHide); tipHide = setTimeout(() => { tip.hidden = true; }, ms); }
  const TIP_SEL = '[data-tip], button[title], button[aria-label]';
  document.addEventListener('pointerdown', e => {
    tipFired = false;
    clearTimeout(tipTimer);
    if (e.pointerType === 'mouse') return; // en la PC ya está el cartel al pasar el mouse
    const el = e.target.closest(TIP_SEL);
    if (!el || el.closest('.item')) return;
    tipX = e.clientX; tipY = e.clientY;
    tipTimer = setTimeout(() => { tipFired = true; if (navigator.vibrate) navigator.vibrate(10); showTip(el); }, 450);
  }, true);
  document.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - tipX, e.clientY - tipY) > 10) clearTimeout(tipTimer); }, true);
  const tipEnd = () => { clearTimeout(tipTimer); if (tipFired && !tip.hidden) hideTipSoon(tip.classList.contains('rich') ? 4000 : 1800); };
  document.addEventListener('pointerup', tipEnd, true);
  document.addEventListener('pointercancel', tipEnd, true);
  // El toque largo no ejecuta el botón.
  document.addEventListener('click', e => { if (tipFired) { tipFired = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('contextmenu', e => { if (e.target.closest(TIP_SEL)) e.preventDefault(); }, true);
  addEventListener('scroll', () => { if (!tip.hidden) tip.hidden = true; }, true);

  /* ---------- Diálogos genéricos ---------- */
  function openDialog(dlg, title, content, actions) {
    dlg.replaceChildren(h('div', { class: 'dlg-inner' },
      h('div', { class: 'dlg-head' }, h('h2', { text: title })),
      h('div', { class: 'dlg-content' }, content),
      actions && actions.length ? h('div', { class: 'dlg-foot' }, actions) : null
    ));
    if (!dlg.open) dlg.showModal();
    return dlg;
  }
  for (const id of ['dlg', 'dlg2']) {
    const d = document.getElementById(id);
    d.addEventListener('close', () => { if (!d.open) d.replaceChildren(); });
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
  }
  function confirmBox(msg, okLabel = 'Aceptar', danger = false) {
    return new Promise(resolve => {
      const d = $('#dlg2');
      let done = false;
      const finish = v => { if (done) return; done = true; resolve(v); if (d.open) d.close(); };
      openDialog(d, 'Confirmar', [h('p', { text: msg })], [
        h('button', { class: 'btn', text: 'Cancelar', onclick: () => finish(false) }),
        h('button', { class: 'btn ' + (danger ? 'danger solid' : 'primary'), text: okLabel, onclick: () => finish(true) })
      ]);
      d.addEventListener('close', function onClose() { if (d.open) return; d.removeEventListener('close', onClose); finish(false); });
    });
  }
  function askPassword(title, msg) {
    return new Promise(resolve => {
      const d = $('#dlg2');
      let done = false;
      const pw = h('input', { type: 'password', autocomplete: 'off', placeholder: 'Contraseña' });
      const finish = v => { if (done) return; done = true; resolve(v); if (d.open) d.close(); };
      const form = h('form', { onsubmit: e => { e.preventDefault(); finish(pw.value); } }, pw);
      openDialog(d, title, [h('p', { class: 'muted', text: msg }), form], [
        h('button', { class: 'btn', text: 'Cancelar', onclick: () => finish(null) }),
        h('button', { class: 'btn primary', text: 'Continuar', onclick: () => finish(pw.value) })
      ]);
      d.addEventListener('close', function onClose() { if (d.open) return; d.removeEventListener('close', onClose); finish(null); });
      setTimeout(() => pw.focus(), 50);
    });
  }

  /* ---------- Menú ---------- */
  function menuDialog() {
    const d = $('#dlg');
    if (driveConfigured()) loadGis().catch(() => {});
    const go = fn => () => { d.close(); fn(); };
    openDialog(d, 'Menú', [h('div', { class: 'menu' },
      h('button', { class: 'btn', html: I.lock + '<span>' + (S.multi ? 'Bloquear ahora o cambiar de sesión' : 'Bloquear ahora') + '</span>', onclick: go(lock) }),
      h('hr'),
      h('button', { class: 'btn', text: 'Copiar o descargar notas como texto', onclick: go(() => exportDialog(null)) }),
      h('button', { class: 'btn', text: 'Importar notas desde texto', onclick: go(importDialog) }),
      h('button', { class: 'btn', text: 'Nueva nota desde un archivo .docx', onclick: go(newNoteFromDocx) }),
      h('button', { class: 'btn', text: 'Categorías de secciones', onclick: go(catsDialog) }),
      h('hr'),
      h('button', { class: 'btn', text: 'Descargar backup encriptado', onclick: go(exportBackup) }),
      h('button', { class: 'btn', text: 'Restaurar backup encriptado', onclick: go(importBackup) }),
      driveConfigured() ? [
        h('hr'),
        driveOn() ? h('p', { class: 'muted small sync-detail', text: 'Drive: ' + syncVisual()[1] + '. ' + syncVisual()[2] }) : null,
        driveOn()
          ? h('button', { class: 'btn', text: 'Sincronizar con Drive ahora', onclick: go(syncTap) })
          : h('button', { class: 'btn', text: 'Conectar Google Drive', onclick: go(connectDrive) }),
        driveOn() ? h('button', { class: 'btn', text: 'Desconectar Google Drive', onclick: go(disconnectDrive) }) : null
      ] : null,
      h('hr'),
      h('button', { class: 'btn', text: 'Cambiar contraseña', onclick: go(changePasswordDialog) }),
      h('button', { class: 'btn', text: 'Crear otra sesión', onclick: go(newSessionDialog) }),
      h('hr'),
      S.multi ? h('button', { class: 'btn danger', text: 'Eliminar esta sesión de este dispositivo', onclick: go(deleteSessionDialog) }) : null,
      h('button', { class: 'btn danger', text: S.multi ? 'Borrar todas las sesiones de este dispositivo' : 'Borrar todo de este dispositivo', onclick: go(wipeDialog) }),
      h('p', { class: 'muted small', text: `notas-app ${APP_VERSION} · sesión ${S.data.profile.name} · ${liveNotes().length} notas · se bloquea tras 5 minutos sin uso` })
    )], [h('button', { class: 'btn', text: 'Cerrar', onclick: () => d.close() })]);
  }

  /* ---------- Exportar como texto para chat ---------- */
  const bump = (md, k) => md.replace(/^(#{1,6}) /gm, (m, x) => '#'.repeat(Math.min(6, x.length + k)) + ' ');
  // inc: { text: bool, cats: Set de categorías a incluir }
  function noteToText(n, inc) {
    let out = `# ${n.title || 'Sin título'}\n`;
    if (n.date) out += `Fecha: ${n.date}\n`;
    if ((n.tags || []).length) out += `Etiquetas: ${n.tags.join(', ')}\n`;
    const body = inc.text ? bump((n.text || '').trim(), 1) : '';
    if (body) out += `\n${body}\n`;
    for (const t of n.transcripts || []) {
      const cat = catOf(t);
      if (!inc.cats.has(cat)) continue;
      const tx = (t.text || '').trim();
      if (!tx) continue;
      out += `\n## ${catName(cat)}${t.name ? ': ' + t.name : ''}\n\n${isPlainT(t) ? tx : bump(tx, 2)}\n`;
    }
    return out;
  }
  function buildExport(notes, inc) {
    const ordered = [...notes].sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.createdAt - b.createdAt);
    return ordered.map(n => noteToText(n, inc)).join('\n========\n\n');
  }

  function exportDialog(noteId, preIds) {
    commitEditor();
    const d = $('#dlg');
    const filtered = filteredNotes();
    const isFiltered = filterActive();
    const years = [...new Set(liveNotes().map(n => (n.date || '').slice(0, 4)).filter(Boolean))].sort().reverse();
    const opts = [];
    if (noteId) opts.push(['nota', 'Solo esta nota']);
    opts.push(['elegir', 'Elegir notas']);
    opts.push(['todas', `Todas las notas (${liveNotes().length})`]);
    if (isFiltered) opts.push(['filtro', `Las que coinciden con la búsqueda o el filtro (${filtered.length})`]);
    if (years.length) opts.push(['anio', 'Un año']);
    opts.push(['rango', 'Un rango de fechas']);
    let scope = noteId ? 'nota' : preIds && preIds.length ? 'elegir' : 'todas';

    // Rango
    const from = h('input', { type: 'date', 'aria-label': 'Desde' });
    const to = h('input', { type: 'date', 'aria-label': 'Hasta', value: todayISO() });
    const range = h('div', { class: 'range', hidden: true }, h('label', { class: 'field' }, h('span', { text: 'Desde' }), from), h('label', { class: 'field' }, h('span', { text: 'Hasta' }), to));
    from.addEventListener('change', update);
    to.addEventListener('change', update);

    // Año
    const yearSel = h('select', { 'aria-label': 'Año' }, years.map(y => h('option', { value: y, text: y })));
    const yearBox = h('div', { class: 'range', hidden: true }, h('label', { class: 'field' }, h('span', { text: 'Año' }), yearSel));
    yearSel.addEventListener('change', update);

    // Elegir notas
    const chosen = new Set(noteId ? [noteId] : preIds || []);
    const pickQ = h('input', { type: 'search', placeholder: 'Buscar por título, fecha o etiqueta', 'aria-label': 'Buscar notas' });
    const pickList = h('div', { class: 'imp-list pick-list' });
    const pickInfo = h('span', { class: 'muted small' });
    function pickVisible() {
      const q = norm(pickQ.value.trim());
      return sortNotes(liveNotes()).filter(n => !q || q.split(/\s+/).every(w => norm([n.title, n.date, fmtDate(n.date), (n.tags || []).join(' ')].join(' ')).includes(w)));
    }
    function drawPick() {
      pickList.replaceChildren(...pickVisible().map(n => {
        const cb = h('input', { type: 'checkbox', checked: chosen.has(n.id) });
        cb.addEventListener('change', () => { cb.checked ? chosen.add(n.id) : chosen.delete(n.id); update(); });
        return h('label', { class: 'imp-item' }, cb, h('div', null,
          h('div', { class: 't', text: n.title || 'Sin título' }),
          h('div', { class: 'd', text: fmtDate(n.date) + ((n.tags || []).length ? ' · ' + n.tags.join(', ') : '') })));
      }));
    }
    pickQ.addEventListener('input', debounce(drawPick, 150));
    const pickBox = h('div', { class: 'pick', hidden: true },
      pickQ,
      h('div', { class: 'row' },
        h('button', { class: 'btn small', text: 'Marcar las visibles', onclick: () => { pickVisible().forEach(n => chosen.add(n.id)); drawPick(); update(); } }),
        h('button', { class: 'btn small', text: 'Desmarcar todas', onclick: () => { chosen.clear(); drawPick(); update(); } }),
        pickInfo),
      pickList);

    const radios = h('div', { class: 'radio-list' }, opts.map(([v, label]) => {
      const r = h('input', { type: 'radio', name: 'scope', value: v, checked: v === scope });
      r.addEventListener('change', () => {
        scope = v;
        range.hidden = v !== 'rango'; yearBox.hidden = v !== 'anio'; pickBox.hidden = v !== 'elegir';
        if (v === 'elegir') drawPick();
        update();
      });
      return h('label', null, r, h('span', { text: label }));
    }));
    range.hidden = scope !== 'rango'; yearBox.hidden = scope !== 'anio'; pickBox.hidden = scope !== 'elegir';
    if (scope === 'elegir') drawPick();

    // Secciones a incluir
    const inc = { text: true, cats: new Set(liveCats().map(c => c.id)) };
    if (noteId) inc.cats.add(TR);
    const secBox = h('div', { class: 'sec-pick' });
    function drawSecs(notes) {
      const present = [];
      const seen = new Set();
      for (const n of notes) for (const t of n.transcripts || []) {
        const c = catOf(t);
        if (!seen.has(c) && (t.text || '').trim()) { seen.add(c); present.push(c); }
      }
      present.sort((a, b) => (a === TR ? -1 : b === TR ? 1 : catName(a).localeCompare(catName(b))));
      const mk = (label, on, set) => {
        const cb = h('input', { type: 'checkbox', checked: on });
        cb.addEventListener('change', () => { set(cb.checked); update(); });
        return h('label', { class: 'check' }, cb, h('span', { text: label }));
      };
      secBox.replaceChildren(
        h('div', { class: 'muted small', text: 'Qué partes incluir' }),
        mk('Texto de la nota', inc.text, v => { inc.text = v; }),
        ...present.map(c => mk(isPlain(c) ? 'Transcripciones' : catName(c), inc.cats.has(c), v => { v ? inc.cats.add(c) : inc.cats.delete(c); }))
      );
    }

    const stats = h('div', { class: 'stats' });
    const preview = h('textarea', { class: 'preview', readonly: true, 'aria-label': 'Vista previa' });
    let current = '';
    let lastKey = '';

    function pick() {
      if (scope === 'nota') return [getNote(noteId)].filter(Boolean);
      if (scope === 'elegir') return liveNotes().filter(n => chosen.has(n.id));
      if (scope === 'filtro') return filtered;
      if (scope === 'anio') return liveNotes().filter(n => (n.date || '').slice(0, 4) === yearSel.value);
      if (scope === 'rango') return liveNotes().filter(n => n.date && (!from.value || n.date >= from.value) && (!to.value || n.date <= to.value));
      return liveNotes();
    }
    function update() {
      const notes = pick();
      const key = notes.map(n => n.id).join(',');
      if (key !== lastKey) { lastKey = key; drawSecs(notes); }
      if (scope === 'elegir') pickInfo.textContent = `${chosen.size} elegida${chosen.size === 1 ? '' : 's'}`;
      current = notes.length ? buildExport(notes, inc) : '';
      preview.value = current;
      const chars = current.length;
      const tokens = Math.ceil(chars / 4);
      stats.replaceChildren(
        h('strong', { text: `${notes.length} nota${notes.length === 1 ? '' : 's'}` }),
        ` · ${nf(chars)} caracteres · aprox. ${nf(tokens)} tokens (estimado)`
      );
      if (tokens > 120000) stats.append(h('div', { class: 'warn', text: 'Es mucho texto para un solo chat. Probá sin transcripciones o con menos notas.' }));
      copyBtn.disabled = dlBtn.disabled = !current;
    }
    const copyBtn = h('button', { class: 'btn primary', text: 'Copiar', onclick: async () => {
      const ok = await copyText(current);
      if (ok) { d.close(); toast('Copiado. Pegalo en el chat.'); }
      else { preview.focus(); preview.select(); toast('No se pudo copiar solo. Seleccioná el texto y copialo a mano.', 5000); }
    } });
    const dlBtn = h('button', { class: 'btn', text: 'Descargar .txt', onclick: () => {
      const one = scope === 'nota' ? getNote(noteId) : null;
      const base = one && one.title ? slugify(one.title) || 'nota' : 'notas';
      download(`${base}-${todayISO()}.txt`, current);
      d.close();
      toast('Archivo descargado, sin encriptar.');
    } });

    openDialog(d, 'Copiar o descargar como texto', [
      radios, range, yearBox, pickBox,
      secBox,
      stats, preview,
      h('p', { class: 'warn', text: 'Este texto sale de tu dispositivo sin encriptar: queda en el chat donde lo pegues o en el archivo que descargues.' })
    ], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => d.close() }), dlBtn, copyBtn]);
    update();
  }

  /* ---------- Importar desde texto con formato ---------- */
  const AI_PROMPT = `Voy a pasarte texto de varias fuentes (notas, resúmenes, transcripciones de sesiones). Reorganizalo en el formato exacto de abajo para importarlo a una app de notas.

Reglas:
- No resumas, no corrijas, no reescribas ni agregues nada. Copiá cada texto tal cual.
- Si falta un dato (fecha, título), dejalo vacío. No lo inventes.
- Una nota por sesión, tema o reflexión. Si dudás cómo agrupar, preguntame antes.
- Si el texto tiene títulos, subtítulos o listas, mantenelos en Markdown: # título, ## subtítulo, - viñeta, 1. lista numerada.
- Fechas en formato AAAA-MM-DD.
- Si es muy largo, cortá en tandas y avisame. No acortes ni omitas texto para que entre.
- Devolvé solo el formato, en un bloque de código, sin comentarios.

Formato:

=== NOTA ===
titulo: <título>
fecha: <AAAA-MM-DD o vacío>
etiquetas: <etiqueta1, etiqueta2 o vacío>
--- TEXTO ---
<mis notas, comentarios y resumen de esta nota>
--- TRANSCRIPCION: <nombre opcional> ---
<transcripción completa>
--- SECCION: <categoría>: <nombre opcional> ---
<texto de esa sección, por ejemplo un resumen o comentarios aparte>
=== NOTA ===
<siguiente nota, mismo esquema>

Los bloques TRANSCRIPCION y SECCION son opcionales y se pueden repetir en una misma nota. Usá SECCION solo si el texto original ya separa partes con un nombre claro (por ejemplo "Resumen" o "Comentarios"); si no, dejá todo en TEXTO.`;

  function trimBlank(lines) {
    let a = 0, b = lines.length;
    while (a < b && !lines[a].trim()) a++;
    while (b > a && !lines[b - 1].trim()) b--;
    return lines.slice(a, b).join('\n');
  }
  function cleanField(v) {
    const s = (v || '').trim();
    if (!s || /^<.*>$/.test(s) || /^vac[ií]o$/i.test(s) || s === '-') return '';
    return s;
  }
  function parseFormat(raw) {
    const lines = raw.replace(/\r\n?/g, '\n').split('\n').filter(l => !/^\s*```[\w-]*\s*$/.test(l));
    const isNota = l => /^\s*={3,}\s*NOTA\s*={3,}\s*$/i.test(l);
    const isTexto = l => /^\s*-{3,}\s*TEXTO\s*-{3,}\s*$/i.test(l);
    const trRe = /^\s*-{3,}\s*TRANSCRIPCI[OÓ]N\s*(?::\s*(.*?))?\s*-{3,}\s*$/i;
    const secRe = /^\s*-{3,}\s*SECCI[OÓ]N\s*:\s*([^:]*?)\s*(?::\s*(.*?))?\s*-{3,}\s*$/i;
    const headRe = /^\s*(t[ií]tulo|fecha|etiquetas)\s*:\s*(.*)$/i;
    const out = [];
    let cur = null, mode = null, tr = null;
    const finish = () => {
      if (!cur) return;
      const warns = [];
      let date = cleanField(cur.fecha);
      if (date && !validISO(date)) { warns.push(`Fecha inválida "${date}", quedó sin fecha.`); date = ''; }
      const note = {
        title: cleanField(cur.titulo),
        date,
        tags: cleanField(cur.etiquetas).split(',').map(s => s.trim()).filter(Boolean),
        text: trimBlank(cur.text),
        transcripts: cur.trs.map(t => ({ name: cleanField(t.name), text: trimBlank(t.lines), catName: cleanField(t.catName) })).filter(t => t.text)
      };
      if (!note.title) warns.push('Sin título.');
      if (!note.text && !note.transcripts.length && !note.title) { cur = null; return; }
      note.warns = warns;
      out.push(note);
      cur = null;
    };
    for (const l of lines) {
      if (isNota(l)) { finish(); cur = { titulo: '', fecha: '', etiquetas: '', text: [], trs: [] }; mode = 'head'; continue; }
      if (!cur) continue;
      if (isTexto(l)) { mode = 'text'; continue; }
      const m = l.match(trRe);
      if (m) { tr = { name: m[1] || '', lines: [] }; cur.trs.push(tr); mode = 'tr'; continue; }
      const sm = l.match(secRe);
      if (sm) { tr = { catName: sm[1] || '', name: sm[2] || '', lines: [] }; cur.trs.push(tr); mode = 'tr'; continue; }
      if (mode === 'head') {
        const hm = l.match(headRe);
        if (hm) {
          const k = norm(hm[1]);
          if (k === 'titulo') cur.titulo = hm[2];
          else if (k === 'fecha') cur.fecha = hm[2];
          else cur.etiquetas = hm[2];
        } else if (l.trim()) { mode = 'text'; cur.text.push(l); }
        continue;
      }
      if (mode === 'text') cur.text.push(l);
      else if (mode === 'tr') tr.lines.push(l);
    }
    finish();
    return out;
  }
  function fingerprint(n) {
    return [norm(n.title), n.date || '', (n.text || '').trim(), ...(n.transcripts || []).map(t => (t.text || '').trim())].join('\u0001');
  }

  function importDialog() {
    const d = $('#dlg');
    const ta = h('textarea', { class: 'preview', placeholder: 'Pegá acá el texto con el formato === NOTA ===', 'aria-label': 'Texto a importar' });
    const area = h('div');
    const nextBtn = h('button', { class: 'btn primary', text: 'Analizar' });
    let parsed = null;

    function step1() {
      parsed = null;
      nextBtn.textContent = 'Analizar';
      nextBtn.disabled = false;
      area.replaceChildren(
        h('p', { class: 'muted', text: 'Pegá el texto ordenado por la IA o cargá un archivo .txt. Antes de importar vas a ver qué entra.' }),
        h('div', { class: 'row' },
          h('button', { class: 'btn small', text: 'Cargar archivo', onclick: async () => {
            const [f] = await pickFile('.txt,.md,text/plain');
            if (f) ta.value = await f.text();
          } }),
          h('button', { class: 'btn small', text: 'Ver instrucciones para la IA', onclick: showPrompt })
        ),
        ta
      );
    }
    function showPrompt() {
      const dd = $('#dlg2');
      openDialog(dd, 'Instrucciones para la IA', [
        h('p', { class: 'muted small', text: 'Copialo y pegalo en un chat (mejor en modo incógnito), seguido de tus textos.' }),
        h('pre', { class: 'codebox', text: AI_PROMPT })
      ], [
        h('button', { class: 'btn', text: 'Cerrar', onclick: () => dd.close() }),
        h('button', { class: 'btn primary', text: 'Copiar', onclick: async () => { toast(await copyText(AI_PROMPT) ? 'Instrucciones copiadas.' : 'No se pudo copiar.'); } })
      ]);
    }
    function step2() {
      const items = parseFormat(ta.value);
      if (!items.length) { toast('No encontré notas. Revisá que cada una empiece con === NOTA ===.', 5000); return; }
      const existing = new Set(liveNotes().map(fingerprint));
      const seen = new Set();
      parsed = items.map(n => {
        const fp = fingerprint(n);
        const dup = existing.has(fp) || seen.has(fp);
        seen.add(fp);
        return { n, dup, on: !dup };
      });
      const dups = parsed.filter(p => p.dup).length;
      area.replaceChildren(
        h('p', { class: 'info', text: `${parsed.length} nota${parsed.length === 1 ? '' : 's'} encontrada${parsed.length === 1 ? '' : 's'}` + (dups ? `, ${dups} ya existe${dups === 1 ? '' : 'n'} (desmarcada${dups === 1 ? '' : 's'}).` : '.') }),
        h('div', { class: 'imp-list' }, parsed.map(p => {
          const cb = h('input', { type: 'checkbox', checked: p.on });
          cb.addEventListener('change', () => { p.on = cb.checked; count(); });
          const trs = p.n.transcripts.length;
          const secs = p.n.transcripts.filter(t => t.catName && norm(t.catName) !== 'transcripcion').map(t => t.catName);
          return h('label', { class: 'imp-item' }, cb, h('div', null,
            h('div', { class: 't', text: p.n.title || 'Sin título' }),
            h('div', { class: 'd', text: `${fmtDate(p.n.date)} · ${nf(p.n.text.length)} caracteres` + (trs - secs.length ? ` · ${trs - secs.length} transcripci${trs - secs.length === 1 ? 'ón' : 'ones'}` : '') + (secs.length ? ` · ${secs.join(', ')}` : '') + (p.n.tags.length ? ` · ${p.n.tags.join(', ')}` : '') }),
            p.dup ? h('div', { class: 'w', text: 'Ya existe una nota idéntica.' }) : null,
            ...p.n.warns.map(w => h('div', { class: 'w', text: w }))
          ));
        })),
        h('button', { class: 'btn small', text: 'Volver a editar el texto', onclick: step1 })
      );
      count();
    }
    function count() {
      const k = parsed.filter(p => p.on).length;
      nextBtn.textContent = `Importar ${k} nota${k === 1 ? '' : 's'}`;
      nextBtn.disabled = k === 0;
    }
    nextBtn.addEventListener('click', () => {
      if (!parsed) { step2(); return; }
      const now = Date.now();
      let k = 0;
      for (const p of parsed) {
        if (!p.on) continue;
        const n = p.n;
        S.data.notes.push({
          id: uid(), title: n.title, date: n.date, text: n.text, tags: n.tags,
          transcripts: n.transcripts.map(t => {
            const o = { id: uid(), name: t.name, text: t.text };
            const cat = t.catName ? addCat(t.catName) : TR;
            if (cat !== TR) o.cat = cat;
            return o;
          }),
          createdAt: now + k, updatedAt: now + k
        });
        k++;
      }
      scheduleSave();
      renderList();
      if (!ui.current) showEmpty();
      d.close();
      toast(`${k} nota${k === 1 ? '' : 's'} importada${k === 1 ? '' : 's'}.`);
    });

    openDialog(d, 'Importar notas', [area], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => d.close() }), nextBtn]);
    step1();
  }

  /* ---------- Backup encriptado ---------- */
  const BK_HEAD = 'NOTAS-APP BACKUP v1';
  async function exportBackup() {
    await flush();
    const rec = await DB.get(vaultKey(S.sid));
    const body = b64(te.encode(JSON.stringify(rec))).replace(/(.{76})/g, '$1\n');
    download(`notas-app-backup-${todayISO()}.txt`, `${BK_HEAD}\n${body}\n`);
    toast('Backup descargado. Se abre con la contraseña actual.', 4500);
  }
  function mergeNotes(incoming) {
    const map = new Map(S.data.notes.map((n, i) => [n.id, i]));
    let added = 0, updated = 0, same = 0;
    for (const n of incoming) {
      if (!n || !n.id) continue;
      if (!map.has(n.id)) {
        S.data.notes.push(n); map.set(n.id, S.data.notes.length - 1);
        if (!n.deleted) added++;
      } else {
        const i = map.get(n.id);
        if ((n.updatedAt || 0) > (S.data.notes[i].updatedAt || 0)) { S.data.notes[i] = n; updated++; }
        else same++;
      }
    }
    return { added, updated, same };
  }
  async function importBackup() {
    const [f] = await pickFile('.txt,text/plain');
    if (!f) return;
    let rec;
    try {
      const txt = (await f.text()).replace(/\r/g, '');
      const lines = txt.split('\n');
      const i = lines.findIndex(l => l.trim() === BK_HEAD);
      if (i < 0) throw new Error('formato');
      rec = JSON.parse(td.decode(unb64(lines.slice(i + 1).join(''))));
      if (rec.format !== 'notas-app-vault') throw new Error('formato');
    } catch {
      toast('El archivo no es un backup de notas-app.', 5000);
      return;
    }
    let data = null;
    if (rec.salt === b64(S.salt) && rec.iter === S.iter) {
      try { data = await unseal(S.key, rec); } catch { data = null; }
    }
    while (!data) {
      const pw = await askPassword('Contraseña del backup', 'Este backup se hizo con otra contraseña. Ingresala para abrirlo.');
      if (pw == null) return;
      try {
        const key = await deriveKey(pw, unb64(rec.salt), rec.iter);
        data = await unseal(key, rec);
      } catch { toast('Contraseña incorrecta.'); }
    }
    const r = mergeNotes(Array.isArray(data.notes) ? data.notes : []);
    mergeCats(data.cats);
    scheduleSave();
    renderList();
    if (ui.current) renderEditor(); else showEmpty();
    toast(`Backup restaurado: ${r.added} nuevas, ${r.updated} actualizadas, ${r.same} sin cambios.`, 5000);
  }

  /* ---------- Cambiar contraseña ---------- */
  function changePasswordDialog() {
    const d = $('#dlg');
    const cur = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Contraseña actual' });
    const p1 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Contraseña nueva' });
    const p2 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Repetí la nueva' });
    const msg = h('p', { class: 'small', text: '' });
    const ok = h('button', { class: 'btn primary', text: 'Cambiar' });
    ok.addEventListener('click', async () => {
      msg.textContent = '';
      if (p1.value.length < MIN_PASS) { msg.textContent = `La nueva necesita al menos ${MIN_PASS} caracteres.`; return; }
      if (p1.value !== p2.value) { msg.textContent = 'Las nuevas no coinciden.'; return; }
      ok.disabled = true; ok.textContent = 'Cambiando…';
      try {
        await flush();
        const rec = await DB.get(vaultKey(S.sid));
        const k = await deriveKey(cur.value, S.salt, S.iter);
        await unseal(k, rec);
      } catch {
        msg.textContent = 'La contraseña actual no es correcta.';
        ok.disabled = false; ok.textContent = 'Cambiar';
        return;
      }
      if (await openAny(p1.value, S.sid)) {
        msg.textContent = 'Esa contraseña ya abre otra sesión de este dispositivo. Usá una distinta.';
        ok.disabled = false; ok.textContent = 'Cambiar';
        return;
      }
      if (driveOn()) {
        if (tokenValid()) await syncNow();
        if (!tokenValid() || G.state !== 'ok') {
          msg.textContent = 'Primero sincronizá con Drive: tocá el estado de sincronización, arriba a la izquierda.';
          ok.disabled = false; ok.textContent = 'Cambiar';
          return;
        }
      }
      const salt = crypto.getRandomValues(new Uint8Array(16));
      S.key = await deriveKey(p1.value, salt, KDF_ITER);
      S.salt = salt; S.iter = KDF_ITER;
      cur.value = p1.value = p2.value = '';
      await queueSave();
      if (driveOn()) { G.forcePush = true; syncNow(); }
      d.close();
      toast('Contraseña cambiada. Los backups viejos siguen abriéndose con la anterior.', 5000);
    });
    openDialog(d, 'Cambiar contraseña', [cur, p1, p2, msg], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => d.close() }), ok]);
    setTimeout(() => cur.focus(), 50);
  }

  /* ---------- Borrar todo ---------- */
  function wipeDialog() {
    const d = $('#dlg');
    const conf = h('input', { type: 'text', placeholder: 'Escribí BORRAR', autocomplete: 'off' });
    const ok = h('button', { class: 'btn danger solid', text: 'Borrar todo', disabled: true });
    conf.addEventListener('input', () => { ok.disabled = conf.value.trim() !== 'BORRAR'; });
    ok.addEventListener('click', async () => {
      clearTimeout(saveTimer); saveTimer = null;
      await saveChain;
      S = null;
      await wipeAll();
      location.reload();
    });
    openDialog(d, 'Borrar todo', [
      h('p', { text: 'Se borran todas las notas de este dispositivo, de todas las sesiones. Si no tenés un backup ni Drive conectado, no se pueden recuperar.' }),
      conf
    ], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => d.close() }), ok]);
  }


  /* ---------- Sincronización con Google Drive ---------- */
  const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const driveName = () => (S && S.data.profile && S.data.profile.driveFile) || 'notas-app-vault.txt';
  const DRIVE_FOLDER = 'notas-app';
  const API = 'https://www.googleapis.com/drive/v3';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
  let driveMeta = null; // { enabled, consented, fileId, folderId, token, exp, lastSync }
  const G = { client: null, gis: null, waiter: null, busy: false, again: false, pending: false, forcePush: false, state: 'idle', detail: '', timer: null };
  class NeedAuth extends Error { constructor() { super('auth'); } }

  function driveConfigured() { return !!CFG.googleClientId; }
  function driveOn() { return driveConfigured() && !!(driveMeta && driveMeta.enabled); }
  function tokenValid() { return !!(driveMeta && driveMeta.token && Date.now() < (driveMeta.exp || 0) - 60000); }
  function saveMeta() { return driveMeta && S ? DB.put(driveKey(S.sid), driveMeta).catch(() => {}) : Promise.resolve(); }

  function loadGis() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    if (G.gis) return G.gis;
    G.gis = new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = 'https://accounts.google.com/gsi/client';
      sc.async = true;
      sc.onload = () => res();
      sc.onerror = () => { G.gis = null; rej(new Error('No se pudo cargar Google.')); };
      document.head.append(sc);
    });
    return G.gis;
  }
  function initClient() {
    if (G.client || !(window.google && google.accounts && google.accounts.oauth2)) return;
    G.client = google.accounts.oauth2.initTokenClient({
      client_id: CFG.googleClientId,
      scope: DRIVE_SCOPE,
      callback: r => {
        const w = G.waiter; G.waiter = null;
        if (!r || r.error || !r.access_token) { if (w) w.rej(new Error((r && r.error) || 'sin_token')); return; }
        driveMeta = Object.assign(driveMeta || {}, { token: r.access_token, exp: Date.now() + (Number(r.expires_in) || 3600) * 1000, consented: true });
        saveMeta();
        if (w) w.res();
      },
      error_callback: e => { const w = G.waiter; G.waiter = null; if (w) w.rej(new Error((e && e.type) || 'popup')); }
    });
  }
  // Se llama dentro de un toque del usuario, sin esperas antes, para que el navegador permita la ventana de Google.
  function askToken() {
    initClient();
    if (!G.client) {
      loadGis().catch(() => {});
      return Promise.reject(new Error('Google todavía está cargando. Probá de nuevo en unos segundos.'));
    }
    return new Promise((res, rej) => {
      G.waiter = { res, rej };
      const cfg = { prompt: driveMeta && driveMeta.consented ? '' : 'consent select_account' };
      if (driveMeta && driveMeta.email) cfg.login_hint = driveMeta.email;
      G.client.requestAccessToken(cfg);
    }).then(checkAccount);
  }
  // Cada sesión queda atada a la cuenta de Google con la que se conectó, para no mezclar Drives.
  async function checkAccount() {
    let email = '';
    try {
      const r = await gfetch(`${API}/about?fields=user(emailAddress)`);
      if (r.ok) { const j = await r.json(); email = (j.user && j.user.emailAddress) || ''; }
    } catch (e) { if (e instanceof NeedAuth) throw e; return; }
    if (!email || !driveMeta) return;
    if (driveMeta.email && driveMeta.email !== email) {
      driveMeta.token = null; saveMeta();
      throw new Error(`Elegiste otra cuenta de Google. Esta sesión está conectada a ${driveMeta.email}.`);
    }
    if (!driveMeta.email) { driveMeta.email = email; saveMeta(); }
  }
  function googleErr(e) {
    const m = (e && e.message) || '';
    if (/popup_closed|access_denied/.test(m)) return 'No se completó el acceso a Google.';
    if (/popup_failed/.test(m)) return 'El navegador bloqueó la ventana de Google. Probá de nuevo.';
    return m || 'No se pudo conectar con Google.';
  }

  async function gfetch(url, opts = {}) {
    if (!tokenValid()) throw new NeedAuth();
    let r;
    try {
      r = await fetch(url, Object.assign({}, opts, { headers: Object.assign({ Authorization: 'Bearer ' + driveMeta.token }, opts.headers || {}) }));
    } catch {
      const e = new Error('offline'); e.offline = true; throw e;
    }
    if (r.status === 401) { driveMeta.token = null; saveMeta(); throw new NeedAuth(); }
    return r;
  }
  async function gjson(url, opts) {
    const r = await gfetch(url, opts);
    if (!r.ok) throw new Error('Drive respondió ' + r.status);
    return r.json();
  }
  const qe = v => encodeURIComponent(v);

  async function findFile() {
    if (driveMeta.fileId) {
      const r = await gfetch(`${API}/files/${driveMeta.fileId}?fields=id,trashed`);
      if (r.ok) { const j = await r.json(); if (!j.trashed) return j.id; }
      else if (r.status !== 404) throw new Error('Drive respondió ' + r.status);
      driveMeta.fileId = null;
    }
    const j = await gjson(`${API}/files?q=${qe(`name='${driveName()}' and trashed=false`)}&fields=files(id,modifiedTime)&orderBy=modifiedTime%20desc&spaces=drive`);
    if (j.files && j.files.length) { driveMeta.fileId = j.files[0].id; saveMeta(); return driveMeta.fileId; }
    return null;
  }
  async function ensureFolder() {
    if (driveMeta.folderId) return driveMeta.folderId;
    const j = await gjson(`${API}/files?q=${qe(`name='${DRIVE_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id)&spaces=drive`);
    if (j.files && j.files.length) driveMeta.folderId = j.files[0].id;
    else {
      driveMeta.folderId = (await gjson(`${API}/files?fields=id`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: DRIVE_FOLDER, mimeType: 'application/vnd.google-apps.folder' })
      })).id;
    }
    saveMeta();
    return driveMeta.folderId;
  }
  async function uploadText(text) {
    if (driveMeta.fileId) {
      await gjson(`${UPLOAD}/files/${driveMeta.fileId}?uploadType=media&fields=id`, { method: 'PATCH', headers: { 'Content-Type': 'text/plain' }, body: text });
      return;
    }
    const folder = await ensureFolder();
    const bd = 'notasapp' + Math.random().toString(36).slice(2);
    const body = `--${bd}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify({ name: driveName(), parents: [folder], mimeType: 'text/plain' }) +
      `\r\n--${bd}\r\nContent-Type: text/plain\r\n\r\n${text}\r\n--${bd}--`;
    const j = await gjson(`${UPLOAD}/files?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + bd }, body });
    driveMeta.fileId = j.id;
    saveMeta();
  }

  function recToText(rec) { return `${BK_HEAD}\n${b64(te.encode(JSON.stringify(rec))).replace(/(.{76})/g, '$1\n')}\n`; }
  function textToRec(txt) {
    const lines = txt.replace(/\r/g, '').split('\n');
    const i = lines.findIndex(l => l.trim() === BK_HEAD);
    if (i < 0) throw new Error('El archivo de Drive no tiene el formato esperado.');
    const rec = JSON.parse(td.decode(unb64(lines.slice(i + 1).join(''))));
    if (rec.format !== 'notas-app-vault') throw new Error('El archivo de Drive no tiene el formato esperado.');
    return rec;
  }

  function sameContent(a, b) {
    const pick = n => JSON.stringify([n.title, n.date, n.text, n.tags, (n.transcripts || []).map(t => [t.name, t.text, t.cat || ''])]);
    return pick(a) === pick(b);
  }
  function mergeRemote(remoteNotes) {
    const base = S.data.syncBase || {};
    const idx = new Map(S.data.notes.map((n, i) => [n.id, i]));
    const now = Date.now();
    let changed = false, conflicts = 0;
    const replaced = new Set();
    const copyOf = (n, label) => Object.assign(JSON.parse(JSON.stringify(n)), {
      id: uid(), title: `${n.title || 'Sin título'} (${label})`,
      transcripts: (n.transcripts || []).map(t => Object.assign({}, t, { id: uid() })),
      createdAt: now, updatedAt: now + conflicts
    });
    for (const r of remoteNotes) {
      if (!r || !r.id) continue;
      if (!idx.has(r.id)) { S.data.notes.push(r); idx.set(r.id, S.data.notes.length - 1); changed = true; continue; }
      const i = idx.get(r.id);
      const l = S.data.notes[i];
      const ru = r.updatedAt || 0, lu = l.updatedAt || 0, b = base[r.id] || 0;
      if (ru === lu) continue;
      const bothLive = !l.deleted && !r.deleted;
      if (ru > lu) {
        if (bothLive && lu > b && !sameContent(l, r)) { S.data.notes.push(copyOf(l, 'versión en conflicto')); conflicts++; }
        S.data.notes[i] = r; replaced.add(r.id); changed = true;
      } else if (bothLive && ru > b && !sameContent(l, r)) {
        S.data.notes.push(copyOf(r, 'versión en conflicto')); conflicts++; changed = true;
      }
    }
    return { changed, conflicts, replaced };
  }

  async function unlockRemote(remote) {
    for (;;) {
      const pw = await askPassword('Contraseña de las notas en Drive',
        'Las notas guardadas en Drive usan otra contraseña, o la cambiaste en otro dispositivo. Ingresala para unirlas. Desde ahora, este dispositivo también va a usar esa contraseña.');
      if (pw == null) return null;
      try {
        const salt = unb64(remote.salt);
        const key = await deriveKey(pw, salt, remote.iter);
        const data = await unseal(key, remote);
        if (!S) return null;
        if (await openAny(pw, S.sid)) { toast('Esa contraseña ya abre otra sesión de este dispositivo. Para unir estas notas, usá una contraseña distinta en cada sesión.', 7000); return null; }
        S.key = key; S.salt = salt; S.iter = remote.iter;
        return data;
      } catch { toast('Contraseña incorrecta.'); }
    }
  }

  async function syncNow() {
    if (!S || !driveOn()) return;
    if (G.busy) { G.again = true; return; }
    if (!tokenValid()) { setSync('auth'); return; }
    if (!navigator.onLine) { setSync('offline'); return; }
    const s = S;
    const hadPending = G.pending;
    G.busy = true; G.pending = false;
    setSync('sync');
    try {
      await flush();
      const fileId = await findFile();
      let res = { changed: false, conflicts: 0, replaced: new Set() };
      if (fileId && !G.forcePush) {
        const r = await gfetch(`${API}/files/${fileId}?alt=media`);
        if (!r.ok) throw new Error('Drive respondió ' + r.status);
        const remote = textToRec(await r.text());
        let data = null;
        if (remote.salt === b64(s.salt) && remote.iter === s.iter) {
          try { data = await unseal(s.key, remote); } catch { data = null; }
        }
        if (!data) data = await unlockRemote(remote);
        if (!data) { G.pending = hadPending; setSync('error', 'Falta la contraseña de las notas en Drive.'); return; }
        if (S !== s) return;
        res = mergeRemote(Array.isArray(data.notes) ? data.notes : []);
        if (mergeCats(data.cats)) res.changed = true;
      }
      G.forcePush = false;
      if (S !== s) return;
      s.data.syncBase = Object.fromEntries(s.data.notes.map(n => [n.id, n.updatedAt || 0]));
      await queueSave();
      const rec = await DB.get(vaultKey(s.sid));
      await uploadText(recToText(rec));
      driveMeta.lastSync = Date.now();
      saveMeta();
      setSync('ok');
      if (res.changed && S === s) {
        renderList();
        if (ui.current) {
          if (!getNote(ui.current)) { if (history.state && history.state.note && narrow()) history.back(); else closeEditor(); }
          else if (res.replaced.has(ui.current)) renderEditor();
        } else showEmpty();
      }
      if (res.conflicts) toast(`${res.conflicts === 1 ? 'Una nota se editó' : res.conflicts + ' notas se editaron'} en dos dispositivos a la vez: quedaron las dos versiones.`, 7000);
    } catch (e) {
      G.pending = G.pending || hadPending;
      if (e instanceof NeedAuth) setSync('auth');
      else if (e && e.offline) setSync('offline');
      else { console.error(e); setSync('error', (e && e.message) || String(e)); }
    } finally {
      G.busy = false;
      if (G.again) { G.again = false; syncSoon(1500); }
    }
  }

  function syncSoon(ms = 8000) {
    if (!driveOn()) return;
    if (!G.pending) { G.pending = true; renderSync(); }
    clearTimeout(G.timer);
    G.timer = setTimeout(() => {
      if (!S) return;
      if (tokenValid()) syncNow(); else setSync('auth');
    }, ms);
  }

  function setSync(state, detail = '') { G.state = state; G.detail = detail; renderSync(); }
  function ago(t) {
    if (!t) return '';
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'recién';
    if (m < 60) return `hace ${m} min`;
    return 'a las ' + new Date(t).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
  // Estado visual del botón de sincronización: [clase, texto].
  // Estado del botón de Drive: [clase, nombre del estado, explicación].
  function syncVisual() {
    const last = driveMeta && driveMeta.lastSync ? ' Última sincronización: ' + ago(driveMeta.lastSync) + '.' : '';
    if (!driveOn()) return ['off', 'Sin conectar', 'Las notas quedan solo en este dispositivo. Tocá para conectar Google Drive.'];
    if (G.state === 'sync') return ['sync', 'Sincronizando', 'Subiendo y bajando cambios con Drive.'];
    if (G.state === 'error') return ['error', 'Error al sincronizar', (G.detail ? G.detail + '. ' : '') + 'Tocá para reintentar.' + last];
    if (G.state === 'auth') return ['warn', 'Hay que reconectar', 'Google pide volver a dar permiso cada tanto. Tocá y elegí tu cuenta.' + last];
    if (G.state === 'offline') return ['offline', 'Sin conexión', 'No hay internet. Se sincroniza solo cuando vuelva.' + last];
    if (G.pending) return ['warn', 'Cambios sin subir', 'Hay cambios que todavía no están en Drive. Se suben solos en unos segundos, o tocá para subirlos ya.' + last];
    if (G.state === 'ok') return ['ok', 'Sincronizado', 'Todo al día con Drive.' + last];
    return ['idle', 'Conectado', 'Todavía no sincronizó desde que abriste la app. Tocá para sincronizar.' + last];
  }
  function renderSync() {
    const el = document.getElementById('sync-btn');
    if (!el) return;
    el.hidden = !driveConfigured();
    if (el.hidden) return;
    const [st, name, why] = syncVisual();
    el.dataset.state = st;
    el.title = 'Drive: ' + name + '. ' + why;
    el.setAttribute('aria-label', 'Google Drive: ' + name);
  }
  setInterval(() => { if (G.state === 'ok') renderSync(); }, 30000);

  function syncBtnTap() {
    if (!driveOn()) { connectDialog(); return; }
    if (G.state === 'sync') { toast('Sincronizando…', 1500); return; }
    syncTap();
  }
  function connectDialog() {
    const d = $('#dlg2');
    loadGis().catch(() => {});
    openDialog(d, 'Sincronizar con Google Drive', [
      h('p', { text: 'Tus notas se suben encriptadas a una carpeta "notas-app" de tu Drive y se mantienen iguales entre tus dispositivos.' }),
      h('p', { class: 'muted small', text: 'La app solo ve los archivos que ella misma crea. Nadie puede leer las notas sin tu contraseña.' })
    ], [
      h('button', { class: 'btn', text: 'Ahora no', onclick: () => d.close() }),
      h('button', { class: 'btn primary', text: 'Conectar', onclick: () => { d.close(); connectDrive(); } })
    ]);
  }
  function syncTap() {
    if (!driveOn()) return;
    if (G.state === 'error' && G.detail) toast(G.detail, 5000);
    if (tokenValid()) { syncNow(); return; }
    askToken().then(() => syncNow()).catch(e => { setSync('auth'); toast(googleErr(e), 5000); });
  }
  function driveAfterUnlock() {
    if (!driveOn()) return;
    renderSync();
    if (tokenValid()) { syncNow(); return; }
    const active = navigator.userActivation ? navigator.userActivation.isActive : false;
    if (active && window.google && google.accounts && google.accounts.oauth2) {
      askToken().then(() => syncNow()).catch(() => setSync('auth'));
    } else setSync('auth');
  }
  function connectDrive() {
    driveMeta = Object.assign(driveMeta || {}, { enabled: true });
    askToken()
      .then(async () => { await saveMeta(); renderSync(); toast('Drive conectado.'); await syncNow(); })
      .catch(e => { driveMeta.enabled = false; saveMeta(); renderSync(); toast(googleErr(e), 5000); });
  }
  async function disconnectDrive() {
    if (!(await confirmBox('¿Desconectar Google Drive? El archivo encriptado queda en tu Drive y este dispositivo deja de sincronizar.', 'Desconectar'))) return;
    driveMeta = null;
    await DB.del(driveKey(S.sid)).catch(() => {});
    G.state = 'idle';
    renderSync();
    toast('Drive desconectado en este dispositivo.');
  }

  setInterval(() => { if (S && driveOn() && tokenValid() && !document.hidden) syncNow(); }, 3 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!S || !driveOn() || !tokenValid()) return;
    if (document.hidden) { if (G.pending) syncNow(); }
    else syncNow();
  });
  addEventListener('online', () => { if (S && driveOn() && tokenValid()) syncNow(); });

  /* ---------- Inicio ---------- */
  async function boot() {
    if (!window.isSecureContext || !window.crypto || !crypto.subtle) {
      document.body.replaceChildren(h('div', { class: 'lock' }, h('div', { class: 'lock-card' },
        h('h1', { text: 'No se puede abrir así' }),
        h('p', { text: 'La app necesita abrirse desde su dirección https para poder encriptar.' }))));
      return;
    }
    try {
      await DB.open();
    } catch {
      document.body.replaceChildren(h('div', { class: 'lock' }, h('div', { class: 'lock-card' },
        h('h1', { text: 'Sin almacenamiento' }),
        h('p', { text: 'El navegador no deja guardar datos. Si estás en modo incógnito, abrí la app en una ventana normal.' }))));
      return;
    }
    // Precarga Google solo si alguna sesión de este dispositivo usa Drive.
    for (const x of await listSessions().catch(() => [])) {
      const m = await DB.get(driveKey(x.id)).catch(() => null);
      if (m && m.enabled && driveConfigured()) { loadGis().catch(() => {}); break; }
    }
    showLock();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  boot();
})();
